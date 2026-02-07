'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BiomechanicsInsoleForm from "@/features/pbe/components/BiomechanicsInsoleForm"; // Restored
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, Check, ChevronsUpDown, FileText, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { saveSandboxAssessment } from './actions';
import { searchPatients } from '@/actions/appointments';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function PalmilhaSandboxPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    // State
    const [pendingData, setPendingData] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("associate");

    // Associate State
    const [openCombobox, setOpenCombobox] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Create State
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isRestoring, setIsRestoring] = useState(true);

    // PERSISTENCE BACKUP (Avoid data loss)
    // 1. Load on mount
    useEffect(() => {
        const saved = localStorage.getItem(`sandbox_backup_pbe`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    setPendingData(parsed);
                    console.log("Restored sandbox backup from localStorage");
                }
            } catch (e) {
                console.error("Failed to restore backup", e);
            }
        }
        setIsRestoring(false);
    }, []);

    // 2. Save on change (Debounced to avoid heavy storage writes)
    useEffect(() => {
        if (pendingData && !isRestoring) {
            const timer = setTimeout(() => {
                localStorage.setItem(`sandbox_backup_pbe`, JSON.stringify(pendingData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [pendingData, isRestoring]);

    const handleFormChange = (newType: string) => {
        if (newType === 'palmilha') return;
        if (newType === 'palmilha-v3') {
            router.push(`/dashboard/${slug}/test-form/palmilha-v3`);
            return;
        }
        router.push(`/dashboard/${slug}/test-form/${newType}`);
    };

    // Search Logic
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length >= 2) {
            const res = await searchPatients(query.trim(), slug);
            setPatients(res || []);
        }
    }

    // Phone Mask
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 11) val = val.slice(0, 11); // Limit to 11 digits

        // Apply Mask
        if (val.length > 7) {
            val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
        } else if (val.length > 2) {
            val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        }

        setNewPhone(val);
    };

    // Capture Data & Handle Manual Save (Stabilized with useCallback)
    const handleFormSave = React.useCallback((data: any, isManual: boolean = false) => {
        setPendingData(data);
        if (isManual) {
            setDialogOpen(true);
        }
    }, []);

    const handleFinalSave = async () => {
        if (!pendingData) return;
        setIsSaving(true);

        try {
            const res = await saveSandboxAssessment(
                slug,
                'pbe', // Assuming 'pbe' is the formType for Palmilha
                pendingData,
                activeTab === 'associate' ? selectedPatient?.id : undefined,
                activeTab === 'create' ? { name: newName, phone: newPhone } : undefined
            );

            if (!res) {
                toast.error("O servidor não respondeu. Tente novamente.");
                return;
            }

            if (res.success) {
                toast.success("Dados salvos com sucesso! Redirecionando para finalização...");
                setDialogOpen(false);
                router.push(`/dashboard/${slug}/attendance/${res.appointmentId}`);
            } else {
                toast.error(res.error || "Erro ao salvar");
            }
        } catch (error: any) {
            console.error("Sandbox Save Exception:", error);
            toast.error(error.message || "Erro inesperado ao salvar");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 relative pb-20">
            {/* Standardized Header */}
            <div className="bg-white border rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => router.push(`/dashboard/${slug}/forms`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Atalho de Preenchimento
                        </span>
                        <div className="flex items-center gap-1 group cursor-pointer">
                            <Select value="palmilha" onValueChange={handleFormChange}>
                                <SelectTrigger className="border-none shadow-none font-black text-xl text-slate-900 tracking-tight p-0 h-auto focus:ring-0">
                                    <SelectValue placeholder="Selecione o Formulário" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectGroup>
                                        <SelectItem value="palmilha">Palmilha Biomecânica (Original)</SelectItem>
                                        <SelectItem value="palmilha-v3">Palmilha V3 (Nova)</SelectItem>
                                        <SelectItem value="physical">Avaliação Física Avançada</SelectItem>
                                        <SelectItem value="advanced-pbe">Avaliação Física (Antigo URL)</SelectItem>
                                        <SelectItem value="pbe">Avaliação PBE (Inteligente)</SelectItem>
                                        <SelectItem value="ultimate-pbe" className="font-bold text-indigo-600">✨ Ultimate PBE (Fusão)</SelectItem>
                                        <SelectItem value="womens-health">Saúde da Mulher & Pélvica</SelectItem>
                                        <SelectItem value="diabetic-foot">Avaliação de Pé Diabético</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Salvamento Automático</span>
                </div>
            </div>

            {/* RESTORED OLD FORM WITH ORIGINAL BUTTONS */}
            {isRestoring ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-8 w-8 animate-spin border-4 border-indigo-600 border-t-transparent rounded-full" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recuperando progresso...</p>
                </div>
            ) : (
                <BiomechanicsInsoleForm
                    key="sandbox-form"
                    patientId="sandbox"
                    initialData={pendingData}
                    onSave={handleFormSave}
                    hideHeader={true}
                    hideButtons={false}
                />
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salvar Avaliação (Palmilha)</DialogTitle>
                        <DialogDescription>
                            Escolha onde deseja salvar os dados preenchidos.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="associate">Paciente Existente</TabsTrigger>
                            <TabsTrigger value="create">Novo Paciente</TabsTrigger>
                        </TabsList>

                        <TabsContent value="associate" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Buscar Paciente</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between">
                                            {selectedPatient ? selectedPatient.name : "Selecione..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-3 shadow-xl border-2 overflow-visible" align="start">
                                        <Command className="rounded-lg border shadow-sm overflow-visible">
                                            <div className="p-2 border-b overflow-visible">
                                                <CommandInput
                                                    placeholder="Buscar por nome..."
                                                    onValueChange={handleSearch}
                                                    className="h-10 border-none focus-visible:ring-0"
                                                />
                                            </div>
                                            <CommandList>
                                                <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {patients.map(p => (
                                                        <CommandItem key={p.id} value={p.name} onSelect={() => {
                                                            setSelectedPatient(p);
                                                            setOpenCombobox(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedPatient?.id === p.id ? "opacity-100" : "opacity-0")} />
                                                            {p.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </TabsContent>

                        <TabsContent value="create" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do paciente" />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone / WhatsApp</Label>
                                <Input value={newPhone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength={15} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="default" onClick={handleFinalSave} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Confirmar e Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

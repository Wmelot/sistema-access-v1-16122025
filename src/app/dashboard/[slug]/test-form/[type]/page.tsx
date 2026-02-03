'use client'

import { useParams, useRouter } from 'next/navigation';
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm";
import { SmartAssessmentForm } from "@/features/pbe/components/SmartAssessmentForm";
import { PhysicalAssessmentForm } from "@/features/pbe/components/PhysicalAssessmentFormLegacy";
import DiabeticFootForm from "@/features/pbe/components/DiabeticFootForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, UserPlus, User, X, FileText } from "lucide-react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';
import { saveSandboxAssessment } from '../actions';
import { searchPatients } from '@/actions/appointments'; // Check path
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from "lucide-react"

export default function GenericSandboxPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as string;
    const slug = params.slug as string;

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

    // Phone Mask
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);

        if (val.length > 7) {
            val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
        } else if (val.length > 2) {
            val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        }
        setNewPhone(val);
    };

    // Search Logic
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const res = await searchPatients(query, slug);
            setPatients(res || []);
        }
    }

    const handleInitialSave = (data: any) => {
        setPendingData(data);
        // [FIX] Don't open dialog automatically on auto-save
        // toast.success("Rascunho atualizado automaticamente.");
    };

    const handleFinalSave = async () => {
        if (!pendingData) return;
        setIsSaving(true);

        try {
            let result;

            if (activeTab === 'associate') {
                if (!selectedPatient) {
                    toast.error("Selecione um paciente");
                    setIsSaving(false);
                    return;
                }
                result = await saveSandboxAssessment(slug, type, pendingData, selectedPatient.id);
            } else {
                if (!newName || !newPhone) {
                    toast.error("Preencha nome e telefone");
                    setIsSaving(false);
                    return;
                }
                result = await saveSandboxAssessment(slug, type, pendingData, undefined, { name: newName, phone: newPhone });
            }

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Dados salvos com sucesso! Redirecionando para finalização...");
                setDialogOpen(false);
                // Redirect to full attendance flow to finish
                router.push(`/dashboard/${slug}/attendance/${result.appointmentId}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderForm = () => {
        switch (type) {
            case 'womens-health':
                return <WomensHealthForm patientId="sandbox" onSave={handleInitialSave} />;
            case 'pbe':
                return <SmartAssessmentForm patientId="sandbox" onSave={handleInitialSave} />;
            case 'physical':
                return <PhysicalAssessmentForm patientId="sandbox" onSave={handleInitialSave} />; // Ensure PhysicalAssessmentForm accepts onSave
            case 'diabetic-foot':
                return <DiabeticFootForm patientId="sandbox" onSave={handleInitialSave} />;
            default:
                return <div>Formulário não encontrado.</div>;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'womens-health': return 'pink';
            case 'pbe': return 'blue';
            case 'physical': return 'emerald';
            case 'diabetic-foot': return 'orange';
            default: return 'slate';
        }
    };

    const color = getColor();

    const getTitle = () => {
        switch (type) {
            case 'womens-health': return 'Saúde da Mulher & Pélvica';
            case 'pbe': return 'Avaliação Clínica Inteligente (PBE)';
            case 'physical': return 'Avaliação Física Avançada';
            case 'diabetic-foot': return 'Pé Diabético';
            default: return 'Formulário';
        }
    };

    return (
        <div className="space-y-6 relative pb-20">
            {/* Card Header Design (FOTO 2/3) - Standardized Header */}
            <div className="bg-white border rounded-xl p-3 mb-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => router.back()}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                            Modo Sandbox
                        </span>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight text-left">
                            {getTitle()}
                        </h1>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Salvamento Automático</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-1">
                {renderForm()}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salvar Avaliação</DialogTitle>
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
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar por nome..." onValueChange={handleSearch} />
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
                        <Button variant="ghost" onClick={() => {
                            setDialogOpen(false);
                            setPendingData(null); // Optional: Ask confirmation before clearing
                            toast.info("Dados descartados.");
                        }}>
                            Descartar
                        </Button>
                        <Button variant="default" onClick={handleFinalSave} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Confirmar e Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* BOTÕES DE AÇÃO FLUTUANTES - Padronizado Axiom */}
            <div className="fixed bottom-8 right-8 flex gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                    onClick={() => {
                        // In sandbox, we always open the dialog on explicit save
                        setDialogOpen(true);
                    }}
                    variant="outline"
                    className="bg-white hover:bg-slate-50 border-slate-200 shadow-xl font-bold gap-2 text-slate-700 h-11 px-6 rounded-full"
                >
                    <Save className="w-4 h-4 text-blue-600" />
                    Confirmar e Salvar
                </Button>
                <Button
                    onClick={() => toast.info("Salve os dados primeiro para gerar o relatório.")}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-xl h-11 px-8 rounded-full"
                >
                    <User className="w-4 h-4 text-blue-400" />
                    Gerar Relatório PDF
                </Button>
            </div>
        </div>
    );
}

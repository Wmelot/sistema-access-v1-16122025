'use client'

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PalmilhaAccessForm from "@/features/pbe/components/PalmilhaAccessForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, Check, ChevronsUpDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { saveSandboxAssessment } from './actions';
import { searchPatients } from '@/actions/appointments';
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
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        if (val.length > 9) val = `${val.slice(0, 9)}-${val.slice(9)}`;
        setNewPhone(val);
    };

    // Capture Data & Handle Manual Save
    const handleFormSave = (data: any, isManual: boolean = false) => {
        setPendingData(data);
        if (isManual) {
            setDialogOpen(true);
        }
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
                result = await saveSandboxAssessment(slug, 'pbe', pendingData, selectedPatient.id);
            } else {
                if (!newName || !newPhone) {
                    toast.error("Preencha nome e telefone");
                    setIsSaving(false);
                    return;
                }
                result = await saveSandboxAssessment(slug, 'pbe', pendingData, undefined, { name: newName, phone: newPhone });
            }

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Avaliação salva com sucesso!");
                setDialogOpen(false);
                setPendingData(null);
                // Redirect directly to the patient's assessment tab
                if (result.patientId) {
                    router.push(`/dashboard/${slug}/patients/${result.patientId}?tab=assessments`);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 relative pb-20">
            {/* Alert Removed as requested */}

            <PalmilhaAccessForm
                patientId="sandbox"
                onSave={handleFormSave}
            />

            {/* Floating Button Removed - using internal form button */}

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

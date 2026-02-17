"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PalmilhaFormV3 from "@/features/palmilha-biomecanica/components/PalmilhaFormV3";
import { ArrowLeft, FileText, Check, ChevronsUpDown } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { saveSandboxAssessment } from '@/app/dashboard/[slug]/test-form/actions'; // Adjust import path
import { searchPatients } from '@/actions/appointments';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay } from '@/utils/format-phone';
import { useGlobalLoader } from '@/components/providers/global-loader-provider';

export default function PalmilhaV3SandboxPage() {
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

    const { showLoading } = useGlobalLoader();

    const handleFormChange = (newType: string) => {
        if (newType === 'palmilha-v3') return;
        showLoading();
        if (newType === 'palmilha') {
            router.push(`/dashboard/${slug}/test-form`);
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

    // Capture Data & Handle Manual Save
    const handleFormSave = (data: any, isManual: boolean = false) => {
        setPendingData(data);
        if (isManual) {
            setDialogOpen(true);
        }
    };

    const handleFinalSave = async (force: boolean = false) => {
        if (!pendingData) {
            toast.error("Nenhum dado para salvar. Preencha o formulário primeiro.");
            return;
        }

        // Validate patient selection
        if (activeTab === 'associate' && !selectedPatient?.id) {
            toast.error("Selecione um paciente antes de salvar.");
            return;
        }
        if (activeTab === 'create' && (!newName.trim() || !newPhone.trim())) {
            toast.error("Preencha o nome e telefone do paciente.");
            return;
        }

        setIsSaving(true);

        try {
            const sanitizedData = JSON.parse(JSON.stringify(pendingData));
            const res = await saveSandboxAssessment(
                slug,
                'palmilha',
                sanitizedData,
                activeTab === 'associate' ? selectedPatient?.id : undefined,
                activeTab === 'create' ? { name: newName, phone: newPhone } : undefined,
                force
            );

            if (!res) {
                toast.error("O servidor não retornou uma resposta. Tente novamente.");
                return;
            }

            if (res.error === 'PATIENT_NAME_EXISTS') {
                setIsSaving(false);
                const { default: Swal } = await import('sweetalert2');
                const p = res.existingPatient;
                const patientsHtml = (res.existingPatients || [p]).map((ext: any) => `
                    <div 
                        class="patient-item-option" 
                        data-patient-id="${ext.id}" 
                        style="text-align:left; padding:12px 16px; margin-bottom:10px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:all 0.2s;"
                    >
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <p style="margin:0; font-size:15px; color:#1e293b; font-weight:600;">${ext.name || '---'}</p>
                            <div class="check-circle" style="width:18px; height:18px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center;">
                                <div class="inner-check" style="width:10px; height:10px; border-radius:50%; background:#3b82f6; display:none;"></div>
                            </div>
                        </div>
                        <div style="display:flex; gap:12px; margin-top:4px;">
                            <p style="margin:0; font-size:12px; color:#64748b;"><b>Tel:</b> ${ext.phone ? formatPhoneDisplay(ext.phone) : '---'}</p>
                            <p style="margin:0; font-size:12px; color:#64748b;"><b>CPF:</b> ${ext.cpf || '---'}</p>
                        </div>
                    </div>
                `).join('');

                const countFound = (res.existingPatients || [p]).length;
                let selectedDuplicateId: string | null = null;

                const handleItemClick = (clickedItem: HTMLElement) => {
                    const id = clickedItem.getAttribute('data-patient-id');
                    if (!id) return;
                    selectedDuplicateId = id;
                    document.querySelectorAll('.patient-item-option').forEach(item => {
                        const htmlItem = item as HTMLElement;
                        const isSelected = htmlItem.getAttribute('data-patient-id') === id;
                        htmlItem.style.borderColor = isSelected ? '#3b82f6' : '#e2e8f0';
                        htmlItem.style.background = isSelected ? '#eff6ff' : '#f8fafc';
                        const inner = htmlItem.querySelector('.inner-check') as HTMLElement;
                        const outer = htmlItem.querySelector('.check-circle') as HTMLElement;
                        if (inner) inner.style.display = isSelected ? 'block' : 'none';
                        if (outer) outer.style.borderColor = isSelected ? '#3b82f6' : '#cbd5e1';
                    });
                };

                const choice = await Swal.fire({
                    title: 'Paciente(s) já Cadastrado(s)',
                    html: `
                        <p style="margin-bottom:14px; color:#64748b; font-size:14px; text-align:left;">
                            Foram encontrados pacientes com o nome "<b>${newName}</b>". Selecione o correto ou crie um novo:
                        </p>
                        <div id="sandbox-duplicates-list" style="max-height:400px; overflow-y:auto; padding-right:8px; margin-bottom:10px; scrollbar-width: thin;">
                            ${patientsHtml}
                        </div>
                        <p style="margin-top:14px; color:#475569; font-size:14px; font-weight:500;">Deseja usar o cadastro selecionado ou criar um novo?</p>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Usar selecionado',
                    denyButtonText: 'Criar novo',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3b82f6',
                    denyButtonColor: '#10b981',
                    didOpen: () => {
                        document.querySelectorAll('.patient-item-option').forEach(item => {
                            item.addEventListener('click', () => handleItemClick(item as HTMLElement));
                        });
                    },
                    preConfirm: () => {
                        if (!selectedDuplicateId && countFound > 0) {
                            Swal.showValidationMessage('Selecione um paciente na lista acima');
                            return false;
                        }
                        return selectedDuplicateId;
                    }
                });

                if (choice.isConfirmed && choice.value) {
                    const selectedId = choice.value;
                    const matchedPatient = (res.existingPatients || [p]).find((pa: any) => pa.id === selectedId);
                    setActiveTab('associate');
                    setSelectedPatient(matchedPatient || p);
                    setIsSaving(true);
                    const res2 = await saveSandboxAssessment(slug, 'palmilha', JSON.parse(JSON.stringify(pendingData)), selectedId, undefined, false);
                    handleSaveResponse(res2);
                } else if (choice.isDenied) {
                    handleFinalSave(true);
                }
                return;
            }

            handleSaveResponse(res);
        } catch (error: any) {
            console.error("Client Save Error:", error);
            toast.error(error.message || "Erro inesperado ao salvar");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveResponse = async (res: any) => {
        if (res.error === 'DUPLICATE_TODAY') {
            setIsSaving(false);
            const { default: Swal } = await import('sweetalert2');
            const choice = await Swal.fire({
                title: 'Agendamento Identificado',
                text: `${res.msg} Deseja usar este agendamento ou criar um novo?`,
                icon: 'info',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Usar Existente',
                denyButtonText: 'Criar Novo',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3b82f6',
                denyButtonColor: '#10b981',
            });

            if (choice.isConfirmed) {
                setIsSaving(true);
                const retryRes = await saveSandboxAssessment(slug, 'palmilha', JSON.parse(JSON.stringify(pendingData)), res.patientId || selectedPatient?.id, undefined, true, res.appointmentId, 'fde183ad-1c20-4d6c-9efb-89d08f483cf2');
                if (retryRes.success) {
                    toast.success("Dados salvos no agendamento existente!");
                    router.push(`/dashboard/${slug}/patients/${retryRes.patientId}`);
                } else {
                    toast.error(retryRes.error || "Erro ao salvar no agendamento.");
                }
            } else if (choice.isDenied) {
                setIsSaving(true);
                const retryRes = await saveSandboxAssessment(slug, 'palmilha', JSON.parse(JSON.stringify(pendingData)), res.patientId || selectedPatient?.id, undefined, true, undefined, 'fde183ad-1c20-4d6c-9efb-89d08f483cf2');
                if (retryRes.success) {
                    toast.success("Dados salvos e novo agendamento gerado!");
                    router.push(`/dashboard/${slug}/patients/${retryRes.patientId}`);
                } else {
                    toast.error(retryRes.error || "Erro ao criar novo atendimento.");
                }
            }
            setIsSaving(false);
            return;
        }

        if (res.success) {
            toast.success("Dados salvos com sucesso! Abrindo prontuário...");
            localStorage.removeItem('sandbox_backup_palmilha_v3');
            setTimeout(() => {
                setDialogOpen(false);
                router.push(`/dashboard/${slug}/patients/${res.patientId}?tab=assessments`);
            }, 800);
        } else {
            toast.error(res.error || "Erro ao salvar os dados.");
        }
    }

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
                            <Select value="palmilha-v3" onValueChange={handleFormChange}>
                                <SelectTrigger className="border-none shadow-none font-black text-xl text-slate-900 tracking-tight p-0 h-auto focus:ring-0">
                                    <SelectValue placeholder="Selecione o Formulário" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectGroup>
                                        <SelectItem value="palmilha">Palmilha Biomecânica (Original)</SelectItem>
                                        <SelectItem value="palmilha-v3">Palmilha V3 (Nova)</SelectItem>
                                        <SelectItem value="physical">Avaliação Física Avançada</SelectItem>
                                        <SelectItem value="pbe">Avaliação PBE (Inteligente)</SelectItem>
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

            <PalmilhaFormV3
                patientId="sandbox"
                onSave={handleFormSave}
            />

            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!isSaving) setDialogOpen(open); }}>
                <DialogContent className="relative overflow-hidden">
                    {/* Loading Overlay */}
                    {isSaving && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-slate-800">Salvando avaliação...</p>
                                <p className="text-sm text-slate-500 mt-1">Criando prontuário e vinculando ao paciente</p>
                            </div>
                        </div>
                    )}
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
                                                        <CommandItem key={p.id} value={`${p.id} ${p.name}`} onSelect={() => {
                                                            setSelectedPatient(p);
                                                            setOpenCombobox(false);
                                                        }}>
                                                            <Check className={cn("mr-2 h-4 w-4 shrink-0", selectedPatient?.id === p.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-semibold truncate">{p.name}</span>
                                                                {p.phone && <span className="text-[10px] text-muted-foreground">{formatPhoneDisplay(p.phone)}</span>}
                                                            </div>
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
                        <Button variant="default" onClick={() => handleFinalSave()} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Confirmar e Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

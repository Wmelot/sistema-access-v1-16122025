'use client'

import { useParams, useRouter } from 'next/navigation';
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm";
import { ConceptPBEForm } from "@/features/pbe/components/ConceptPBEForm";
import { AdvancedPhysicalForm } from "@/features/pbe/components/AdvancedPhysicalForm";
import SmartPBEForm from "@/features/pbe/components/SmartPBEForm";
import DiabeticFootForm from "@/features/pbe/components/DiabeticFootForm";
import UltimatePBEForm from "@/features/pbe/components/UltimatePBEForm";
import AdvancedSmartAssessment from "@/features/smart-assessment/components/AdvancedSmartAssessment";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, UserPlus, User, X, FileText, ArrowLeft, ChevronDown, Check, ChevronsUpDown } from "lucide-react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';

import { toast } from 'sonner';
import { saveSandboxAssessment } from '../actions';
import { searchPatients } from '@/actions/appointments';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatPhoneDisplay } from '@/utils/format-phone';

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
    };

    const handleFinalSave = async (force: boolean = false) => {
        if (!pendingData || Object.keys(pendingData).length === 0) {
            toast.error("Preencha alguns dados no formulário antes de salvar.");
            return;
        }

        setIsSaving(true);

        try {
            let result;

            // [FIX] Ensure plain object for Server Action
            const sanitizedData = JSON.parse(JSON.stringify(pendingData));

            if (activeTab === 'associate') {
                if (!selectedPatient) {
                    toast.error("Selecione um paciente");
                    setIsSaving(false);
                    return;
                }
                result = await saveSandboxAssessment(slug, type, sanitizedData, selectedPatient.id, undefined, force);
            } else {
                if (!newName || !newPhone) {
                    toast.error("Preencha nome e telefone");
                    setIsSaving(false);
                    return;
                }
                result = await saveSandboxAssessment(slug, type, sanitizedData, undefined, { name: newName, phone: newPhone }, force);
            }

            if (result.error === 'PATIENT_NAME_EXISTS') {
                setIsSaving(false);
                const { default: Swal } = await import('sweetalert2');
                const p = result.existingPatient;
                const patientsHtml = (result.existingPatients || [p]).map((ext: any) => `
                    <div 
                        class="patient-item-option" 
                        data-id="${ext.id}" 
                        style="text-align:left; padding:12px 16px; margin-bottom:10px; background:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:all 0.2s;"
                        onclick="window.selectPatientSandbox('${ext.id}', this)"
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

                const countFound = (result.existingPatients || [p]).length;

                const choice = await Swal.fire({
                    title: 'Paciente(s) já Cadastrado(s)',
                    html: `
                        <style>
                            .patient-item-option.selected { border-color: #3b82f6 !important; background: #eff6ff !important; }
                            .patient-item-option.selected .check-circle { border-color: #3b82f6 !important; }
                            .patient-item-option.selected .inner-check { display: block !important; }
                        </style>
                        <p style="margin-bottom:14px; color:#64748b; font-size:14px; text-align:left;">
                            ${countFound > 1 ? `Foram encontrados <b>${countFound} pacientes</b>` : 'Foi encontrado <b>1 paciente</b>'} com o nome "<b>${newName}</b>":
                        </p>
                        <div id="sandbox-duplicates-list" style="max-height:280px; overflow-y:auto; padding-right:8px; margin-bottom:10px;">
                            ${patientsHtml}
                        </div>
                        <p style="margin-top:14px; color:#475569; font-size:14px; font-weight:500;">Deseja usar o cadastro selecionado ou criar um novo?</p>
                        <script>
                            window.selectedSandboxId = null;
                            window.selectPatientSandbox = function(id, el) {
                                document.querySelectorAll('.patient-item-option').forEach(item => item.classList.remove('selected'));
                                el.classList.add('selected');
                                window.selectedSandboxId = id;
                            }
                        </script>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Usar selecionado',
                    denyButtonText: 'Criar novo',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#3b82f6',
                    denyButtonColor: '#10b981',
                    preConfirm: () => {
                        const sid = (window as any).selectedSandboxId;
                        if (!sid && countFound > 0) {
                            Swal.showValidationMessage('Selecione um paciente na lista acima');
                            return false;
                        }
                        return sid;
                    }
                });

                if (choice.isConfirmed && choice.value) {
                    const selectedId = choice.value;
                    const matchedPatient = (result.existingPatients || [p]).find((pa: any) => pa.id === selectedId);

                    setActiveTab('associate');
                    setSelectedPatient(matchedPatient || p);
                    setIsSaving(true);
                    const sanitizedData = JSON.parse(JSON.stringify(pendingData));
                    const res2 = await saveSandboxAssessment(slug, type, sanitizedData, selectedId, undefined, false);
                    handleSaveResponse(res2);
                } else if (choice.isDenied) {
                    // Force create new with same name
                    handleFinalSave(true);
                }
                return;
            }

            handleSaveResponse(result);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveResponse = async (result: any) => {
        if (result.error === 'DUPLICATE_TODAY') {
            setIsSaving(false);
            const { default: Swal } = await import('sweetalert2');
            const choice = await Swal.fire({
                title: 'Agendamento Identificado',
                text: `${result.msg} Deseja usar este agendamento ou criar um novo?`,
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
                const sanitizedData = JSON.parse(JSON.stringify(pendingData));
                const res = await saveSandboxAssessment(slug, type, sanitizedData, result.patientId || selectedPatient?.id, undefined, true, result.appointmentId);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Dados salvos no agendamento existente!");
                    router.push(`/dashboard/${slug}/patients/${res.patientId}`);
                }
            } else if (choice.isDenied) {
                setIsSaving(true);
                const sanitizedData = JSON.parse(JSON.stringify(pendingData));
                const res = await saveSandboxAssessment(slug, type, sanitizedData, result.patientId || selectedPatient?.id, undefined, true);
                if (res.error) toast.error(res.error);
                else {
                    toast.success("Dados salvos e novo agendamento gerado!");
                    router.push(`/dashboard/${slug}/patients/${res.patientId}`);
                }
            }
            setIsSaving(false);
            return;
        }

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Dados salvos com sucesso! Abrindo prontuário...");
            setDialogOpen(false);
            router.push(`/dashboard/${slug}/patients/${result.patientId}`);
        }
    }

    const renderForm = () => {
        switch (type) {
            case 'womens-health':
                return <WomensHealthForm patientId="sandbox" onSave={handleInitialSave} hideHeader hideButtons />;
            case 'pbe':
                return <SmartPBEForm patientId="sandbox" onSave={handleInitialSave} hideHeader hideButtons />;
            case 'physical':
                return <AdvancedPhysicalForm patientId="sandbox" onSave={handleInitialSave} hideHeader hideButtons />;
            case 'ultimate-pbe': // Fusion Form
                return <UltimatePBEForm patientId="sandbox" onSave={handleInitialSave} hideHeader hideButtons />;
            case 'diabetic-foot':
                return <DiabeticFootForm patientId="sandbox" onSave={handleInitialSave} hideHeader hideButtons />;

            case 'smart-wizard':
                return <AdvancedSmartAssessment patientId="sandbox" />;
            default:
                return <div>Formulário não encontrado.</div>;
        }
    };

    const handleFormChange = (newType: string) => {
        if (newType === 'palmilha') {
            router.push(`/dashboard/${slug}/test-form`);
        } else {
            router.push(`/dashboard/${slug}/test-form/${newType}`);
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
                            <Select value={type} onValueChange={handleFormChange}>
                                <SelectTrigger className="border-none shadow-none font-black text-xl text-slate-900 tracking-tight p-0 h-auto focus:ring-0">
                                    <SelectValue placeholder="Selecione o Formulário" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]">
                                    <SelectGroup>
                                        <SelectItem value="palmilha">Palmilha Biomecânica</SelectItem>
                                        <SelectItem value="physical">Avaliação Física Avançada</SelectItem>
                                        <SelectItem value="pbe">Avaliação PBE (Acordeão Inteligente)</SelectItem>
                                        <SelectItem value="smart-wizard" className="font-bold text-indigo-600 bg-indigo-50">✨ PBE 3.0: Decision Tree Wizard (IA)</SelectItem>
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

            {/* Form Containers */}
            {renderForm()}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salvar Avaliação ({type})</DialogTitle>
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
                                            <CommandList className="max-h-[300px] overflow-y-auto">
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
                        <Button variant="default" onClick={() => handleFinalSave()} disabled={isSaving}>
                            {isSaving ? "Salvando..." : "Confirmar e Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="fixed bottom-8 right-8 flex gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Button
                    onClick={() => setDialogOpen(true)}
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

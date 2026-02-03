'use client'

import { useParams, useRouter } from 'next/navigation';
import { WomensHealthForm } from "@/features/womens-health/components/WomensHealthForm";
import { SmartAssessmentForm } from "@/features/pbe/components/SmartAssessmentForm";
import { PhysicalAssessmentForm } from "@/features/pbe/components/PhysicalAssessmentFormLegacy";
import DiabeticFootForm from "@/features/pbe/components/DiabeticFootForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, UserPlus, User, X } from "lucide-react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox'; // Assuming exists or use standard shadcn
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
        setDialogOpen(true);
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
                toast.success("Avaliação salva com sucesso!");
                setDialogOpen(false);
                setPendingData(null);
                // Redirect to patient?
                router.push(`/dashboard/${slug}/patients/${result.patientId}?tab=assessments`);
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

    return (
        <div className="space-y-6">
            <Alert className={`bg-${color}-50 border-${color}-200`}>
                <InfoIcon className={`h-4 w-4 text-${color}-600`} />
                <AlertTitle className={`text-${color}-800`}>Ambiente de Sandbox</AlertTitle>
                <AlertDescription className={`text-${color}-700`}>
                    Preencha o formulário abaixo. Ao final, clique em <strong>Salvar</strong> para vincular a um paciente ou criar um novo.
                </AlertDescription>
            </Alert>

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
                                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="(00) 00000-0000" />
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
        </div>
    );
}

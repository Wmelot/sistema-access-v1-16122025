import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PencilRuler, Plus, Trash2, ClipboardList, FileText, Info, CalendarClock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label as FormLabel } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";

// QUESTIONNAIRES DEFINITION
const QUESTIONNAIRES_BY_CATEGORY = [
    {
        category: "Coluna Cervical",
        items: [
            { id: "ndi", label: "NDI (Cervical)" },
            { id: "cmq", label: "CMQ (Cefaleia)" }
        ]
    },
    {
        category: "Coluna Lombar",
        items: [
            { id: "oswestry", label: "Oswestry (Lombar)" },
            { id: "roland_morris", label: "Roland-Morris (Lombar)" },
            { id: "quebec", label: "Quebec (Lombar)" },
            { id: "start_back", label: "STarT Back (Triagem)" }
        ]
    },
    {
        category: "Ombro",
        items: [
            { id: "spadi", label: "SPADI (Ombro)" }
        ]
    },
    {
        category: "Cotovelo, Punho e Mão",
        items: [
            { id: "quickdash", label: "QuickDASH (Mm. Superior)" },
            { id: "prwe", label: "PRWE (Punho)" }
        ]
    },
    {
        category: "Quadril",
        items: [
            { id: "hoos", label: "HOOS (Quadril)" },
            { id: "ihot33", label: "iHOT-33 (Quadril)" }
        ]
    },
    {
        category: "Joelho",
        items: [
            { id: "koos", label: "KOOS (Joelho)" },
            { id: "ikdc", label: "IKDC Subjetivo (Joelho)" },
            { id: "lysholm", label: "Lysholm (Joelho)" }
        ]
    },
    {
        category: "Pé e Tornozelo",
        items: [
            { id: "lefs", label: "LEFS (Membro Inferior)" },
            { id: "faam", label: "FAAM (Tornozelo e Pé)" },
            { id: "faos", label: "FAOS (Tornozelo e Pé)" },
            { id: "aofas", label: "AOFAS (Tornozelo/Retropé)" }
        ]
    },
    {
        category: "Saúde Pélvica",
        items: [
            { id: "iciq_sf", label: "ICIQ-SF (Incontinência)" },
            { id: "udi_6", label: "UDI-6 (Urogenital)" },
            { id: "fsfi", label: "FSFI (Função Sexual)" }
        ]
    },
    {
        category: "Geral & Dor",
        items: [
            { id: "tampa_kinesiophobia", label: "Tampa (Cinesiofobia)" },
            { id: "mcgill_short", label: "McGill (Dor)" }
        ]
    }
];

const QUESTIONNAIRES = QUESTIONNAIRES_BY_CATEGORY.flatMap(c => c.items);

const ExtraQuestionnaireSelector = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 text-xs border-blue-200 font-bold bg-white text-blue-900 shadow-sm hover:bg-blue-50 focus:ring-0">
                    <span className="truncate">{value && value !== 'none'
                        ? QUESTIONNAIRES.find((q) => q.id === value)?.label
                        : "Selecionar Questionário Clínico..."}</span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar questionário..." className="h-9 border-none focus:ring-0 focus:outline-none focus-visible:ring-0 hover:bg-transparent" />
                    <CommandList className="max-h-[400px]">
                        <CommandEmpty>Não encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem value="none" onSelect={() => { onChange('none'); setOpen(false); }}>
                                <span className="font-bold text-slate-400">Nenhum (Apenas Funcional)</span>
                            </CommandItem>
                            {QUESTIONNAIRES_BY_CATEGORY.map((cat) => (
                                <div key={cat.category} className="px-2 py-1.5 border-b last:border-0 border-slate-50">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-2">{cat.category}</div>
                                    {cat.items.map((q) => (
                                        <CommandItem
                                            key={q.id}
                                            value={q.label}
                                            onSelect={() => {
                                                onChange(q.id);
                                                setOpen(false);
                                            }}
                                            className="pl-4 h-8"
                                        >
                                            <Check className={cn("mr-2 h-3.5 w-3.5", value === q.id ? "opacity-100" : "opacity-0")} />
                                            <span className="text-xs">{q.label}</span>
                                        </CommandItem>
                                    ))}
                                </div>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

interface EfepAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function EfepAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: EfepAccordionProps) {
    const form = useFormContext();

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({
        control: form.control,
        name: "efep"
    });

    return (
        <AccordionItem
            value="efep"
            data-value="efep"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'efep' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-orange-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('efep') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <PencilRuler className={cn("h-5 w-5 transition-colors", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-orange-600 transition-colors">Funcionalidade (EFEP) & Questionários</span>
                </div>
                {isSectionFilled('efep') && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-none text-[10px] h-5 mr-4 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6 border-t border-slate-50">
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                    <p className="text-[11px] text-blue-700 leading-tight">
                        <strong>Instrução:</strong> Selecione até 3 atividades cujo desempenho esteja comprometido.
                        (0 = Incapaz de realizar | 10 = Realiza sem dificuldades).
                    </p>
                </div>

                {efepFields.map((f, i) => (
                    <div key={f.id} className="flex gap-3 items-center mb-3 animate-in slide-in-from-left-2 duration-300">
                        <span className="text-xs font-black text-slate-400 w-5">{i + 1}º</span>
                        <Input {...form.register(`efep.${i}.activity`)} placeholder={["Ex: Dormir / Repouso", "Ex: Caminhar plano", "Ex: Caminhar terreno irregular", "Ex: Subir escadas"][i] || "Ex: Atividade física..."} className="flex-1 bg-white h-10" />
                        <div className="w-24">
                            <Input
                                type="number"
                                {...form.register(`efep.${i}.score`)}
                                placeholder="0-10"
                                className="text-center font-black h-10 border-blue-200"
                                min={0}
                                max={10}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        form.setValue(`efep.${i}.score`, "");
                                        return;
                                    }
                                    const parsed = parseInt(val);
                                    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                        form.setValue(`efep.${i}.score`, parsed);
                                    }
                                }}
                                onBlur={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val) || val < 0) val = 0;
                                    if (val > 10) val = 10;
                                    form.setValue(`efep.${i}.score`, val);
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const result = await Swal.fire({
                                    title: 'Tem certeza?',
                                    text: "Deseja remover esta atividade funcional?",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#3085d6',
                                    cancelButtonColor: '#d33',
                                    confirmButtonText: 'Sim, remover',
                                    cancelButtonText: 'Cancelar'
                                });

                                if (result.isConfirmed) {
                                    removeEfep(i);
                                }
                            }}
                            className="focusable-element text-slate-400 hover:text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                {efepFields.length < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => appendEfep({ activity: "", score: "" })} className="focusable-element w-full border-dashed h-12 hover:bg-blue-50 text-blue-600 font-bold">
                        <Plus className="w-4 h-4 mr-2" /> ADICIONAR ATIVIDADE FUNCIONAL
                    </Button>
                )}

                {/* SEÇÃO DE QUESTIONÁRIOS MÚLTIPLOS */}
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-blue-600" />
                            <h4 className="font-bold text-slate-700 text-sm">Questionários Clínicos de Base</h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-600 bg-blue-50/50" title="Prática Baseada em Evidências">
                            Padrão Ouro (PBE)
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {(form.watch('plan.questionnaires') || []).length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {form.watch('plan.questionnaires').map((q: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl group transition-all hover:bg-blue-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-900 leading-none">
                                                    {QUESTIONNAIRES.find(item => item.id === q.type)?.label || q.type}
                                                </p>
                                                <p className="text-[10px] text-blue-500 mt-1 font-bold">Score: {q.score || 'Ver histórico'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all font-bold"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const result = await Swal.fire({
                                                    title: 'Remover questionário?',
                                                    text: "O questionário será removido deste registro.",
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#2563eb',
                                                    cancelButtonColor: '#64748b',
                                                    confirmButtonText: 'Sim, remover',
                                                    cancelButtonText: 'Manter'
                                                });

                                                if (result.isConfirmed) {
                                                    const current = form.getValues('plan.questionnaires') || [];
                                                    current.splice(idx, 1);
                                                    form.setValue('plan.questionnaires', [...current]);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhum questionário adicionado</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Selecione uma opção abaixo para iniciar</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <ExtraQuestionnaireSelector
                                value={form.watch("plan.extraQuestionnaire")}
                                onChange={(v) => form.setValue("plan.extraQuestionnaire", v)}
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!form.watch("plan.extraQuestionnaire") || form.watch("plan.extraQuestionnaire") === 'none'}
                            onClick={() => setIsAssessmentModalOpen?.(true)}
                            size="sm"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-9 font-bold text-[10px] tracking-wider rounded-lg shadow-md shadow-blue-900/10 transition-all active:scale-95"
                        >
                            <Plus className="h-3 w-3 mr-1" /> ADICIONAR
                        </Button>
                    </div>

                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                            <strong>Recomendação:</strong> Utilize o questionário PSFS para monitorar funções específicas e pelo menos um questionário regional (ex: LEFS para membros inferiores).
                        </p>
                    </div>
                </div>

                {/* AUTOMAÇÃO DE FOLLOW-UP */}
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg animate-in fade-in slide-in-from-top-2 mt-4 ml-0">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarClock className="w-5 h-5 text-purple-600" />
                        <h4 className="font-bold text-purple-900 text-sm">Automação de Follow-up & Monitoramento</h4>
                    </div>
                    <p className="text-xs text-purple-700 mb-4 leading-relaxed">
                        O paciente receberá um <strong>Link Único Inteligente</strong> combinando todos os itens selecionados abaixo (Funcionalidade, Dor e Questionários Extras), garantindo maior taxa de resposta.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <FormLabel className="text-[10px] font-bold text-purple-800 uppercase block">Régua de Envio (Múltipla Escolha)</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { l: "15 Dias", v: "15" },
                                    { l: "30 Dias", v: "30" },
                                    { l: "45 Dias", v: "45" },
                                    { l: "60 Dias", v: "60" },
                                    { l: "90 Dias", v: "90" }
                                ].map((opt) => {
                                    const current = form.watch('plan.followUpDays') || [];
                                    const isChecked = current.includes(opt.v);
                                    return (
                                        <label key={opt.v} className={cn(
                                            "flex items-center gap-2 border px-3 py-2 rounded-lg cursor-pointer transition-all",
                                            isChecked ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white border-purple-200 text-purple-900 hover:bg-purple-50"
                                        )}>
                                            <Checkbox
                                                className={cn("data-[state=checked]:bg-white data-[state=checked]:text-purple-600 border-purple-300", isChecked && "border-white")}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    const novo = checked
                                                        ? [...current, opt.v]
                                                        : current.filter((i: string) => i !== opt.v);
                                                    form.setValue('plan.followUpDays', novo);
                                                }}
                                            />
                                            <span className="text-xs font-bold">{opt.l}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 bg-white p-3 rounded border border-purple-100 h-full">
                                <FormLabel className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-2 mb-2">
                                    <Activity className="w-3 h-3" /> O que Avaliar?
                                </FormLabel>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 opacity-75">
                                        <Checkbox checked disabled className="border-purple-300" />
                                        <span className="text-xs text-purple-900 font-medium">Funcionalidade (As 3 atividades acima)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            defaultChecked
                                            onCheckedChange={(c) => form.setValue('plan.monitorPain', c)}
                                            className="data-[state=checked]:bg-purple-600 border-purple-300"
                                        />
                                        <span className="text-xs text-purple-900 font-medium">Nível de Dor (Escala EVA)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start sm:justify-end items-center gap-2 pt-2 border-t border-purple-100">
                            <span className="text-[10px] font-bold text-purple-800 uppercase">Enviar por:</span>
                            <Select defaultValue="whatsapp">
                                <SelectTrigger className="bg-white border-purple-200 text-purple-900 h-8 font-medium w-[180px] text-xs">
                                    <SelectValue placeholder="WhatsApp" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" className="z-[110]">
                                    <SelectItem value="whatsapp">WhatsApp (Automático)</SelectItem>
                                    <SelectItem value="email">E-mail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

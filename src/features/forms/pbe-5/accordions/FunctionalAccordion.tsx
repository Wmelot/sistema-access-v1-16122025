"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { PencilRuler, Plus, Trash2, ClipboardList, FileText, Info, CalendarClock, Activity, Zap, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

const QUESTIONNAIRES_BY_CATEGORY = [
    {
        category: "Coluna Cervical",
        regions: ["coluna_cervical"],
        specialties: ["ortopedia"],
        items: [
            { id: "ndi", label: "NDI (Cervical)" },
            { id: "cmq", label: "CMQ (Cefaleia)" }
        ]
    },
    {
        category: "ATM (Temporomandibular)",
        regions: ["atm"],
        specialties: ["ortopedia"],
        items: [
            { id: "fonseca", label: "Fonseca (Triagem DTM)" },
            { id: "jfls8", label: "JFLS-8 (Limitação Mandibular)" }
        ]
    },
    {
        category: "Coluna Lombar",
        regions: ["coluna_lombar"],
        specialties: ["ortopedia"],
        items: [
            { id: "oswestry", label: "Oswestry (Lombar)" },
            { id: "roland_morris", label: "Roland-Morris (Lombar)" },
            { id: "quebec", label: "Quebec (Lombar)" },
            { id: "start_back", label: "STarT Back (Triagem)" }
        ]
    },
    {
        category: "Ombro",
        regions: ["ombro"],
        specialties: ["ortopedia"],
        items: [
            { id: "spadi", label: "SPADI (Ombro)" }
        ]
    },
    {
        category: "Cotovelo, Punho e Mão",
        regions: ["cotovelo_mao"],
        specialties: ["ortopedia"],
        items: [
            { id: "quickdash", label: "QuickDASH (Mm. Superior)" },
            { id: "prwe", label: "PRWE (Punho)" }
        ]
    },
    {
        category: "Quadril",
        regions: ["quadril"],
        specialties: ["ortopedia"],
        items: [
            { id: "hoos", label: "HOOS (Quadril)" },
            { id: "ihot33", label: "iHOT-33 (Quadril)" }
        ]
    },
    {
        category: "Joelho",
        regions: ["joelho"],
        specialties: ["ortopedia"],
        items: [
            { id: "koos", label: "KOOS (Joelho)" },
            { id: "ikdc", label: "IKDC Subjetivo (Joelho)" },
            { id: "lysholm", label: "Lysholm (Joelho)" }
        ]
    },
    {
        category: "Pé e Tornozelo",
        regions: ["tornozelo_pe"],
        specialties: ["ortopedia"],
        items: [
            { id: "lefs", label: "LEFS (Membro Inferior)" },
            { id: "faam", label: "FAAM (Tornozelo e Pé)" },
            { id: "faos", label: "FAOS (Tornozelo e Pé)" },
            { id: "aofas", label: "AOFAS (Tornozelo/Retropé)" }
        ]
    },
    {
        category: "Saúde Pélvica",
        specialties: ["saude_mulher"],
        items: [
            { id: "iciq_sf", label: "ICIQ-SF (Incontinência)" },
            { id: "udi_6", label: "UDI-6 (Urogenital)" },
            { id: "fsfi", label: "FSFI (Função Sexual)" }
        ]
    },
    {
        category: "Neurologia & Pediatria",
        specialties: ["neuropediatria", "neurofuncional_adulto"],
        items: [
            { id: "gmfcs", label: "GMFCS (Classificação Motora)" },
            { id: "pbs_pediatric", label: "PBS (Equilíbrio Pediátrico)" },
            { id: "ecab", label: "ECAB (Equilíbrio Inicial)" },
            { id: "aims", label: "AIMS (Escala Motora Infantil)" },
            { id: "mfm32", label: "MFM-32 (Função Motora)" }
        ]
    },
    {
        category: "Gerontologia",
        specialties: ["gerontologia"],
        items: [
            { id: "meem_gero", label: "MEEM (Cognição)" },
            { id: "lawton_gero", label: "Lawton (AIVD)" },
            { id: "sppb_gero", label: "SPPB (Desempenho Físico)" }
        ]
    },
    {
        category: "Geral & Dor",
        specialties: ["all"],
        items: [
            { id: "tampa_kinesiophobia", label: "Tampa (Cinesiofobia)" },
            { id: "mcgill_short", label: "McGill (Dor)" }
        ]
    },
    {
        category: "Neuropatia / Pé Diabético",
        specialties: ["diabetes"], // special marker
        items: [
            { id: "mnsi", label: "MNSI (Neuropatia Diabética)" },
            { id: "diabetes_control", label: "Score Glicêmico" }
        ]
    }
];

const QUESTIONNAIRES = QUESTIONNAIRES_BY_CATEGORY.flatMap(c => c.items);

const ExtraQuestionnaireSelector = ({ value, onChange, specialty, regions, hasDiabetes }: { value: string, onChange: (v: string) => void, specialty: string, regions: string[], hasDiabetes?: boolean }) => {
    const [open, setOpen] = React.useState(false);

    const filteredCategories = QUESTIONNAIRES_BY_CATEGORY.filter(cat => {
        if (cat.specialties?.includes('all')) return true;
        if (cat.specialties?.includes('diabetes') && (hasDiabetes || regions?.includes('tornozelo_pe'))) return true;

        if (cat.specialties?.includes(specialty)) {
            // If specialty matches, further filter ortopedia by regions if regions are provided
            if (specialty === 'ortopedia' && cat.regions && regions?.length > 0) {
                return cat.regions.some(r => regions.includes(r));
            }
            return true;
        }
        return false;
    });

    const selectedLabel = QUESTIONNAIRES.find((q) => q.id === value)?.label || "Selecionar Questionário...";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-12 justify-between text-xs font-bold bg-white text-slate-900 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                    {value === "none" ? "Selecionar Questionário Clínico..." : selectedLabel}
                    <div className="flex items-center gap-2">
                        {value !== "none" && <Badge className="bg-blue-600 text-[8px] h-4">SELECIONADO</Badge>}
                        <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[500] rounded-2xl shadow-2xl border-slate-100 overflow-hidden">
                <Command className="rounded-none">
                    <CommandInput placeholder="Digite para pesquisar questionário..." className="h-12 font-bold" />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum questionário encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="none"
                                onSelect={() => {
                                    onChange("none");
                                    setOpen(false);
                                }}
                                className="font-bold text-slate-400 uppercase text-[10px] py-3 cursor-pointer"
                            >
                                <Check className={cn("mr-2 h-4 w-4", value === "none" ? "opacity-100" : "opacity-0")} />
                                Nenhum (Apenas Funcional)
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        {filteredCategories.map((cat) => (
                            <CommandGroup key={cat.category} heading={cat.category} className="px-2">
                                {cat.items.map((q) => (
                                    <CommandItem
                                        key={q.id}
                                        value={q.label}
                                        onSelect={() => {
                                            onChange(q.id);
                                            setOpen(false);
                                        }}
                                        className="text-xs font-bold py-3 pl-4 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <Check className={cn("mr-2 h-4 w-4 text-blue-600", value === q.id ? "opacity-100" : "opacity-0")} />
                                        {q.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


interface FunctionalAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function FunctionalAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: FunctionalAccordionProps) {
    const { register, watch, setValue, control, getValues } = useFormContext();

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({
        control,
        name: "functionality.efep"
    });

    const questionnaires = watch('conduct.questionnaires') || [];
    const followUpDays = watch('conduct.followUpDays') || [];
    const extraQuestionnaire = watch('conduct.extraQuestionnaire') || "none";

    return (
        <AccordionItem
            value="functionality"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'functionality' ? 'bg-white ring-2 ring-blue-50' : 'bg-white/50',
                isSectionFilled('functionality') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <PencilRuler className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'functionality' ? "text-slate-900" : "text-slate-600")}>Funcionalidade e Escalas</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">EFEP, Questionários Regionais e Follow-up</p>
                    </div>
                </div>
                {isSectionFilled('functionality') && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-none text-[10px] h-6 px-3 rounded-full font-black">PREENCHIDO</Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-10 border-t border-slate-50">

                {/* EFEP SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-blue-500 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Escala Funcional Específica (EFEP)</h4>
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[9px] font-black uppercase tracking-widest px-3">Atividades de Vida Diária</Badge>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4 shadow-inner">
                        <div className="flex gap-4 items-start mb-2 px-1">
                            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter opacity-80">
                                Identifique atividades comprometidas. <span className="text-blue-600">0 = Incapaz</span> até <span className="text-emerald-600">10 = Sem dificuldade.</span>
                            </p>
                        </div>

                        {efepFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-3 items-center animate-in slide-in-from-left-2 duration-300">
                                <div className="col-span-1 text-center">
                                    <span className="text-xs font-black text-slate-300">{index + 1}º</span>
                                </div>
                                <div className="col-span-8">
                                    <Input
                                        {...register(`functionality.efep.${index}.activity`)}
                                        placeholder={["Ex: Caminhar plano", "Ex: Subir escadas", "Ex: Dormir / Repouso"][index] || "Descreva a atividade..."}
                                        className="h-12 rounded-xl bg-white border-slate-200 text-xs font-bold"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        {...register(`functionality.efep.${index}.score`)}
                                        placeholder="0-10"
                                        className="h-12 rounded-xl bg-white border-blue-200 text-center font-black text-sm"
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeEfep(index)}
                                        className="h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {efepFields.length < 3 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => appendEfep({ activity: "", score: "" })}
                                className="w-full h-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-400 text-blue-600 font-black text-[10px] tracking-[0.2em] transition-all active:scale-[0.98]"
                            >
                                <Plus className="h-4 w-4 mr-2" /> ADICIONAR ITEM FUNCIONAL
                            </Button>
                        )}
                    </div>
                </div>

                {/* CLINICAL QUESTIONNAIRES */}
                <div className="pt-6 border-t border-slate-50 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Questionários Clínicos (PBE)</h4>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none text-[9px] h-6 px-3 rounded-full font-black tracking-widest uppercase">Padrão Ouro</Badge>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-3 min-h-[160px] p-1">
                                {questionnaires.length > 0 ? (
                                    questionnaires.map((q: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-indigo-200 shadow-sm hover:shadow-md h-fit">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-800 leading-none mb-1 uppercase tracking-tight">
                                                        {QUESTIONNAIRES.find(item => item.id === q.type)?.label || q.type}
                                                    </p>
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black tracking-widest uppercase h-4 px-1.5 rounded-sm">Score: {q.score || 'Pendente'}</Badge>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => {
                                                    const current = getValues('conduct.questionnaires') || [];
                                                    setValue('conduct.questionnaires', current.filter((_: any, i: number) => i !== idx));
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-1 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                                        <ClipboardList className="h-8 w-8 text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Nenhum questionário<br />adicionado à consulta</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 w-full">
                                <div className="flex-1">
                                    <ExtraQuestionnaireSelector
                                        value={extraQuestionnaire}
                                        onChange={(v) => setValue("conduct.extraQuestionnaire", v)}
                                        specialty={watch('clinical.specialty')}
                                        regions={watch('anamnesis.mainRegions')}
                                        hasDiabetes={watch('clinical.comorbidities')?.includes('Diabetes Mellitus')}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    disabled={!extraQuestionnaire || extraQuestionnaire === 'none'}
                                    onClick={() => setIsAssessmentModalOpen?.(true)}
                                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-widest px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:grayscale shrink-0"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> ADICIONAR
                                </Button>
                            </div>
                        </div>

                        {/* FOLLOW-UP AUTOMATION */}
                        <div className="bg-purple-50/50 border border-purple-100/50 rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute -top-4 -right-4 opacity-5 rotate-12">
                                <CalendarClock className="w-32 h-32 text-purple-900" />
                            </div>

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="p-2 bg-white rounded-xl shadow-sm text-purple-600 border border-purple-100">
                                    <CalendarClock className="h-5 w-5" />
                                </div>
                                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Automação de Follow-up</h5>
                            </div>

                            <p className="text-[10px] text-purple-700 leading-relaxed font-bold uppercase tracking-tighter relative z-10">
                                Enviaremos um <span className="text-purple-900">Link Inteligente</span> via WhatsApp/E-mail nas datas selecionadas para monitorar a evolução.
                            </p>

                            <div className="space-y-4 relative z-10 bg-white p-6 rounded-[2rem] border border-purple-100 shadow-sm">
                                <div className="space-y-4">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block ml-1">Prazos de envio das Reavaliações</span>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { l: "15 Dias", v: "15" },
                                            { l: "30 Dias", v: "30" },
                                            { l: "45 Dias", v: "45" },
                                            { l: "60 Dias", v: "60" },
                                            { l: "90 Dias", v: "90" },
                                            { l: "120 Dias", v: "120" }
                                        ].map((opt) => {
                                            const isChecked = followUpDays.includes(opt.v);
                                            return (
                                                <label key={opt.v} className={cn(
                                                    "flex items-center gap-2 border-2 px-4 py-2 rounded-xl cursor-pointer transition-all min-w-[70px] justify-center",
                                                    isChecked ? "bg-purple-600 border-purple-600 text-white shadow-md scale-105" : "bg-white border-purple-100 text-purple-400 hover:border-purple-300"
                                                )}>
                                                    <Checkbox
                                                        className={cn("hidden", isChecked && "border-white")}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            const novo = checked
                                                                ? [...followUpDays, opt.v]
                                                                : followUpDays.filter((i: string) => i !== opt.v);
                                                            setValue('conduct.followUpDays', novo);
                                                        }}
                                                    />
                                                    <span className="text-xs font-black uppercase">{opt.l}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="flex flex-col gap-3 px-1 py-4">
                                        <div className="flex items-center gap-3 group">
                                            <Checkbox checked disabled className="border-purple-300 data-[state=checked]:bg-purple-400" />
                                            <span className="text-[11px] text-purple-900 font-bold uppercase tracking-tight opacity-70">Funcionalidade (As 3 atividades acima)</span>
                                        </div>
                                        <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setValue('conduct.monitorPain', !watch('conduct.monitorPain'))}>
                                            <Checkbox
                                                checked={!!watch('conduct.monitorPain')}
                                                onCheckedChange={(c) => setValue('conduct.monitorPain', c)}
                                                className="data-[state=checked]:bg-purple-600 border-purple-300 h-5 w-5 rounded-md"
                                            />
                                            <span className="text-[11px] text-purple-900 font-black uppercase tracking-tight group-hover:text-purple-600">Intensidade da Dor (EVA)</span>
                                        </label>
                                    </div>

                                    <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 h-full shadow-sm">
                                        <h6 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Canal de Monitoramento</h6>
                                        <Select defaultValue="whatsapp">
                                            <SelectTrigger className="bg-white border-indigo-200 text-indigo-900 h-10 font-bold rounded-xl text-xs shadow-sm">
                                                <SelectValue placeholder="Selecione o canal..." />
                                            </SelectTrigger>
                                            <SelectContent position="popper" side="bottom" className="z-[110] rounded-xl">
                                                <SelectItem value="whatsapp" className="font-bold py-2">WhatsApp</SelectItem>
                                                <SelectItem value="email" className="font-bold py-2">E-mail</SelectItem>
                                                <SelectItem value="manual" className="font-bold py-2">Coleta Presencial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1 mt-1 leading-tight opacity-70">
                                            O link será gerado automaticamente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

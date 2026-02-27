"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { PencilRuler, Plus, Trash2, ClipboardList, FileText, Info, CalendarClock, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

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
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-12 text-xs border-slate-200 font-bold bg-white text-slate-900 rounded-xl shadow-sm hover:bg-slate-50 focus:ring-blue-600 transition-all">
                <SelectValue placeholder="Selecionar Questionário Clínico Padrão..." />
            </SelectTrigger>
            <SelectContent className="z-[500]"> {/* Changed z-index here */}
                <SelectItem value="none" className="font-bold text-slate-400 uppercase text-[10px]">Nenhum (Apenas Funcional)</SelectItem>
                {QUESTIONNAIRES_BY_CATEGORY.map((cat) => (
                    <SelectGroup key={cat.category}>
                        <SelectLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50/50 mt-1">{cat.category}</SelectLabel>
                        {cat.items.map(q => (
                            <SelectItem key={q.id} value={q.id} className="text-xs font-bold py-3 pl-8">
                                {q.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
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
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'functionality' ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500")}>
                        <PencilRuler className="h-5 w-5" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'functionality' ? "text-slate-900" : "text-slate-600")}>4. Funcionalidade & Escalas</span>
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

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 min-h-[160px] p-1">
                                {questionnaires.length > 0 ? (
                                    questionnaires.map((q: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group transition-all hover:border-indigo-200 shadow-sm hover:shadow-md">
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
                                    <div className="flex-1 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                                        <ClipboardList className="h-8 w-8 text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">Nenhum questionário<br />adicionado à consulta</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <ExtraQuestionnaireSelector
                                        value={extraQuestionnaire}
                                        onChange={(v) => setValue("conduct.extraQuestionnaire", v)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    disabled={!extraQuestionnaire || extraQuestionnaire === 'none'}
                                    onClick={() => setIsAssessmentModalOpen?.(true)}
                                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-widest px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:grayscale"
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

                            <div className="space-y-4 relative z-10">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block ml-1">Régua de Reavaliação</span>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { l: "15d", v: "15" },
                                            { l: "30d", v: "30" },
                                            { l: "45d", v: "45" },
                                            { l: "60d", v: "60" },
                                            { l: "90d", v: "90" }
                                        ].map((opt) => {
                                            const isChecked = followUpDays.includes(opt.v);
                                            return (
                                                <button
                                                    key={opt.v}
                                                    type="button"
                                                    onClick={() => {
                                                        const novo = isChecked
                                                            ? followUpDays.filter((i: string) => i !== opt.v)
                                                            : [...followUpDays, opt.v];
                                                        setValue('conduct.followUpDays', novo);
                                                    }}
                                                    className={cn(
                                                        "h-10 px-4 rounded-xl text-[10px] font-black transition-all border shadow-sm",
                                                        isChecked
                                                            ? "bg-purple-600 border-purple-600 text-white shadow-purple-200"
                                                            : "bg-white border-purple-100 text-purple-600 hover:border-purple-300"
                                                    )}
                                                >
                                                    {opt.l}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 relative z-10">
                                    <div className="flex items-center gap-2 opacity-75">
                                        <Checkbox checked disabled className="border-purple-300" />
                                        <span className="text-xs text-purple-900 font-medium tracking-tight uppercase">Funcionalidade (As 3 atividades acima)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={watch('conduct.monitorPain')}
                                            onCheckedChange={(c) => setValue('conduct.monitorPain', c)}
                                            className="data-[state=checked]:bg-purple-600 border-purple-300"
                                        />
                                        <span className="text-xs text-purple-900 font-medium tracking-tight uppercase">Nível de Dor (Escala EVA)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="space-y-2 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                                    <h6 className="text-[10px] font-black text-purple-800 uppercase tracking-widest mb-3">Canal de Envio Preferencial</h6>
                                    <div className="flex flex-col gap-2">
                                        <Select defaultValue="whatsapp">
                                            <SelectTrigger className="w-full h-10 text-[10px] font-bold border-purple-100 bg-purple-50/10 rounded-xl">
                                                <SelectValue placeholder="Selecione o canal..." />
                                            </SelectTrigger>
                                            <SelectContent className="z-[500]">
                                                <SelectItem value="whatsapp" className="text-[10px] font-bold py-2">WhatsApp Automático</SelectItem>
                                                <SelectItem value="email" className="text-[10px] font-bold py-2">E-mail Profissional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1 mt-1 leading-tight opacity-70">
                                            O link será gerado automaticamente ao salvar a avaliação.
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

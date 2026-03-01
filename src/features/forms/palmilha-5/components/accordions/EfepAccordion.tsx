import React, { useState, useMemo } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PencilRuler, Plus, Trash2, ClipboardList, FileText, Info, CalendarClock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label as FormLabel } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

// MAP OF REGIONS TO CATEGORIES
const REGION_TO_CATEGORY: Record<string, string> = {
    coluna_cervical: "Coluna Cervical",
    coluna_lombar: "Coluna Lombar",
    ombro: "Ombro",
    joelho: "Joelho",
    tornozelo_pe: "Pé e Tornozelo",
    quadril: "Quadril",
    cotovelo_mao: "Cotovelo, Punho e Mão",
    atm: "ATM (Temporomandibular)"
};

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

const ExtraQuestionnaireSelector = ({ value, onChange, selectedCategories }: { value: string, onChange: (v: string) => void, selectedCategories: string[] }) => {
    const filteredCategories = useMemo(() => {
        // "Geral & Dor" and "Saúde Pélvica" are always relevant or based on specialty, but for now let's show them as "Geral"
        const alwaysVisible = ["Geral & Dor"];

        if (selectedCategories.length === 0) return QUESTIONNAIRES_BY_CATEGORY;

        return QUESTIONNAIRES_BY_CATEGORY.filter(cat =>
            selectedCategories.includes(cat.category) || alwaysVisible.includes(cat.category)
        );
    }, [selectedCategories]);

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full h-10 text-xs border-blue-200 font-bold bg-white text-blue-900 shadow-sm hover:bg-blue-50 focus:ring-0 rounded-xl">
                <SelectValue placeholder="Selecionar Questionário Regional/Geral..." />
            </SelectTrigger>
            <SelectContent className="z-[200]">
                <SelectItem value="none" className="font-bold text-slate-500">Nenhum questionário selecionado</SelectItem>
                {filteredCategories.map((cat) => (
                    <SelectGroup key={cat.category}>
                        <SelectLabel className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">{cat.category}</SelectLabel>
                        {cat.items.map(q => (
                            <SelectItem key={q.id} value={q.id} className="text-xs font-bold py-2">
                                {q.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                ))}
            </SelectContent>
        </Select>
    );
};

interface EfepAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
    setIsAssessmentModalOpen?: (isOpen: boolean) => void;
}

export function EfepAccordion({ openSection, isSectionFilled, sectionStyle, setIsAssessmentModalOpen }: EfepAccordionProps) {
    const form = useFormContext();
    const selectedRegions = form.watch('hma.mainRegions') || [];
    const selectedCategories = useMemo(() => selectedRegions.map((r: string) => REGION_TO_CATEGORY[r]).filter(Boolean), [selectedRegions]);

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
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <PencilRuler className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-orange-600 transition-colors">Escala Funcional Específica do Paciente (EFEP) e Questionários</span>
                </div>
                {isSectionFilled('efep') && <Badge variant="outline" className="bg-orange-50 text-orange-600 border-none text-[10px] h-5 mr-4 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-5 space-y-6 border-t border-slate-50">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-tight mb-1">Instruções EFEP</p>
                        <p className="text-[11px] text-blue-700/80 leading-snug font-medium">
                            Selecione 3 atividades cujo desempenho esteja comprometido por causa dos seus sintomas.
                            <br />Escala: <strong>0 (Totalmente Incapaz de Realizar)</strong> até <strong>10 (Consigo Realizar Sem Difilculdades)</strong>.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {efepFields.map((f, i) => (
                        <div key={f.id} className="flex gap-3 items-center animate-in slide-in-from-left-2 duration-300 group/row">
                            <span className="text-[10px] font-black text-slate-300 w-5 text-center mt-1">{i + 1}º</span>
                            <Input
                                {...form.register(`efep.${i}.activity`)}
                                placeholder={["Ex: Dormir / Repouso", "Ex: Caminhar plano", "Ex: Caminhar terreno irregular", "Ex: Subir escadas"][i] || "Ex: Atividade física..."}
                                className="flex-1 bg-white h-11 border-slate-200 rounded-xl font-medium focus:ring-orange-500 transition-all shadow-sm"
                            />
                            <div className="w-24 relative">
                                <Input
                                    type="number"
                                    {...form.register(`efep.${i}.score`)}
                                    placeholder="0-10"
                                    className="text-center font-black h-11 border-orange-200 rounded-xl bg-orange-50/30 focus:bg-white focus:ring-orange-500 transition-all"
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
                                <div className="absolute -top-2 -right-2 transform scale-75 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                    <Badge className="bg-orange-500 text-white border-white border text-[8px] px-1 py-0 min-w-[20px] justify-center">SCORE</Badge>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const result = await Swal.fire({
                                        title: 'Remover?',
                                        text: "Deseja remover esta atividade funcional?",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#f97316',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Sim, remover',
                                        cancelButtonText: 'Cancelar'
                                    });

                                    if (result.isConfirmed) {
                                        removeEfep(i);
                                    }
                                }}
                                className="focusable-element text-slate-300 hover:text-red-500 h-11 w-11 rounded-xl transition-colors hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {efepFields.length < 3 && (
                    <Button type="button" variant="outline" onClick={() => appendEfep({ activity: "", score: "" })} className="focusable-element w-full border-dashed border-2 h-14 hover:bg-orange-50 text-orange-600 font-black tracking-widest text-[10px] rounded-2xl group transition-all">
                        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" /> ADICIONAR ATIVIDADE FUNCIONAL
                    </Button>
                )}

                {/* SEÇÃO DE QUESTIONÁRIOS MÚLTIPLOS */}
                <div className="pt-6 border-t border-slate-100 mt-6 space-y-5">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                            <div className="space-y-0.5">
                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest">Questionários Clínicos</h4>
                                {selectedCategories.length > 0 && (
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                        Filtrando por: <span className="text-blue-600">{selectedCategories.join(", ")}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black border-blue-200 text-blue-600 bg-blue-50/50 px-2.5 py-1 uppercase tracking-widest" title="Prática Baseada em Evidências">
                            Padrão PBE
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        {(form.watch('plan.questionnaires') || []).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {form.watch('plan.questionnaires').map((q: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] group transition-all hover:border-blue-200 hover:shadow-md animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {QUESTIONNAIRES.find(item => item.id === q.type)?.label || q.type}
                                                </p>
                                                <p className="text-[10px] text-blue-600 mt-1 font-bold bg-blue-100/50 px-2 py-0.5 rounded-full inline-block">Score: {q.score || 'Ativo'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all font-bold rounded-xl"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const result = await Swal.fire({
                                                    title: 'Remover?',
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
                                                    const novo = [...current];
                                                    novo.splice(idx, 1);
                                                    form.setValue('plan.questionnaires', novo);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30 flex flex-col items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-200">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aguardando Avaliação Regional</p>
                                    <p className="text-[9px] text-slate-300 uppercase font-black tracking-tighter">Selecione o questionário abaixo para iniciar a resposta</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="flex-1">
                            <ExtraQuestionnaireSelector
                                value={form.watch("plan.extraQuestionnaire")}
                                onChange={(v) => form.setValue("plan.extraQuestionnaire", v)}
                                selectedCategories={selectedCategories}
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!form.watch("plan.extraQuestionnaire") || form.watch("plan.extraQuestionnaire") === 'none'}
                            onClick={() => setIsAssessmentModalOpen?.(true)}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-10 px-8 font-black text-[10px] tracking-widest uppercase rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center border-none"
                        >
                            <Plus className="h-4 w-4 mr-2" /> INICIAR
                        </Button>
                    </div>
                </div>

                {/* AUTOMAÇÃO DE FOLLOW-UP */}
                <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-[2rem] animate-in fade-in slide-in-from-top-2 mt-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                            <CalendarClock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-purple-900 text-xs uppercase tracking-widest">Follow-up Automático</h4>
                            <p className="text-[9px] font-bold text-purple-400 uppercase tracking-tighter">Monitoramento Digital Inteligente</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-purple-700 font-medium mb-5 leading-relaxed bg-white/60 p-3 rounded-xl border border-purple-50">
                        O envio do questionário é feito por <strong>Link Único</strong>, permitindo monitorar a evolução funcional e o nível de dor do paciente a distância.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <FormLabel className="text-[10px] font-black text-purple-800 uppercase tracking-widest block ml-1">Prazos de Envio (Dias Pós-Alta ou Atendimento)</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { l: "15 Dias", v: "15" },
                                    { l: "30 Dias", v: "30" },
                                    { l: "45 Dias", v: "45" },
                                    { l: "60 Dias", v: "60" },
                                    { l: "90 Dias", v: "90" },
                                    { l: "120 Dias", v: "120" }
                                ].map((opt) => {
                                    const current = form.watch('plan.followUpDays') || [];
                                    const isChecked = current.includes(opt.v);
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
                                                        ? [...current, opt.v]
                                                        : current.filter((i: string) => i !== opt.v);
                                                    form.setValue('plan.followUpDays', novo);
                                                }}
                                            />
                                            <span className="text-xs font-black uppercase">{opt.l}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3 bg-white p-4 rounded-2xl border border-purple-100 h-full shadow-sm">
                                <FormLabel className="text-[10px] font-black text-purple-800 uppercase flex items-center gap-2 mb-1 tracking-widest">
                                    <Activity className="w-3.5 h-3.5 text-purple-500" /> Parâmetros de Coleta
                                </FormLabel>

                                <div className="flex flex-col gap-3 px-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <Checkbox checked disabled className="border-purple-300 data-[state=checked]:bg-purple-400" />
                                        <span className="text-[11px] text-purple-900 font-bold uppercase tracking-tight opacity-70">Funcionalidade (PSFS)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group" onClick={() => form.setValue('plan.monitorPain', !form.watch('plan.monitorPain'))}>
                                        <Checkbox
                                            checked={!!form.watch('plan.monitorPain')}
                                            onCheckedChange={(c) => form.setValue('plan.monitorPain', c)}
                                            className="data-[state=checked]:bg-purple-600 border-purple-300 h-5 w-5 rounded-md"
                                        />
                                        <span className="text-[11px] text-purple-900 font-black uppercase tracking-tight group-hover:text-purple-600">Intensidade da Dor (EVA)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 h-full shadow-sm">
                                <FormLabel className="text-[10px] font-black text-indigo-800 uppercase flex items-center gap-2 mb-1 tracking-widest">
                                    Canal de Monitoramento
                                </FormLabel>
                                <Select defaultValue="whatsapp">
                                    <SelectTrigger className="bg-white border-indigo-200 text-indigo-900 h-10 font-bold rounded-xl text-xs shadow-sm">
                                        <SelectValue placeholder="Escolha o Canal..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" side="bottom" className="z-[110] rounded-xl">
                                        <SelectItem value="whatsapp" className="font-bold py-2">WhatsApp</SelectItem>
                                        <SelectItem value="email" className="font-bold py-2">E-mail</SelectItem>
                                        <SelectItem value="manual" className="font-bold py-2">Coleta Presencial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

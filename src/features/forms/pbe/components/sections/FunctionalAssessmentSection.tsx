"use client";

import React, { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, PencilRuler, Plus, Trash2, ClipboardList, FileText, Info, CalendarClock, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExtraQuestionnaireSelector, ALL_QUESTIONNAIRES } from "../ExtraQuestionnaireSelector";

interface FunctionalAssessmentSectionProps {
    value: any; // { efep, questionnaires, plan?: { followUpDays, monitorPain, extraQuestionnaire } }
    onChange: (newValue: any) => void;
    readonly?: boolean;
    onOpenAssessment?: (type: string) => void; // Callback to open the assessment modal
}

export function FunctionalAssessmentSection({ value, onChange, readonly, onOpenAssessment }: FunctionalAssessmentSectionProps) {
    const efep = value?.efep || [{ activity: "", score: "" }];
    const questionnaires = value?.questionnaires || [];
    const plan = value?.plan || { followUpDays: [], monitorPain: true, extraQuestionnaire: "none" };

    const handleEfepChange = (index: number, field: string, val: any) => {
        const newEfep = [...efep];
        newEfep[index] = { ...newEfep[index], [field]: val };
        onChange({ ...value, efep: newEfep });
    };

    const addEfep = () => {
        if (efep.length < 3) {
            onChange({ ...value, efep: [...efep, { activity: "", score: "" }] });
        }
    };

    const removeEfep = (index: number) => {
        const newEfep = efep.filter((_: any, i: number) => i !== index);
        onChange({ ...value, efep: newEfep });
    };

    const removeQuestionnaire = (index: number) => {
        const newQs = questionnaires.filter((_: any, i: number) => i !== index);
        onChange({ ...value, questionnaires: newQs });
    };

    const isFilled = efep.some((f: any) => f.activity) || questionnaires.length > 0;

    return (
        <AccordionItem
            value="functional_assessment"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                isFilled ? 'bg-slate-50 border-l-orange-500' : 'bg-card border-l-slate-200'
            )}
        >
            <AccordionTrigger className="px-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left">
                <div className="flex items-center gap-2 flex-1 text-base">
                    <PencilRuler className="h-5 w-5 text-orange-500" />
                    <span>Funcionalidade (EFEP) & Questionários</span>
                </div>
                {isFilled && <Badge variant="outline" className="bg-orange-100 text-orange-700 border-none text-[9px] h-5 mr-4">PREENCHIDO</Badge>}
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-6">
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-4">
                    <p className="text-[11px] text-blue-700 leading-tight">
                        <strong>Instrução:</strong> Avalie até 3 atividades comprometidas e adicione questionários clínicos regionalizados.
                    </p>
                </div>

                <div className="space-y-3">
                    {efep.map((f: any, i: number) => (
                        <div key={i} className="flex gap-3 items-center">
                            <span className="text-xs font-black text-slate-400 w-5">{i + 1}º</span>
                            <Input
                                value={f.activity}
                                onChange={(e) => handleEfepChange(i, 'activity', e.target.value)}
                                disabled={readonly}
                                placeholder="Ex: Caminhar plano"
                                className="flex-1 bg-white h-10 shadow-sm"
                            />
                            <div className="w-20">
                                <Input
                                    type="number"
                                    value={f.score}
                                    onChange={(e) => handleEfepChange(i, 'score', e.target.value)}
                                    disabled={readonly}
                                    placeholder="0-10"
                                    className="text-center font-bold h-10 border-blue-200"
                                    min={0}
                                    max={10}
                                />
                            </div>
                            {!readonly && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeEfep(i)} className="text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {!readonly && efep.length < 3 && (
                        <Button type="button" variant="outline" size="sm" onClick={addEfep} className="w-full border-dashed h-10 hover:bg-blue-50 text-blue-600 font-bold">
                            <Plus className="w-3 h-3 mr-2" /> ADICIONAR ATIVIDADE
                        </Button>
                    )}
                </div>

                {/* Questionnaires List */}
                <div className="pt-4 border-t mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-blue-600" />
                            <h4 className="font-bold text-slate-700 text-sm">Questionários Aplicados</h4>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {questionnaires.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {questionnaires.map((q: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl group transition-all hover:bg-blue-50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-blue-900 leading-none">
                                                    {ALL_QUESTIONNAIRES.find((item: any) => item.id === q.type)?.label || q.type}
                                                </p>
                                                <p className="text-[10px] text-blue-500 mt-1 font-bold">Score: {q.score}</p>
                                            </div>
                                        </div>
                                        {!readonly && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={() => removeQuestionnaire(idx)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Nenhum questionário registrado</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                            <ExtraQuestionnaireSelector
                                value={plan.extraQuestionnaire}
                                onChange={(v: string) => onChange({ ...value, plan: { ...plan, extraQuestionnaire: v } })}
                            />
                        </div>
                        <Button
                            type="button"
                            disabled={!plan.extraQuestionnaire || plan.extraQuestionnaire === 'none' || readonly}
                            onClick={() => onOpenAssessment?.(plan.extraQuestionnaire)}
                            size="sm"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-9 font-bold text-[10px] tracking-wider rounded-lg shadow-md shadow-blue-900/10 transition-all active:scale-95"
                        >
                            <Plus className="h-3 w-3 mr-1" /> ADICIONAR
                        </Button>
                    </div>

                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3">
                        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                            <strong>Dica PBE:</strong> Acompanhe a evolução funcional comparando o score total (EFEP) entre as sessões.
                        </p>
                    </div>
                </div>

                {/* Automation Section (Restored/Integrated) */}
                <div className="pt-6 border-t mt-6">
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-purple-100/50 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4 text-purple-600" />
                            <h4 className="font-bold text-purple-900 text-sm">Automação de Follow-up</h4>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-[11px] text-purple-700 leading-relaxed font-medium">
                                O paciente receberá um link automático para reavaliação funcional nos períodos selecionados.
                            </p>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-purple-800 uppercase tracking-wider">Régua de Envio (Dias pós-alta/sessão)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { l: "15d", v: "15" },
                                        { l: "30d", v: "30" },
                                        { l: "45d", v: "45" },
                                        { l: "60d", v: "60" },
                                        { l: "90d", v: "90" }
                                    ].map((opt) => {
                                        const isChecked = plan.followUpDays?.includes(opt.v);
                                        return (
                                            <label key={opt.v} className={cn(
                                                "flex items-center gap-2 border px-3 py-2 rounded-lg cursor-pointer transition-all",
                                                isChecked ? "bg-purple-600 border-purple-600 text-white shadow-md scale-105" : "bg-white border-purple-200 text-purple-900 hover:bg-purple-50"
                                            )}>
                                                <Checkbox
                                                    className={cn("data-[state=checked]:bg-white data-[state=checked]:text-purple-600 border-purple-300", isChecked && "border-white")}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        const current = plan.followUpDays || [];
                                                        const novo = checked
                                                            ? [...current, opt.v]
                                                            : current.filter((i: string) => i !== opt.v);
                                                        onChange({ ...value, plan: { ...plan, followUpDays: novo } });
                                                    }}
                                                    disabled={readonly}
                                                />
                                                <span className="text-xs font-bold">{opt.l}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="monitor-pain"
                                        checked={plan.monitorPain}
                                        onCheckedChange={(c) => onChange({ ...value, plan: { ...plan, monitorPain: !!c } })}
                                        disabled={readonly}
                                        className="border-purple-300 data-[state=checked]:bg-purple-600"
                                    />
                                    <Label htmlFor="monitor-pain" className="text-xs font-bold text-purple-900 cursor-pointer">Monitorar Dor (EVA)</Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-purple-800 uppercase">Canal:</span>
                                    <Select defaultValue="whatsapp" disabled={readonly}>
                                        <SelectTrigger className="bg-white border-purple-200 text-purple-900 h-8 font-medium w-[120px] text-[10px] uppercase">
                                            <SelectValue placeholder="WhatsApp" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="email">E-mail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

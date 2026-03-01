import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface EcnOption {
    label: string;
    value: number;
}

interface EcnFieldProps {
    label: string;
    options: EcnOption[];
    valueLeft: number;
    valueRight: number;
    onChangeLeft: (v: number) => void;
    onChangeRight: (v: number) => void;
}

const SegmentedControl = ({ options, value, onChange }: { options: EcnOption[], value: number, onChange: (v: number) => void }) => {
    return (
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto">
            {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg whitespace-nowrap transition-all ${isSelected
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            }`}
                    >
                        {opt.label} ({opt.value})
                    </button>
                );
            })}
        </div>
    );
};

const EcnFieldRow = ({ label, options, valueLeft, valueRight, onChangeLeft, onChangeRight }: EcnFieldProps) => {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 border-b border-slate-50 gap-4 last:border-0">
            <div className="w-full md:w-1/3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
            </div>

            <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest pl-1">Esquerdo</span>
                    <SegmentedControl options={options} value={valueLeft} onChange={onChangeLeft} />
                </div>
                <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest pl-1">Direito</span>
                    <SegmentedControl options={options} value={valueRight} onChange={onChangeRight} />
                </div>
            </div>
        </div>
    );
};

export interface EcnEvaluationProps {
    initialValues?: any;
    onScoreChange?: (score: number, details: any) => void;
}

export function EcnEvaluation({ initialValues, onScoreChange }: EcnEvaluationProps) {
    const [state, setState] = useState({
        vibrationLeft: initialValues?.vibrationLeft ?? 0,
        vibrationRight: initialValues?.vibrationRight ?? 0,
        thermalLeft: initialValues?.thermalLeft ?? 0,
        thermalRight: initialValues?.thermalRight ?? 0,
        monofilamentLeft: initialValues?.monofilamentLeft ?? 0,
        monofilamentRight: initialValues?.monofilamentRight ?? 0,
        reflexLeft: initialValues?.reflexLeft ?? 0,
        reflexRight: initialValues?.reflexRight ?? 0,
    });

    const updateState = (key: keyof typeof state, value: number) => {
        setState(s => {
            const next = { ...s, [key]: value };
            const totalLeft = next.vibrationLeft + next.thermalLeft + next.monofilamentLeft + next.reflexLeft;
            const totalRight = next.vibrationRight + next.thermalRight + next.monofilamentRight + next.reflexRight;
            const totalScore = totalLeft + totalRight;

            if (onScoreChange) {
                // To avoid React loop if parent uses watch(), wrap in setTimeout or just call it
                onScoreChange(totalScore, next);
            }
            return next;
        });
    };

    const getClassification = (score: number) => {
        if (score <= 2) return { label: "Ausente", color: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500" };
        if (score <= 5) return { label: "Leve", color: "bg-yellow-50 text-yellow-600 border-yellow-200", dot: "bg-yellow-500" };
        if (score <= 8) return { label: "Moderada", color: "bg-orange-50 text-orange-600 border-orange-200", dot: "bg-orange-500" };
        return { label: "Severa", color: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" };
    };

    const totalLeft = state.vibrationLeft + state.thermalLeft + state.monofilamentLeft + state.reflexLeft;
    const totalRight = state.vibrationRight + state.thermalRight + state.monofilamentRight + state.reflexRight;
    const totalScore = totalLeft + totalRight;

    const classInfo = getClassification(totalScore);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100/50 rounded-xl text-indigo-700">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Escore Clínico Neurológico (ECN)</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avaliação Global de Neuropatia Periférica</p>
                    </div>
                </div>

                <div className={`px-4 py-2 border rounded-xl flex items-center gap-3 ${classInfo.color}`}>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase opacity-70 tracking-widest">Score Total</span>
                        <span className="text-lg font-black leading-none">{totalScore}<span className="text-[10px] ml-1 opacity-50">/10</span></span>
                    </div>
                    <div className="h-8 w-px bg-current opacity-20" />
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${classInfo.dot} animate-pulse`} />
                        <span className="text-xs font-black uppercase tracking-widest">{classInfo.label}</span>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <EcnFieldRow
                    label="Sensibilidade Vibratória (128 Hz)"
                    options={[{ label: "Preservada", value: 0 }, { label: "Alterada", value: 1 }]}
                    valueLeft={state.vibrationLeft}
                    valueRight={state.vibrationRight}
                    onChangeLeft={(v) => updateState('vibrationLeft', v)}
                    onChangeRight={(v) => updateState('vibrationRight', v)}
                />
                <EcnFieldRow
                    label="Sensibilidade Térmica"
                    options={[{ label: "Preservada", value: 0 }, { label: "Ausente", value: 1 }]}
                    valueLeft={state.thermalLeft}
                    valueRight={state.thermalRight}
                    onChangeLeft={(v) => updateState('thermalLeft', v)}
                    onChangeRight={(v) => updateState('thermalRight', v)}
                />
                <EcnFieldRow
                    label="Sensibilidade Protetora (Monofilamento 10g)"
                    options={[{ label: "Preservada", value: 0 }, { label: "Ausente", value: 1 }]}
                    valueLeft={state.monofilamentLeft}
                    valueRight={state.monofilamentRight}
                    onChangeLeft={(v) => updateState('monofilamentLeft', v)}
                    onChangeRight={(v) => updateState('monofilamentRight', v)}
                />
                <EcnFieldRow
                    label="Reflexo Aquileu"
                    options={[{ label: "Normal", value: 0 }, { label: "Hipo/Hiper", value: 1 }, { label: "Ausente", value: 2 }]}
                    valueLeft={state.reflexLeft}
                    valueRight={state.reflexRight}
                    onChangeLeft={(v) => updateState('reflexLeft', v)}
                    onChangeRight={(v) => updateState('reflexRight', v)}
                />
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Esq: {totalLeft}/5 pts</span>
                <span>Dir: {totalRight}/5 pts</span>
            </div>
        </div>
    );
}

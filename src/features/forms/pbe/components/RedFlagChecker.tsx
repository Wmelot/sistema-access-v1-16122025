"use client";

import { AlertTriangle, ShieldCheck, Thermometer, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface RedFlagCheckerProps {
    regions: string[];
    values: Record<string, boolean>;
    onChange: (id: string, checked: boolean) => void;
}

const RED_FLAGS_BY_REGION: Record<string, { id: string, label: string, severity: 'high' | 'medium' }[]> = {
    ankle_foot: [
        { id: 'fracture_dislocation', label: 'Fratura/Luxação (Ottawa: Dor Maleolar/Navicular/Base do 5º ou S/ Carga)', severity: 'high' },
        { id: 'dvt', label: 'Trombose Venosa Profunda (Wells+: Edema assimétrico, Dor à palpação)', severity: 'high' },
        { id: 'charcot', label: 'Pé de Charcot (Diabético: Edema/Calor súbito sem trauma)', severity: 'medium' },
    ],
    elbow_hand: [
        { id: 'compartment_syndrome', label: 'Síndrome Compartimental (Dor desproporcional/Tensão)', severity: 'high' },
        { id: 'deep_infection', label: 'Infecção Profunda (Tenossinovite supurativa)', severity: 'high' },
    ],
    spine_cervical: [
        { id: 'malignancy_cervical', label: 'Sinais de Malignidade (Perda de peso/Histórico)', severity: 'high' },
        { id: 'unstable_fracture', label: 'Fratura Instável (Trauma grave/Instabilidade)', severity: 'high' },
        { id: 'cervical_infection', label: 'Infecção (Febre/Rigidez nucal grave)', severity: 'high' },
    ],
    knee: [
        { id: 'fracture_knee', label: 'Possível Fratura (Padrão Ottawa: >55 anos, Dor na Patela/Fíbula, Flexão < 90° ou S/ Carga)', severity: 'high' },
        { id: 'septic_knee', label: 'Artrite Séptica (Calor, Rubor intenso e Febre)', severity: 'high' },
    ],
    hip: [
        { id: 'septic_arthritis', label: 'Artrite Séptica (Febre/Incapacidade de carga)', severity: 'high' },
    ],
    atm: [
        { id: 'atm_malignancy', label: 'Sinais de Malignidade ATM (Edema persistente)', severity: 'high' },
    ],
    spine_lumbar: [
        { id: 'cauda_equina', label: 'Síndrome da Cauda Equina (Anestesia em sela/Incontinência)', severity: 'high' },
        { id: 'fracture_lumbar', label: 'Fratura Vertebral (Trauma/Uso prolongado corticóide)', severity: 'high' },
        { id: 'malignancy_lumbar', label: 'Malignidade (Idade > 50/Histórico/Dor constante)', severity: 'high' },
    ]
};

export function RedFlagChecker({ regions, values, onChange }: RedFlagCheckerProps) {
    const activeFlags = regions.flatMap(r => RED_FLAGS_BY_REGION[r] || []);

    if (activeFlags.length === 0) return null;

    return (
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3 text-red-700">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shadow-sm">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-black uppercase text-xs tracking-tight">Triagem de Bandeiras Vermelhas</h4>
                    <span className="text-[10px] font-bold opacity-70">MARQUE APENAS SE HOUVER SUSPEITA CLÍNICA</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeFlags.map(flag => (
                    <div
                        key={flag.id}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                            values[flag.id]
                                ? "bg-red-600 border-red-700 shadow-lg shadow-red-100 text-white"
                                : "bg-white border-red-100 hover:border-red-300"
                        )}
                        onClick={() => onChange(flag.id, !values[flag.id])}
                    >
                        <Checkbox
                            id={flag.id}
                            checked={values[flag.id] || false}
                            onCheckedChange={() => { }} // Handled by div click
                            className={cn(
                                "mt-1 h-5 w-5 rounded-md",
                                values[flag.id] ? "border-white bg-white text-red-600" : "border-red-200"
                            )}
                        />
                        <div className="space-y-1">
                            <Label
                                htmlFor={flag.id}
                                className={cn(
                                    "font-black text-xs uppercase tracking-tight cursor-pointer",
                                    values[flag.id] ? "text-white" : "text-red-950"
                                )}
                            >
                                {flag.label}
                            </Label>
                            {flag.severity === 'high' && !values[flag.id] && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase tracking-widest">
                                    <ShieldCheck className="w-3 h-3" />
                                    Prioridade Máxima
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-white border border-red-100 rounded-xl">
                <Info className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-[10px] font-medium text-slate-500 italic">
                    A presença de qualquer Red Flag requer avaliação médica imediata ou encaminhamento para urgência.
                </p>
            </div>
        </div>
    );
}

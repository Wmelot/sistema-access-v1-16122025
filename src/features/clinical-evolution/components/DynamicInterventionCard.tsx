"use client";

import React, { useState, useEffect } from 'react';
import { Info, Zap, Activity, Watch, Layers, Hash, Gauge, Sun, Dumbbell, Trash2, Plus, X, Brain, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- SUB-COMPONENTS (Must be outside to prevent re-render focus loss) ---

interface CleanInputProps {
    label: string;
    placeholder: string;
    field: string;
    icon: React.ElementType;
    value: any;
    onChange: (field: string, value: any) => void;
}

const CleanInput: React.FC<CleanInputProps> = ({ label, placeholder, field, icon: Icon, value, onChange }) => (
    <div className="relative group/input">
        <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
            <Icon size={10} className="text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" />
            {label}
        </label>
        <input
            type="text"
            value={value || ''}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-600 px-0 py-1.5 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
            onChange={(e) => onChange(field, e.target.value)}
        />
    </div>
);

interface PainInputProps {
    label: string;
    field: string;
    value: number;
    onChange: (field: string, value: any) => void;
}

const PainInput: React.FC<PainInputProps> = ({ label, field, value, onChange }) => {
    // Calculate percentage for gradient
    const percentage = (value / 10) * 100;
    const color = value > 7 ? '#ef4444' : value > 3 ? '#f59e0b' : '#4f46e5';

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex justify-between items-end">
                <label className="text-[9px] font-bold uppercase text-slate-500">{label}</label>
                <span className="text-xs font-bold" style={{ color }}>
                    {value}
                </span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-slate-200">
                <input
                    type="range" min="0" max="10" step="1"
                    value={value}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => onChange(field, Number(e.target.value))}
                />
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
                <div
                    className="absolute top-1/2 -ml-1.5 w-3 h-3 bg-white border-2 rounded-full shadow-sm transition-all duration-300 transform -translate-y-1/2 pointer-events-none"
                    style={{ left: `${percentage}%`, borderColor: color }}
                />
            </div>
        </div>
    );
};

// --- RICH CLINICAL DATA (Mini-Brain) ---
const CLINICAL_INTELLIGENCE: any = {
    'Fotobiomodulação': {
        'Analgesia': { dosagem: '2-4 J/ponto', potencia: '100mW', freq: 'Contínuo ou 2.5Hz', obs: 'Aplicar nos pontos gatilho e trajeto do nervo.' },
        'Inflamação': { dosagem: '1-3 J/ponto', potencia: '100mW', freq: 'Contínuo', obs: 'Aplicar ao redor da articulação/lesão.' },
        'Cicatrização': { dosagem: '3-6 J/ponto', potencia: '50-100mW', freq: 'Pulsado 20Hz', obs: 'Bordas da lesão.' },
        'Edema': { dosagem: '1-2 J/ponto', potencia: '100mW', freq: 'Pulsado 10Hz/50Hz', obs: 'Drenagem linfática (linfonodos).' }
    },
    'Eletroterapia-TENS': {
        'Acupuntura/Burst': { freq: '1-4 Hz', largura: '200-250 us', tempo: '20-30 min', mecanismo: 'Liberação de Endorfinas (Crônico)' },
        'Analgesia Convencional': { freq: '80-120 Hz', largura: '50-80 us', tempo: '20 min', mecanismo: 'Teoria das Comportas (Agudo)' },
        'Breve e Intenso': { freq: '100-150 Hz', largura: '150-250 us', tempo: '15 min', mecanismo: 'Bloqueio Periférico (Procedimentos)' }
    },
    'Eletroterapia-FES': {
        'Fortalecimento - Fibras II': { freq: '50-80 Hz', largura: '250-400 us', ciclo: 'ON 10s / OFF 30-50s', tempo: '10-20 min' },
        'Resistência - Fibras I': { freq: '20-40 Hz', largura: '200-300 us', ciclo: 'ON 10s / OFF 10-20s', tempo: '20-30 min' }
    },
    'Ultrassom': {
        'Térmico (Crônico)': { modo: 'Contínuo (100%)', intensidade: '1.0 - 2.0 W/cm²', tempo: '1 min por cabeçote' },
        'Reparo (Agudo)': { modo: 'Pulsado 20% (1:4)', intensidade: '0.5 - 0.8 W/cm²', tempo: '1 min por cabeçote' },
        'Subagudo': { modo: 'Pulsado 50% (1:1)', intensidade: '0.8 - 1.2 W/cm²', tempo: '1 min por cabeçote' }
    }
};

type ModalityType = 'Cinesioterapia' | 'Eletroterapia' | 'Fotobiomodulação' | 'Terapia Manual' | 'Recovery' | 'Pilates' | 'Esportivo';

interface InterventionProps {
    id: string;
    name: string;
    modality_type: ModalityType;
    default_load_type?: string;
    dosimetry_guide?: any;
    onUpdate: (data: any) => void;
    onRemove: () => void;
}

export const DynamicInterventionCard: React.FC<InterventionProps> = ({
    name, modality_type, dosimetry_guide, onUpdate, onRemove
}) => {
    // Initialize state properly if possible, but empty object is fine as inputs handle fallback
    const [data, setData] = useState<any>({
        pain_during: 0,
        pain_after: 0,
        rpe: 0,
        // Preset generic defaults
        sets: 3,
        reps: 10
    });

    const [showJointExercise, setShowJointExercise] = useState(false);

    // Update local state and propagate up
    const handleChange = (field: string, value: any) => {
        const newData = { ...data, [field]: value };
        setData(newData);
        // Debounce could be added here if performance issues persist, but usually React handles this fine
        onUpdate(newData);
    };

    // --- INTELIGÊNCIA DE TIPO ---
    const isNameNMES = /NMES|FES|Russa|Corrente Russa|Fortalecimento/i.test(name);
    const isNameElectro = /TENS|FES|NMES|Russa|Interferencial|Corrente/i.test(name);
    const isNameUltrasound = /Ultrassom|US /i.test(name);
    const isNameLaser = /Laser|Led|Foto/i.test(name);

    const realType = isNameLaser ? 'Fotobiomodulação'
        : (isNameElectro || isNameUltrasound) ? 'Eletroterapia'
            : modality_type;

    const isActiveTherapy = !['Eletroterapia', 'Fotobiomodulação', 'Recovery', 'Terapia Manual'].includes(realType);

    // --- TEMAS ---
    const getTheme = () => {
        if (realType === 'Fotobiomodulação') return { bg: 'bg-rose-100', icon: 'text-rose-600', border: 'border-rose-100', indicator: 'bg-rose-500' };
        if (realType === 'Eletroterapia') return { bg: 'bg-amber-100', icon: 'text-amber-600', border: 'border-amber-100', indicator: 'bg-amber-500' };
        if (realType === 'Recovery') return { bg: 'bg-sky-100', icon: 'text-sky-600', border: 'border-sky-100', indicator: 'bg-sky-500' };
        if (realType === 'Terapia Manual') return { bg: 'bg-purple-100', icon: 'text-purple-600', border: 'border-purple-100', indicator: 'bg-purple-500' };
        return { bg: 'bg-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-100', indicator: 'bg-emerald-500' };
    };
    const theme = getTheme();

    // --- SMART GUIDES ---
    let activeGuide = {};
    if (isNameUltrasound) activeGuide = CLINICAL_INTELLIGENCE['Ultrassom'];
    else if (isNameNMES) activeGuide = CLINICAL_INTELLIGENCE['Eletroterapia-FES'];
    else if (isNameElectro) activeGuide = CLINICAL_INTELLIGENCE['Eletroterapia-TENS'];
    else if (realType === 'Fotobiomodulação') activeGuide = CLINICAL_INTELLIGENCE['Fotobiomodulação'];

    return (
        <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-200 relative group hover:shadow-md transition-all animate-in fade-in">
            <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${theme.indicator}`} />

            {/* HEADER */}
            <div className="flex justify-between items-start mb-4 pl-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg shadow-sm ${theme.bg} ${theme.icon}`}>
                        {realType === 'Eletroterapia' ? <Zap size={18} /> :
                            realType === 'Fotobiomodulação' ? <Sun size={18} /> :
                                realType === 'Terapia Manual' ? <Dumbbell size={18} /> :
                                    <Activity size={18} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-700 text-sm leading-tight">{name}</h3>

                            {/* INTELLIGENT TOOLTIP */}
                            {Object.keys(activeGuide).length > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity">
                                                <Info size={12} className="text-slate-500" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-slate-900 border-slate-800 text-white p-4 rounded-xl shadow-2xl max-w-sm">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                                                <Brain size={14} className="text-indigo-400" />
                                                <span className="font-bold text-xs uppercase tracking-wider">Protocolos Clínicos</span>
                                            </div>
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                                {Object.entries(activeGuide).map(([key, params]: [string, any]) => (
                                                    <div key={key} className="text-xs bg-white/5 p-2 rounded border border-white/10">
                                                        <strong className="block text-indigo-300 mb-1 border-b border-white/5 pb-1">{key}</strong>
                                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300">
                                                            {Object.entries(params).map(([pKey, pVal]) => (
                                                                <div key={pKey}>
                                                                    <span className="opacity-50 capitalize">{pKey}: </span>
                                                                    <span className="font-medium text-white">{String(pVal)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>
                </div>
                <button onClick={onRemove} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                </button>
            </div>

            {/* MAIN INPUTS */}
            <div className="grid grid-cols-12 gap-x-6 gap-y-4 pl-3">

                {realType === 'Fotobiomodulação' && (
                    <>
                        <div className="col-span-4"><CleanInput label="Energia (J)" placeholder="Ex: 3J" field="joules" icon={Sun} value={data.joules} onChange={handleChange} /></div>
                        <div className="col-span-4"><CleanInput label="Pontos" placeholder="Ex: 4" field="points" icon={Hash} value={data.points} onChange={handleChange} /></div>
                        <div className="col-span-4">
                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Comprimento</label>
                            <Select onValueChange={(v) => handleChange('wavelength', v)} value={data.wavelength}>
                                <SelectTrigger className="h-7 text-xs border-0 border-b border-slate-300 rounded-none px-0 focus:ring-0 focus:border-indigo-600 bg-transparent">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="660nm">Vermelho (660nm)</SelectItem>
                                    <SelectItem value="808nm">Infravermelho (808nm)</SelectItem>
                                    <SelectItem value="Misto">Misto (Red/Infra)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                {realType === 'Eletroterapia' && isNameUltrasound && (
                    <>
                        <div className="col-span-3"><CleanInput label="Intensidade" placeholder="W/cm²" field="intensity" icon={Activity} value={data.intensity} onChange={handleChange} /></div>
                        <div className="col-span-5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Ciclo (Duty)</label>
                            <Select onValueChange={(v) => handleChange('mode', v)} value={data.mode}>
                                <SelectTrigger className="h-7 text-xs border-0 border-b border-slate-300 rounded-none px-0 focus:ring-0 focus:border-indigo-600 bg-transparent">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Continuo">Contínuo (100%) - T</SelectItem>
                                    <SelectItem value="Pulsado 50%">Pulsado 50% (1:1) - At</SelectItem>
                                    <SelectItem value="Pulsado 20%">Pulsado 20% (1:4) - At</SelectItem>
                                    <SelectItem value="Pulsado 10%">Pulsado 10% (1:9) - At</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-4"><CleanInput label="Tempo" placeholder="Min" field="time" icon={Watch} value={data.time} onChange={handleChange} /></div>
                    </>
                )}

                {realType === 'Eletroterapia' && !isNameUltrasound && (
                    <>
                        <div className="col-span-3"><CleanInput label="Freq (Hz)" placeholder="Hz" field="frequency" icon={Activity} value={data.frequency} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Largura (us)" placeholder="us" field="pulse_width" icon={Zap} value={data.pulse_width} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Intensidade" placeholder="mA" field="intensity" icon={Gauge} value={data.intensity} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Tempo" placeholder="Min" field="time" icon={Watch} value={data.time} onChange={handleChange} /></div>
                    </>
                )}

                {isActiveTherapy && (
                    <>
                        <div className="col-span-3"><CleanInput label="Séries" placeholder="3" field="sets" icon={Layers} value={data.sets} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Reps" placeholder="10" field="reps" icon={Hash} value={data.reps} onChange={handleChange} /></div>
                        <div className="col-span-6"><CleanInput label="Carga / Obs" placeholder="Kg ou elástico..." field="load" icon={Dumbbell} value={data.load} onChange={handleChange} /></div>
                    </>
                )}

                {/* Terapia Manual Fields */}
                {realType === 'Terapia Manual' && (
                    <>
                        <div className="col-span-6"><CleanInput label="Técnica / Manobra" placeholder="Ex: Maitland Grau II" field="technique" icon={Layers} value={data.technique} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Tempo" placeholder="Min" field="time" icon={Watch} value={data.time} onChange={handleChange} /></div>
                        <div className="col-span-3"><CleanInput label="Resposta" placeholder="Melhor/Pior" field="response" icon={Activity} value={data.response} onChange={handleChange} /></div>
                    </>
                )}
            </div>

            {/* EXERCÍCIO CONJUGADO ADD-ON (Only for NMES) */}
            {isNameNMES && (
                <div className="mt-4 pt-3 border-t border-slate-50 pl-3">
                    {!showJointExercise ? (
                        <button
                            onClick={() => setShowJointExercise(true)}
                            className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide transition-colors"
                        >
                            <Plus size={12} /> Adicionar Exercício Conjugado (Opcional)
                        </button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-top-2 bg-indigo-50/50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-indigo-800 uppercase flex items-center gap-1">
                                    <Dumbbell size={10} /> Exercício Associado ao Eletro
                                </span>
                                <button onClick={() => setShowJointExercise(false)} className="text-indigo-300 hover:text-indigo-500">
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="grid grid-cols-12 gap-3">
                                <div className="col-span-6"><CleanInput label="Exercício" placeholder="Ex: Agachamento" field="joint_exercise" icon={Activity} value={data.joint_exercise} onChange={handleChange} /></div>
                                <div className="col-span-3"><CleanInput label="Carga" placeholder="kg" field="joint_load" icon={Dumbbell} value={data.joint_load} onChange={handleChange} /></div>
                                <div className="col-span-3"><CleanInput label="Reps" placeholder="10" field="joint_reps" icon={Hash} value={data.joint_reps} onChange={handleChange} /></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PAIN DASHBOARD (Apenas Ativos) */}
            {isActiveTherapy && (
                <div className="mt-5 pt-4 border-t border-slate-50 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monitoramento de Resposta</span>
                    </div>
                    <div className="grid grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <PainInput label="Dor Durante" field="pain_during" value={data.pain_during || 0} onChange={handleChange} />
                        <PainInput label="Dor Após" field="pain_after" value={data.pain_after || 0} onChange={handleChange} />
                        <PainInput label="Esforço (RPE)" field="rpe" value={data.rpe || 0} onChange={handleChange} />
                    </div>
                </div>
            )}
        </div>
    );
};

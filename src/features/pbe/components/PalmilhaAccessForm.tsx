// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Form, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Send, Eye, Loader2, Mic, Search, Info, CheckCircle2, Flame, Footprints, ChevronDown, Menu, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// COMPONENTES FILHOS
import { BiomechanicsSidebar } from "./biomechanics-sidebar";
import { PhysicalAssessmentForm } from "@/components/assessments/physical-assessment-form";
import { SmartAssessmentForm } from "@/components/assessments/smart-assessment-form";
import WomensHealthForm from "@/features/womens-health/components/WomensHealthForm";
import { BodyPainMap } from "@/features/biomechanics/components/body-pain-map";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { BipolarSlider } from "@/components/ui/bipolar-slider";
import { AudioTextarea } from "./audio-textarea";
import { CLINICAL_REFS, checkStatus } from "@/utils/clinical-references";

// Naviculometro e arco alto médio e baixo
const NAVICULO_REF_TABLE: Record<number, { baixo: number; alto: number }> = {
    25: { baixo: 9, alto: 15 },
    26: { baixo: 10, alto: 16 },
    27: { baixo: 10, alto: 17 },
    28: { baixo: 10, alto: 18 },
    29: { baixo: 10, alto: 20 },
    30: { baixo: 11, alto: 21 },
    31: { baixo: 11, alto: 20 },
    32: { baixo: 11, alto: 20 },
    33: { baixo: 12, alto: 20 },
    34: { baixo: 12, alto: 20 },
    35: { baixo: 12, alto: 19 },
    36: { baixo: 12, alto: 20 },
    37: { baixo: 13, alto: 20 },
    38: { baixo: 13, alto: 21 },
    39: { baixo: 13, alto: 21 },
    40: { baixo: 14, alto: 22 },
    41: { baixo: 14, alto: 22 },
    42: { baixo: 14, alto: 22 },
    43: { baixo: 14, alto: 23 },
    44: { baixo: 15, alto: 23 },
    45: { baixo: 15, alto: 24 },
    46: { baixo: 15, alto: 24 },
    47: { baixo: 16, alto: 25 },
    48: { baixo: 16, alto: 25 },
    49: { baixo: 16, alto: 26 },
    50: { baixo: 17, alto: 26 },
};

// --- VALORES DE REFERÊNCIA (SEU "CÉREBRO") ---
const LIMITS = {
    lunge: { min: 35, max: 45 },
    jack: { normal: 1 },
    thomas: { min: 0 },
    slr: { min: 70 },
    rotation: { min: 30, max: 60 },
    craig: { min: 8, max: 15 }
};

// --- COMPONENTES AUXILIARES ---

// Status Colorido (Referência)
const ReferenceStatus = ({ value, type }: { value: any, type: keyof typeof CLINICAL_REFS }) => {
    const v = Number(value);
    if (!value && value !== 0 && value !== "0") return null;

    // Especial para o Y-Balance que não usa ranges simples
    if (type === 'ybalance') {
        return (
            <div className="text-[10px] text-slate-500 mt-1">
                Ref: Assimetria {'>'} {CLINICAL_REFS.ybalance.asymmetry_cutoff}cm = Risco
            </div>
        );
    }

    // Busca o status baseado nos artigos científicos
    const status = checkStatus(type, v);

    if (!status) return null;

    // Converte as cores de texto (text-red-600) para cores de fundo para o badge
    const bgColor = status.color.replace('text-', 'bg-').replace('600', '100').replace('800', '100');

    return (
        <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase tracking-wide",
            bgColor,
            status.color.replace('text-', 'border-').replace('600', '200')
        )}>
            {status.label}
        </div>
    );
};

// Naviculômetro
const getArchType = (navValue: any, shoeSize: any) => {
    const n = Number(navValue);
    const size = Number(shoeSize);

    // Se não houver número de calçado ou valor de naviculômetro, retorna neutro
    if (!n || !size || !NAVICULO_REF_TABLE[size]) {
        return { label: "Aguardando dados...", color: "bg-slate-100 text-slate-500" };
    }

    const ref = NAVICULO_REF_TABLE[size];

    // Lógica baseada no seu Excel:
    // Se o valor for menor ou igual ao limite "Baixo" da tabela
    if (n <= ref.baixo) return { label: "Baixo (Plano)", color: "bg-red-600 text-white" };

    // Se o valor for maior ou igual ao limite "Alto" da tabela
    if (n >= ref.alto) return { label: "Alto (Cavo)", color: "bg-orange-500 text-white" };

    // Caso contrário, é médio
    return { label: "Médio (Normal)", color: "bg-green-600 text-white" };
};

// Escala Visual Calçados
const ShoeScale = ({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: { val: string, label: string }[], label: string }) => (
    <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center justify-between h-full">
        <span className="text-slate-500 text-xs font-bold text-center mb-2 h-8 flex items-center">{label}</span>
        <div className="flex justify-between items-center w-full px-1 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />
            {options.map((opt) => (
                <div key={opt.val} onClick={() => onChange(opt.val)} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border-2",
                        value === opt.val ? "bg-blue-600 border-blue-600 text-white scale-125 shadow-md" : "bg-white border-slate-300 text-slate-400 hover:border-blue-400"
                    )}>
                        {opt.label || opt.val}
                    </div>
                    <span className={cn("text-[9px] font-medium mt-1", value === opt.val ? "text-blue-700" : "text-slate-400")}>{opt.val}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function PalmilhaAccessForm({ patientId }: { patientId: string }) {
    const [activeForm, setActiveForm] = useState("palmilha");
    const [previewOpen, setPreviewOpen] = useState(false);

    // CONFIGURAÇÃO FORMULÁRIO
    const form = useForm({
        mode: "onChange",
        defaultValues: {
            hma: { qp: "", history: "", eva: [0] },
            history: { comorbidities: [], meds: "", treatments: [] },
            anthropometry: { weight: "" },
            sports: [],
            efep: [{ activity: "", score: 0 }],
            questionnaire: { selected: "" },
            painPoints: [],
            postural: {
                teste_catalogo: { left: "", right: "" },
                navicular: { left: "", right: "" },
                shoeSize: "",
                fpi_left: { talus: "", curves: "", calc: "", tnj: "", arch: "", abd: "" },
                fpi_right: { talus: "", curves: "", calc: "", tnj: "", arch: "", abd: "" }
            },
            tests: {
                jack: { left: 0, right: 0 },
                lunge: { left: "", right: "" },
                ybalance: {
                    dominance: "right",
                    legLength: { left: "", right: "" },
                    Anterior: { left: { t1: "", t2: "", t3: "" }, right: { t1: "", t2: "", t3: "" } },
                    "Post-Med": { left: { t1: "", t2: "", t3: "" }, right: { t1: "", t2: "", t3: "" } },
                    "Post-Lat": { left: { t1: "", t2: "", t3: "" }, right: { t1: "", t2: "", t3: "" } }
                },
                thomas: { left: "", right: "" },
                slr: { left: "", right: "" },
                glute_strength: { med_left: 5, med_right: 5, max_left: 5, max_right: 5 },
                mob_1_raio: { left: 0, right: 0 },
                mob_medio: { left: 0, right: 0 },
                ventral: {
                    rotation: { left: "", right: "" },
                    craig: { left: "", right: "" },
                    measures: { left: { retro: "", ante: "", apa: "" }, right: { retro: "", ante: "", apa: "" } }
                },
                single_squat: {
                    score_left: 0, score_right: 0,
                    pelvic_drop_left: "nao", pelvic_drop_right: "nao",
                    valgus_left: "nao", valgus_right: "nao"
                },
                dfi: [{ left: "", right: "" }, { left: "", right: "" }, { left: "", right: "" }]
            },
            shoe: {
                model: "", brand: "", weight: "", drop: "", stack: "",
                flex_long: "2.5", flex_tors: "2.5", stability: "0",
                injuryStatus: "none", goals: [], experience: "beginner", injuryType: "none"
            },
            plan: { exams: "", orientations: "", exercises: [] }
        }
    });

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({ control: form.control, name: "efep" });
    const { fields: painFields, append: appendPain, remove: removePain, update: updatePain } = useFieldArray({ control: form.control, name: "painPoints" });
    const { fields: sportFields, append: appendSport, remove: removeSport } = useFieldArray({ control: form.control, name: "sports" });

    // Watches
    const weightVal = useWatch({ control: form.control, name: "anthropometry.weight" });
    const sportsVal = useWatch({ control: form.control, name: "sports" });
    const fpiLeftVals = useWatch({ control: form.control, name: "postural.fpi_left" });
    const fpiRightVals = useWatch({ control: form.control, name: "postural.fpi_right" });
    const shoeVals = useWatch({ control: form.control, name: "shoe" });

    // 1. Gasto Calórico e Classificação IPAQ
    const calData = useMemo(() => {
        const weight = Number(weightVal) || 70;
        const sports = sportsVal || [];
        const kcalTable: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };
        let weeklyBurn = 0, totalMinutes = 0;
        sports.forEach((s: any) => {
            weeklyBurn += ((kcalTable[s?.type] || 300) / 70) * weight * (Number(s?.duration) / 60) * Number(s?.freq);
            totalMinutes += Number(s?.freq) * Number(s?.duration);
        });
        let level = "Sedentário", color = "bg-slate-500";
        if (totalMinutes >= 150) { level = "Ativo"; color = "bg-green-500"; }
        if (totalMinutes >= 300) { level = "Muito Ativo"; color = "bg-purple-600"; }
        return { weekly: Math.round(weeklyBurn), daily: Math.round(weeklyBurn / 7), minutes: totalMinutes, level, color };
    }, [weightVal, sportsVal]);

    // 2. Pontuação e Classificação FPI-6
    const fpiData = useMemo(() => {
        const sum = (v: any) => v ? Object.values(v).reduce((acc: number, c: any) => acc + (Number(c) || 0), 0) : 0;
        const getC = (s: number) => s >= 6 ? { l: "Pronado (Plano)", c: "bg-red-500 text-white" } : s <= -1 ? { l: "Supinado (Cavo)", c: "bg-orange-500 text-white" } : { l: "Neutro", c: "bg-green-500 text-white" };
        const l = sum(fpiLeftVals), r = sum(fpiRightVals);
        return { left: { s: l, ...getC(l) }, right: { s: r, ...getC(r) } };
    }, [fpiLeftVals, fpiRightVals]);

    // 3. Recomendação de Calçados (Baseada no PDF "Selecting the Right Running Shoes")
    const shoeRecommendations = useMemo(() => {
        const type = shoeVals?.injuryType;
        const status = shoeVals?.injuryStatus;

        let rec = {
            text: "Tênis neutro recomendado.",
            image: "👟",
            feature: "Drop 6-8mm | Amortecimento Moderado",
            details: "Mantenha o uso habitual enquanto não forem observados sintomas de dor.",
            color: "bg-slate-50 border-slate-200 text-slate-700"
        };

        if (status === "acute") {
            rec = {
                text: "Fase Aguda: Evite mudanças importantes nesse momento.",
                image: "⚠️",
                feature: "Necessário melhor controle dos movimentos e estabilidade.",
                details: "Mantenha o tênis atual, inicie ou dê continuidade a um programa de reabilitação e avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de aliviar os sintomas.",
                color: "bg-amber-50 border-amber-200 text-amber-800"
            };
        } else if (type === "achilles") {
            rec = {
                text: "Tênis com Drop Elevado Recomendado",
                image: "📐",
                feature: "Drop > 8mm",
                details: "Ajuda a Reduzir a tensão mecânica no tendão Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de minimizar a sobrecarga no tendão de Aquiles e músculos da panturrilha",
                color: "bg-blue-50 border-blue-200 text-blue-900"
            };
        } else if (type === "pfps") {
            rec = {
                text: "Tênis com Drop Baixo / Minimalista",
                image: "👣",
                feature: "Drop 0-4mm",
                details: "Ajuda a Reduzir o estresse na articulação patelofemoral reduzindo a dor anterior do joelho. Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de melhorar a distribuição de forças na articulação patelofemoral",
                color: "bg-green-50 border-green-200 text-green-900"
            };
        } else if (type === "stress_fracture") {
            rec = {
                text: "Maximalista / Rocker Sole",
                image: "☁️",
                feature: "Stack Alto | Rocker Sole",
                details: "Protege os metatarsos durante a fase de propulsão. Avalie a possibilidade do uso de palmilhas biomecânicas com o intuito de reduzir a pressão nos metatarsos",
                color: "bg-orange-50 border-orange-200 text-orange-900"
            };
        }
        return rec;
    }, [shoeVals]);

    // 4. Índice Minimalista (Fórmula Única - Base 30 pontos)
    const minIndexResult = useMemo(() => {
        if (!shoeVals) return 0;
        let score = 0;
        const w = Number(shoeVals.weight) || 0;
        const d = Number(shoeVals.drop) || 0;
        const s = Number(shoeVals.stack) || 0;

        if (w > 0) score += (w < 170 ? 5 : w < 250 ? 3 : 1);
        if (d >= 0) score += (d === 0 ? 5 : d <= 4 ? 4 : d <= 8 ? 2 : 0);
        if (s > 0) score += (s < 15 ? 5 : s < 25 ? 3 : 1);

        score += (Number(shoeVals.flex_long) || 0) * 2;
        score += (Number(shoeVals.flex_tors) || 0) * 2;
        score += (5 - (Number(shoeVals.stability) || 0));

        return Math.min(100, Math.round((score / 30) * 100));
    }, [shoeVals]);

    // 5. Lista de Exercícios
    const EXERCISE_LIST = [
        "Fortalecimento do músculo glúteo médio com o quadril em extensão (Ex. Drop pélvico)",
        "Fortalecimento do músculo glúteo médio com o quadril e joelhos fletidos (Ex. Ostra)",
        "Fortalecimento excêntrico na posição alongada do músculo tríceps sural",
        "Fortalecimento do músculo glúteo máximo",
        "Fortalecimento de músculos do CORE (Transverso/Multífidos) + Respiração",
        "Fortalecimento de glúteo médio (Ex. Ponte unilateral e/ou ponte lateral)",
        "Fortalecimento de quadríceps em cadeia cinética fechada e/ou aberta",
        "Fortalecimento excêntrico de isquiosurais em posição alongada",
        "Exercícios para ganho de mobilidade de quadril",
        "Exercícios para ganho de mobilidade de tornozelo"
    ];

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">

            {/* --- CABEÇALHO COM DROPDOWN (Sem barra amarela superior) --- */}
            <div className="w-full space-y-2">
                <div className="bg-white p-3 border rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><Menu className="w-5 h-5" /></div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Formulário Atual</span>
                            {/* Este Select age como seu Dropdown de Navegação */}
                            <Select value={activeForm} onValueChange={setActiveForm}>
                                <SelectTrigger className="border-none shadow-none p-0 h-auto font-bold text-lg text-slate-800 focus:ring-0">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="palmilha">Palmilha Biomecânica 2.0</SelectItem>
                                    <SelectItem value="avancada">Avaliação Física Avançada</SelectItem>
                                    <SelectItem value="clinica">Avaliação Clínica Inteligente</SelectItem>
                                    <SelectItem value="mulher">Saúde da Mulher</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                    {/* BOTÃO DE PRÉVIA E STATUS - BLOCO UNIFICADO */}
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <Eye className="w-4 h-4" />
                            Prévia do Relatório
                        </Button>

                        <Badge variant="outline" className="gap-2 px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-medium text-slate-600">Salvamento Automático</span>
                        </Badge>
                    </div>
                </div>

                {/* BARRA DE AVISO (ÚNICA) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 w-full">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 flex-1">
                        <span className="font-bold block text-amber-900 mb-1">Modo de Visualização (Sandbox)</span>
                        <p className="leading-relaxed opacity-90">
                            Os dados inseridos aqui <span className="font-bold">não serão salvos</span> em nenhum paciente real.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- CONTEÚDO CONDICIONAL --- */}
            {activeForm === 'avancada' && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <PhysicalAssessmentForm patientId={patientId} onSave={() => toast.success("Dados salvos (Simulação)")} />
                </div>
            )}

            {activeForm === 'clinica' && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <SmartAssessmentForm patientId={patientId} onSave={async () => toast.success("Dados salvos (Simulação)")} />
                </div>
            )}

            {activeForm === 'mulher' && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <WomensHealthForm patientId={patientId} />
                </div>
            )}

            {activeForm === 'palmilha' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

                    {/* COLUNA ESQUERDA (FORMULÁRIO) - Esticado para 9 colunas */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        <Form {...form}>
                            <form className="space-y-6">
                                <Accordion type="multiple" defaultValue={["hma", "shoe", "orto", "exercises"]} className="w-full space-y-4">

                                    {/* 1. ANAMNESE */}
                                    <AccordionItem value="hma" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🗣️ Anamnese & Queixa Principal</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="space-y-2"><FormLabel>Queixa Principal (QP)</FormLabel><Input {...form.register('hma.qp')} className="bg-white" placeholder="Descreva a queixa principal..." /></div>
                                            <div className="space-y-2">
                                                <FormLabel>História da Moléstia Atual (HMA)</FormLabel>
                                                <AudioTextarea
                                                    value={form.watch('hma.history')}
                                                    onChange={(e) => form.setValue('hma.history', e.target.value)}
                                                    onTranscription={(text) => form.setValue('hma.history', text)}
                                                    placeholder="Use o microfone para registrar a história da moléstia atual..."
                                                />
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border"><div className="flex justify-between mb-4"><FormLabel>Nível de Dor (EVA)</FormLabel><span className="text-2xl font-bold text-blue-600">{form.watch('hma.eva')?.[0]}/10</span></div><Slider max={10} step={1} value={form.watch('hma.eva')} onValueChange={(v) => form.setValue('hma.eva', v)} /></div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 2. HISTÓRICO */}
                                    <AccordionItem value="history" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🏥 Histórico Clínico</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="space-y-3"><FormLabel>Comorbidades</FormLabel><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{["Cardiopatia", "Diabetes", "D. Metabólicas", "D. Reumáticas", "D. Tiroideanas", "D. Vasculares", "Dislipidemia", "Etilismo", "HAS", "Obesidade", "Osteoporose", "Tabagismo"].map(c => (<div key={c} className="flex items-center gap-2"><Checkbox onCheckedChange={(checked) => { const current = form.getValues("history.comorbidities") || []; form.setValue("history.comorbidities", checked ? [...current, c] : current.filter((i: string) => i !== c)); }} /><label className="text-sm">{c}</label></div>))}</div></div>
                                            <div className="space-y-2"><FormLabel>Medicação</FormLabel><Input {...form.register("history.meds")} placeholder="Descreva os medicamentos em uso pelo paciente..." /></div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 3. ESPORTE */}
                                    <AccordionItem value="sports" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🏃 Rotina Esportiva</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="flex items-center gap-4 bg-orange-50 p-4 rounded border border-orange-100">
                                                <div className="space-y-1"><FormLabel className="text-xs uppercase font-bold text-orange-600">Peso (kg)</FormLabel><Input type="number" {...form.register("anthropometry.weight")} className="bg-white w-24 font-bold" placeholder="70" /></div>
                                                <div className="flex-1 text-right"><div className="text-xs text-slate-500">Gasto Semanal</div><div className="text-xl font-black text-orange-600">{calData.weekly} kcal</div><div className="flex justify-end gap-2 items-center"><div className="text-xs font-medium text-slate-400">{calData.minutes} min/sem</div><Badge className={calData.color}>{calData.level}</Badge></div></div>
                                            </div>
                                            {sportFields.map((field, index) => (<div key={field.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4"><div className="col-span-5"><FormLabel className="text-xs">Modalidade</FormLabel><Input list="sports-list" {...form.register(`sports.${index}.type` as any)} /></div><div className="col-span-3"><FormLabel className="text-xs">Frequência</FormLabel><Select onValueChange={(v) => form.setValue(`sports.${index}.freq` as any, v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7].map(d => <SelectItem key={d} value={d.toString()}>{d} dias</SelectItem>)}</SelectContent></Select></div><div className="col-span-3"><FormLabel className="text-xs">Minutos por Dia</FormLabel><Input type="number" {...form.register(`sports.${index}.duration` as any)} /></div><div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeSport(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button></div></div>))}
                                            <datalist id="sports-list">{["Balé", "Basquete", "Beach Tênis", "Bicicleta Ergométrica (Intensa)", "Bike (Ciclismo de Estrada)", "Boxe (Treino)", "Caminhada (5 km/h)", "Caminhada em Trilha (Hiking)", "Capoeira", "Corrida (10 km/h)", "Crossfit", "Dança de Salão", "Danças Urbanas/Hip Hop", "Escalada", "Esgrima", "Frescobol", "Futebol", "Futsal", "Futevôlei", "Ginástica Artística", "Ginástica Laboral", "Ginástica Olímpica", "Golfe", "Handebol", "Hidroginástica", "Hipismo", "Jiu-Jitsu", "Judô", "Karatê", "Kickboxing", "Krav Maga", "Musculação", "Muay Thai", "Natação (Borboleta/Intenso)", "Natação (Crawl moderado)", "Padel", "Patinação", "Pilates", "Pular Corda (Rápido)", "Remo", "Rugby", "Skate", "Spinning", "Squash", "Surf", "Tênis", "Tênis de Mesa", "Treino Funcional", "Triatlo", "Vôlei de Praia", "Vôlei de Quadra", "Yoga", "Zumba"].map(s => <option key={s} value={s} />)}</datalist>
                                            <Button type="button" variant="outline" size="sm" onClick={() => appendSport({ type: "", freq: "", duration: "" })}><Plus className="w-4 h-4 mr-2" /> Adicionar Esporte</Button>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 4. FUNCIONALIDADE */}
                                    <AccordionItem value="efep" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">📉 Funcionalidade & Questionários</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="space-y-2"><FormLabel>EFEP/PSFS (Selecione 3 atividades de execução comprometida por seus sintomas)</FormLabel>{efepFields.map((f, i) => (<div key={f.id} className="flex gap-2 items-center mb-2"><span className="text-xs font-bold text-slate-400 w-4">{i + 1}.</span><Input {...form.register(`efep.${i}.activity`)} placeholder="Atividade..." className="flex-1" /><div className="w-20"><Input type="number" {...form.register(`efep.${i}.score`)} placeholder="0-10" className="text-center font-bold" /></div><Button type="button" variant="ghost" size="icon" onClick={() => removeEfep(i)}><Trash2 className="w-4 h-4" /></Button></div>))}{efepFields.length < 3 && (<Button type="button" variant="outline" size="sm" onClick={() => appendEfep({ activity: "", score: 0 })} className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>)}</div>
                                            <div className="flex gap-2 items-end bg-green-50 p-3 rounded border border-green-100"><div className="flex-1"><FormLabel className="text-green-800">Enviar Questionário</FormLabel><Select onValueChange={(v) => form.setValue("questionnaire.selected", v)}><SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{["LEFS", "FAAM", "VISA-P", "VISA-G"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select></div><Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(`https://wa.me/?text=Olá, responda o ${form.watch("questionnaire.selected")}`, "_blank")}><Send className="w-4 h-4 mr-2" /> WhatsApp</Button></div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 5. DOR */}
                                    <AccordionItem value="map" className="border rounded-xl bg-card"><AccordionTrigger className="px-4 font-semibold text-lg">🎯 Mapa da Dor</AccordionTrigger><AccordionContent><BodyPainMap points={painFields} onAdd={appendPain} onRemove={removePain} onUpdate={updatePain} /></AccordionContent></AccordionItem>

                                    {/* 6. ESTÁTICA */}
                                    <AccordionItem value="static" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">👣 Avaliação Estática</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            {/* Zonas de Upload */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <PasteUploadZone label="Baropo 2D" />
                                                <PasteUploadZone label="Baropo 3D" />
                                            </div>

                                            {/* Grid de Inputs Principais */}
                                            <div className="grid grid-cols-3 gap-4">
                                                {/* 1. Naviculômetro com Lógica de Referência */}
                                                <div className="space-y-1">
                                                    <FormLabel>Naviculômetro (mm)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* Lado Esquerdo */}
                                                        <div>
                                                            <Input
                                                                placeholder="Esquerdo"
                                                                type="number"
                                                                {...form.register("postural.navicular.left")}
                                                            />
                                                            <Badge className={cn("w-full justify-center text-[10px] mt-1", getArchType(form.watch("postural.navicular.left"), form.watch("postural.shoeSize")).color)}>
                                                                {getArchType(form.watch("postural.navicular.left"), form.watch("postural.shoeSize")).label}
                                                            </Badge>
                                                        </div>
                                                        {/* Lado Direito */}
                                                        <div>
                                                            <Input
                                                                placeholder="Direito"
                                                                type="number"
                                                                {...form.register("postural.navicular.right")}
                                                            />
                                                            <Badge className={cn("w-full justify-center text-[10px] mt-1", getArchType(form.watch("postural.navicular.right"), form.watch("postural.shoeSize")).color)}>
                                                                {getArchType(form.watch("postural.navicular.right"), form.watch("postural.shoeSize")).label}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Teste do Catálogo */}
                                                <div className="space-y-1">
                                                    <FormLabel>Teste do Catálogo</FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Esquerdo" type="number" {...form.register("postural.teste_catalogo.left")} />
                                                        <Input placeholder="Direito" type="number" {...form.register("postural.teste_catalogo.right")} />
                                                    </div>
                                                </div>

                                                {/* 3. Número do Calçado (Essencial para a lógica do Arco) */}
                                                <div className="space-y-1">
                                                    <FormLabel>Nº Calçado</FormLabel>
                                                    <Input
                                                        type="number"
                                                        placeholder="Ex: 40"
                                                        {...form.register("postural.shoeSize")}
                                                    />
                                                </div>
                                            </div>

                                            {/* FPI-6 (Soma Automática) */}
                                            <div className="border-t pt-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-bold">FPI-6</h4>
                                                    <div className="flex gap-2 text-xs">
                                                        <Badge className={fpiData.left.c}>E: {fpiData.left.s}</Badge>
                                                        <Badge className={fpiData.right.c}>D: {fpiData.right.s}</Badge>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-6 gap-2 mb-1 text-center text-[9px] uppercase font-bold text-slate-400">
                                                    {["Tálus", "Maléolo medial", "Calcâneo", "Navicular", "Arco", "Abdução"].map(h => <div key={h}>{h}</div>)}
                                                </div>
                                                <div className="grid grid-cols-6 gap-2 mb-2">
                                                    {["talus", "curves", "calc", "tnj", "arch", "abd"].map(k => (
                                                        <Input key={k} type="number" className="h-8 text-center px-0 border-blue-100" placeholder="Esquerdo" {...form.register(`postural.fpi_left.${k}` as any)} />
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-6 gap-2">
                                                    {["talus", "curves", "calc", "tnj", "arch", "abd"].map(k => (
                                                        <Input key={k} type="number" className="h-8 text-center px-0 border-green-100" placeholder="Direito" {...form.register(`postural.fpi_right.${k}` as any)} />
                                                    ))}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 7. ORTOSTATISMO (Y-BALANCE COM LÓGICA E PORCENTAGEM) */}
                                    <AccordionItem value="orto" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🧍 Testes Funcionais - Ortostatismo</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            {/* Teste de Jack - Referência: Hall & Brody */}
                                            <div className="p-4 bg-slate-50 rounded border">
                                                <h4 className="font-bold text-sm mb-4">Teste de Jack</h4>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div>
                                                        <FormLabel>Esquerdo</FormLabel>
                                                        <BipolarSlider value={Number(form.watch("tests.jack.left"))} onChange={(v) => form.setValue("tests.jack.left", v)} />
                                                        <ReferenceStatus type="jack" value={form.watch("tests.jack.left")} />
                                                    </div>
                                                    <div>
                                                        <FormLabel>Direito</FormLabel>
                                                        <BipolarSlider value={Number(form.watch("tests.jack.right"))} onChange={(v) => form.setValue("tests.jack.right", v)} />
                                                        <ReferenceStatus type="jack" value={form.watch("tests.jack.right")} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Lunge Teste e Comprimento de Perna */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <FormLabel>Lunge Teste (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {/* LADO ESQUERDO */}
                                                        <div>
                                                            <Input placeholder="Esquerdo" type="number" {...form.register("tests.lunge.left")} />
                                                            {(() => {
                                                                const val = form.watch("tests.lunge.left");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1 transition-colors",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 35 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 35 ? "NORMAL" : "RESTRITO (<35°) - RISCO"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* LADO DIREITO */}
                                                        <div>
                                                            <Input placeholder="Direito" type="number" {...form.register("tests.lunge.right")} />
                                                            {(() => {
                                                                const val = form.watch("tests.lunge.right");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1 transition-colors",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 35 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 35 ? "NORMAL" : "RESTRITO (<35°) - RISCO"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <FormLabel>Comprimento Membro Inferior (cm)</FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Esquerdo" type="number" {...form.register("tests.ybalance.legLength.left")} />
                                                        <Input placeholder="Direito" type="number" {...form.register("tests.ybalance.legLength.right")} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Y-BALANCE TESTE COMPLETO */}
                                            <div className="border rounded p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-sm">Y-Balance Teste</h4>
                                                    <div className="flex items-center gap-4 text-xs bg-slate-100 px-3 py-1 rounded">
                                                        <span className="font-bold uppercase text-slate-500">Dominância:</span>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={form.watch("tests.ybalance.dominance") === "left"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "left")} /> Esquerda
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={form.watch("tests.ybalance.dominance") === "right"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "right")} /> Direita
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* BLOCO DE LÓGICA E TABELA Y-BALANCE */}
                                                {(() => {
                                                    const directions = [
                                                        { label: "Anterior", key: "Anterior", limit: 4 },
                                                        { label: "Postero Medial", key: "Post-Med", limit: 6 },
                                                        { label: "Postero Lateral", key: "Post-Lat", limit: 6 }
                                                    ];

                                                    const getAvg = (side: string, key: string) => {
                                                        const t1 = Number(form.watch(`tests.ybalance.${key}.${side}.t1` as any)) || 0;
                                                        const t2 = Number(form.watch(`tests.ybalance.${key}.${side}.t2` as any)) || 0;
                                                        const t3 = Number(form.watch(`tests.ybalance.${key}.${side}.t3` as any)) || 0;
                                                        const vals = [t1, t2, t3].filter(v => v > 0);
                                                        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                                                    };

                                                    const getPct = (avg: number, side: string) => {
                                                        const legLength = Number(form.watch(`tests.ybalance.legLength.${side}` as any)) || 0;
                                                        return legLength > 0 && avg > 0 ? Math.round((avg / legLength) * 100) : 0;
                                                    };

                                                    // Variáveis para a caixinha condicional de assimetria anterior
                                                    const lAvgAnt = getAvg("left", "Anterior");
                                                    const rAvgAnt = getAvg("right", "Anterior");
                                                    const diffAnt = Math.abs(lAvgAnt - rAvgAnt);

                                                    // Variáveis para o Score Composto (Média das 3 direções / Comprimento da Perna)
                                                    const lComp = (getAvg("left", "Anterior") + getAvg("left", "Post-Med") + getAvg("left", "Post-Lat")) / 3;
                                                    const lScore = getPct(lComp, "left");

                                                    return (
                                                        <>
                                                            <table className="w-full text-sm text-center">
                                                                <thead className="bg-muted text-xs">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Direção</th>
                                                                        <th colSpan={3}>Esquerda (cm)</th>
                                                                        <th>Média</th>
                                                                        <th>%</th>
                                                                        <th colSpan={3}>Direita (cm)</th>
                                                                        <th>Média</th>
                                                                        <th>%</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {directions.map(dir => {
                                                                        const lAvg = getAvg("left", dir.key);
                                                                        const rAvg = getAvg("right", dir.key);
                                                                        const lPct = getPct(lAvg, "left");
                                                                        const rPct = getPct(rAvg, "right");

                                                                        return (
                                                                            <tr key={dir.key} className="border-b">
                                                                                <td className="text-left p-2 font-medium">{dir.label}</td>
                                                                                {[1, 2, 3].map(t => (
                                                                                    <td key={`L${t}`} className="p-1">
                                                                                        <Input className="h-7 w-16 mx-auto px-1 text-center" type="number" {...form.register(`tests.ybalance.${dir.key}.left.t${t}` as any)} />
                                                                                    </td>
                                                                                ))}
                                                                                <td className="p-1 font-bold text-blue-600 bg-blue-50/50">{Math.round(lAvg) || "-"}</td>
                                                                                <td className="p-1 text-[10px] text-slate-500 bg-slate-50">{lPct ? lPct + "%" : "-"}</td>
                                                                                {[1, 2, 3].map(t => (
                                                                                    <td key={`R${t}`} className="p-1">
                                                                                        <Input className="h-7 w-16 mx-auto px-1 text-center" type="number" {...form.register(`tests.ybalance.${dir.key}.right.t${t}` as any)} />
                                                                                    </td>
                                                                                ))}
                                                                                <td className="p-1 font-bold text-green-600 bg-green-50/50">{Math.round(rAvg) || "-"}</td>
                                                                                <td className="p-1 text-[10px] text-slate-500 bg-slate-50">{rPct ? rPct + "%" : "-"}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>

                                                            {/* RESULTADO CONDICIONAL Y-BALANCE (CAIXINHAS COLORIDAS) */}
                                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                                {/* Verificação de Assimetria Anterior */}
                                                                {diffAnt > 4 ? (
                                                                    <div className="bg-red-100 text-red-700 p-2 rounded text-center text-xs font-bold border border-red-200">
                                                                        ASSIMETRIA ANTERIOR ({Math.round(diffAnt)}cm) - RISCO
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-green-100 text-green-700 p-2 rounded text-center text-xs font-bold border border-green-200">
                                                                        SIMETRIA ANTERIOR - NORMAL
                                                                    </div>
                                                                )}

                                                                {/* Verificação de Score Composto Perna Esquerda */}
                                                                {lScore < 94 ? (
                                                                    <div className="bg-yellow-100 text-yellow-700 p-2 rounded text-center text-xs font-bold border border-yellow-200">
                                                                        SCORE COMPOSTO E. ({lScore}%) - ATENÇÃO
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-green-100 text-green-700 p-2 rounded text-center text-xs font-bold border border-green-200">
                                                                        SCORE COMPOSTO E. - EXCELENTE
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 8. DECÚBITO DORSAL - THOMAS E ISQUIOSURAIS CORRIGIDOS */}
                                    <AccordionItem value="dorsal" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🛌 Decúbito Dorsal</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Teste de Thomas - Critério Ferber et. al, 2010 (Ref 10) */}
                                                <div className="space-y-1">
                                                    <FormLabel>Teste de Thomas (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col gap-1">
                                                            <Input placeholder="Esquerdo" {...form.register("tests.thomas.left")} />
                                                            {(() => {
                                                                const val = form.watch("tests.thomas.left");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 10 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 10 ? "NORMAL" : "DÉFICIT PSOAS"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <Input placeholder="Direito" {...form.register("tests.thomas.right")} />
                                                            {(() => {
                                                                const val = form.watch("tests.thomas.left");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 10 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 10 ? "NORMAL" : "DÉFICIT PSOAS"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Isquiosurais - Critério Reurink et. al, 2013 (Ref 132) */}
                                                <div className="space-y-1">
                                                    <FormLabel>Isquiosurais (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col gap-1">
                                                            <Input placeholder="Esquerdo" {...form.register("tests.slr.left")} />
                                                            {(() => {
                                                                const val = form.watch("tests.slr.left");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 132 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 132 ? "NORMAL" : "DÉFICIT ISQUIOS"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="flex flex-col gap-1">
                                                            <Input placeholder="Direito" {...form.register("tests.slr.right")} />
                                                            {(() => {
                                                                const val = form.watch("tests.slr.left");
                                                                const isEmpty = val === "" || val === undefined || val === null;
                                                                const numVal = Number(val);
                                                                return (
                                                                    <div className={cn(
                                                                        "text-[10px] font-bold px-2 py-1 rounded border text-center uppercase mt-1",
                                                                        isEmpty ? "bg-slate-100 text-slate-400 border-slate-200" :
                                                                            numVal >= 132 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                                                                    )}>
                                                                        {isEmpty ? "Sem Dados" : numVal >= 132 ? "NORMAL" : "DÉFICIT ISQUIOS"}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Força Muscular - Seus Sliders com cores dinâmicas */}
                                            <div className="space-y-6 border-t pt-4">
                                                <h4 className="font-bold text-sm">Força Muscular (0-10)</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <FormLabel>Glúteo Médio</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold w-4">E</span>
                                                            <Slider max={10} className="flex-1" value={[form.watch("tests.glute_strength.med_left")]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_left", v)} />
                                                            <Badge className={form.watch("tests.glute_strength.med_left") < 4 ? "bg-red-500" : form.watch("tests.glute_strength.med_left") > 7 ? "bg-green-500" : "bg-yellow-500"}>
                                                                {form.watch("tests.glute_strength.med_left")}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold w-4">D</span>
                                                            <Slider max={10} className="flex-1" value={[form.watch("tests.glute_strength.med_right")]} onValueChange={([v]) => form.setValue("tests.glute_strength.med_right", v)} />
                                                            <Badge className={form.watch("tests.glute_strength.med_right") < 4 ? "bg-red-500" : form.watch("tests.glute_strength.med_right") > 7 ? "bg-green-500" : "bg-yellow-500"}>
                                                                {form.watch("tests.glute_strength.med_right")}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <FormLabel>Glúteo Máximo</FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold w-4">E</span>
                                                            <Slider max={10} className="flex-1" value={[form.watch("tests.glute_strength.max_left")]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_left", v)} />
                                                            <Badge className={form.watch("tests.glute_strength.max_left") < 4 ? "bg-red-500" : form.watch("tests.glute_strength.max_left") > 7 ? "bg-green-500" : "bg-yellow-500"}>
                                                                {form.watch("tests.glute_strength.max_left")}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold w-4">D</span>
                                                            <Slider max={10} className="flex-1" value={[form.watch("tests.glute_strength.max_right")]} onValueChange={([v]) => form.setValue("tests.glute_strength.max_right", v)} />
                                                            <Badge className={form.watch("tests.glute_strength.max_right") < 4 ? "bg-red-500" : form.watch("tests.glute_strength.max_right") > 7 ? "bg-green-500" : "bg-yellow-500"}>
                                                                {form.watch("tests.glute_strength.max_right")}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobilidade - Seus Bipolar Sliders */}
                                            <div className="grid grid-cols-2 gap-8 pt-4">
                                                <div className="space-y-2">
                                                    <FormLabel>Mobilidade 1º Raio</FormLabel>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">E</span>
                                                            <BipolarSlider value={Number(form.watch("tests.mob_1_raio.left"))} onChange={v => form.setValue("tests.mob_1_raio.left", v)} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">D</span>
                                                            <BipolarSlider value={Number(form.watch("tests.mob_1_raio.right"))} onChange={v => form.setValue("tests.mob_1_raio.right", v)} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <FormLabel>Mobilidade Mediopé</FormLabel>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">E</span>
                                                            <BipolarSlider value={Number(form.watch("tests.mob_medio.left"))} onChange={v => form.setValue("tests.mob_medio.left", v)} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">D</span>
                                                            <BipolarSlider value={Number(form.watch("tests.mob_medio.right"))} onChange={v => form.setValue("tests.mob_medio.right", v)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 9. DECÚBITO VENTRAL - LÓGICA ATUALIZADA (CARVALHAIS 2011 & CRAIG) */}
                                    <AccordionItem value="ventral" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">⇩ Decúbito Ventral</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">
                                            {/* Tabela de Medidas de Torção (Mantenha como está) */}
                                            <table className="w-full text-sm text-center mb-4">
                                                <thead className="bg-muted">
                                                    <tr>
                                                        <th className="p-2 border">Lado</th>
                                                        <th className="border">Retropé (º)</th>
                                                        <th className="border">Antepé (º)</th>
                                                        <th className="border">APA (º)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b">
                                                        <td className="font-medium p-2 border">Esquerdo</td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.left.retro")} /></td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.left.ante")} /></td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.left.apa")} /></td>
                                                    </tr>
                                                    <tr>
                                                        <td className="font-medium p-2 border">Direito</td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.right.retro")} /></td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.right.ante")} /></td>
                                                        <td className="border"><Input className="h-8 w-full text-center" {...form.register("tests.ventral.measures.right.apa")} /></td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Rigidez Rotadores Laterais (º) - Ref: Carvalhais, 2011 */}
                                                <div className="space-y-1">
                                                    <FormLabel>Rigidez Rotadores Laterais (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['left', 'right'].map((side) => {
                                                            const val = form.watch(`tests.ventral.rotation.${side}`);
                                                            const isEmpty = val === "" || val === undefined || val === null;
                                                            const numVal = Number(val);

                                                            let label = "Sem Dados";
                                                            let color = "bg-slate-100 text-slate-400 border-slate-200";

                                                            if (!isEmpty) {
                                                                if (numVal < 40) {
                                                                    label = "RIGIDEZ AUMENTADA";
                                                                    color = "bg-red-100 text-red-700 border-red-200";
                                                                } else if (numVal >= 40 && numVal <= 42) {
                                                                    label = "NORMAL";
                                                                    color = "bg-green-100 text-green-700 border-green-200";
                                                                } else {
                                                                    label = "RIGIDEZ REDUZIDA";
                                                                    color = "bg-yellow-100 text-yellow-700 border-yellow-200";
                                                                }
                                                            }

                                                            return (
                                                                <div key={side} className="flex flex-col gap-1">
                                                                    <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} {...form.register(`tests.ventral.rotation.${side}` as any)} />
                                                                    <div className={cn("text-[10px] font-bold px-1 py-1 rounded border text-center uppercase min-h-[24px] flex items-center justify-center transition-colors", color)}>
                                                                        {label}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Teste de Craig (º) - Lógica de Anteversão/Retroversão */}
                                                <div className="space-y-1">
                                                    <FormLabel>Teste de Craig (º)</FormLabel>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['left', 'right'].map((side) => {
                                                            const val = form.watch(`tests.ventral.craig.${side}`);
                                                            const isEmpty = val === "" || val === undefined || val === null;
                                                            const numVal = Number(val);

                                                            let label = "Sem Dados";
                                                            let color = "bg-slate-100 text-slate-400 border-slate-200";

                                                            if (!isEmpty) {
                                                                if (numVal >= 8 && numVal <= 15) {
                                                                    label = "NORMAL";
                                                                    color = "bg-green-100 text-green-700 border-green-200";
                                                                } else if (numVal < 8) {
                                                                    label = "RETROVERSÃO";
                                                                    color = "bg-red-100 text-red-700 border-red-200";
                                                                } else {
                                                                    label = "ANTEVERSÃO";
                                                                    color = "bg-orange-100 text-orange-700 border-orange-200";
                                                                }
                                                            }

                                                            return (
                                                                <div key={side} className="flex flex-col gap-1">
                                                                    <Input placeholder={side === 'left' ? "Esquerdo" : "Direito"} {...form.register(`tests.ventral.craig.${side}` as any)} />
                                                                    <div className={cn("text-[10px] font-bold px-1 py-1 rounded border text-center uppercase min-h-[24px] flex items-center justify-center transition-colors", color)}>
                                                                        {label}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 10. DINÂMICA (FOTOS DIVIDIDAS EM 2 LINHAS) */}
                                    <AccordionItem value="dynamic" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🏃 Avaliação Dinâmica</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-8">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div><FormLabel>Pontuação Dynamic Foot Index (-2 a +2)</FormLabel><table className="w-full text-sm mt-2"><thead className="bg-muted"><tr><th>Fase</th><th>Esquerdo</th><th>Direito</th></tr></thead><tbody>{["Contato Inicial", "Resposta à Carga", "Impulsão"].map((f, i) => <tr key={i} className="border-b"><td className="p-2">{f}</td><td className="p-1"><Input type="number" className="text-center" min={-2} max={2} {...form.register(`tests.dfi.${i}.left` as any)} /></td><td className="p-1"><Input type="number" className="text-center" min={-2} max={2} {...form.register(`tests.dfi.${i}.right` as any)} /></td></tr>)}</tbody></table></div><div className="h-40 bg-white border rounded"><ResponsiveContainer width="100%" height="100%"><LineChart data={[{ name: 'CI', e: form.watch("tests.dfi.0.left"), d: form.watch("tests.dfi.0.right") }, { name: 'RC', e: form.watch("tests.dfi.1.left"), d: form.watch("tests.dfi.1.right") }, { name: 'IMP', e: form.watch("tests.dfi.2.left"), d: form.watch("tests.dfi.2.right") }]}><CartesianGrid strokeDasharray="3 3" /><Line type="monotone" dataKey="e" stroke="#2563eb" /><Line type="monotone" dataKey="d" stroke="#16a34a" /></LineChart></ResponsiveContainer></div></div>
                                            <div className="p-4 bg-slate-50 border rounded-lg space-y-4"><h4 className="font-bold text-sm">Agachamento Unipodal</h4><div className="grid grid-cols-2 gap-8"><div className="space-y-3"><div className="flex justify-between"><FormLabel>Esquerda (-5 a +5)</FormLabel><Badge className={form.watch("tests.single_squat.score_left") < 0 ? "bg-red-500" : "bg-green-500"}>{form.watch("tests.single_squat.score_left")}</Badge></div><Slider min={-5} max={5} step={1} value={[form.watch("tests.single_squat.score_left")]} onValueChange={([v]) => form.setValue("tests.single_squat.score_left", v)} /><div className="grid grid-cols-2 gap-2 text-xs"><div><label>Queda Pélvica</label><Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_left", v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent><SelectItem value="nao">Não</SelectItem><SelectItem value="sim">Sim</SelectItem></SelectContent></Select></div><div><label>Valgo Dinâmico</label><Select onValueChange={v => form.setValue("tests.single_squat.valgus_left", v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="+">+</SelectItem></SelectContent></Select></div></div></div><div className="space-y-3"><div className="flex justify-between"><FormLabel>Direita (-5 a +5)</FormLabel><Badge className={form.watch("tests.single_squat.score_right") < 0 ? "bg-red-500" : "bg-green-500"}>{form.watch("tests.single_squat.score_right")}</Badge></div><Slider min={-5} max={5} step={1} value={[form.watch("tests.single_squat.score_right")]} onValueChange={([v]) => form.setValue("tests.single_squat.score_right", v)} /><div className="grid grid-cols-2 gap-2 text-xs"><div><label>Queda Pélvica</label><Select onValueChange={v => form.setValue("tests.single_squat.pelvic_drop_right", v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent><SelectItem value="nao">Não</SelectItem><SelectItem value="sim">Sim</SelectItem></SelectContent></Select></div><div><label>Valgo Dinâmico</label><Select onValueChange={v => form.setValue("tests.single_squat.valgus_right", v)}><SelectTrigger><SelectValue placeholder="-" /></SelectTrigger><SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="+">+</SelectItem></SelectContent></Select></div></div></div></div></div>

                                            {/* FOTOS DE MARCHA (SEPARADAS) */}
                                            <div className="space-y-6">
                                                <div className="space-y-2 border-b pb-4">
                                                    <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2"><Footprints className="w-4 h-4" /> Pé Esquerdo</span>
                                                    <div className="grid grid-cols-3 gap-2"><PasteUploadZone label="Contato Inicial" /><PasteUploadZone label="Apoio Médio" /><PasteUploadZone label="Impulsão" /></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold text-green-600 uppercase flex items-center gap-2"><Footprints className="w- h-4" /> Pé Direito</span>
                                                    <div className="grid grid-cols-3 gap-2"><PasteUploadZone label="Contato Inicial" /><PasteUploadZone label="Apoio Médio" /><PasteUploadZone label="Impulsão" /></div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="shoe" className="border rounded-xl bg-card border-l-4 border-l-blue-600">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">👟 Análise de Calçados & Prescrição</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-6">

                                            {/* 1. SELEÇÃO DA PATOLOGIA */}
                                            <div className="space-y-1">
                                                <FormLabel className="text-blue-900 text-xs font-bold uppercase tracking-wider">1. Localização / Tipo de Lesão</FormLabel>
                                                <Select onValueChange={v => form.setValue("shoe.injuryType", v)}>
                                                    <SelectTrigger className="bg-white border-blue-200 h-10 shadow-sm">
                                                        <SelectValue placeholder="Selecione a patologia para recomendação..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="achilles">Tendinopatia de Aquiles / Panturrilha</SelectItem>
                                                        <SelectItem value="pfps">Dor Patelofemoral (Joelho)</SelectItem>
                                                        <SelectItem value="stress_fracture">Fratura por Estresse / Metatarsalgia</SelectItem>
                                                        <SelectItem value="plantar_fasciitis">Fasciíte Plantar</SelectItem>
                                                        <SelectItem value="none">Prevenção / Outros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>


                                            {/* 3. CRITÉRIOS DE ESTADO E OBJETIVO */}
                                            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Estado da Lesão</FormLabel>
                                                    <Select onValueChange={v => form.setValue("shoe.injuryStatus", v)}>
                                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Sem Lesão Ativa</SelectItem>
                                                            <SelectItem value="acute">Fase Aguda (Recente)</SelectItem>
                                                            <SelectItem value="chronic">Fase Crônica ({'>'} 3 meses)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Objetivo</FormLabel>
                                                    <Select onValueChange={v => form.setValue("shoe.goals", [v])}>
                                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pain_reduction">Conforto / Menos Dor</SelectItem>
                                                            <SelectItem value="performance">Performance / Velocidade</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold uppercase text-slate-500">Nível</FormLabel>
                                                    <Select onValueChange={v => form.setValue("shoe.experience", v)}>
                                                        <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="beginner">Iniciante</SelectItem>
                                                            <SelectItem value="amateur">Amador</SelectItem>
                                                            <SelectItem value="elite">Elite</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* 2. BANNER DE DIRETRIZ (VISUAL CORRIGIDO: Texto amplo e Ícone lateral moderno) */}
                                            <div className={cn("p-5 rounded-2xl border-2 flex items-center gap-6 transition-all shadow-sm", shoeRecommendations.color)}>
                                                <div className="flex-shrink-0 w-16 h-16 bg-white/80 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-white">
                                                    {shoeRecommendations.image}
                                                </div>
                                                <div className="flex-1">
                                                    <Badge className="mb-2 text-[10px] uppercase font-black tracking-widest bg-white/20 hover:bg-white/30 text-current border-none">
                                                        {shoeRecommendations.feature}
                                                    </Badge>
                                                    <h4 className="font-bold text-lg leading-tight mb-1">{shoeRecommendations.text}</h4>
                                                    <p className="text-sm leading-relaxed font-medium opacity-90 italic">
                                                        {shoeRecommendations.details}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 4. DADOS TÉCNICOS DO CALÇADO (FOTO 3 RESTAURADA) */}
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Peso (g)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.weight")} />
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Drop (mm)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.drop")} />
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                                                        <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Stack (mm)</span>
                                                        <Input type="number" className="text-center font-black text-3xl border-none p-0 h-auto bg-transparent focus-visible:ring-0" {...form.register("shoe.stack")} />
                                                    </div>
                                                </div>

                                                {/* SLIDERS DE FLEXIBILIDADE E ESTABILIDADE (FOTO 3 VOLTOU!) */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <ShoeScale
                                                        label="Flex. Longitudinal"
                                                        value={form.watch("shoe.flex_long")}
                                                        onChange={(v) => form.setValue("shoe.flex_long", v)}
                                                        options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                                                    />
                                                    <ShoeScale
                                                        label="Flex. Torsional"
                                                        value={form.watch("shoe.flex_tors")}
                                                        onChange={(v) => form.setValue("shoe.flex_tors", v)}
                                                        options={[{ val: "0", label: "" }, { val: "0.5", label: "" }, { val: "1", label: "" }, { val: "1.5", label: "" }, { val: "2", label: "" }, { val: "2.5", label: "" }]}
                                                    />
                                                    <ShoeScale
                                                        label="Estabilidade"
                                                        value={form.watch("shoe.stability")}
                                                        onChange={(v) => form.setValue("shoe.stability", v)}
                                                        options={[{ val: "5", label: "" }, { val: "4", label: "" }, { val: "3", label: "" }, { val: "2", label: "" }, { val: "1", label: "" }, { val: "0", label: "" }]}
                                                    />
                                                </div>
                                            </div>

                                            {/* 5. ÍNDICE MINIMALISTA FINAL */}
                                            <div className="p-6 bg-slate-900 rounded-2xl flex items-center justify-between text-white shadow-xl">
                                                <div className="space-y-1">
                                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Índice Minimalista Estimado</h4>
                                                    <p className="text-[10px] text-slate-400">Metodologia: The Running Clinic.</p>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-5xl font-black text-white">{minIndexResult}%</div>
                                                    <Badge className={cn("px-4 py-1.5 font-bold text-[11px]",
                                                        minIndexResult > 70 ? "bg-green-500" :
                                                            minIndexResult < 30 ? "bg-red-500" :
                                                                "bg-blue-500")}>
                                                        {minIndexResult > 70 ? "MINIMALISTA" : minIndexResult < 30 ? "MAXIMALISTA" : "TRANSIÇÃO"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 12. EXAMES E PLANO (COM MIC FUNCIONAL) */}
                                    <AccordionItem value="exams" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">📝 Exames & Plano Terapêutico</AccordionTrigger>
                                        <AccordionContent className="p-4 space-y-4">
                                            <div className="space-y-2"><FormLabel>Resultados de Exames</FormLabel><Textarea placeholder="Descreva os achados..." {...form.register("plan.exams")} className="min-h-[100px]" /></div>
                                            <div className="space-y-2">
                                                <FormLabel>Orientações ao Paciente (Use o microfone)</FormLabel>
                                                <AudioTextarea
                                                    value={form.watch("plan.orientations")}
                                                    onChange={(e) => form.setValue("plan.orientations", e.target.value)}
                                                    onTranscription={(text) => form.setValue("plan.orientations", text)}
                                                    placeholder="Fale as orientações..."
                                                />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* 13. SUGESTÕES DE EXERCÍCIO (A LISTA QUE FALTAVA) */}
                                    <AccordionItem value="exercises" className="border rounded-xl bg-card">
                                        <AccordionTrigger className="px-4 font-semibold text-lg hover:no-underline">🏋️ Sugestões de Exercício</AccordionTrigger>
                                        <AccordionContent className="p-4">
                                            <div className="grid grid-cols-1 gap-2">
                                                {EXERCISE_LIST.map((ex) => (
                                                    <div key={ex} className="flex items-start gap-3 p-3 rounded-md border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-colors">
                                                        <Checkbox id={ex} onCheckedChange={(checked) => {
                                                            const current = form.getValues("plan.exercises") || [];
                                                            // @ts-ignore
                                                            form.setValue("plan.exercises", checked ? [...current, ex] : current.filter(i => i !== ex));
                                                        }} />
                                                        <label htmlFor={ex} className="text-sm font-medium leading-tight cursor-pointer text-slate-700">{ex}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </form>
                        </Form>
                    </div>

                    {/* SIDEBAR COM DADOS EM TEMPO REAL */}
                    <div className="lg:col-span-4 xl:col-span-3 hidden lg:block relative">
                        <div className="sticky top-6">
                            <BiomechanicsSidebar
                                form={form}
                                calorieData={calData}
                                fpiData={fpiData}
                                shoeIndex={minIndexResult}
                                shoeRec={shoeRecommendations}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useMemo } from 'react'
import { cn } from "@/lib/utils"
import { AssessmentRadar } from './assessment-radar'
// Using the more complete radar calculation from clinical-references
import { calculateRadarData as calculateRadarDataRef } from '@/utils/clinical-references'
import { calculateMinimalismIndex, calculateSmartRecommendation, getFpiClass } from '@/features/forms/pbe/utils/biomechanics-calculations'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Footprints, Activity, Ruler, Scaling, User, AlertCircle, CheckCircle2, Info, Clock, Weight } from 'lucide-react'

// --- INTERNAL HELPERS ---
const SectionHeader = ({ title, icon: Icon, color = "blue" }: any) => (
    <div className={cn("flex items-center gap-3 border-b-2 pb-2 mb-4 print:mb-2",
        color === "blue" ? "border-blue-200" :
            color === "orange" ? "border-orange-200" :
                color === "purple" ? "border-purple-200" :
                    "border-slate-200")}>
        <div className={cn("p-1.5 rounded-lg text-white",
            color === "blue" ? "bg-blue-600" :
                color === "orange" ? "bg-orange-600" :
                    color === "purple" ? "bg-purple-600" :
                        "bg-slate-600")}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className={cn("font-black uppercase text-sm tracking-widest",
            color === "blue" ? "text-blue-900" :
                color === "orange" ? "text-orange-900" :
                    color === "purple" ? "text-purple-900" :
                        "text-slate-900")}>{title}</h3>
    </div>
);

const InsightBox = ({ text }: { text: string }) => {
    if (!text) return null;
    return (
        <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex gap-3 items-start mt-2 print:mt-1 print:p-2">
            <div className="bg-purple-100 text-purple-600 p-1 rounded mt-0.5 shrink-0 print:bg-purple-50 print:text-purple-800">
                <Activity className="w-3 h-3" />
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-purple-600 block mb-0.5">Insight Clínico</span>
                <div className="text-[11px] text-slate-700 leading-tight italic">
                    {text}
                </div>
            </div>
        </div>
    );
};

const GaugeCard = ({ label, value, max = 100, unit = "", color = "blue", insight }: any) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const strokeColor = color === "red" ? "#ef4444" : color === "green" ? "#22c55e" : "#3b82f6";

    return (
        <div className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden print:border-slate-200 break-inside-avoid">
            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</h4>
            <div className="relative h-24 flex items-center justify-center">
                <div className="relative w-32 h-16 overflow-hidden">
                    <svg viewBox="0 0 100 50" className="w-full h-full absolute inset-0">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={strokeColor} strokeWidth="12"
                            strokeDasharray={`${(pct / 100) * 126} 126`} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-2xl font-black text-slate-800">{value}</div>
                </div>
                <span className="absolute bottom-1 text-[10px] uppercase font-bold text-slate-400">{unit}</span>
            </div>
            {insight && <InsightBox text={insight} />}
        </div>
    );
};

function calculateAge(dob: string) {
    if (!dob) return "--";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

interface BiomechanicsReportPrintProps {
    data: any
    patient?: any
    professionalName?: string
    date?: string
    organizationName?: string
    professional?: any
    organization?: any
}

export function BiomechanicsReportPrint({ data, patient, professionalName, date, organizationName, professional, organization }: BiomechanicsReportPrintProps) {
    if (!data) return null;

    // Data normalization for new PBE format
    const normalizedData = useMemo(() => {
        const isNew = !!(data.hma || data.postural);
        if (!isNew) return data;

        // Map NEW structure to OLD structure expected by some calculations
        return {
            ...data,
            qp: data.hma?.qp || data.qp,
            eva: data.hma?.eva?.[0] || data.eva,
            anthropometry: {
                ...data.anthropometry,
                navicularLeft: data.postural?.navicular?.left || data.anthropometry?.navicularLeft,
                navicularRight: data.postural?.navicular?.right || data.anthropometry?.navicularRight,
            },
            fpi: {
                left: data.postural?.fpi_left_total !== undefined
                    ? [data.postural.fpi_left_total, 0, 0, 0, 0, 0]
                    : (data.fpi?.left || [0, 0, 0, 0, 0, 0]),
                right: data.postural?.fpi_right_total !== undefined
                    ? [data.postural.fpi_right_total, 0, 0, 0, 0, 0]
                    : (data.fpi?.right || [0, 0, 0, 0, 0, 0]),
            },
            flexibility: {
                ...data.flexibility,
                lungeLeft: data.tests?.lunge?.left || data.flexibility?.lungeLeft,
                lungeRight: data.tests?.lunge?.right || data.flexibility?.lungeRight,
            },
            yBalance: data.tests?.ybalance || data.yBalance,
        };
    }, [data]);

    // Using the clinical-references version of Radar data which is more complete (8 pillars)
    const radarData = useMemo(() => calculateRadarDataRef(normalizedData), [normalizedData]);

    const minimalismIndex = calculateMinimalismIndex(normalizedData.currentShoe || { specs: { weight: 0, drop: 0, stack: 0 }, minScoreData: { flexLong: 0, flexTor: 0, stability: 0 } })
    const smartRec = calculateSmartRecommendation(normalizedData.patientProfile, normalizedData.painPoints)
    const fpiRight = getFpiClass(normalizedData.fpi?.right || [0, 0, 0, 0, 0, 0])
    const fpiLeft = getFpiClass(normalizedData.fpi?.left || [0, 0, 0, 0, 0, 0])

    const fmt = (n: any) => typeof n === 'number' ? n.toFixed(1) : (typeof n === 'string' && n !== "" ? n : '-');

    // Insights logic
    const painVal = Number(normalizedData.eva || 0);
    const painInsight = painVal >= 7 ? "Nível de dor crítico. Recomenda-se foco em controle agudo." : painVal >= 4 ? "Nível de dor moderado permite intervenções adaptadas." : "Nível de dor baixo permite progressão de carga mecânica.";

    const efepItems = normalizedData.efep?.items || [];
    const efepSum = efepItems.reduce((acc: number, item: any) => acc + (+item.score || 0), 0);
    const funcScoreRaw = efepItems.length > 0 ? (efepSum / efepItems.length) * 10 : 0;
    const funcScore = Math.round(funcScoreRaw);
    const funcInsight = funcScore > 70 ? "Capacidade funcional excelente." : funcScore > 40 ? "Capacidade funcional preservada com restrições leves." : "Capacidade funcional reduzida significativa.";

    const loadMin = Number(normalizedData.hma?.training_load || 0);
    const loadInsight = loadMin > 600 ? "Volume de treinamento elevado." : loadMin > 300 ? "Volume de treino ideal/ativo." : "Volume de treino moderado/baixo.";

    return (
        <div className="w-full bg-white text-slate-900 p-0 max-w-[210mm] mx-auto min-h-screen">
            {/* --- PÁGINA 1: CAPA & RESUMO --- */}
            <div className="p-10 flex flex-col relative min-h-[297mm] page-break">
                {/* Header Premium (FOTO 4 style) */}
                <header className="flex justify-between items-start border-b-4 border-blue-900 pb-6 mb-10 print:mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center text-white font-black text-3xl print-color-adjust">A</div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Relatório Biomecânico</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Advanced Clinical Protocol</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400">Emissão</p>
                        <p className="text-xl font-black text-slate-800">{date ? new Date(date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </header>

                {/* Patient Info Card */}
                <div className="bg-slate-50 border-l-4 border-blue-600 p-6 mb-10 rounded-r-xl print:bg-slate-50 print:border-blue-600">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <div>
                            <span className="block text-[10px] uppercase font-black text-slate-400">Paciente</span>
                            <span className="block text-xl font-bold text-slate-800">{patient?.name || "Paciente Modelo"}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-black text-slate-400">Idade</span>
                            <span className="block text-xl font-bold text-slate-800">{patient?.date_of_birth ? calculateAge(patient.date_of_birth) : "--"} anos</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-[10px] uppercase font-black text-slate-400">Queixa Principal</span>
                            <span className="block text-lg font-medium text-slate-700 italic">"{normalizedData.qp || "Avaliação de Rotina"}"</span>
                        </div>
                    </div>
                </div>

                {/* Quadro Geral (GAUGES) */}
                <SectionHeader title="Quadro Geral" icon={Activity} />
                <div className="grid grid-cols-2 gap-6 mb-8 print:gap-4">
                    <GaugeCard label="Nível de Dor (EVA)" value={painVal} max={10} color="red" unit="/ 10" insight={painInsight} />
                    <GaugeCard label="Nível Funcional (EFEP)" value={funcScore} max={100} color="green" unit="Pts" insight={funcInsight} />
                </div>

                {/* Boxes: Training Load & FPI-6 */}
                <div className="grid grid-cols-2 gap-6 mb-8 print:gap-4">
                    <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Carga de Treino Semanal</h4>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-3xl font-black text-orange-600">{loadMin}</span>
                            <span className="text-xs font-bold text-slate-500">min/sem</span>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 border-none mb-2 block w-fit h-4 text-[9px]">
                            {loadMin >= 600 ? "ALTA PERFORMANCE" : loadMin >= 300 ? "ATIVO" : "MODERADO/BAIXO"}
                        </Badge>
                        <InsightBox text={loadInsight} />
                    </div>

                    <div className="bg-white border rounded-2xl p-4 shadow-sm break-inside-avoid print:border-slate-200">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Postura dos Pés (FPI-6)</h4>
                        <div className="space-y-4 mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black w-4 text-slate-400">ESQ</span>
                                <Badge variant="outline" className={cn("h-4 text-[9px] font-bold border-none bg-slate-100", fpiLeft.color)}>
                                    {fpiLeft.label} ({fpiLeft.score})
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black w-4 text-slate-400">DIR</span>
                                <Badge variant="outline" className={cn("h-4 text-[9px] font-bold border-none bg-slate-100", fpiRight.color)}>
                                    {fpiRight.label} ({fpiRight.score})
                                </Badge>
                            </div>
                        </div>
                        <InsightBox text={`Índice indica ${Math.abs(fpiLeft.score) > 5 ? "alinhamento com desvio" : "alinhamento normal"}.`} />
                    </div>
                </div>

                {/* Footnotes */}
                <div className="mt-auto pt-6 border-t flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                    <span>Relatório Gerado por {organizationName || 'Access Fisioterapia'}</span>
                    <span>Axiom Health System</span>
                </div>
            </div>

            {/* --- PÁGINA 2: ANÁLISE FUNCIONAL --- */}
            <div className="p-10 flex flex-col relative min-h-[297mm] page-break">
                <SectionHeader title="Perfil Biomecânico & Clínico" icon={Scaling} color="purple" />

                <div className="flex flex-col items-center justify-center mb-10 min-h-[400px]">
                    <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 mb-4 text-center">Resumo Clínico-Funcional</h3>
                    <div className="w-full h-[400px]">
                        <AssessmentRadar data={radarData} />
                    </div>
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                        Análise multidimensional de 8 pilares funcionais
                    </p>
                </div>

                {/* Functional Tables */}
                <div className="grid grid-cols-2 gap-8 mb-8 print:gap-4">
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b-2 pb-1">Flexibilidade & ADM</h4>
                        <Table>
                            <TableBody>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Lunge (Dorsiflex)</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{fmt(normalizedData.flexibility?.lungeLeft)}° / {fmt(normalizedData.flexibility?.lungeRight)}°</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Thomas (Quadril)</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{fmt(normalizedData.flexibility?.thomasLeft)}° / {fmt(normalizedData.flexibility?.thomasRight)}°</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Navicular Drop</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{fmt(normalizedData.anthropometry?.navicularLeft)}mm / {fmt(normalizedData.anthropometry?.navicularRight)}mm</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b-2 pb-1">Perfil de Pisada</h4>
                        <Table>
                            <TableBody>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Tipo de Arco (D/E)</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{normalizedData.anthropometry?.archTypeRight || '-'} / {normalizedData.anthropometry?.archTypeLeft || '-'}</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Jack Test (D/E)</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{normalizedData.flexibility?.jackRight === 1 ? 'N' : 'R'} / {normalizedData.flexibility?.jackLeft === 1 ? 'N' : 'R'}</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableCell className="py-2 text-xs font-medium text-slate-500">Tamanho do Pé</TableCell>
                                    <TableCell className="py-2 text-xs font-black text-right">{normalizedData.postural?.shoeSize || normalizedData.shoeSize || '-'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Recommendations Section */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden mt-auto break-inside-avoid print:bg-blue-50">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Footprints className="w-40 h-40 text-blue-900" /></div>
                    <SectionHeader title="Conduta e Recomendações" icon={User} color="blue" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div>
                            <span className="text-[10px] font-black text-blue-900 uppercase block mb-2 tracking-widest">Sugestão de Calçado</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-black text-xl text-slate-800">{normalizedData.currentShoe?.model || 'Não informado'}</span>
                                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 h-5 text-[10px] font-bold">
                                    ÍNDICE MINIMALISTA: {minimalismIndex}%
                                </Badge>
                            </div>
                            <div className="bg-white/60 p-4 rounded-xl border border-blue-100 mt-4 shadow-sm">
                                <p className="text-slate-800 text-[13px] italic leading-tight">
                                    "{smartRec.description}"
                                </p>
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {smartRec.traits.map(t => (
                                        <Badge key={t} variant="secondary" className="bg-blue-100 text-blue-800 border-none text-[9px] font-bold uppercase">{t}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-black text-blue-900 uppercase block mb-2 tracking-widest">Orientações do Especialista</span>
                            <div className="bg-white/60 p-4 rounded-xl border border-blue-100 h-full shadow-sm min-h-[140px]">
                                <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-tight">
                                    {normalizedData.orientations || normalizedData.plan?.orientations || 'Nenhuma orientação adicional registrada.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ASSINATURA ACOPLADA (NOVO) */}
                <div className="pt-8 mt-10 border-t border-slate-200 flex flex-col items-center justify-center break-inside-avoid w-full">
                    {professional?.digital_signature_url ? (
                        <div className="h-20 w-48 relative mb-2">
                            {/* Use standard img tag since printing is sensitive to Next Image containers */}
                            <img src={professional.digital_signature_url} alt="Assinatura" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                        </div>
                    ) : (
                        <div className="h-16 w-64 border-b-2 border-slate-300 mb-2"></div>
                    )}
                    <h4 className="font-extrabold text-slate-900 uppercase text-sm tracking-tight mb-1 text-center mt-2">
                        {professionalName || professional?.full_name || professional?.name || (data?.professional?.name) || (data?.professional?.full_name) || "Dr. Fisioterapeuta"}
                    </h4>
                    <div className="flex gap-4 text-[9px] text-slate-500 font-bold uppercase justify-center mt-1 w-full">
                        <span>{professional?.council_type || "CREFITO"}: {professional?.council_number || professional?.crefito || "---"}</span>
                        <span>|</span>
                        <span>{professional?.phone || "BIOMECÂNICA CLÍNICA"}</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                    <span>Relatório Gerado por {organizationName || 'Access Fisioterapia'}</span>
                    <span>Pag. 2 de 2</span>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .page-break { page-break-after: always; }
                    .print-color-adjust { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
                .print-color-adjust { -webkit-print-color-adjust: exact; }
            `}</style>
        </div>
    )
}

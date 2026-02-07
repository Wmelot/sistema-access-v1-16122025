'use client';
import React, { useState } from 'react';
import {
    UploadCloud, FileText, AlertTriangle, CheckCircle, Activity,
    Search, ArrowRight, Loader2, ArrowLeft, BrainCircuit,
    Library, PlusCircle, BookmarkCheck, Scale, Users2,
    Layers, FlaskConical, Clock8, Quote, Target, Compass, Copy,
    FileDown, Award, ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { AuditReportPdf } from '@/features/evidence-auditor/components/AuditReportPdf';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);
import { Button } from '@/components/ui/button';
import { getProtocols, addArticleToProtocol } from '../settings/intelligence/actions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { QuantumLoader } from '@/components/ui/quantum-loader';

interface AuditResult {
    original_title: string;
    translated_title: string;
    citation: string;
    verdict_score: number;
    spin_detected: boolean;
    spin_type: string | null;
    study_type: string;
    journal_info: {
        name: string;
        is_predatory: boolean;
        predatory_evidence: string | null;
        impact_factor: string;
    };
    methodological_quality: string;
    bias_risk: 'Low' | 'Moderate' | 'High';
    explanation: string;
    calculated_effect_size: string;
    author_conclusion: string;
    real_conclusion: string;
    pedro_review: {
        total_score: number;
        criteria: {
            item: number;
            description: string;
            result: boolean;
            justification: string;
        }[];
    };
    methodology_summary: {
        participants: string;
        groups: string;
        interventions: string;
        dosage: string;
    };
    clinical_translation: {
        outcome: string;
        result_diff: string;
        statistical_significance: string;
    };
    recommendation: string;
    protocol_suggestion: {
        match_found: boolean;
        protocol_id: string | null;
        suggested_title: string;
        suggested_region: string;
        reason: string;
    };
    structured_data: {
        titulo: string;
        tipo_estudo: string;
        autor: string;
        ano: string;
        nota_qualidade: string;
        resumo_educativo: string;
        pontos_chave: string[];
        analise_antispin: string;
        doi_link: string | null;
    };
}

export default function AuditorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AuditResult | null>(null);
    const [picot, setPicot] = useState({ p: '', i: '', c: '', o: '', t: '' });
    const [protocols, setProtocols] = useState<any[]>([]);
    const [isSavingToKB, setIsSavingToKB] = useState(false);

    // Novo Estado para Assistente de Busca
    const [searchStrategy, setSearchStrategy] = useState<any | null>(null);
    const [isGeneratingSearch, setIsGeneratingSearch] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Carregar protocolos locais ao montar
    React.useEffect(() => {
        const loadProtocols = async () => {
            try {
                const data = await getProtocols();
                setProtocols(data || []);
            } catch (e) {
                console.error("Failed to load protocols", e);
            }
        };
        loadProtocols();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null); // Limpa resultado anterior ao trocar arquivo
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            toast.error("Por favor, selecione um arquivo PDF.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('picot', JSON.stringify(picot));
            formData.append('protocols', JSON.stringify(protocols.map(p => p.title)));

            const res = await fetch(`${window.location.origin}/api/evidence-auditor/audit`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.details || "Erro desconhecido na IA");
            }

            setResult(data);
            toast.success("Auditoria concluída com sucesso!");
        } catch (e: any) {
            console.error("Auditor error:", e);
            toast.error(`Falha na auditoria: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToKnowledgeBase = async () => {
        if (!result) return;
        setIsSavingToKB(true);
        try {
            const isNew = !result.protocol_suggestion.match_found;
            const targetId = result.protocol_suggestion.protocol_id || "";
            const meta = {
                title: result.protocol_suggestion.suggested_title,
                region: result.protocol_suggestion.suggested_region,
                reason: result.protocol_suggestion.reason
            };

            await addArticleToProtocol(targetId, result.structured_data, isNew, meta);

            MySwal.fire({
                icon: 'success',
                title: 'Base de Conhecimento Atualizada!',
                text: isNew
                    ? `O artigo foi arquivado em um novo protocolo: ${meta.title}`
                    : `Este artigo foi vinculado ao protocolo existente.`,
                confirmButtonColor: '#0f172a',
            });
        } catch (error: any) {
            toast.error("Erro ao salvar na base de conhecimento.");
        } finally {
            setIsSavingToKB(false);
        }
    };

    const handleGeneratePDF = async () => {
        if (!result) return;
        setIsGeneratingPDF(true);
        try {
            const blob = await pdf(
                <AuditReportPdf
                    data={result}
                    date={format(new Date(), "dd/MM/yyyy HH:mm")}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Auditoria_${(result.structured_data.titulo || "artigo").replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Relatório gerado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar PDF.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleGenerateSearch = async () => {
        if (!picot.p && !picot.i) {
            toast.error("Preencha ao menos o Paciente e Intervenção.");
            return;
        }
        setIsGeneratingSearch(true);
        setSearchStrategy(null); // Limpa busca anterior para evitar crash
        try {
            const res = await fetch(`${window.location.origin}/api/evidence-auditor/search-strings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ picot }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.details || "Erro desconhecido na IA");
            }

            setSearchStrategy(data);
            toast.success("Bússola de busca gerada!");
        } catch (e: any) {
            console.error("Search Generation Error:", e);
            toast.error(`Falha na Bússola: ${e.message}`);
        } finally {
            setIsGeneratingSearch(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado para a área de transferência!");
    };

    return (
        <div className="py-6 px-2 md:px-6">
            <div className="max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                    {!result ? (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        <BrainCircuit className="text-indigo-600 w-8 h-8" />
                                        Evidence Auditor <span className="text-indigo-600 text-sm bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest font-black">Beta v2.1</span>
                                    </h1>
                                    <p className="text-slate-500 font-medium">Análise de viés e rigor científico em tempo real (Powered by Axiom Intelligence)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1">
                                        <Activity size={14} className="mr-2 text-emerald-500" />
                                        Análise Bilingue
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <label className="group relative block w-full cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-white p-12 transition-all hover:border-indigo-400 hover:bg-indigo-50/30">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600 transition-transform group-hover:scale-110 group-active:scale-95">
                                                <UploadCloud size={40} />
                                            </div>
                                            <h3 className="mb-1 text-xl font-bold text-slate-800">
                                                {file ? file.name : 'Suba o PDF do Artigo Científico'}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Arraste ou clique para selecionar seu arquivo. <br />
                                                <span className="font-bold text-indigo-600">A IA irá revisar o rigor metodológico.</span>
                                            </p>
                                        </div>
                                    </label>

                                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Compass size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-6">
                                                <Badge className="bg-indigo-600 hover:bg-indigo-600 border-none px-3 py-1 uppercase text-[10px] font-black tracking-widest">IA Bússola de Busca</Badge>
                                                <h3 className="text-lg font-bold">Assistente de Estratégia</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm mb-6 max-w-lg">Não tem o artigo? Digite as informações abaixo e eu gero as <b>Search Strings</b> profissionais para Pubmed, PEDro e Cochrane para você.</p>

                                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paciente (P)</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        placeholder="Ex: Lombalgia Crônica"
                                                        value={picot.p}
                                                        onChange={(e) => setPicot({ ...picot, p: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intervenção (I)</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        placeholder="Ex: RPG ou Pilates"
                                                        value={picot.i}
                                                        onChange={(e) => setPicot({ ...picot, i: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desfecho (O)</label>
                                                    <input
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        placeholder="Ex: Escala de Dor (EVA)"
                                                        value={picot.o}
                                                        onChange={(e) => setPicot({ ...picot, o: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                onClick={handleGenerateSearch}
                                                disabled={isGeneratingSearch}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all active:scale-95"
                                            >
                                                {isGeneratingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={18} />}
                                                Gerar Estratégia de Busca IA
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-full">
                                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-4 flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-amber-500" />
                                            O que o Auditor vigia?
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { t: 'SPIN de Resultados', d: 'Detecta conclusões superestimadas que os dados não provam.' },
                                                { t: 'Viés de Conflito', d: 'Analisa se a fonte de financiamento pode ter influenciado os resultados.' },
                                                { t: 'Revistas Predatórias', d: 'Cruza o periódico com listas internacionais de baixa credibilidade.' },
                                                { t: 'P-Hacking', d: 'Identifica uso enganoso de estatística para forçar significância.' },
                                                { t: 'Escala PEDro', d: 'Avaliação item por item da qualidade metodológica de RCTs.' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <div className="shrink-0 w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{item.t}</p>
                                                        <p className="text-[11px] text-slate-500 leading-tight">{item.d}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {searchStrategy && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-indigo-50/50 rounded-3xl border border-indigo-100/50 p-6 sm:p-8"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                                                    <Search size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900">Estratégias de Busca Otimizadas</h3>
                                                    <p className="text-xs text-slate-500">Copiadas e prontas para colar nas bases de dados.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">PubMed / Medline</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(searchStrategy.search_strategies.pubmed)}
                                                        className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-400 group-hover:text-indigo-600"
                                                    >
                                                        <Copy size={12} />
                                                    </Button>
                                                </div>
                                                <code className="text-[10px] sm:text-[11px] font-mono text-indigo-900 leading-relaxed block break-all">
                                                    {searchStrategy.search_strategies.pubmed}
                                                </code>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PEDro</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(searchStrategy.search_strategies.pedro)}
                                                            className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-400 group-hover:text-indigo-600"
                                                        >
                                                            <Copy size={12} />
                                                        </Button>
                                                    </div>
                                                    <code className="text-[10px] sm:text-[11px] font-mono text-indigo-900 leading-relaxed block break-all">
                                                        {searchStrategy.search_strategies.pedro}
                                                    </code>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cochrane</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(searchStrategy.search_strategies.cochrane)}
                                                            className="h-6 w-6 p-0 hover:bg-slate-100 text-slate-400 group-hover:text-indigo-600"
                                                        >
                                                            <Copy size={12} />
                                                        </Button>
                                                    </div>
                                                    <code className="text-[10px] sm:text-[11px] font-mono text-indigo-900 leading-relaxed block break-all">
                                                        {searchStrategy.search_strategies.cochrane}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button
                                onClick={handleAnalyze}
                                disabled={!file || loading}
                                className={`w-full mt-8 h-14 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-lg shadow-lg
                                    ${loading
                                        ? 'bg-slate-300 shadow-none cursor-not-allowed'
                                        : 'bg-slate-900 hover:bg-black hover:scale-[1.01] hover:shadow-xl'}`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Processando...</span>
                                    </div>
                                ) : (
                                    <>
                                        Auditar Artigo
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <AnimatePresence>
                    {loading && !result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
                        >
                            <div className="flex flex-col items-center gap-6">
                                <QuantumLoader size="60" color="#4f46e5" />
                                <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.2em] text-xs">
                                    Auditando Evidência Científica...
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 pb-20"
                        >
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                                    <FileText size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="bg-indigo-50 p-1.5 rounded-lg">
                                            <Quote size={14} className="text-indigo-600" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificação do Estudo Analisado</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">
                                        {result.original_title}
                                    </h2>
                                    <h3 className="text-sm md:text-base font-bold text-indigo-500/80 mb-6 leading-snug">
                                        {result.translated_title}
                                    </h3>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 pt-6 border-t border-slate-50">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <Activity size={10} className="text-indigo-400" />
                                                Citação (Referência Vancouver)
                                            </p>
                                            <p className="text-[11px] font-mono text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                                {result.citation}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-3xl border-l-8 flex flex-col md:flex-row items-start gap-6 shadow-sm bg-white
                                ${result.spin_detected ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                                <div className={`p-4 rounded-2xl shrink-0 ${result.spin_detected ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                    {result.spin_detected ? <AlertTriangle size={40} /> : <CheckCircle size={40} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                                                {result.study_type}
                                            </Badge>
                                            {result.journal_info.is_predatory && (
                                                <Badge variant="destructive" className="bg-rose-500 text-white animate-pulse text-[10px] font-bold uppercase tracking-widest border-none">
                                                    ⚠️ Revista Predatória (Sinalizada)
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h2 className={`text-2xl font-bold ${result.spin_detected ? 'text-red-600' : 'text-emerald-700'}`}>
                                                {result.spin_detected ? 'ALTO RISCO DE VIÉS (SPIN)' : 'EVIDÊNCIA CONFIÁVEL'}
                                            </h2>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${result.spin_detected ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                Score: {result.verdict_score}/5
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-lg mb-4">{result.explanation}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.spin_type && (
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-[10px] font-bold text-red-700 border border-red-100 uppercase tracking-wider">
                                                <AlertTriangle size={14} />
                                                Tipo: {result.spin_type}
                                            </div>
                                        )}
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider
                                            ${result.bias_risk === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                result.bias_risk === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-red-50 text-red-700 border-red-100'}`}>
                                            <Activity size={14} />
                                            Risco de Viés: {result.bias_risk === 'Low' ? 'Baixo' : result.bias_risk === 'Moderate' ? 'Moderado' : 'Alto'}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg text-[10px] font-bold text-indigo-700 border border-indigo-100 uppercase tracking-wider text-center">
                                            <BookmarkCheck size={14} />
                                            Qualidade: {result.methodological_quality}
                                        </div>
                                    </div>

                                    <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all
                                        ${result.journal_info.is_predatory ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl ${result.journal_info.is_predatory ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-500 shadow-sm'}`}>
                                                <Library size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Periódico / Revista</p>
                                                <p className={`text-sm font-bold ${result.journal_info.is_predatory ? 'text-rose-700' : 'text-slate-700'}`}>
                                                    {result.journal_info.name}
                                                </p>
                                                {result.journal_info.is_predatory && (
                                                    <p className="text-[10px] text-rose-500 font-medium mt-0.5">{result.journal_info.predatory_evidence}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fator de Impacto</p>
                                            <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 font-black">
                                                {result.journal_info.impact_factor || 'N/A'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-500">
                                        <Users2 size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Participantes</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight">{result.methodology_summary.participants}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                                        <Layers size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Grupos / Braços</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight">{result.methodology_summary.groups}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                                        <FlaskConical size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Intervenções</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600 leading-tight">{result.methodology_summary.interventions}</p>
                                </div>
                                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-500">
                                        <Clock8 size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Dosagem / Duração</span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600 leading-tight">{result.methodology_summary.dosage}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-500" />
                                    Métricas de Eficácia & Efeito
                                </h3>
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 lg:col-span-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Desfecho Primário</span>
                                        <span className="font-bold text-slate-800 text-base leading-tight">{result.clinical_translation.outcome}</span>
                                    </div>
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 lg:col-span-1">
                                        <span className="text-xs font-bold text-blue-400 uppercase block mb-2">Diferença Média</span>
                                        <span className="font-bold text-blue-700 text-xl">{result.clinical_translation.result_diff}</span>
                                    </div>
                                    <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 lg:col-span-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-purple-400 uppercase">Tamanho do Efeito</span>
                                            <Scale size={14} className="text-purple-400" />
                                        </div>
                                        <span className="font-black text-purple-700 text-xl">{result.calculated_effect_size}</span>
                                        <p className="text-[9px] text-purple-400 font-bold mt-1 uppercase tracking-tighter">(Calculado Cohen's d/SMD)</p>
                                    </div>
                                    <div className={`p-5 rounded-2xl border lg:col-span-1 ${result.clinical_translation.statistical_significance.toLowerCase().includes('não') ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <span className={`text-xs font-bold uppercase block mb-2 ${result.clinical_translation.statistical_significance.toLowerCase().includes('não') ? 'text-red-400' : 'text-emerald-400'}`}>P-Valor</span>
                                        <span className={`font-bold text-lg ${result.clinical_translation.statistical_significance.toLowerCase().includes('não') ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {result.clinical_translation.statistical_significance}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {result.pedro_review && (
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                                                <Award size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">Revisor Escala PEDro</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação de Qualidade de RCTs</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score Total</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-indigo-600">{result.pedro_review.total_score}</span>
                                                <span className="text-xl font-bold text-slate-300">/10</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.pedro_review.criteria.map((c, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border transition-all ${c.result ? 'bg-emerald-50/30 border-emerald-100/50' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm
                                                        ${c.result ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                        {c.result ? '✓' : '×'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className={`text-[11px] font-bold ${c.result ? 'text-emerald-700' : 'text-slate-600'}`}>
                                                                Item {c.item}: {c.description}
                                                            </p>
                                                            {c.item === 1 && <Badge variant="outline" className="text-[8px] bg-slate-100 text-slate-500 border-slate-200 uppercase px-1">Neutro</Badge>}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                                            "{c.justification}"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-6 text-[10px] text-slate-400 text-center italic">
                                        * Nota: O item 1 (Elegibilidade) não é contabilizado no score total conforme diretrizes oficiais.
                                        {(!result.study_type.toLowerCase().includes('randomizado') && !result.study_type.toLowerCase().includes('ensaio clínico')) &&
                                            " Este estudo não é um RCT clássico, a escala foi aplicada para fins de transparência metodológica."}
                                    </p>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Quote size={80} />
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Quote size={14} className="text-slate-300" />
                                        O que os Autores Concluíram
                                    </h4>
                                    <p className="text-slate-600 italic leading-relaxed">
                                        "{result.author_conclusion}"
                                    </p>
                                </div>

                                <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Target size={80} className="text-indigo-600" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Target size={14} className="text-indigo-500" />
                                        Conclusão Real (PBE Auditor)
                                    </h4>
                                    <p className="text-slate-900 font-bold leading-relaxed">
                                        {result.real_conclusion}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <BrainCircuit size={200} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-indigo-600 p-2 rounded-xl text-white">
                                            <Compass size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold uppercase tracking-widest">Recomendação Clínica Axiom</h3>
                                    </div>
                                    <p className="text-2xl md:text-3xl font-black leading-tight mb-8 text-indigo-100">
                                        {result.recommendation}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
                                        <Button
                                            onClick={handleSaveToKnowledgeBase}
                                            disabled={isSavingToKB || result.verdict_score < 3 || result.bias_risk === 'High'}
                                            className={`rounded-xl h-12 px-6 font-bold transition-all flex items-center gap-2
                                                ${(result.verdict_score < 3 || result.bias_risk === 'High')
                                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
                                        >
                                            {isSavingToKB ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : result.protocol_suggestion.match_found ? (
                                                <>
                                                    <PlusCircle className="w-4 h-4" />
                                                    Arquivar no Protocolo
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle className="w-4 h-4" />
                                                    Criar Novo Protocolo
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={handleGeneratePDF}
                                            disabled={isGeneratingPDF}
                                            className="rounded-xl h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold flex items-center gap-2"
                                        >
                                            {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                            Relatório PDF
                                        </Button>

                                        <Button
                                            onClick={() => { setFile(null); setResult(null); setSearchStrategy(null); }}
                                            className="rounded-xl h-12 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold flex items-center gap-2"
                                        >
                                            <Activity className="w-4 h-4" />
                                            Nova Análise
                                        </Button>

                                        <Button
                                            onClick={() => { setFile(null); setResult(null); setSearchStrategy(null); }}
                                            variant="ghost"
                                            className="rounded-xl h-12 px-4 hover:bg-white/5 text-slate-400 hover:text-white"
                                        >
                                            Início do Auditor
                                        </Button>
                                    </div>
                                </div>
                                {(result.verdict_score < 3 || result.bias_risk === 'High') && (
                                    <p className="mt-4 text-[10px] text-rose-400 font-bold uppercase tracking-widest animate-pulse text-center">
                                        ⚠️ ARTIGO COM ALTO RISCO DE VIÉS OU SCORE BAIXO. ARQUIVAMENTO BLOQUEADO PARA EVITAR 'CHUTÔMETROS'.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

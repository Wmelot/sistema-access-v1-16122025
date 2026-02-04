'use client';
import React, { useState } from 'react';
import { UploadCloud, FileText, AlertTriangle, CheckCircle, Activity, Search, ArrowRight, Loader2 } from 'lucide-react';

// Tipagem da Resposta da API
interface AuditResult {
    verdict_score: number;
    spin_detected: boolean;
    spin_type: string | null;
    explanation: string;
    clinical_translation: {
        outcome: string;
        result_diff: string;
        statistical_significance: string;
    };
    recommendation: string;
}

export default function AuditorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AuditResult | null>(null);
    const [picot, setPicot] = useState({ p: '', i: '', c: '', o: '' });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null); // Limpa resultado anterior ao trocar arquivo
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('picot', JSON.stringify(picot));

        try {
            const res = await fetch('/api/evidence-auditor/audit', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Falha na análise');

            const data = await res.json();
            setResult(data);
        } catch (error) {
            alert('Erro ao analisar artigo. Verifique se o PDF é legível.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-12 px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-900 rounded-lg text-white">
                            <Search size={24} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Módulo PBE Alpha</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Auditor de Evidência</h1>
                    <p className="text-slate-500 font-medium">Detector automático de SPIN e análise de integridade científica baseada em evidências.</p>
                </div>

                {/* ÁREA DE UPLOAD E INPUTS */}
                {!result && (
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

                        {/* Drag & Drop Simulado */}
                        <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all relative group
                            ${file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>

                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            <div className="flex flex-col items-center justify-center gap-3">
                                {file ? (
                                    <>
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                                            <FileText size={32} />
                                        </div>
                                        <p className="font-semibold text-slate-700">{file.name}</p>
                                        <p className="text-xs text-blue-500 font-medium">Clique para trocar</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={48} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                        <p className="text-slate-500 font-medium">Clique ou arraste o PDF aqui</p>
                                        <p className="text-xs text-slate-400">Suporta arquivos PDF de ensaios clínicos</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Inputs PICOT (Opcional - Ajuda a IA) */}
                        <div className="mt-8">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">Contexto Clínico (Opcional)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="Paciente (ex: Idosos com Dor Lombar)"
                                    className="p-3.5 bg-slate-50 rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                                    onChange={e => setPicot({ ...picot, p: e.target.value })}
                                />
                                <input
                                    placeholder="Intervenção (ex: Pilates)"
                                    className="p-3.5 bg-slate-50 rounded-xl border-none outline-none text-sm focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                                    onChange={e => setPicot({ ...picot, i: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!file || loading}
                            className={`w-full mt-8 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-lg shadow-lg
                                ${loading
                                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 hover:bg-black hover:scale-[1.01] hover:shadow-xl'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Analisando Evidência...
                                </>
                            ) : (
                                <>
                                    Auditar Artigo
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* RESULTADOS (VEREDITO) */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 pb-20">

                        {/* 1. O Veredito Principal */}
                        <div className={`p-8 rounded-3xl border-l-8 flex flex-col md:flex-row items-start gap-6 shadow-sm bg-white
                            ${result.spin_detected ? 'border-l-red-500' : 'border-l-emerald-500'}`}>

                            <div className={`p-4 rounded-2xl shrink-0 ${result.spin_detected ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                {result.spin_detected ? <AlertTriangle size={40} /> : <CheckCircle size={40} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className={`text-2xl font-bold ${result.spin_detected ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {result.spin_detected ? 'ALTO RISCO DE VIÉS (SPIN)' : 'EVIDÊNCIA CONFIÁVEL'}
                                    </h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${result.spin_detected ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                        Score: {result.verdict_score}/5
                                    </span>
                                </div>

                                <p className="text-slate-600 leading-relaxed text-lg">{result.explanation}</p>

                                {result.spin_type && (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg text-sm font-bold text-red-700 border border-red-100">
                                        <Activity size={16} />
                                        Tipo de Spin: {result.spin_type}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Tradução Clínica (Números Reais) */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Tradução dos Dados Reais
                            </h3>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Desfecho Primário</span>
                                    <span className="font-bold text-slate-800 text-lg leading-tight">{result.clinical_translation.outcome}</span>
                                </div>
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                    <span className="text-xs font-bold text-blue-400 uppercase block mb-2">Diferença Real</span>
                                    <span className="font-bold text-blue-700 text-2xl">{result.clinical_translation.result_diff}</span>
                                </div>
                                <div className={`p-5 rounded-2xl border ${result.clinical_translation.statistical_significance.includes('Não') ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                    <span className={`text-xs font-bold uppercase block mb-2 ${result.clinical_translation.statistical_significance.includes('Não') ? 'text-red-400' : 'text-emerald-400'}`}>Significância (P-Valor)</span>
                                    <span className={`font-bold text-lg ${result.clinical_translation.statistical_significance.includes('Não') ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {result.clinical_translation.statistical_significance}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Recomendação Final */}
                        <div className="bg-slate-900 text-white p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <p className="text-xs text-slate-400 uppercase font-bold mb-3 tracking-widest">Recomendação do Auditor</p>
                            <p className="text-2xl font-medium leading-relaxed mb-8">"{result.recommendation}"</p>

                            <button
                                onClick={() => { setFile(null); setResult(null); }}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-semibold transition-all backdrop-blur-sm border border-white/10"
                            >
                                Analisar outro artigo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

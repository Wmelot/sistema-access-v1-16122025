"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    FileText,
    Activity,
    Home,
    ClipboardList,
    Info,
    CheckCircle2,
    Zap,
    Droplets,
    History,
    Calendar,
    ArrowRight,
    Lock
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PortalData {
    patient: { name: string; birthdate: string; id: string };
    clinic: { name: string };
    permissions: {
        voiding_diary?: {
            enabled: boolean;
            duration_days: number;
            expires_at?: string;
        };
        fill_questionnaires?: string[];
        view_exercises?: boolean;
        view_report?: boolean;
    };
    report?: {
        id: string;
        date: string;
        summary: string;
        type: 'smart' | 'standard';
    } | null;
}

interface DiaryEntry {
    id: string;
    recorded_at: string;
    volume_class: "little" | "medium" | "much";
    had_urgency: boolean;
    had_leakage: boolean;
    changed_pad: boolean;
    liquid_intake?: string;
    liquid_type?: string;
}

type Step =
    | "idle"
    | "volume"
    | "urgency"
    | "leakage"
    | "pad"
    | "liquid"
    | "confirm"
    | "done";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function formatDate(iso: string) {
    if (!iso) return "--/--";
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
    });
}
function getAge(birthDate: string): number {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PatientPortalPage() {
    const params = useParams();
    const token = params?.token as string;

    const [portalData, setPortalData] = useState<PortalData | null>(null);
    const [portalStatus, setPortalStatus] = useState<
        "loading" | "valid" | "invalid" | "expired"
    >("loading");
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [activeTab, setActiveTab] = useState<"home" | "diary" | "exercises" | "report">(
        "home"
    );

    // Wizard state
    const [step, setStep] = useState<Step>("idle");
    const [draft, setDraft] = useState({
        volume_class: "" as "little" | "medium" | "much" | "",
        had_urgency: false,
        had_leakage: false,
        changed_pad: false,
        liquid_intake: "",
        liquid_type: "" as string,
    });
    const [isSaving, setIsSaving] = useState(false);

    const [diaryExpired, setDiaryExpired] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // ── Fetch portal data ────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch(`/api/patient-portal/${token}`)
            .then((r) => r.json())
            .then((data) => {
                if (!data.valid) {
                    setPortalStatus(
                        data.reason === "TOKEN_EXPIRED" ? "expired" : "invalid"
                    );
                    return;
                }
                setPortalData(data);
                setPortalStatus("valid");

                // Auto-select tab logic
                if (data.report) {
                    setActiveTab("report");
                } else if (data.permissions?.voiding_diary?.enabled) {
                    setActiveTab("diary");
                }

                // Check diary expiration
                const exp = data.permissions?.voiding_diary?.expires_at;
                if (exp && new Date(exp) < new Date()) setDiaryExpired(true);
            })
            .catch(() => setPortalStatus("invalid"));
    }, [token]);

    // ── Fetch entries ────────────────────────────────────────────────────────
    const fetchEntries = useCallback(() => {
        if (!token) return;
        fetch(`/api/voiding-diary?token=${token}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setEntries(data.entries || []);
            });
    }, [token]);

    useEffect(() => {
        if (portalStatus === "valid") fetchEntries();
    }, [portalStatus, fetchEntries]);

    // ── Submit entry ─────────────────────────────────────────────────────────
    async function submitEntry() {
        setIsSaving(true);
        try {
            const res = await fetch("/api/voiding-diary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, entry: draft }),
            });
            const data = await res.json();
            if (data.diary_closed) setDiaryExpired(true);
            if (data.success) {
                setStep("done");
                setShowCelebration(true);
                setTimeout(() => {
                    setShowCelebration(false);
                    setStep("idle");
                    setDraft({
                        volume_class: "",
                        had_urgency: false,
                        had_leakage: false,
                        changed_pad: false,
                        liquid_intake: "",
                        liquid_type: "",
                    });
                    fetchEntries();
                }, 2500);
            }
        } finally {
            setIsSaving(false);
        }
    }

    // ── Derived ──────────────────────────────────────────────────────────────
    const todayEntries = entries.filter((e) => {
        const today = new Date().toDateString();
        return new Date(e.recorded_at).toDateString() === today;
    });

    const leakageCount = entries.filter((e) => e.had_leakage).length;
    const urgencyCount = entries.filter((e) => e.had_urgency).length;
    const totalToday = todayEntries.length;

    // ────────────────────────────────────────────────────────────────────────
    // LOADING
    if (portalStatus === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                        Carregando...
                    </p>
                </div>
            </div>
        );
    }

    // INVALID / EXPIRED
    if (portalStatus === "invalid" || portalStatus === "expired") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-6">
                <div className="text-center max-w-sm space-y-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-4xl">
                        🔐
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">
                        {portalStatus === "expired"
                            ? "Link Expirado"
                            : "Link Inválido"}
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {portalStatus === "expired"
                            ? "O período de acesso a este diário encerrou. Peça um novo link ao seu fisioterapeuta."
                            : "Este link não é válido. Verifique se copiou o endereço corretamente."}
                    </p>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            Precisa de ajuda?
                        </p>
                        <p className="text-sm text-slate-600 font-medium mt-1">
                            Entre em contato com sua clínica.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const patient = portalData!.patient;
    const clinic = portalData!.clinic;
    const permissions = portalData!.permissions;
    const diaryEnabled = permissions?.voiding_diary?.enabled;

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN PORTAL
    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white font-sans overflow-x-hidden">
            {/* CELEBRATION OVERLAY */}
            {showCelebration && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-pink-600/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-50 duration-500">
                        <div className="text-7xl">✅</div>
                        <h2 className="text-3xl font-black text-white">Registrado!</h2>
                        <p className="text-pink-100 font-bold text-lg">Obrigada por cuidar da sua saúde.</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            {step === "idle" && (
                <header className="px-4 pt-8 pb-6 text-center space-y-3 sticky top-0 bg-pink-50/80 backdrop-blur-md z-40">
                    <div className="inline-flex items-center gap-2 bg-white border border-pink-100 rounded-full px-5 py-2 shadow-sm focus:outline-none">
                        <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-pink-700 uppercase tracking-widest">
                            {clinic.name}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 leading-tight">
                            Olá, {patient.name.split(" ")[0]}! 👋
                        </h1>
                    </div>
                </header>
            )}

            {/* MAIN CONTENT SWITCH */}
            {step === "idle" && (
                <main className="px-4 pb-40 space-y-6 max-w-lg mx-auto">
                    {/* TAB: HOME */}
                    {activeTab === "home" && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-pink-100/50 border border-pink-50/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Home className="h-24 w-24 text-pink-600" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h2 className="text-xl font-black text-slate-800 leading-tight">Bem-vinda ao seu Portal de Saúde!</h2>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">Acompanhe sua evolução, acesse relatórios e prescrições de forma segura.</p>
                                    <div className="flex gap-2">
                                        {portalData.report && <button onClick={() => setActiveTab("report")} className="bg-pink-600 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-200">Ver Relatório</button>}
                                        <button onClick={() => setActiveTab("exercises")} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest">Exercícios</button>
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-4">
                                {diaryEnabled && !diaryExpired && (
                                    <button id="home-diary-card" onClick={() => setActiveTab("diary")} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left space-y-3 active:scale-95 transition-all">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><ClipboardList className="h-5 w-5" /></div>
                                        <div><p className="font-black text-slate-800 text-sm italic">Diário</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Preencher Hoje</p></div>
                                    </button>
                                )}
                                <button id="home-exercises-card" onClick={() => setActiveTab("exercises")} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left space-y-3 active:scale-95 transition-all"><div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Zap className="h-5 w-5" /></div><div><p className="font-black text-slate-800 text-sm italic">Treino</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ver Prescrição</p></div></button>
                            </div>

                            <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                                <Activity className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
                                <div className="relative z-10 space-y-4">
                                    <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><Info className="h-3 w-3" /><span className="text-[8px] font-black uppercase tracking-[0.2em]">Dica de Saúde</span></div>
                                    <p className="text-lg font-bold leading-tight">Mantenha a hidratação constante ao longo do dia para um melhor controle vesical.</p>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* TAB: REPORT */}
                    {activeTab === "report" && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-50 min-h-[400px]">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center"><FileText className="h-6 w-6" /></div>
                                    <div><h2 className="text-lg font-black text-slate-800 italic">Seu Relatório Evolutivo</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(portalData.report?.date || new Date().toISOString())}</p></div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative">
                                        <div className="absolute -top-3 left-6 bg-white border border-slate-100 px-3 py-1 rounded-full"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resumo Clínico</span></div>
                                        <div className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pt-4">
                                            {portalData.report?.summary || "Sua fisioterapeuta preparou um resumo personalizado para você acompanhar sua evolução."}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                                            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Tipo</p>
                                            <p className="font-bold text-blue-900">{portalData.report?.type === 'smart' ? 'IA Avançado' : 'Padrão Clínico'}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                                            <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Status</p>
                                            <p className="font-bold text-emerald-900">Validado</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-3">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Próximos Passos</h3>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed italic">Continue realizando seus exercícios diariamente para potencializar os resultados observados neste relatório.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* TAB: DIARY */}
                    {activeTab === "diary" && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                            {diaryExpired ? (
                                <section className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 text-center space-y-4">
                                    <div className="text-5xl">⏰</div><h2 className="text-xl font-black text-amber-800 uppercase tracking-tight">Período Encerrado</h2><p className="text-amber-600 text-sm font-medium leading-relaxed">Este diário já foi finalizado. Peça um novo link se precisar continuar o registro.</p>
                                </section>
                            ) : (
                                <section className="space-y-6">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100"><p className="text-2xl font-black text-pink-600">{totalToday}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Idas</p></div>
                                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100"><p className="text-2xl font-black text-amber-500">{urgencyCount}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Urgência</p></div>
                                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100"><p className="text-2xl font-black text-blue-500">{leakageCount}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Perdas</p></div>
                                    </div>

                                    <button id="add-entry-btn" onClick={() => setStep("volume")} className="w-full bg-pink-600 text-white rounded-[2.5rem] py-10 flex flex-col items-center gap-3 shadow-2xl shadow-pink-200 active:scale-95 transition-all">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-1"><Droplets className="h-8 w-8 text-white" /></div>
                                        <span className="text-xl font-black uppercase tracking-wide">Registrar Xixi</span>
                                        <span className="text-pink-200 text-[10px] font-black uppercase tracking-widest opacity-80">Toque aqui para começar</span>
                                    </button>

                                    {entries.length > 0 && (
                                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2"><History className="h-4 w-4 text-slate-400" /><h2 className="font-black text-slate-600 text-[10px] uppercase tracking-widest">Histórico de Hoje</h2></div>
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {todayEntries.map((e) => (
                                                    <div key={e.id} className="px-6 py-5 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">{formatTime(e.recorded_at)}</div>
                                                            <div className="flex gap-1.5">{e.had_urgency && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">⚡ Urgência</span>}{e.had_leakage && <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">💧 Perda</span>}</div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{{ little: "Pouco", medium: "Médio", much: "Muito" }[e.volume_class]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}

                    {/* TAB: EXERCISES */}
                    {activeTab === "exercises" && (
                        <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-amber-100/30 border border-amber-50">
                                <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Zap className="h-6 w-6" /></div><div><h2 className="text-lg font-black text-slate-800 italic">Seu Treino</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Prescrição VIP</p></div></div>
                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] py-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm"><Activity className="h-10 w-10 text-slate-300" /></div>
                                    <div className="space-y-2 px-6">
                                        <p className="font-black text-slate-700 uppercase tracking-tight text-lg">Em Preparação</p>
                                        <p className="text-sm text-slate-400 font-medium">Sua fisioterapeuta está preparando sua lista de exercícios personalizada com vídeos e fotos.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            )}

            {/* WIZARD OVERLAY */}
            {step !== "idle" && step !== "done" && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto pt-safe pb-safe">
                    <div className="h-2 bg-slate-100"><div className="h-full bg-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" style={{ width: `${(["volume", "urgency", "leakage", "pad", "liquid", "confirm"].indexOf(step) + 1) * (100 / 6)}%` }} /></div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-10">
                        {step === "volume" && (<><p className="text-6xl animate-bounce">🚿</p><h2 className="text-3xl font-black text-slate-800">Quanto xixi você fez?</h2><div className="w-full max-w-xs space-y-4">{[{ v: "little", emoji: "💧", label: "Pouquinho", desc: "Apenas gotas ou bem pouco" }, { v: "medium", emoji: "💧💧", label: "Volume Médio", desc: "Uma quantidade normal" }, { v: "much", emoji: "💧💧💧", label: "Bastante", desc: "Esvaziou bem a bexiga" }].map(({ v, emoji, label, desc }) => (<button key={v} onClick={() => { setDraft((d) => ({ ...d, volume_class: v as any })); setStep("urgency"); }} className="w-full flex items-center gap-5 p-6 bg-slate-50 hover:bg-pink-50 rounded-3xl text-left border-2 border-transparent hover:border-pink-200 transition-all active:scale-95 group"><span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span><div><p className="font-black text-slate-800 text-xl italic">{label}</p><p className="text-xs text-slate-400 font-medium">{desc}</p></div></button>))}</div></>)}
                        {step === "urgency" && (<><p className="text-6xl animate-pulse">⚡</p><h2 className="text-3xl font-black text-slate-800">Veio com urgência?</h2><div className="w-full max-w-xs space-y-4">{[{ v: false, emoji: "😊", label: "Não", desc: "Foi com calma" }, { v: true, emoji: "😰", label: "Sim!", desc: "Foi correndo / forte desejo" }].map(({ v, emoji, label, desc }) => (<button key={String(v)} onClick={() => { setDraft((d) => ({ ...d, had_urgency: v })); setStep("leakage"); }} className="w-full flex items-center gap-5 p-6 bg-slate-50 hover:bg-pink-50 rounded-3xl text-left border-2 border-transparent hover:border-pink-200 transition-all active:scale-95 group"><span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span><div><p className="font-black text-slate-800 text-xl italic">{label}</p><p className="text-xs text-slate-400 font-medium">{desc}</p></div></button>))}</div></>)}
                        {step === "leakage" && (<><p className="text-6xl text-blue-500">💧</p><h2 className="text-3xl font-black text-slate-800">Perdeu urina?</h2><div className="w-full max-w-xs space-y-4">{[{ v: false, emoji: "✅", label: "Não", desc: "Tudo sob controle" }, { v: true, emoji: "💧", label: "Sim", desc: "Escapou um pouco" }].map(({ v, emoji, label, desc }) => (<button key={String(v)} onClick={() => { setDraft((d) => ({ ...d, had_leakage: v })); setStep("pad"); }} className="w-full flex items-center gap-5 p-6 bg-slate-50 hover:bg-pink-50 rounded-3xl text-left border-2 border-transparent hover:border-pink-200 transition-all active:scale-95 group"><span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span><div><p className="font-black text-slate-800 text-xl italic">{label}</p><p className="text-xs text-slate-400 font-medium">{desc}</p></div></button>))}</div></>)}
                        {step === "pad" && (<><p className="text-6xl">🩹</p><h2 className="text-3xl font-black text-slate-800">Trocou o absorvente?</h2><div className="w-full max-w-xs space-y-4">{[{ v: true, emoji: "🔄", label: "Sim, troquei", desc: "Colocou um novo" }, { v: false, emoji: "👍", label: "Não", desc: "Continuou com o mesmo" }].map(({ v, emoji, label, desc }) => (<button key={String(v)} onClick={() => { setDraft((d) => ({ ...d, changed_pad: v })); setStep("liquid"); }} className="w-full flex items-center gap-5 p-6 bg-slate-50 hover:bg-pink-50 rounded-3xl text-left border-2 border-transparent hover:border-pink-200 transition-all active:scale-95 group"><span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span><div><p className="font-black text-slate-800 text-xl italic">{label}</p><p className="text-xs text-slate-400 font-medium">{desc}</p></div></button>))}</div></>)}
                        {step === "liquid" && (<><p className="text-6xl">☕</p><h2 className="text-3xl font-black text-slate-800">O que você bebeu?</h2><div className="w-full max-w-xs"><div className="grid grid-cols-2 gap-3 mb-6">{[{ v: "water", emoji: "💧", label: "Água" }, { v: "coffee", emoji: "☕", label: "Café" }, { v: "juice", emoji: "🧃", label: "Suco" }, { v: "other", emoji: "🥤", label: "Outro" }].map(({ v, emoji, label }) => (<button key={v} onClick={() => setDraft((d) => ({ ...d, liquid_type: d.liquid_type === v ? "" : v }))} className={`p-6 rounded-[2rem] flex flex-col items-center gap-3 border-2 shadow-sm transition-all active:scale-95 ${draft.liquid_type === v ? "bg-pink-600 border-pink-600 text-white scale-105" : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100"}`}><span className="text-3xl">{emoji}</span><span className="font-black text-xs uppercase tracking-widest">{label}</span></button>))}</div><button onClick={() => setStep("confirm")} className="w-full py-6 bg-pink-600 text-white font-black rounded-3xl text-xl shadow-xl shadow-pink-200 active:scale-95 transition-all">Continuar</button></div></>)}
                        {step === "confirm" && (<><p className="text-6xl animate-pulse">📋</p><h2 className="text-3xl font-black text-slate-800 italic">Conferir Dados</h2><div className="w-full max-w-xs bg-slate-50 rounded-[2.5rem] p-8 text-left space-y-4 border border-slate-100 shadow-inner"><div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Volume</span><span className="font-black text-slate-800 text-lg">{{ little: "Pouquinho", medium: "Normal", much: "Bastante" }[draft.volume_class || "little"]}</span></div><div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Urgência</span><span className={`font-black text-lg ${draft.had_urgency ? "text-amber-600" : "text-emerald-600"}`}>{draft.had_urgency ? "Sim ⚡" : "Não ✅"}</span></div><div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Perda</span><span className={`font-black text-lg ${draft.had_leakage ? "text-blue-600" : "text-emerald-600"}`}>{draft.had_leakage ? "Sim 💧" : "Não ✅"}</span></div></div><div className="w-full max-w-xs space-y-4"><button id="confirm-diary-entry" onClick={submitEntry} disabled={isSaving} className="w-full py-6 bg-emerald-600 text-white font-black text-2xl rounded-3xl shadow-xl shadow-emerald-200 active:scale-95 transition-all disabled:opacity-60">{isSaving ? "Enviando..." : "✅ Confirmar TUDO"}</button><button onClick={() => setStep("idle")} className="w-full py-4 text-slate-400 font-bold text-sm uppercase tracking-widest">Voltar e Ajustar</button></div></>)}
                    </div>
                </div>
            )}

            {/* BOTTOM NAVIGATION */}
            {step === "idle" && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 pb-10 z-[50] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                    <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === "home" ? "text-pink-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><Home className="h-6 w-6" /><span className="text-[9px] font-black uppercase tracking-widest">Início</span></button>
                    {portalData?.report && <button id="report-tab-btn" onClick={() => setActiveTab("report")} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === "report" ? "text-pink-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><FileText className="h-6 w-6" /><span className="text-[9px] font-black uppercase tracking-widest">Relatório</span></button>}
                    {diaryEnabled && <button id="diary-tab-btn" onClick={() => setActiveTab("diary")} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === "diary" ? "text-pink-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><Activity className="h-6 w-6" /><span className="text-[9px] font-black uppercase tracking-widest">Diário</span></button>}
                    <button onClick={() => setActiveTab("exercises")} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === "exercises" ? "text-pink-600 scale-110" : "text-slate-300 hover:text-slate-400"}`}><Zap className="h-6 w-6" /><span className="text-[9px] font-black uppercase tracking-widest">Treino</span></button>
                </nav>
            )}
        </div>
    );
}

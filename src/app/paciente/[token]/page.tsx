"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

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
    return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function formatDate(iso: string) {
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
    const [activeTab, setActiveTab] = useState<"diary" | "exercises" | "info">(
        "diary"
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
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white font-sans">
            {/* CELEBRATION OVERLAY */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-600/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-50 duration-500">
                        <div className="text-7xl">✅</div>
                        <h2 className="text-3xl font-black text-white">
                            Registrado!
                        </h2>
                        <p className="text-pink-100 font-bold text-lg">
                            Obrigada por cuidar da sua saúde.
                        </p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <header className="px-4 pt-8 pb-6 text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-white border border-pink-100 rounded-full px-5 py-2 shadow-sm">
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black text-pink-700 uppercase tracking-widest">
                        {clinic.name}
                    </span>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 leading-tight">
                        Olá, {patient.name.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                        {getAge(patient.birthdate)} anos •{" "}
                        {new Date().toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                        })}
                    </p>
                </div>
            </header>

            {/* SUMMARY CARDS — Today */}
            {diaryEnabled && !diaryExpired && (
                <section className="px-4 mb-6">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center">
                            <p className="text-3xl font-black text-pink-600">
                                {totalToday}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                Hoje
                            </p>
                        </div>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center">
                            <p className="text-3xl font-black text-amber-500">
                                {urgencyCount}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                Urgências
                            </p>
                        </div>
                        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 text-center">
                            <p className="text-3xl font-black text-blue-500">
                                {leakageCount}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                Perdas
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {/* DIARY EXPIRED BANNER */}
            {diaryExpired && (
                <section className="px-4 mb-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-2">
                        <p className="text-2xl">⏰</p>
                        <p className="font-black text-amber-800 text-sm uppercase tracking-wide">
                            Período do Diário Encerrado
                        </p>
                        <p className="text-amber-600 text-sm font-medium leading-relaxed">
                            O fisioterapeuta já recebeu seus dados. Aguarde as
                            orientações na próxima consulta.
                        </p>
                    </div>
                </section>
            )}

            {/* MAIN CONTENT */}
            {diaryEnabled && !diaryExpired && (
                <main className="px-4 space-y-5 pb-32">
                    {/* BIG RECORD BUTTON */}
                    {step === "idle" && (
                        <section className="space-y-4">
                            <button
                                onClick={() => setStep("volume")}
                                className="w-full bg-pink-600 hover:bg-pink-700 active:scale-95 text-white rounded-[2.5rem] py-8 flex flex-col items-center justify-center gap-3 shadow-2xl shadow-pink-200 transition-all duration-200"
                            >
                                <span className="text-5xl">🚿</span>
                                <span className="text-xl font-black uppercase tracking-wide">
                                    Fui ao banheiro
                                </span>
                                <span className="text-pink-200 text-sm font-bold">
                                    Toque aqui para registrar
                                </span>
                            </button>

                            {/* Recent entries */}
                            {todayEntries.length > 0 && (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-50">
                                        <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">
                                            Registros de hoje
                                        </h2>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {todayEntries.slice(0, 8).map((e) => (
                                            <div
                                                key={e.id}
                                                className="px-5 py-3.5 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">
                                                        {e.volume_class ===
                                                            "little"
                                                            ? "🔵"
                                                            : e.volume_class ===
                                                                "medium"
                                                                ? "🔵🔵"
                                                                : "🔵🔵🔵"}
                                                    </span>
                                                    <div>
                                                        <p className="font-black text-slate-700 text-sm">
                                                            {formatTime(
                                                                e.recorded_at
                                                            )}
                                                        </p>
                                                        <div className="flex gap-2 mt-0.5">
                                                            {e.had_urgency && (
                                                                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                                                                    urgência
                                                                </span>
                                                            )}
                                                            {e.had_leakage && (
                                                                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                                                    perda
                                                                </span>
                                                            )}
                                                            {e.changed_pad && (
                                                                <span className="text-[9px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full uppercase">
                                                                    absorvente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-300 font-bold">
                                                    {
                                                        {
                                                            little: "Pouco",
                                                            medium: "Médio",
                                                            much: "Muito",
                                                        }[e.volume_class]
                                                    }
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All entries by day */}
                            {entries.length > todayEntries.length && (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-50">
                                        <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">
                                            Dias anteriores
                                        </h2>
                                    </div>
                                    {(() => {
                                        const byDay = entries.reduce(
                                            (acc: Record<string, DiaryEntry[]>, e) => {
                                                const d = formatDate(e.recorded_at);
                                                if (!acc[d]) acc[d] = [];
                                                if (
                                                    new Date(
                                                        e.recorded_at
                                                    ).toDateString() !==
                                                    new Date().toDateString()
                                                ) {
                                                    acc[d].push(e);
                                                }
                                                return acc;
                                            },
                                            {}
                                        );
                                        return Object.entries(byDay)
                                            .slice(0, 7)
                                            .map(([day, dayEntries]) => (
                                                <div
                                                    key={day}
                                                    className="px-5 py-3.5 flex items-center justify-between border-b border-slate-50"
                                                >
                                                    <span className="font-black text-slate-600 text-sm">
                                                        {day}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-slate-400 font-medium">
                                                            {dayEntries.length}x ao banheiro
                                                        </span>
                                                        {dayEntries.some(
                                                            (e) => e.had_leakage
                                                        ) && (
                                                                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                                                    perdas
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            ));
                                    })()}
                                </div>
                            )}

                            {entries.length === 0 && (
                                <div className="text-center py-8 space-y-3 text-slate-400">
                                    <p className="text-4xl">📋</p>
                                    <p className="font-bold uppercase tracking-widest text-xs">
                                        Nenhum registro ainda
                                    </p>
                                    <p className="text-sm font-medium">
                                        Toque no botão rosa para começar!
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── WIZARD STEPS ─────────────────────────────────────────────────── */}
                    {step !== "idle" && step !== "done" && (
                        <div className="fixed inset-0 z-40 bg-white flex flex-col">
                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-100">
                                <div
                                    className="h-full bg-pink-500 transition-all duration-500"
                                    style={{
                                        width: `${(["volume", "urgency", "leakage", "pad", "liquid", "confirm"].indexOf(step) + 1) * (100 / 6)
                                            }%`,
                                    }}
                                />
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                                {/* STEP: VOLUME */}
                                {step === "volume" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">🚿</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Quanto xixi você fez?
                                            </h2>
                                            <p className="text-slate-400 font-medium">
                                                Escolha a opção que mais se parece
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs space-y-3">
                                            {[
                                                { v: "little", emoji: "🔵", label: "Pouquinho", sub: "Menos que o normal" },
                                                { v: "medium", emoji: "🔵🔵", label: "Normal", sub: "Volume habitual" },
                                                { v: "much", emoji: "🔵🔵🔵", label: "Bastante", sub: "Mais que o normal" },
                                            ].map(({ v, emoji, label, sub }) => (
                                                <button
                                                    key={v}
                                                    onClick={() => {
                                                        setDraft((d) => ({ ...d, volume_class: v as any }));
                                                        setStep("urgency");
                                                    }}
                                                    className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 border-2 border-transparent rounded-2xl transition-all active:scale-95 text-left"
                                                >
                                                    <span className="text-2xl">{emoji}</span>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-lg">{label}</p>
                                                        <p className="text-slate-400 text-sm font-medium">{sub}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* STEP: URGENCY */}
                                {step === "urgency" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">⚡</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Veio com urgência?
                                            </h2>
                                            <p className="text-slate-400 font-medium leading-relaxed">
                                                Aquela vontade forte e repentina que precisou correr
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs space-y-3">
                                            {[
                                                { v: false, emoji: "😊", label: "Não, veio normal" },
                                                { v: true, emoji: "😰", label: "Sim, veio de repente" },
                                            ].map(({ v, emoji, label }) => (
                                                <button
                                                    key={String(v)}
                                                    onClick={() => {
                                                        setDraft((d) => ({ ...d, had_urgency: v }));
                                                        setStep("leakage");
                                                    }}
                                                    className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 border-2 border-transparent rounded-2xl transition-all active:scale-95 text-left"
                                                >
                                                    <span className="text-3xl">{emoji}</span>
                                                    <p className="font-black text-slate-800 text-lg">{label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* STEP: LEAKAGE */}
                                {step === "leakage" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">💧</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Perdeu urina antes de chegar?
                                            </h2>
                                            <p className="text-slate-400 font-medium leading-relaxed">
                                                Qualquer gotinha conta. Seja honesta, é para te ajudar!
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs space-y-3">
                                            {[
                                                { v: false, emoji: "✅", label: "Não, consegui segurar" },
                                                { v: true, emoji: "💧", label: "Sim, perdi uma pouco" },
                                            ].map(({ v, emoji, label }) => (
                                                <button
                                                    key={String(v)}
                                                    onClick={() => {
                                                        setDraft((d) => ({ ...d, had_leakage: v }));
                                                        setStep("pad");
                                                    }}
                                                    className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 border-2 border-transparent rounded-2xl transition-all active:scale-95 text-left"
                                                >
                                                    <span className="text-3xl">{emoji}</span>
                                                    <p className="font-black text-slate-800 text-lg">{label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* STEP: PAD */}
                                {step === "pad" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">🩹</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Trocou absorvente?
                                            </h2>
                                            <p className="text-slate-400 font-medium">
                                                Ou não usa absorvente? Sem problema!
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs space-y-3">
                                            {[
                                                { v: true, emoji: "🔄", label: "Sim, troquei" },
                                                { v: false, emoji: "👍", label: "Não precisei / Não uso" },
                                            ].map(({ v, emoji, label }) => (
                                                <button
                                                    key={String(v)}
                                                    onClick={() => {
                                                        setDraft((d) => ({ ...d, changed_pad: v }));
                                                        setStep("liquid");
                                                    }}
                                                    className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-pink-50 hover:border-pink-200 border-2 border-transparent rounded-2xl transition-all active:scale-95 text-left"
                                                >
                                                    <span className="text-3xl">{emoji}</span>
                                                    <p className="font-black text-slate-800 text-lg">{label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* STEP: LIQUID */}
                                {step === "liquid" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">☕</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Bebeu algo recentemente?
                                            </h2>
                                            <p className="text-slate-400 font-medium">
                                                Opcional — ajuda o fisioterapeuta a entender melhor
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {[
                                                    { v: "water", emoji: "💧", label: "Água" },
                                                    { v: "coffee", emoji: "☕", label: "Café" },
                                                    { v: "juice", emoji: "🧃", label: "Suco" },
                                                    { v: "other", emoji: "🥤", label: "Outro" },
                                                ].map(({ v, emoji, label }) => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setDraft((d) => ({ ...d, liquid_type: d.liquid_type === v ? "" : v }))}
                                                        className={`p-4 rounded-2xl transition-all active:scale-95 flex flex-col items-center gap-2 border-2 ${draft.liquid_type === v ? "bg-pink-600 border-pink-600 text-white" : "bg-slate-50 border-transparent text-slate-700"
                                                            }`}
                                                    >
                                                        <span className="text-2xl">{emoji}</span>
                                                        <span className="font-black text-sm">{label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setStep("confirm")}
                                                className="w-full py-4 bg-pink-600 text-white font-black rounded-2xl text-lg active:scale-95 transition-all"
                                            >
                                                {draft.liquid_type ? "Continuar" : "Pular esta etapa"}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* STEP: CONFIRM */}
                                {step === "confirm" && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-5xl">📋</p>
                                            <h2 className="text-2xl font-black text-slate-800">
                                                Confirmar registro
                                            </h2>
                                            <p className="text-slate-400 font-medium">
                                                {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                        <div className="w-full max-w-xs bg-slate-50 rounded-3xl p-6 space-y-3 text-left">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-medium">Volume</span>
                                                <span className="font-black text-slate-800">
                                                    {{ little: "Pouquinho", medium: "Normal", much: "Bastante" }[draft.volume_class || "little"]}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-medium">Urgência</span>
                                                <span className={`font-black ${draft.had_urgency ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {draft.had_urgency ? "Sim ⚡" : "Não ✅"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-medium">Perda</span>
                                                <span className={`font-black ${draft.had_leakage ? "text-blue-600" : "text-emerald-600"}`}>
                                                    {draft.had_leakage ? "Sim 💧" : "Não ✅"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-medium">Absorvente</span>
                                                <span className="font-black text-slate-800">
                                                    {draft.changed_pad ? "Trocou 🔄" : "Não precisou"}
                                                </span>
                                            </div>
                                            {draft.liquid_type && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500 font-medium">Líquido</span>
                                                    <span className="font-black text-slate-800 capitalize">
                                                        {draft.liquid_type}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-full max-w-xs space-y-3">
                                            <button
                                                onClick={submitEntry}
                                                disabled={isSaving}
                                                className="w-full py-5 bg-pink-600 text-white font-black text-xl rounded-2xl active:scale-95 transition-all disabled:opacity-60 shadow-xl shadow-pink-200"
                                            >
                                                {isSaving ? "Salvando..." : "✅ Confirmar"}
                                            </button>
                                            <button
                                                onClick={() => setStep("idle")}
                                                className="w-full py-3 text-slate-400 font-bold text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Cancel button */}
                            {step !== "confirm" && (
                                <div className="p-6 text-center">
                                    <button
                                        onClick={() => {
                                            setStep("idle");
                                            setDraft({ volume_class: "", had_urgency: false, had_leakage: false, changed_pad: false, liquid_intake: "", liquid_type: "" });
                                        }}
                                        className="text-slate-400 font-bold text-sm py-3 px-8"
                                    >
                                        ← Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            )}

            {/* INFO SECTION — Tips */}
            <section className="px-4 pb-8 space-y-4">
                <div className="bg-pink-50 border border-pink-100 rounded-3xl p-6 space-y-3">
                    <p className="font-black text-pink-800 text-xs uppercase tracking-widest flex items-center gap-2">
                        💡 Dica do Fisioterapeuta
                    </p>
                    <p className="text-pink-700 font-medium text-sm leading-relaxed">
                        Registre cada vez que for ao banheiro, mesmo durante a noite.
                        Esses dados são muito importantes para o seu tratamento!
                    </p>
                </div>

                <div className="text-center py-4">
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
                        Powered by Axiom Health 💙
                    </p>
                </div>
            </section>
        </div>
    );
}

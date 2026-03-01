"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, CheckCircle2, Trophy, Clock, Plus, Trash2, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";

const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };

interface PhysicalSportsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

export function PhysicalSportsAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalSportsAccordionProps) {
    const { control, register, watch, setValue } = useFormContext();
    const isFilled = isSectionFilled('sports');

    const weight = Number(watch('antro.weight')) || 70;
    const sportsList = watch('sports.activities') || [];

    const { fields, append, remove } = useFieldArray({
        control,
        name: "sports.activities"
    });

    const calData = React.useMemo(() => {
        let totalWeeklyKcal = 0;
        let totalWeeklyMinutes = 0;

        sportsList.forEach((s: any) => {
            const metValue = KCAL_TABLE[s?.type] || 350;
            const freq = Number(s?.freq) || 0;
            const duration = Number(s?.duration) || 0;
            const weeklyMinutes = freq * duration;

            // MET conversion for weight
            const kcalPerHour = (metValue / 70) * weight;
            const kcalWeekly = (kcalPerHour / 60) * weeklyMinutes;

            totalWeeklyKcal += kcalWeekly;
            totalWeeklyMinutes += weeklyMinutes;
        });

        let level = 'Sedentário';
        let color = 'bg-slate-500';
        let badgeColor = 'bg-rose-100 text-rose-700';

        if (totalWeeklyMinutes >= 300) {
            level = 'Muito Ativo';
            color = 'bg-emerald-600';
            badgeColor = 'bg-emerald-100 text-emerald-700';
        } else if (totalWeeklyMinutes >= 150) {
            level = 'Ativo';
            color = 'bg-emerald-500';
            badgeColor = 'bg-emerald-100 text-emerald-700';
        } else if (totalWeeklyMinutes >= 75) {
            level = 'Moderadamente Ativo';
            color = 'bg-amber-500';
            badgeColor = 'bg-amber-100 text-amber-700';
        } else if (totalWeeklyMinutes > 0) {
            level = 'Insuficientemente Ativo';
            color = 'bg-orange-500';
            badgeColor = 'bg-orange-100 text-orange-700';
        }

        return {
            totalWeeklyKcal: Math.round(totalWeeklyKcal),
            totalWeeklyMinutes,
            level,
            color,
            badgeColor
        };
    }, [sportsList, weight]);

    // Initial item if empty
    React.useEffect(() => {
        if (fields.length === 0) {
            append({ type: "", freq: "", duration: "" });
        }
    }, [fields, append]);

    return (
        <AccordionItem value="sports" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'sports' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'sports' ? "bg-emerald-600 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-emerald-600")}>
                        <Bike className="h-6 w-6 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'sports' ? "text-slate-900" : "text-slate-500")}>Rotina Desportiva & Atividade</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Modalidades, Frequência e Nível (IPAQ)</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8 space-y-8">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Routine Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                                <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Modalidades Ativas</h4>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ type: "", freq: "", duration: "" })}
                                className="h-8 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px] hover:bg-emerald-100"
                            >
                                <Plus className="h-3 w-3 mr-1" /> ADICIONAR
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative group/card bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:bg-white hover:border-emerald-200 hover:shadow-md">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                        <div className="md:col-span-6 space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Atividade / Esporte</Label>
                                            <Controller
                                                name={`sports.activities.${index}.type`}
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold shadow-sm">
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl max-h-72">
                                                            {Object.keys(KCAL_TABLE).sort().map(sport => (
                                                                <SelectItem key={sport} value={sport} className="font-medium">{sport}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Freq. Semanal</Label>
                                            <Input
                                                type="number"
                                                {...register(`sports.activities.${index}.freq`)}
                                                placeholder="x/sem"
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center"
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Duração (Min)</Label>
                                            <Input
                                                type="number"
                                                {...register(`sports.activities.${index}.duration`)}
                                                placeholder="min"
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold text-center"
                                            />
                                        </div>
                                    </div>
                                    {fields.length > 1 && (
                                        <button
                                            title="Remover Atividade"
                                            onClick={() => remove(index)}
                                            className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 h-8 w-8 rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover/card:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* IPAQ Classification & Weekly Report */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Dashboard IPAQ</h4>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-1000 group-hover:scale-150" />

                            <div className="space-y-4 relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80">Classificação Geral</span>
                                    </div>
                                    <p className="text-2xl font-black tracking-tight leading-tight">{calData.level}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gasto Calórico</p>
                                            <p className="text-xl font-black tabular-nums">{calData.totalWeeklyKcal} <span className="text-xs font-bold text-emerald-400">kcal/sem</span></p>
                                        </div>
                                        <Flame className="h-8 w-8 text-orange-500/40" />
                                    </div>

                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Minutos</p>
                                            <p className="text-xl font-black tabular-nums">{calData.totalWeeklyMinutes} <span className="text-xs font-bold text-emerald-400">min/sem</span></p>
                                        </div>
                                        <Clock className="h-8 w-8 text-emerald-500/40" />
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                                    <p className="text-[8px] font-medium text-slate-500 leading-relaxed italic">
                                        A OMS recomenda pelo menos 150 min de atividade moderada ou 75 min de vigorosa para saúde cardiovascular.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}

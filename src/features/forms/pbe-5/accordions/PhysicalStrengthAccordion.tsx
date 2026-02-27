"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STRENGTH_TESTS, FORCE_REFERENCES_BY_AGE } from "@/app/dashboard/[slug]/assessments/strength-references";

interface PhysicalStrengthAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string, iconColor: string, bg: string };
}

function getForceClassification(value: number, weight: number, reference: { mean: number, std_dev: number } | undefined) {
    if (!value || !weight || !reference) return null;
    const relForce = value / weight;
    const zScore = (relForce - reference.mean) / reference.std_dev;

    let label = 'Normal';
    let status: 'weak' | 'normal' | 'strong' = 'normal';

    if (zScore < -1) {
        label = 'Abaixo da Média';
        status = 'weak';
    } else if (zScore > 1) {
        label = 'Acima da Média';
        status = 'strong';
    } else {
        label = 'Na Média';
        status = 'normal';
    }

    return { relForce, zScore, label, status };
}

export function PhysicalStrengthAccordion({ openSection, isSectionFilled, sectionStyle }: PhysicalStrengthAccordionProps) {
    const { control, watch, register } = useFormContext();
    const isFilled = isSectionFilled('strength');

    const strength = watch('strength') || {};
    const weight = Number(watch('antro.weight')) || 70;
    const age = Number(watch('antro.age')) || 30;
    const gender = (watch('antro.gender') || 'male') as 'male' | 'female';

    const strengthResult = React.useMemo(() => {
        if (!weight) return null;

        const testResults = STRENGTH_TESTS.map(test => {
            let ref: { mean: number, std_dev: number } | undefined = undefined;
            const ageRefs = FORCE_REFERENCES_BY_AGE[test.id as keyof typeof FORCE_REFERENCES_BY_AGE];

            if (ageRefs && ageRefs.ranges) {
                const range = ageRefs.ranges.find(r => age >= r.min && age <= r.max);
                if (range) ref = range.vals[gender];
                else {
                    if (age < 20) ref = ageRefs.ranges[0].vals[gender];
                    else ref = ageRefs.ranges[ageRefs.ranges.length - 1].vals[gender];
                }
            }

            const rightVal = Number(strength[`${test.id}_right`]) || 0;
            const leftVal = Number(strength[`${test.id}_left`]) || 0;
            const hasAny = !!strength[`${test.id}_right`] || !!strength[`${test.id}_left`];
            const hasBoth = !!strength[`${test.id}_right`] && !!strength[`${test.id}_left`];

            if (!hasAny) return { id: test.id, label: test.label, status: 'empty' };
            if (!hasBoth) return { id: test.id, label: test.label, status: 'incomplete' };

            const maxVal = Math.max(rightVal, leftVal);
            const minVal = Math.min(rightVal, leftVal);
            const symmetryIndex = maxVal > 0 ? 100 - ((minVal / maxVal) * 100) : 0;
            const avgVal = (rightVal + leftVal) / 2;
            const classification = getForceClassification(avgVal, weight, ref);

            return {
                id: test.id,
                label: test.label,
                avgVal,
                symmetryIndex,
                isAsymmetric: symmetryIndex > 15,
                classification,
                status: 'complete'
            };
        });

        const completeTests = testResults.filter(r => r.status === 'complete' && r.classification);
        return {
            testResults,
            hasActiveTests: completeTests.length > 0
        };
    }, [strength, weight, age, gender]);

    const renderTest = (test: typeof STRENGTH_TESTS[0]) => {
        const result = strengthResult?.testResults.find(r => r.id === test.id);

        return (
            <div key={test.id} className="w-full border-b last:border-0 pb-6 last:pb-0">
                <div className="flex items-center justify-between mb-4">
                    <Label className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        {test.label}
                        {result?.status === 'incomplete' && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[9px] font-black uppercase">Incompleto</Badge>
                        )}
                    </Label>
                    {result?.status === 'complete' && result.classification && (
                        <div className="flex items-center gap-2">
                            {result.isAsymmetric && <AlertCircle className="w-4 h-4 text-rose-500" />}
                            <Badge className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-1",
                                result.classification.status === 'weak' ? "bg-rose-100 text-rose-700 hover:bg-rose-100" :
                                    result.classification.status === 'strong' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                            )}>
                                {result.classification.label} (Z: {result.classification.zScore.toFixed(2)})
                            </Badge>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {test.inputs.map(input => (
                        <div key={input.id} className="space-y-2 text-center">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{input.label} ({test.unit})</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register(`strength.${test.id}_${input.id}`)}
                                className="h-12 rounded-xl border-slate-200 bg-white font-black text-center text-lg shadow-inner focus:ring-slate-900"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AccordionItem value="strength" className={cn("border rounded-[2rem] px-6 mb-4 transition-all duration-500 shadow-sm", openSection === 'strength' ? "bg-white border-slate-200 shadow-xl scale-[1.01]" : "bg-slate-50/50 border-transparent hover:bg-white")}>
            <AccordionTrigger className="hover:no-underline py-6 group">
                <div className="flex items-center gap-4 w-full text-left">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500", openSection === 'strength' ? "bg-slate-900 text-white shadow-lg rotate-12" : "bg-white text-slate-400 shadow-sm group-hover:text-slate-900")}>
                        <Dumbbell className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className={cn("text-sm font-black uppercase tracking-widest", openSection === 'strength' ? "text-slate-900" : "text-slate-500")}>Dinamometria Avançada</h3>
                            {isFilled && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Comparativo Z-Score por Idade e Gênero</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-8">
                <Tabs defaultValue="lower" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-2xl h-14">
                        <TabsTrigger value="lower" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Membros Inferiores</TabsTrigger>
                        <TabsTrigger value="upper" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Membros Superiores</TabsTrigger>
                    </TabsList>

                    <TabsContent value="lower" className="space-y-8 px-2">
                        {STRENGTH_TESTS.filter(t => t.category === 'lower').map(renderTest)}
                    </TabsContent>

                    <TabsContent value="upper" className="space-y-8 px-2">
                        {STRENGTH_TESTS.filter(t => t.category === 'upper').map(renderTest)}
                    </TabsContent>
                </Tabs>
            </AccordionContent>
        </AccordionItem>
    );
}

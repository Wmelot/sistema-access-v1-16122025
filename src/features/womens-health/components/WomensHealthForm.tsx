"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WomensHealthSchema, WomensHealthFormValues } from "../schemas/womens-health-schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, Baby, AlertTriangle, Activity, HeartPulse } from "lucide-react";
import { submitWomensHealth } from "../actions/submit-womens-health";

// Sections
import { ObstetricSection } from "./sections/ObstetricSection";
import { ComplaintsSection } from "./sections/ComplaintsSection";
import { RedFlagsSection } from "./sections/RedFlagsSection";
import { PerfectSection } from "./sections/PerfectSection";
import { WomensHealthSidePanel } from "./sections/WomensHealthSidePanel";

interface WomensHealthFormProps {
    patientId: string;
    initialData?: Partial<WomensHealthFormValues>;
}

export default function WomensHealthForm({ patientId, initialData }: WomensHealthFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<WomensHealthFormValues>({
        resolver: zodResolver(WomensHealthSchema) as any,
        defaultValues: initialData || {
            obstetric: {},
            complaints: {},
            redFlags: {},
            perfect: {}
        }
    });

    function onSubmit(data: WomensHealthFormValues) {
        startTransition(async () => {
            const result = await submitWomensHealth(data, patientId);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
                if (result.details) console.error("Validation Details:", result.details);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20">

                {/* HEADLINE */}
                <div className="flex items-center gap-3 mb-6">
                    <HeartPulse className="w-8 h-8 text-rose-600" />
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-none">Saúde da Mulher & Pélvica</h1>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Avaliação Uro-Ginecológica</p>
                    </div>
                </div>

                {/* --- 12-COLUMN GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: ACCORDION FORM (8 COLS) */}
                    <div className="lg:col-span-8">
                        <Accordion type="multiple" defaultValue={["obstetric", "complaints", "perfect"]} className="space-y-4">

                            {/* [Item 1] Histórico Obstétrico */}
                            <AccordionItem value="obstetric" className="bg-white border rounded-lg px-4 shadow-sm">
                                <AccordionTrigger className="hover:no-underline">
                                    <span className="flex items-center gap-2 font-bold text-slate-700 uppercase text-xs tracking-wider">
                                        <Baby className="w-4 h-4 text-rose-500" /> Histórico Obstétrico
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                    <ObstetricSection />
                                </AccordionContent>
                            </AccordionItem>

                            {/* [Item 2] Queixas e Red Flags */}
                            <AccordionItem value="complaints" className="bg-white border rounded-lg px-4 shadow-sm">
                                <AccordionTrigger className="hover:no-underline">
                                    <span className="flex items-center gap-2 font-bold text-slate-700 uppercase text-xs tracking-wider">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Queixas & Red Flags
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    {/* Red Flags Alert Box */}
                                    <div className="border border-red-100 bg-red-50/50 rounded-lg p-4">
                                        <RedFlagsSection />
                                    </div>
                                    <ComplaintsSection />
                                </AccordionContent>
                            </AccordionItem>

                            {/* [Item 3] PERFECT Scheme */}
                            <AccordionItem value="perfect" className="bg-white border rounded-lg px-4 shadow-sm">
                                <AccordionTrigger className="hover:no-underline">
                                    <span className="flex items-center gap-2 font-bold text-slate-700 uppercase text-xs tracking-wider">
                                        <Activity className="w-4 h-4 text-purple-500" /> Exame Físico (PERFECT)
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                    <PerfectSection />
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </div>

                    {/* RIGHT COLUMN: STICKY DASHBOARD (4 COLS) */}
                    <div className="lg:col-span-4 relative h-full">
                        <WomensHealthSidePanel />
                    </div>

                </div>

            </form>
        </Form>
    );
}

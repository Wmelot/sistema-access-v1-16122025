"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PalmilhaSchema, PalmilhaFormValues } from "../schemas/palmilha-schema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AnamneseSection } from "./sections/AnamneseSection";
import { FPISection } from "./sections/FPISection";
import { FunctionalTestsSection } from "./sections/FunctionalTestsSection";
import { ShoeSection } from "./sections/ShoeSection";
import { PrescriptionSection } from "./sections/PrescriptionSection";
import { submitPalmilha } from "../actions/submit-palmilha";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PalmilhaFormProps {
    patientId: string;
}

export default function PalmilhaForm({ patientId }: PalmilhaFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<PalmilhaFormValues>({
        resolver: zodResolver(PalmilhaSchema) as any,
        defaultValues: {
            anamnese: {
                eva: 0,
                efep: [{ atividade: "", nota: 0 }, { atividade: "", nota: 0 }, { atividade: "", nota: 0 }]
            },
            exame_fisico: {
                jack_test: { left: 0, right: 0 },
                fpi: { score_total: { left: 0, right: 0 } },
                thomas_test: 0,
                isquiotibiais: 0,
                craig_anteversao: 0
            },
            prescricao: {
                elementos_extras: { piloto: false }
            }
        }
    });

    function onSubmit(data: PalmilhaFormValues) {
        startTransition(async () => {
            const result = await submitPalmilha(data, patientId);

            if (result.success) {
                toast.success(result.message);
                console.log("Salvo no banco:", data);
            } else {
                toast.error(result.message);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="pb-20 max-w-6xl mx-auto bg-white min-h-screen text-slate-800">
                {/* Header Estilo Prontuário */}
                <div className="border-b-2 border-slate-800 bg-slate-100 p-4 mb-4 flex justify-between items-center sticky top-0 z-20 shadow-sm print:hidden">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider text-slate-900 leading-none">Avaliação Biomecânica</h1>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">REF: PALMILHA-V2 • DATA: {new Date().toLocaleDateString()}</p>
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isPending}
                        className="bg-slate-900 text-white hover:bg-slate-700 h-8 text-xs uppercase font-bold px-6"
                    >
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Prontuário"}
                    </Button>
                </div>

                <div className="px-6 space-y-8">
                    <AnamneseSection />
                    <FPISection />
                    <FunctionalTestsSection />
                    <ShoeSection />
                    <PrescriptionSection />
                </div>
            </form>
        </Form>
    );
}

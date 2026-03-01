import { getDraftRecords } from "@/actions/attendance";
import { PenTool, ChevronRight } from "lucide-react";
import { DraftsList } from "./DraftsList";
import Link from "next/link";

export default async function DraftsPage({ params }: { params: { slug: string } }) {
    const res = await getDraftRecords();
    const drafts = res.success ? (res.data || []) : [];

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    <Link href={`/dashboard/${params.slug}`} className="hover:text-indigo-600">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-indigo-600">Rascunhos Rápidos</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <PenTool className="h-8 w-8 text-indigo-600" />
                            Rascunhos Rápidos
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 max-w-lg">
                            Gerencie atendimentos iniciados rapidamente sem vínculo com paciente.
                            Você pode atribuir a um paciente existente ou criar um novo ao continuar o atendimento.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <DraftsList initialDrafts={drafts} slug={params.slug} />
            </div>
        </div>
    );
}

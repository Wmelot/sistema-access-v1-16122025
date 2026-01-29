"use client";

import { ArrowRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { backToMaster } from "@/app/admin/tenants/actions";
import { Button } from "@/components/ui/button";

interface ImpersonationBarProps {
    clinicName: string;
    isOriginClinic?: boolean;
}

export function ImpersonationBar({ clinicName, isOriginClinic = false }: ImpersonationBarProps) {
    const router = useRouter();

    const handleReturn = async () => {
        toast.info("Voltando para o Painel Master...");
        try {
            const result = await backToMaster();
            if (result && !result.success) {
                throw new Error(result.error);
            }

            toast.success("Bem-vindo de volta, Master!");
            router.refresh();
            router.push('/admin');

        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao voltar para o Painel Master");
        }
    };

    return (
        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-b border-amber-300 px-4 py-3 flex items-center justify-between text-sm shadow-md sticky top-0 z-50 text-amber-900">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Eye className="h-5 w-5 text-amber-600 animate-pulse" />
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full animate-ping" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-sm lg:text-base flex items-center gap-2 text-amber-800">
                        🛡️ MODO MASTER: {clinicName}
                    </span>
                    <span className="text-xs opacity-90">
                        Você está visualizando a clínica: <strong className="text-amber-900 bg-amber-200/50 px-2 py-0.5 rounded border border-amber-300/50">{clinicName}</strong>
                    </span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReturn}
                className="h-8 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400 transition-all hover:scale-105"
            >
                Voltar para Painel Master
                <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
        </div>
    );
}

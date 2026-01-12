"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { backToMaster } from "@/app/admin/tenants/actions";
import { Button } from "@/components/ui/button";

interface ImpersonationBarProps {
    clinicName: string;
}

export function ImpersonationBar({ clinicName }: ImpersonationBarProps) {
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
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm text-amber-900">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-xs lg:text-sm">
                    Modo Suporte (Master): Visualizando <strong>{clinicName}</strong>.
                    <span className="hidden sm:inline ml-2 opacity-80 border-l border-amber-300 pl-2">
                        Dados sensíveis mascarados por ética e LGPD.
                    </span>
                </span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReturn}
                className="h-7 text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-300"
            >
                Voltar para Painel Master
                <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
        </div>
    );
}

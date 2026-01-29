"use client";

import { AlertTriangle, ArrowRight, Shield, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { backToMaster } from "@/app/admin/tenants/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImpersonationBarProps {
    clinicName: string;
    isOriginClinic?: boolean;
}

export function ImpersonationBar({ clinicName, isOriginClinic = false }: ImpersonationBarProps) {
    const router = useRouter();

    // Use specific property or fallback to generic name check for safety
    const isHome = isOriginClinic || clinicName?.toLowerCase().includes('access');

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
        <div className={cn(
            "border-b px-4 py-3 flex items-center justify-between text-sm shadow-md sticky top-0 z-50",
            isHome
                ? "bg-blue-50 border-blue-200 text-blue-900"
                : "bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-amber-300 text-amber-900 animate-pulse"
        )}>
            <div className="flex items-center gap-3">
                {isHome ? (
                    <Shield className="h-5 w-5 text-blue-600" />
                ) : (
                    <div className="relative">
                        <Eye className="h-5 w-5 text-amber-600 animate-bounce" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                )}
                <div className="flex flex-col">
                    <span className={cn(
                        "font-bold text-sm lg:text-base flex items-center gap-2",
                        !isHome && "text-amber-800"
                    )}>
                        {isHome ? (
                            <>🏠 Modo Master - {clinicName}</>
                        ) : (
                            <>⚠️ ATENÇÃO: Navegando em Outra Clínica</>
                        )}
                    </span>
                    <span className="text-xs opacity-90">
                        {isHome ? (
                            <>Você está na sua clínica principal.</>
                        ) : (
                            <>Clínica: <strong className="text-amber-800 bg-amber-200 px-2 py-0.5 rounded">{clinicName}</strong> • Dados sensíveis mascarados (LGPD)</>
                        )}
                    </span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={handleReturn}
                className={cn(
                    "h-8 text-xs font-semibold border shadow-sm transition-all hover:scale-105",
                    isHome
                        ? "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300"
                        : "bg-amber-200 hover:bg-amber-300 text-amber-900 border-amber-400 animate-pulse"
                )}
            >
                Voltar para Painel Master
                <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
        </div>
    );
}


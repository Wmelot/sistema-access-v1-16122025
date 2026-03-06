import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

interface UseOfflineSyncProps {
    form: UseFormReturn<any>;
    id: string; // Chave única para evitar conflitos (ex: patientId_palmilha5)
    enabled?: boolean;
}

export function useOfflineSync({ form, id, enabled = true }: UseOfflineSyncProps) {
    const isRestoring = useRef(false);
    const hasInitialized = useRef(false);
    const DRAFT_KEY = `axiom_offline_draft_${id}`;

    useEffect(() => {
        if (!enabled || !id || typeof window === 'undefined') return;

        // Na montagem, checar se existe um draft não salvo
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            try {
                const draftStr = localStorage.getItem(DRAFT_KEY);
                if (draftStr) {
                    const parsed = JSON.parse(draftStr);
                    // Checa se tem algo válido
                    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                        toast("Backup Local Encontrado", {
                            description: "Detectamos dados não salvos (possível queda de Wi-Fi). Deseja recuperar?",
                            duration: 15000,
                            action: {
                                label: "Restaurar",
                                onClick: () => {
                                    isRestoring.current = true;
                                    form.reset(parsed); // Restaura todos os dados na UI
                                    toast.success("Dados recuperados do cache local com sucesso! 🛡️");
                                    // Pequeno delay para evitar loops do watch
                                    setTimeout(() => { isRestoring.current = false; }, 500);
                                }
                            },
                            cancel: {
                                label: "Descartar",
                                onClick: () => {
                                    localStorage.removeItem(DRAFT_KEY);
                                    toast.info("Backup local descartado.");
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Erro ao ler backup local", error);
            }
        }

        // Ficar "escutando" qualquer mudança no form
        const subscription = form.watch(() => {
            if (isRestoring.current) return; // Não salvar enquanto restaura

            try {
                const currentValues = form.getValues();
                // Apenas salva se o form já foi modificado (dirty) ou se quisermos forçar
                // Neste caso, para PBE, salvaremos o state atualizado
                localStorage.setItem(DRAFT_KEY, JSON.stringify(currentValues));
            } catch (error) {
                console.error("Erro ao salvar backup local", error);
            }
        });

        return () => subscription.unsubscribe();
    }, [form, id, enabled, DRAFT_KEY]);

    // Função para limpar manualmente (ex: apos um Save no banco com sucesso)
    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (e) { }
    }

    return { clearDraft };
}

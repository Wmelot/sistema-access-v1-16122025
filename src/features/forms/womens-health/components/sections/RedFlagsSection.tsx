import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";
import { AlertCircle } from "lucide-react";

export const RedFlagsSection = () => {
    const { control } = useFormContext();

    const redFlags = [
        { id: "vaginalBleeding", label: "Sangramento Vaginal Anormal", desc: "Fora do ciclo ou na pós-menopausa." },
        { id: "amnioticFluidLeak", label: "Perda de Líquido Amniótico", desc: "Suspeita de ruptura (Gestantes)." },
        { id: "severeHeadache", label: "Cefaleia Intensa e Súbita", desc: "Sinal de hipertensão / pré-eclâmpsia." },
        { id: "reducedFetalMovement", label: "Redução de Movimentos Fetais", desc: "Bebê parou de mexer (Gestantes)." },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-red-800 border-b border-red-200 pb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Sinais de Alerta (Red Flags)
            </h3>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                {redFlags.map((item) => (
                    <FormField
                        key={item.id}
                        control={control}
                        name={`redFlags.${item.id}`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-red-200 p-3 shadow-none bg-white">
                                <div className="space-y-0.5">
                                    <FormLabel className="font-semibold text-red-900">{item.label}</FormLabel>
                                    <FormDescription className="text-red-700/80 text-xs">
                                        {item.desc}
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-red-600"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

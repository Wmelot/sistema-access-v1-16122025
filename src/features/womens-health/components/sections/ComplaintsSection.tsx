import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormContext } from "react-hook-form";

export const ComplaintsSection = () => {
    const { control } = useFormContext();

    const complaints = [
        { id: "stressUrinaryIncontinence", label: "Incontinência Urinária de Esforço (IUE)", desc: "Perde urina ao tossir, espirrar ou rir." },
        { id: "urgeIncontinence", label: "Incontinência de Urgência", desc: "Vontade súbita e incontrolável." },
        { id: "nocturia", label: "Noctúria", desc: "Levanta várias vezes à noite para urinar." },
        { id: "prolapseSensation", label: "Sensação de Prolapso", desc: "Sensação de 'bola' ou peso na vagina." },
        { id: "constipation", label: "Constipação Intestinal", desc: "Dificuldade para evacuar frequente." },
        { id: "dyspareunia", label: "Dispareunia", desc: "Dor durante a relação sexual." },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-rose-800 border-b border-rose-100 pb-2">Queixas & Sintomas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaints.map((item) => (
                    <FormField
                        key={item.id}
                        control={control}
                        name={`complaints.${item.id}`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-white hover:bg-slate-50 transition-colors">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        {item.label}
                                    </FormLabel>
                                    <FormDescription>
                                        {item.desc}
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

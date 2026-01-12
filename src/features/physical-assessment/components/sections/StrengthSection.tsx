import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const StrengthSection = () => {
    const { control } = useFormContext();

    // Standard list of exercises for the assessment
    const exercises = [
        { id: "extensao_joelho_d", label: "Extensão de Joelho (D)" },
        { id: "extensao_joelho_e", label: "Extensão de Joelho (E)" },
        { id: "flexao_joelho_d", label: "Flexão de Joelho (D)" },
        { id: "flexao_joelho_e", label: "Flexão de Joelho (E)" },
        { id: "supino", label: "Supino Reto" },
        { id: "remada", label: "Remada Sentada" },
        { id: "leg_press", label: "Leg Press 45º" },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Força Muscular (Carga em Kg)</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {exercises.map((ex) => (
                    <FormField
                        key={ex.id}
                        control={control}
                        name={`strength.${ex.id}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{ex.label}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        {...field}
                                        value={field.value || ""} // Handle undefined for dynamic fields
                                        onChange={e => field.onChange(e.target.value)} // Keep as string or convert if needed. Schema says string.
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

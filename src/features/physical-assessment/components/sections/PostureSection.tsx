import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const PostureSection = () => {
    const { control } = useFormContext();

    const checklistItems = [
        "Cabeça anteriorizada",
        "Ombros protusos",
        "Hipercifose torácica",
        "Hiperlordose lombar",
        "Escoliose observável",
        "Joelho valgo",
        "Joelho varo",
        "Pé plano",
        "Pé cavo"
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Avaliação Postural</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-medium mb-3 text-sm text-slate-600">Checklist de Desvios</h4>
                    <FormField
                        control={control}
                        name="posture.observations"
                        render={({ field }) => (
                            <div className="space-y-2">
                                {checklistItems.map((item) => (
                                    <div key={item} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked) => {
                                                const current = field.value || [];
                                                if (checked) {
                                                    field.onChange([...current, item]);
                                                } else {
                                                    field.onChange(current.filter((val: string) => val !== item));
                                                }
                                            }}
                                        />
                                        <label className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {item}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                </div>

                <div>
                    <h4 className="font-medium mb-3 text-sm text-slate-600">Fotos (URLs)</h4>
                    <div className="space-y-3">
                        <FormField
                            control={control}
                            name="posture.photos.anterior"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Vista Anterior</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="h-8" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="posture.photos.posterior"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Vista Posterior</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="h-8" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="posture.photos.left"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Vista Lateral Esquerda</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="h-8" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="posture.photos.right"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Vista Lateral Direita</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="h-8" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

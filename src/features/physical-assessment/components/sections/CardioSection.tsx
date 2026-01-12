import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext, useWatch } from "react-hook-form";

export const CardioSection = () => {
    const { control } = useFormContext();
    const method = useWatch({ control, name: "cardio.method" });

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Cardiorrespiratório</h3>

            <FormField
                control={control}
                name="cardio.method"
                render={({ field }) => (
                    <FormItem className="w-full md:w-1/2">
                        <FormLabel>Protocolo de Teste</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="rockport">Rockport (Milha)</SelectItem>
                                <SelectItem value="cooper">Cooper (12 min)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {method === "rockport" && (
                    <>
                        <FormField
                            control={control}
                            name="cardio.timeMin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tempo (min)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="cardio.heartRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>FC Final (bpm)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

                {method === "cooper" && (
                    <FormField
                        control={control}
                        name="cardio.distance"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Distância (metros)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={control}
                    name="cardio.vo2Max"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>VO2 Max (Estimado)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} readOnly className="bg-slate-50" placeholder="Calculado..." />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

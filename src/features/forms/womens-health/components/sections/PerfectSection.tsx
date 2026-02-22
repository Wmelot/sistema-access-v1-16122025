import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";

export const PerfectSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-rose-800 border-b border-rose-100 pb-2">Avaliação Pélvica (Escala PERFECT)</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                    control={control}
                    name="perfect.power"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Força (P)</FormLabel>
                            <FormControl>
                                <Input type="number" min="0" max="5" placeholder="0-5" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormDescription>Escala Oxford Modif.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="perfect.endurance"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endurance (E)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Segundos" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormDescription>Duração contração</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="perfect.repetitions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Repetições (R)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Qtd" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormDescription>Mantendo a força</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="perfect.fast"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fast (F)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Qtd" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormDescription>Contrações rápidas</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="mt-4">
                <FormField
                    control={control}
                    name="perfect.diastasis"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-rose-50/50 w-full md:w-1/2">
                            <div className="space-y-0.5">
                                <FormLabel>Diástase Abdominal</FormLabel>
                                <FormDescription className="text-xs">Presença de separação {'>'} 2cm?</FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

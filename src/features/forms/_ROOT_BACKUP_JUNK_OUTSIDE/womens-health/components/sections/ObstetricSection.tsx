import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export const ObstetricSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-rose-800 border-b border-rose-100 pb-2">Histórico Obstétrico</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                    control={control}
                    name="obstetric.gestations"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gestações</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="obstetric.births"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Partos</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="obstetric.abortions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Abortos</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="obstetric.birthType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Parto Principal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="vaginal">Vaginal</SelectItem>
                                    <SelectItem value="c_section">Cesárea</SelectItem>
                                    <SelectItem value="mixed">Misto</SelectItem>
                                    <SelectItem value="null">Nenhum</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <FormField
                    control={control}
                    name="obstetric.episiotomy"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-rose-50/30">
                            <div className="space-y-0.5">
                                <FormLabel>Episiotomia</FormLabel>
                                <FormDescription className="text-xs">Paciente sofreu episiotomia?</FormDescription>
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

                <FormField
                    control={control}
                    name="obstetric.menopause"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-rose-50/30">
                            <div className="space-y-0.5">
                                <FormLabel>Menopausa</FormLabel>
                                <FormDescription className="text-xs">Já entrou na menopausa?</FormDescription>
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

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export const AntroSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Antropometria</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                    control={control}
                    name="antro.gender"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sexo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="female">Feminino</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="antro.age"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Idade (anos)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="antro.weight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="antro.height"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Altura (cm)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Dobras Cutâneas (mm)</h4>
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={control}
                        name="antro.thigh"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Coxa</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="antro.abdominal"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Abdominal</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="antro.suprailiac"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Supra-ilíaca</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const MobilitySection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Flexibilidade & Mobilidade</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={control}
                    name="mobility.wells"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Banco de Wells (cm)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="border p-4 rounded-md bg-slate-50">
                    <h4 className="font-medium mb-3 text-sm uppercase text-slate-500">Elevação da Perna (SLR) - Graus</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="mobility.legRaiseLeft"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Esquerdo</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="mobility.legRaiseRight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Direito</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="border p-4 rounded-md bg-slate-50">
                    <h4 className="font-medium mb-3 text-sm uppercase text-slate-500">Alcance de Ombros (cm)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={control}
                            name="mobility.shoulderReachLeft"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Esq. por Cima</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="mobility.shoulderReachRight"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dir. por Cima</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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

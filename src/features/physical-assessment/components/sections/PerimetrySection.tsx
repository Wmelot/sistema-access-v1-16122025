import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const PerimetrySection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Perimetria (cm)</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                    control={control}
                    name="perimetry.chest"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tórax</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="perimetry.waist"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cintura</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="perimetry.hip"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quadril</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <FormField
                    control={control}
                    name="perimetry.armRelaxedRight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Braço Relax. (D)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="perimetry.armContractedRight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Braço Contraído (D)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="perimetry.thighRight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Coxa Medial (D)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="perimetry.calfRight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Panturrilha (D)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

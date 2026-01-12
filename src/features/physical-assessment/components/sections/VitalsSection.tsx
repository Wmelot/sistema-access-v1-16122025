import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";

export const VitalsSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Sinais Vitais</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={control}
                    name="vitals.restingHeartRate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>FC Repouso (bpm)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="vitals.bloodPressureSys"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>P.A. Sistólica (mmHg)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="vitals.bloodPressureDia"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>P.A. Diastólica (mmHg)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

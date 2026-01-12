import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export const AnamneseSection = () => {
    const { control } = useFormContext();

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Anamnese & Objetivos</h3>

            <FormField
                control={control}
                name="anamnesis.mainComplaint"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Queixa Principal *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="Descreva a queixa principal..." />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name="anamnesis.trainingLevel"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nível de Treinamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="beginner">Iniciante</SelectItem>
                                    <SelectItem value="intermediate">Intermediário</SelectItem>
                                    <SelectItem value="advanced">Avançado</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="anamnesis.goal"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Objetivo Principal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                    <SelectItem value="weight_loss">Emagrecimento</SelectItem>
                                    <SelectItem value="rehab">Reabilitação</SelectItem>
                                    <SelectItem value="performance">Performance</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
};

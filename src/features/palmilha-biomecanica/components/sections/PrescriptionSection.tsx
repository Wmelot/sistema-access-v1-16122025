"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PrescriptionSection = () => {
    const { control } = useFormContext();

    return (
        <section className="print:break-inside-avoid">
            <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">07. Prescrição Técnica</h2>

            <div className="border border-slate-400 bg-teal-50/30 p-4 rounded-sm">
                <div className="flex justify-between mb-4 border-b border-slate-200 pb-2">
                    <div className="w-1/3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de Dispositivo</label>
                        <FormField control={control} name="prescricao.tipo_palmilha" render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-8 text-xs bg-white border-slate-300 font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Biomecânica">Biomecânica (Rígida)</SelectItem>
                                    <SelectItem value="Esportiva">Esportiva (Flex)</SelectItem>
                                    <SelectItem value="Propceptiva">Proprioceptiva</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PÉ ESQUERDO */}
                    <div className="relative border border-slate-300 bg-white p-3 rounded-sm">
                        <div className="absolute -top-2 left-2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">Esquerdo</div>
                        <div className="mt-2 space-y-2">
                            <FormField control={control} name="prescricao.correcoes.retrope.left" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">RETROPÉ</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Postagem..." /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="prescricao.correcoes.arco.left" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">ARCO</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Suporte..." /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="prescricao.correcoes.antepe.left" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">ANTEPÉ</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Correção..." /></FormControl>
                                </div>
                            )} />
                        </div>
                    </div>

                    {/* PÉ DIREITO */}
                    <div className="relative border border-slate-300 bg-white p-3 rounded-sm">
                        <div className="absolute -top-2 right-2 bg-green-600 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">Direito</div>
                        <div className="mt-2 space-y-2">
                            <FormField control={control} name="prescricao.correcoes.retrope.right" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">RETROPÉ</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Postagem..." /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="prescricao.correcoes.arco.right" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">ARCO</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Suporte..." /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="prescricao.correcoes.antepe.right" render={({ field }) => (
                                <div className="grid grid-cols-[60px_1fr] items-center gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 text-right">ANTEPÉ</label>
                                    <FormControl><Input {...field} className="h-7 text-xs bg-slate-50" placeholder="Correção..." /></FormControl>
                                </div>
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const FPISection = () => {
    const { control } = useFormContext();

    const fpiCriteria = [
        { id: "talus", label: "Cabeça do Tálus" },
        { id: "curvatura_maleolar", label: "Curvatura Maleolar" },
        { id: "posicao_calcaneo", label: "Posição Calcâneo" },
        { id: "proeminencia_tln", label: "Proeminência TLN" },
        { id: "congruencia_arco", label: "Congruência Arco" },
        { id: "abducao_antepé", label: "Abdução Antepé" },
    ];

    return (
        <section>
            <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">04. Postura (FPI-6)</h2>
            <div className="border border-slate-300 rounded-sm overflow-hidden">
                <Table className="w-full">
                    <TableHeader className="bg-slate-200">
                        <TableRow className="h-8 hover:bg-slate-200 border-b border-slate-300">
                            <TableHead className="w-1/3 text-xs font-bold text-slate-700 uppercase">Critério</TableHead>
                            <TableHead className="text-center p-0 border-l border-slate-300 bg-blue-100/30">
                                <div className="text-[10px] font-bold text-blue-800 py-1 uppercase border-b border-blue-200">Esquerdo</div>
                                <div className="grid grid-cols-5 text-[9px] text-slate-500 font-mono">
                                    <span>-2</span><span>-1</span><span>0</span><span>+1</span><span>+2</span>
                                </div>
                            </TableHead>
                            <TableHead className="text-center p-0 border-l border-slate-300 bg-green-100/30">
                                <div className="text-[10px] font-bold text-green-800 py-1 uppercase border-b border-green-200">Direito</div>
                                <div className="grid grid-cols-5 text-[9px] text-slate-500 font-mono">
                                    <span>-2</span><span>-1</span><span>0</span><span>+1</span><span>+2</span>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fpiCriteria.map((item, idx) => (
                            <TableRow key={item.id} className={cn("h-9 border-b border-slate-200 hover:bg-slate-50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                <TableCell className="py-1 px-3 text-[11px] font-medium text-slate-700 leading-tight">
                                    {item.label}
                                </TableCell>

                                {/* ESQUERDO */}
                                <TableCell className="p-0 border-l border-slate-200 bg-blue-50/10">
                                    <FormField control={control} name={`exame_fisico.fpi.${item.id}.left` as any} render={({ field }) => (
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-5 h-full items-center justify-items-center">
                                            {['-2', '-1', '0', '+1', '+2'].map((val) => (
                                                <RadioGroupItem key={val} value={val} className="h-3.5 w-3.5 border-slate-400 text-blue-600 shadow-none focus:ring-0" />
                                            ))}
                                        </RadioGroup>
                                    )} />
                                </TableCell>

                                {/* DIREITO */}
                                <TableCell className="p-0 border-l border-slate-200 bg-green-50/10">
                                    <FormField control={control} name={`exame_fisico.fpi.${item.id}.right` as any} render={({ field }) => (
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-5 h-full items-center justify-items-center">
                                            {['-2', '-1', '0', '+1', '+2'].map((val) => (
                                                <RadioGroupItem key={val} value={val} className="h-3.5 w-3.5 border-slate-400 text-green-600 shadow-none focus:ring-0" />
                                            ))}
                                        </RadioGroup>
                                    )} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
};

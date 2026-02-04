"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footprints, Calculator, Receipt, ArrowRight, Save, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkNavicularStatus } from "@/utils/clinical-references";

// Constantes
const COLOR_LEFT_FOOT = '#14b8a6'; // Teal
const COLOR_RIGHT_FOOT = '#f43f5e'; // Rose

const ELEVATION_OPTIONS = [
    { label: 'Nenhuma', value: 'Nenhuma' },
    { label: '0.1 cm', value: '0.1' },
    { label: '0.2 cm', value: '0.2' },
    { label: '0.3 cm', value: '0.3' },
    { label: '0.4 cm', value: '0.4' },
    { label: '0.5 cm', value: '0.5' },
    { label: '0.6 cm', value: '0.6' },
    { label: '0.7 cm', value: '0.7' },
    { label: '0.8 cm', value: '0.8' },
    { label: '0.9 cm', value: '0.9' },
    { label: '1.0 cm', value: '1.0' },
    { label: '1.1 cm', value: '1.1' },
    { label: '1.2 cm', value: '1.2' },
    { label: '1.3 cm', value: '1.3' },
    { label: '1.5 cm', value: '1.5' },
    { label: '2.0 cm', value: '2.0' },
];

export const PrescriptionSection = () => {
    const { control, setValue, watch } = useFormContext();
    const [priceData, setPriceData] = useState({ total: 0, details: [] as string[] });

    // Watch para automação
    const navicularLeft = useWatch({ control, name: "exame_fisico.navicular_drop.left" });
    const navicularRight = useWatch({ control, name: "exame_fisico.navicular_drop.right" });
    const shoeSize = useWatch({ control, name: "calcado.tamanho" }) || 0; // Se tiver no form, senao default

    // Dados da Prescrição
    const presc = useWatch({ control, name: "prescricao.palmilha" });

    // --- AUTOMAÇÃO DE ARCO BASEADA NO NAVICULAR ---
    const applyNavicularToArch = () => {
        if (!shoeSize) {
            toast.error("Defina o tamanho do calçado primeiro.");
            return;
        }

        let applied = false;
        if (navicularLeft) {
            const status = checkNavicularStatus(Number(navicularLeft), Number(shoeSize));
            if (status?.label) {
                let arch = "Médio (25º)";
                if (status.label.includes("Baixo")) arch = "Baixo (20º)";
                if (status.label.includes("Alto")) arch = "Alto (30º)";
                setValue("prescricao.palmilha.left_foot.arco", arch);
                applied = true;
            }
        }
        if (navicularRight) {
            const status = checkNavicularStatus(Number(navicularRight), Number(shoeSize));
            if (status?.label) {
                let arch = "Médio (25º)";
                if (status.label.includes("Baixo")) arch = "Baixo (20º)";
                if (status.label.includes("Alto")) arch = "Alto (30º)";
                setValue("prescricao.palmilha.right_foot.arco", arch);
                applied = true;
            }
        }
        if (applied) toast.success("Altura do arco atualizada com base no Navicular Drop!");
        else toast.warning("Dados insuficientes para cálculo automático.");
    };

    // --- CÁLCULO DE PREÇO ---
    useEffect(() => {
        if (!presc) return;

        // Base Price
        const model = presc.modelo || "Slim";
        let total = model.includes("Slim") ? 190 : 240;
        let details = [`Base (${model}): R$ ${total}`];

        // Cobertura
        if (presc.cobertura && !presc.cobertura.includes("EVA Azul")) {
            total += 20;
            details.push("Cobertura Especial: +R$ 20");
        }

        // Feet Extras
        const calcFoot = (foot: any, side: string) => {
            if (!foot) return;
            // Absorção
            if (foot.absorcao && foot.absorcao !== 'Sem absorção' && foot.absorcao !== "Não") {
                const isFull = foot.absorcao.includes('inteira');
                total += isFull ? 10 : 5;
                details.push(`Absorção (${side}): +R$ ${isFull ? 10 : 5}`);
            }

            // PADS e Elementos
            const pads = foot.pads || []; // V3 Schema array of strings

            if (pads.includes('Gota')) { total += 5; details.push(`Gota (${side}): +R$ 5`); }
            if (pads.includes('Barra')) { total += 10; details.push(`Barra (${side}): +R$ 10`); }

            const reliefs = pads.filter((p: string) => p.includes("Alívio"));
            if (reliefs.length > 0) {
                const cost = reliefs.length * 5;
                total += cost;
                details.push(`Alívios (${side}): +R$ ${cost}`);
            }
        };

        calcFoot(presc.left_foot, "Esq");
        calcFoot(presc.right_foot, "Dir");

        setPriceData({ total, details });
        setValue("prescricao.preco_total", total); // Salvar no form
    }, [presc, setValue]);


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full" />
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Prescrição da Órtese (Palmilha)</h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={applyNavicularToArch} className="text-xs h-8 gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800">
                    <Wand2 className="w-3 h-3" /> Auto-Preencher Arcos (Navicular)
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* COLUNA ESQUERDA: FORMULÁRIO */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Configurações Gerais */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Configuração Geral</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField control={control} name="prescricao.palmilha.modelo" render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Modelo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "Slim"}>
                                        <FormControl><SelectTrigger className="h-9 bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Slim">Slim</SelectItem>
                                            <SelectItem value="Biomecânica">Biomecânica</SelectItem>
                                            <SelectItem value="Chinelo">Chinelo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={control} name="prescricao.palmilha.tipo" render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "Inteira"}>
                                        <FormControl><SelectTrigger className="h-9 bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Inteira">Inteira</SelectItem>
                                            <SelectItem value="3/4">3/4</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={control} name="prescricao.palmilha.tamanho" render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Numeração</FormLabel>
                                    <FormControl><Input {...field} type="number" className="h-9 bg-slate-50" placeholder="Ex: 38" /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={control} name="prescricao.palmilha.cobertura" render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Cobertura</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "EVA Azul (Padrão)"}>
                                        <FormControl><SelectTrigger className="h-9 bg-slate-50"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="EVA Azul (Padrão)">EVA Azul</SelectItem>
                                            <SelectItem value="Tecido Azul">Tecido Azul</SelectItem>
                                            <SelectItem value="Tecido Preto">Tecido Preto</SelectItem>
                                            <SelectItem value="Plastazote">Plastazote</SelectItem>
                                            <SelectItem value="Nobuk">Nobuk</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Left & Right Foot Forms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FootPrescriptionForm side="left" label="Pé Esquerdo" color={COLOR_LEFT_FOOT} control={control} />
                        <FootPrescriptionForm side="right" label="Pé Direito" color={COLOR_RIGHT_FOOT} control={control} />
                    </div>

                </div>

                {/* COLUNA DIREITA: RESUMO E PREÇO */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden sticky top-8">
                        <CardHeader className="bg-slate-900 text-white p-6 pb-12">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Receipt className="w-5 h-5 opacity-80" /> Resumo do Pedido
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="bg-white p-6 -mt-6 rounded-t-[2rem] space-y-4">

                                {/* Lista de Itens */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Detalhamento</p>
                                    {priceData.details.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">Configure a palmilha para ver o preço.</p>
                                    )}
                                    {priceData.details.map((detail, btn) => (
                                        <div key={btn} className="flex justify-between text-xs font-medium text-slate-600 border-b border-dashed border-slate-100 pb-2">
                                            <span>{detail.split(':')[0]}</span>
                                            <span className="text-slate-900">{detail.split(':')[1]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Valor Total Estimado</span>
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">R$ {priceData.total.toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 text-right">Valores sugeridos. Verifique a tabela atual.</p>
                                </div>

                                {/* Botão de Ação (Visual Only - Save handled by main form) */}
                                <div className="pt-4">
                                    <Alert className="bg-green-50 border-green-100">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-800 font-bold text-xs uppercase">Pronto para Prescrever</AlertTitle>
                                        <AlertDescription className="text-green-700 text-xs">
                                            Os dados serão salvos junto com a avaliação completa ao clicar em Finalizar Avaliação.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Componente helper para form de cada pé
const FootPrescriptionForm = ({ side, label, color, control }: { side: 'left' | 'right', label: string, color: string, control: any }) => {
    const prefix = `prescricao.palmilha.${side === 'left' ? 'left_foot' : 'right_foot'}`;

    return (
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2" style={{ color }}>
                <Footprints className="w-4 h-4" /> {label}
            </h4>

            <div className="space-y-4">
                <FormField control={control} name={`${prefix}.arco`} render={({ field }) => (
                    <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Arco (Altura)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-8 bg-slate-50 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Baixo (20º)">Baixo (20º)</SelectItem>
                                <SelectItem value="Médio (25º)">Médio (25º)</SelectItem>
                                <SelectItem value="Alto (30º)">Alto (30º)</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                <FormField control={control} name={`${prefix}.elevacao`} render={({ field }) => (
                    <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Elevação (Compensação)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-8 bg-slate-50 text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger></FormControl>
                            <SelectContent className="max-h-[200px]">
                                {ELEVATION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                {/* Correções */}
                <div className="grid grid-cols-2 gap-2">
                    <FormField control={control} name={`${prefix}.retrope`} render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Retropé</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-8 bg-slate-50 text-[10px]"><SelectValue placeholder="Neutro" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Sem correção">Neutro (0º)</SelectItem>
                                    <SelectItem value="Supinação (-3º)">Supinação (-3º)</SelectItem>
                                    <SelectItem value="Supinação (-6º)">Supinação (-6º)</SelectItem>
                                    <SelectItem value="Pronação (+3º)">Pronação (+3º)</SelectItem>
                                    <SelectItem value="Pronação (+6º)">Pronação (+6º)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={control} name={`${prefix}.antepe`} render={({ field }) => (
                        <FormItem className="space-y-1">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Antepé</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-8 bg-slate-50 text-[10px]"><SelectValue placeholder="Neutro" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Sem correção">Neutro (0º)</SelectItem>
                                    <SelectItem value="Supinação (-3º)">Supinação (-3º)</SelectItem>
                                    <SelectItem value="Pronação (+3º)">Pronação (+3º)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                {/* Pads via Checkbox Array */}
                <FormField control={control} name={`${prefix}.pads`} render={({ field }) => {
                    const current = field.value || [];
                    const toggle = (val: string) => {
                        if (current.includes(val)) field.onChange(current.filter((x: string) => x !== val));
                        else field.onChange([...current, val]);
                    };
                    return (
                        <div className="space-y-2 pt-2 border-t border-slate-50">
                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500 block">Elementos & Pads</FormLabel>
                            {['Alívio 1º Meta', 'Alívio 2/3º Meta', 'Alívio 4/5º Meta', 'Gota', 'Barra'].map(pad => (
                                <div key={pad} className="flex items-center gap-2">
                                    <Checkbox id={`${side}-${pad}`} checked={current.includes(pad)} onCheckedChange={() => toggle(pad)} className="w-3 h-3 rounded-sm border-slate-300" />
                                    <label htmlFor={`${side}-${pad}`} className="text-[11px] font-medium text-slate-700 cursor-pointer">{pad}</label>
                                </div>
                            ))}
                        </div>
                    );
                }} />
            </div>
        </div>
    );
};

import { CheckCircle2 } from "lucide-react";

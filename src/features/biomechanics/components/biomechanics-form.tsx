"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Form, FormControl, FormField, FormLabel, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, MessageCircle, Info } from "lucide-react";
// Importações de componentes filhos (Certifique-se que os caminhos estão corretos ou comente se falhar)
import { BodyPainMap } from "./body-pain-map";
import { BiomechanicsSidebar } from "./biomechanics-sidebar";

export function BiomechanicsForm({ patientId }: { patientId: string }) {
    const form = useForm({
        defaultValues: {
            hma: { qp: "", history: "", duration: "", eva: [0] },
            pregressa: { treatments: [], meds: "", activityFreq: "sedentary", sports: [] },
            efep: [{ activity: "", score: 0 }],
            questionnaire: { selected: "" },
            shoe: { model: "", type: "" }
        }
    });

    const { fields: efepFields, append: appendEfep, remove: removeEfep } = useFieldArray({
        control: form.control,
        name: "efep"
    });

    const handleSendWhatsapp = () => {
        const quest = form.getValues("questionnaire.selected");
        if (!quest) return alert("Selecione um questionário primeiro!");
        window.open(`https://wa.me/?text=Olá, responda ao questionário ${quest}...`, "_blank");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
            {/* COLUNA ESQUERDA (8) */}
            <div className="lg:col-span-8 space-y-6">
                <Form {...form}>
                    <form className="space-y-6">

                        {/* O "defaultValue" garante que só o HMA inicie aberto */}
                        <Accordion type="multiple" defaultValue={["hma"]} className="w-full space-y-4">

                            {/* === 1. HMA (ABERTO) === */}
                            <AccordionItem value="hma" className="border rounded-xl bg-card px-2">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-primary">
                                    🗣️ História da Moléstia Atual (HMA)
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>Queixa Principal</FormLabel>
                                        <Input placeholder="Descreva a dor..." {...form.register("hma.qp")} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormLabel>Tempo de Dor</FormLabel>
                                            <Input placeholder="Ex: 2 meses" {...form.register("hma.duration")} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel>Intensidade (EVA)</FormLabel>
                                            <Slider max={10} step={1} defaultValue={[0]} onValueChange={(v) => form.setValue("hma.eva", v)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>História Detalhada</FormLabel>
                                        <Textarea className="min-h-[100px]" placeholder="Evolução dos sintomas..." {...form.register("hma.history")} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === 2. PREGRESSA (NOVO) === */}
                            <AccordionItem value="pregressa" className="border rounded-xl bg-card px-2">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-primary">
                                    📋 História Pregressa & Estilo de Vida
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-6">
                                    <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                                        <FormLabel className="font-bold">Tratamentos Prévios</FormLabel>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["Fisioterapia", "Palmilhas", "Infiltração", "Cirurgia", "Medicamentos"].map(i => (
                                                <div key={i} className="flex items-center gap-2"><Checkbox id={i} /><label htmlFor={i}>{i}</label></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Medicamentos em Uso</FormLabel>
                                        <Input {...form.register("pregressa.meds")} />
                                    </div>
                                    <div className="space-y-3">
                                        <FormLabel className="font-bold">Nível de Atividade</FormLabel>
                                        <RadioGroup defaultValue="sedentary" className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2"><RadioGroupItem value="sedentary" id="s1" /><label htmlFor="s1">Sedentário</label></div>
                                            <div className="flex items-center gap-2"><RadioGroupItem value="active" id="s2" /><label htmlFor="s2">Ativo (3x+)</label></div>
                                        </RadioGroup>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === 3. EFEP & WHATSAPP (NOVO) === */}
                            <AccordionItem value="efep" className="border rounded-xl bg-card px-2">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-primary">
                                    📉 Escala Funcional & Questionários
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <FormLabel className="font-bold">Escala EFEP</FormLabel>
                                            <Button type="button" size="sm" variant="outline" onClick={() => appendEfep({ activity: "", score: 0 })}><Plus className="w-4 h-4" /> Add</Button>
                                        </div>
                                        {efepFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <Input placeholder="Atividade difícil..." {...form.register(`efep.${index}.activity`)} />
                                                <Input type="number" className="w-20" placeholder="0-10" {...form.register(`efep.${index}.score`)} />
                                            </div>
                                        ))}
                                    </div>
                                    {/* Seção WhatsApp - Botão Seguro */}
                                    <div className="p-4 border border-green-200 bg-green-50 rounded-xl space-y-3">
                                        <div className="flex items-center gap-2 text-green-700 font-bold"><MessageCircle className="w-5 h-5" /> Enviar Questionário</div>
                                        <div className="flex gap-3">
                                            <Select onValueChange={(v) => form.setValue("questionnaire.selected", v)}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent><SelectItem value="LEFS">LEFS</SelectItem><SelectItem value="FAAM">FAAM</SelectItem></SelectContent>
                                            </Select>
                                            <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSendWhatsapp}>Enviar</Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* === 4. MAPA DE DOR === */}
                            <AccordionItem value="painmap" className="border rounded-xl bg-card px-2">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-primary">
                                    🎯 Mapeamento de Dor
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6">
                                    <BodyPainMap />
                                </AccordionContent>
                            </AccordionItem>

                            {/* === 5. ANÁLISE DE CALÇADOS (CORRIGIDO - SEM BOTÃO NO TÍTULO) === */}
                            <AccordionItem value="shoes" className="border rounded-xl bg-card px-2">
                                <AccordionTrigger className="px-4 hover:no-underline font-semibold text-lg text-primary">
                                    👟 Análise de Calçados
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-6 space-y-4">
                                    <div className="flex justify-end">
                                        {/* O botão "Como Avaliar" foi movido para cá (seguro) */}
                                        <Button type="button" variant="ghost" size="sm" className="text-blue-600">
                                            <Info className="w-4 h-4 mr-2" /> Como Avaliar (Tutorial)
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Modelo do Calçado</FormLabel>
                                        <Input placeholder="Marca e Modelo..." {...form.register("shoe.model")} />
                                    </div>
                                    {/* ... outros campos de calçado ... */}
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </form>
                </Form>
            </div>

            {/* DIREITA: DASHBOARD (4) */}
            <div className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-6"><BiomechanicsSidebar form={form} /></div>
            </div>
        </div>
    );
}

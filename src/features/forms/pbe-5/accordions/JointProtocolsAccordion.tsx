"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Box, ChevronRight, Zap, Search, AlertCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

import { LumbarRichProtocol } from "./protocols/LumbarRichProtocol";
import { CervicalRichProtocol } from "./protocols/CervicalRichProtocol";
import { KneeRichProtocol } from "./protocols/KneeRichProtocol";
import { AtmRichProtocol } from "./protocols/AtmRichProtocol";

const PROTOCOLS: Record<string, {
    label: string,
    component?: React.ReactNode,
    tests?: { id: string, label: string }[]
}> = {
    coluna_lombar: {
        label: "Protocolo de Coluna Lombar",
        component: <LumbarRichProtocol />
    },
    coluna_cervical: {
        label: "Protocolo de Coluna Cervical",
        component: <CervicalRichProtocol />
    },
    joelho: {
        label: "Protocolo de Joelho",
        component: <KneeRichProtocol />
    },
    atm: {
        label: "Protocolo de ATM (Temporomandibular)",
        component: <AtmRichProtocol />
    },
    ombro: {
        label: "Protocolo de Ombro",
        tests: [
            { id: "neer", label: "Teste de Neer (Impacto)" },
            { id: "hawkins", label: "Hawkins-Kennedy" },
            { id: "empty_can", label: "Empty Can (Supraespinal)" },
            { id: "speed", label: "Teste de Speed (Bíceps)" },
            { id: "o_brien", label: "O'Brien (Labrum)" }
        ]
    },
    quadril: {
        label: "Protocolo de Quadril",
        tests: [
            { id: "fadir", label: "Teste de FADIR (Impacto)" },
            { id: "faber", label: "Teste de FABER (SIJ/Quadril)" },
            { id: "thomas", label: "Teste de Thomas (Iliopsoas)" },
            { id: "ober", label: "Teste de Ober (Tracto Iliotibial)" },
            { id: "trendelenburg", label: "Sinal de Trendelenburg" }
        ]
    },
    tornozelo_pe: {
        label: "Protocolo Tornozelo e Pé",
        tests: [
            { id: "lunge", label: "Lunge Test (Dorsiflexão)" },
            { id: "navicular_drop", label: "Navicular Drop" },
            { id: "windlass", label: "Teste de Windlass (Fáscia)" },
            { id: "anterior_drawer", label: "Gaveta Anterior" }
        ]
    },
    cotovelo_mao: {
        label: "Protocolo Cotovelo, Punho e Mão",
        tests: [
            { id: "cozen", label: "Teste de Cozen (Epicondilite)" },
            { id: "phallen", label: "Teste de Phallen (Túnel do Carpo)" },
            { id: "finkelstein", label: "De Quervain (Finkelstein)" }
        ]
    }
};

interface JointProtocolsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string; bg: string };
}

export function JointProtocolsAccordion({ openSection, isSectionFilled, sectionStyle }: JointProtocolsAccordionProps) {
    const { register, watch, setValue } = useFormContext();

    const selectedRegions = watch('anamnesis.mainRegions') || [];
    const activeProtocols = selectedRegions.filter((r: string) => PROTOCOLS[r]);

    return (
        <AccordionItem
            value="protocols"
            className={cn(
                "border rounded-[2rem] border-l-4 transition-all duration-300 shadow-sm overflow-hidden",
                openSection === 'protocols' ? 'bg-white ring-2 ring-purple-50' : 'bg-white/50',
                isSectionFilled('protocols') ? 'border-slate-200' : 'border-slate-100',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-8 py-6 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn("p-2 rounded-xl transition-colors", openSection === 'protocols' ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600")}>
                        <Layers className="h-5 w-5 transition-colors group-hover:animate-bounce" />
                    </div>
                    <div>
                        <span className={cn("font-black text-lg tracking-tight", openSection === 'protocols' ? "text-slate-900" : "text-slate-600")}>Protocolos Regionais (Específicos)</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Testes ortopédicos e funcionais por articulação</p>
                    </div>
                </div>
                {activeProtocols.length > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-none text-[10px] h-6 px-3 rounded-full font-black uppercase">
                        {activeProtocols.length} REG {activeProtocols.length === 1 ? 'ATIVA' : 'ATIVAS'}
                    </Badge>
                )}
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-10 pt-4 space-y-12 border-t border-slate-50">
                {activeProtocols.length > 0 ? (
                    <div className="grid grid-cols-1 gap-12 max-w-6xl mx-auto">
                        {activeProtocols.map((regionId: string) => {
                            const protocol = PROTOCOLS[regionId];
                            return (
                                <div key={regionId} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">{protocol.label}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Bateria de testes Padrão Ouro</p>
                                        </div>
                                    </div>

                                    {protocol.component ? (
                                        <div className="mt-4">
                                            {protocol.component}
                                        </div>
                                    ) : (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {protocol.tests?.map(test => (
                                                <div key={test.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-purple-200 hover:shadow-md transition-all group">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="h-6 w-6 rounded-lg border border-slate-200 flex items-center justify-center group-hover:bg-purple-600 group-hover:border-purple-600 transition-colors">
                                                            <Checkbox
                                                                className="data-[state=checked]:bg-transparent border-none shadow-none"
                                                                checked={!!watch(`protocols.${regionId}.${test.id}.checked`)}
                                                                onCheckedChange={(val) => setValue(`protocols.${regionId}.${test.id}.checked`, val)}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{test.label}</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Resultado / Observação</span>
                                                            <Input
                                                                {...register(`protocols.${regionId}.${test.id}.result`)}
                                                                placeholder="Ex: Positivo, 20°, etc..."
                                                                className="h-9 rounded-xl bg-slate-50 border-none text-xs font-bold focus:bg-white focus:ring-1 focus:ring-purple-200 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 max-w-2xl mx-auto flex flex-col items-center gap-6">
                        <div className="h-16 w-16 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 border border-slate-50">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Nenhuma Região Ativa</h4>
                            <p className="text-xs font-bold text-slate-400 max-w-xs mx-auto leading-relaxed uppercase">
                                Selecione uma região articular na <span className="text-blue-600">Etapa 1 (Anamnese)</span> para habilitar os protocolos automáticos.
                            </p>
                        </div>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}


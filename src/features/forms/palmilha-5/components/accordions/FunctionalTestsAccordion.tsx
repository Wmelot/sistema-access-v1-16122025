import React from "react";
import { useFormContext } from "react-hook-form";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { BipolarSlider } from "@/components/ui/bipolar-slider";
import { checkStatus } from "@/utils/clinical-references";

export const ReferenceStatus = ({ value, type }: { value: any, type: string }) => {
    const v = Number(value);
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">Sem Dados</div>;

    const status = checkStatus(type as any, v);

    if (!status) return <div className="text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase bg-slate-100 text-slate-400 border-slate-200">-</div>;

    return <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded border mt-1 w-full text-center uppercase transition-all duration-300", status.color)}>{status.label}</div>;
};

interface FunctionalTestsAccordionProps {
    openSection: string;
    isSectionFilled: (section: string) => boolean;
    sectionStyle: { border: string; iconColor: string };
}

export function FunctionalTestsAccordion({ openSection, isSectionFilled, sectionStyle }: FunctionalTestsAccordionProps) {
    const form = useFormContext();

    const getVal = (side: string, key: string) => {
        return Number(form.watch(`tests.ybalance.${key}.${side}`)) || 0;
    };

    const getPct = (val: number, side: string) => {
        const legLength = Number(form.watch(`tests.ybalance.legLength.${side}`)) || 0;
        return legLength > 0 && val > 0 ? Math.round((val / legLength) * 100) : 0;
    };

    const lAnt = getVal("left", "Anterior");
    const rAnt = getVal("right", "Anterior");
    const diffAnt = Math.abs(lAnt - rAnt);

    const lPm = getVal("left", "Post-Med");
    const rPm = getVal("right", "Post-Med");
    const diffPm = Math.abs(lPm - rPm);

    const lPl = getVal("left", "Post-Lat");
    const rPl = getVal("right", "Post-Lat");
    const diffPl = Math.abs(lPl - rPl);

    const lComp = (lAnt + lPm + lPl) / 3;
    const lScore = getPct(lComp, "left");

    const rComp = (rAnt + rPm + rPl) / 3;
    const rScore = getPct(rComp, "right");

    const directions = [
        { label: "Anterior", key: "Anterior" },
        { label: "Póstero-Medial", key: "Post-Med" },
        { label: "Póstero-Lateral", key: "Post-Lat" }
    ];

    return (
        <AccordionItem
            value="orto"
            data-value="orto"
            className={cn(
                "border rounded-xl border-l-4 transition-all duration-300 shadow-sm",
                openSection === 'orto' ? 'col-span-1 md:col-span-2 bg-white ring-2 ring-sky-50' : 'col-span-1 bg-white/50 border-slate-200',
                isSectionFilled('orto') ? 'bg-slate-50/80 border-slate-200' : 'bg-card',
                sectionStyle.border
            )}
        >
            <AccordionTrigger className="px-5 py-4 font-bold text-slate-700 hover:no-underline flex gap-2 items-center text-left group">
                <div className="flex items-center gap-3 flex-1 text-base">
                    <Flame className={cn("h-5 w-5 transition-colors group-hover:animate-bounce", sectionStyle.iconColor)} />
                    <span className="font-bold tracking-tight text-slate-700 group-hover:text-sky-600 transition-colors">Testes Funcionais (Ortostatismo)</span>
                </div>
                <div className="flex items-center gap-2 mr-4">
                    {isSectionFilled('orto') && <Badge variant="outline" className="bg-sky-50 text-sky-600 border-none text-[10px] h-5 font-black tracking-widest uppercase">PREENCHIDO</Badge>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 space-y-8 border-t border-slate-50">

                {/* Teste de Jack */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-sm mb-4 text-slate-700">Teste de Jack</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <FormLabel className="text-blue-600 font-bold uppercase text-[10px]">Esquerdo</FormLabel>
                            <BipolarSlider value={Number(form.watch("tests.jack.left"))} onChange={(v) => form.setValue("tests.jack.left", v)} />
                            <ReferenceStatus type="jack" value={form.watch("tests.jack.left")} />
                        </div>
                        <div>
                            <FormLabel className="text-green-600 font-bold uppercase text-[10px]">Direito</FormLabel>
                            <BipolarSlider value={Number(form.watch("tests.jack.right"))} onChange={(v) => form.setValue("tests.jack.right", v)} />
                            <ReferenceStatus type="jack" value={form.watch("tests.jack.right")} />
                        </div>
                    </div>
                </div>

                {/* Lunge Teste e Comprimento de Perna */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Lunge Teste (º)</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Input placeholder="Esquerdo" type="number" {...form.register("tests.lunge.left")} className="h-10 text-center font-bold" />
                                <ReferenceStatus type="lunge" value={form.watch("tests.lunge.left")} />
                            </div>
                            <div>
                                <Input placeholder="Direito" type="number" {...form.register("tests.lunge.right")} className="h-10 text-center font-bold" />
                                <ReferenceStatus type="lunge" value={form.watch("tests.lunge.right")} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Comprimento Membro Inferior (cm)</FormLabel>
                        <div className="flex gap-2 border border-slate-200 rounded-lg p-1 bg-slate-50">
                            <Input placeholder="Esquerdo" type="number" {...form.register("tests.ybalance.legLength.left")} className="h-10 text-center font-bold bg-white" />
                            <Input placeholder="Direito" type="number" {...form.register("tests.ybalance.legLength.right")} className="h-10 text-center font-bold bg-white" />
                        </div>
                    </div>
                </div>

                {/* Y-BALANCE TESTE - NOVO LAYOUT SIMPLIFICADO */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-3 border-b border-slate-100 gap-3">
                        <h4 className="font-bold text-sm text-slate-700">Y-Balance Teste</h4>
                        <div className="flex items-center gap-4 text-[10px] bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <span className="font-bold uppercase text-slate-500">Membro Inferior Dominante:</span>
                            <div className="flex items-center gap-1.5">
                                <Checkbox id="dom-esq" checked={form.watch("tests.ybalance.dominance") === "left"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "left")} />
                                <label htmlFor="dom-esq" className="cursor-pointer font-bold text-blue-600 uppercase">Esquerda</label>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Checkbox id="dom-dir" checked={form.watch("tests.ybalance.dominance") === "right"} onCheckedChange={() => form.setValue("tests.ybalance.dominance", "right")} />
                                <label htmlFor="dom-dir" className="cursor-pointer font-bold text-green-600 uppercase">Direita</label>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                        <table className="w-full text-sm text-center min-w-[500px]">
                            <thead className="text-[10px] uppercase text-slate-400 bg-slate-50">
                                <tr>
                                    <th className="p-3 text-left rounded-tl-lg font-black tracking-wider">Direção</th>
                                    <th className="p-3 bg-blue-50/50 text-blue-800 font-black">Esquerda (cm)</th>
                                    <th className="p-3 bg-blue-50 text-blue-900 border-r border-white">%</th>
                                    <th className="p-3 bg-green-50/50 text-green-800 font-black">Direita (cm)</th>
                                    <th className="p-3 bg-green-50 text-green-900 rounded-tr-lg">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {directions.map((dir, idx) => {
                                    const lVal = getVal("left", dir.key);
                                    const rVal = getVal("right", dir.key);
                                    const lPct = getPct(lVal, "left");
                                    const rPct = getPct(rVal, "right");
                                    const isLast = idx === directions.length - 1;

                                    return (
                                        <tr key={dir.key} className={cn(!isLast && "border-b border-slate-100")}>
                                            <td className="text-left p-3 font-semibold text-slate-700 text-xs">{dir.label}</td>

                                            <td className="p-2 bg-blue-50/20">
                                                <Input className="h-9 w-24 mx-auto text-center font-bold text-blue-900 bg-white shadow-sm border-blue-100" type="number" placeholder="cm" {...form.register(`tests.ybalance.${dir.key}.left` as any, { valueAsNumber: true })} />
                                            </td>
                                            <td className="p-2 text-xs font-black text-blue-600 bg-blue-50/40 border-r border-white">{lPct ? `${lPct}%` : "-"}</td>

                                            <td className="p-2 bg-green-50/20">
                                                <Input className="h-9 w-24 mx-auto text-center font-bold text-green-900 bg-white shadow-sm border-green-100" type="number" placeholder="cm" {...form.register(`tests.ybalance.${dir.key}.right` as any, { valueAsNumber: true })} />
                                            </td>
                                            <td className="p-2 text-xs font-black text-green-600 bg-green-50/40">{rPct ? `${rPct}%` : "-"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* RESULTADO CONDICIONAL Y-BALANCE (CAIXINHAS COLORIDAS) */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Verificação de Assimetria Anterior */}
                        {diffAnt > 4 ? (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-red-200 flex items-center justify-center gap-2 shadow-sm">
                                Assimetria Anterior: {Math.round(diffAnt)}cm <span className="text-red-400 bg-red-100 px-2 py-0.5 rounded-full">(Risco)</span>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-emerald-200 flex items-center justify-center gap-2 shadow-sm">
                                Simetria Anterior <span className="text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">(Normal)</span>
                            </div>
                        )}

                        {/* Verificação de Score Composto Perna Esquerda */}
                        {lScore > 0 && lScore < 94 ? (
                            <div className="bg-amber-50 text-amber-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-amber-200 flex items-center justify-center gap-2 shadow-sm">
                                Score Esq: {lScore}% <span className="text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">(Atenção)</span>
                            </div>
                        ) : lScore >= 94 ? (
                            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-emerald-200 flex items-center justify-center gap-2 shadow-sm">
                                Score Esq: {lScore}% <span className="text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">(Excelente)</span>
                            </div>
                        ) : (
                            <div className="bg-slate-50 text-slate-400 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-slate-200 flex items-center justify-center shadow-sm">
                                {Number(form.watch("tests.ybalance.legLength.left")) ? "Score Esq: Preencha..." : "Score Esq: Faltou Membro (cm)"}
                            </div>
                        )}

                        {/* Verificação de Score Composto Perna Direita */}
                        {rScore > 0 && rScore < 94 ? (
                            <div className="bg-amber-50 text-amber-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-amber-200 flex items-center justify-center gap-2 shadow-sm">
                                Score Dir: {rScore}% <span className="text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">(Atenção)</span>
                            </div>
                        ) : rScore >= 94 ? (
                            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-emerald-200 flex items-center justify-center gap-2 shadow-sm">
                                Score Dir: {rScore}% <span className="text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded-full">(Excelente)</span>
                            </div>
                        ) : (
                            <div className="bg-slate-50 text-slate-400 p-3 rounded-lg text-center text-[10px] font-black tracking-widest uppercase border border-slate-200 flex items-center justify-center shadow-sm">
                                {Number(form.watch("tests.ybalance.legLength.right")) ? "Score Dir: Preencha..." : "Score Dir: Faltou Membro (cm)"}
                            </div>
                        )}
                    </div>

                    {/* INTERPRETAÇÃO CLÍNICA AUTOMÁTICA */}
                    {(lScore > 0 || rScore > 0 || diffAnt > 0) && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h5 className="text-xs font-black uppercase text-slate-700 border-b border-slate-200 pb-2 mb-2">Interpretação Clínica (Y-Balance)</h5>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                <span className="font-bold">O que significa?</span> O Y-Balance avalia a estabilidade pélvica e controle neuromuscular dinâmico. Pontuações baixas indicam risco elevado de lesão em membros inferiores. As assimetrias anteriores (&gt;4cm) e posteriores (&gt;6cm) são os principais preditores clínicos na literatura.
                            </p>
                            <ul className="text-xs text-slate-600 leading-relaxed space-y-1 list-disc pl-4">
                                {diffAnt > 4 ? (
                                    <li className="text-red-700 font-bold"><span className="text-red-500">⚠ Assimetria Anterior &gt; 4cm:</span> Há um déficit significativo de mobilidade ou controle em uma das pernas (provável limitação de dorsiflexão, quadril ou core). Risco ~2.5x maior de lesões sem contato.</li>
                                ) : diffAnt > 0 ? (
                                    <li className="text-emerald-700"><span className="font-bold text-emerald-600">✓ Simetria Anterior Normal (≤ 4cm):</span> Mobilidade ântero-posterior entre as pernas está equilibrada.</li>
                                ) : null}

                                {diffPm > 6 || diffPl > 6 ? (
                                    <li className="text-red-700 font-bold"><span className="text-red-500">⚠ Assimetria Posterior &gt; 6cm:</span> Há uma diferença considerável de alcance nas direções póstero-medial ou póstero-lateral, indicando déficit de força/controle pélvico.</li>
                                ) : (diffPm > 0 || diffPl > 0) ? (
                                    <li className="text-emerald-700"><span className="font-bold text-emerald-600">✓ Simetria Posterior Normal (≤ 6cm):</span> Distribuição de controle póstero-latero-medial equilibrada.</li>
                                ) : null}

                                {(lScore > 0 && lScore < 94) || (rScore > 0 && rScore < 94) ? (
                                    <li className="text-amber-700 font-bold"><span className="text-amber-500">⚠ Score Composto &lt; 94%:</span> Pelo menos uma das pernas não alcançou a distância ideal baseada no comprimento do membro. Indica déficit global de equilíbrio e controle motor.</li>
                                ) : (lScore >= 94 || rScore >= 94) ? (
                                    <li className="text-emerald-700"><span className="font-bold text-emerald-600">✓ Score Composto Excelente (≥ 94%):</span> Controle sensório-motor adequado para alta demanda.</li>
                                ) : null}
                            </ul>
                        </div>
                    )}
                </div>

            </AccordionContent>
        </AccordionItem>
    );
}

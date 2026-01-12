
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Box, Info, RotateCcw, Scale, Layers, ArrowDownRight, Shield, Calculator } from 'lucide-react';

interface FieldShoeRecommendationProps {
    field: any;
    isPreview: boolean;
}

export const FieldShoeRecommendation = ({ field, isPreview }: FieldShoeRecommendationProps) => {

    const getShoeRecommendation = () => {
        return (
            <>
                <div className="mt-4 border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">Modelo</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Índice</th>
                                <th className="px-4 py-2">Drop</th>
                                <th className="px-4 py-2">Peso (g)</th>
                                <th className="px-4 py-2">Stack (mm)</th>
                                <th className="px-4 py-2">Flexibilidade</th>
                                <th className="px-4 py-2">Estabilidade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {/* Example Recommendations based on typical categories */}
                            <tr className="bg-white hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium">Merrell Vapor Glove 6</td>
                                <td className="px-4 py-2">Minimalista</td>
                                <td className="px-4 py-2">96%</td>
                                <td className="px-4 py-2">0mm</td>
                                <td className="px-4 py-2">150g</td>
                                <td className="px-4 py-2">6mm</td>
                                <td className="px-4 py-2">Alta</td>
                                <td className="px-4 py-2">Mínima</td>
                            </tr>
                            <tr className="bg-white hover:bg-gray-50">
                                <td className="px-4 py-2">Altra Escalante 3</td>
                                <td className="px-4 py-2">Transição</td>
                                <td className="px-4 py-2">70%</td>
                                <td className="px-4 py-2">0mm</td>
                                <td className="px-4 py-2">263g</td>
                                <td className="px-4 py-2">24mm</td>
                                <td className="px-4 py-2">Média</td>
                                <td className="px-4 py-2">Neutra</td>
                            </tr>
                            <tr className="bg-white hover:bg-gray-50">
                                <td className="px-4 py-2">Hoka Clifton 9</td>
                                <td className="px-4 py-2">Maximalista</td>
                                <td className="px-4 py-2">12%</td>
                                <td className="px-4 py-2">5mm</td>
                                <td className="px-4 py-2">248g</td>
                                <td className="px-4 py-2">32mm</td>
                                <td className="px-4 py-2">Baixa</td>
                                <td className="px-4 py-2">Estável</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="p-2 bg-yellow-50 text-yellow-800 text-xs border-t border-yellow-100">
                        * Recomendação baseada no Índice de Minimalismo calculado e perfil do corredor.
                    </div>
                </div>

                {/* SIMULATED AI ORIENTATION */}
                <div className="mt-4 space-y-2">
                    <Label className="flex items-center gap-2 text-primary font-bold">
                        <Box className="h-4 w-4" />
                        Orientação Personalizada (Simulação IA)
                    </Label>
                    <div className="relative">
                        <Textarea
                            readOnly
                            className="min-h-[220px] bg-blue-50/50 border-blue-200 text-sm leading-relaxed resize-none p-4"
                            value={`Com base na avaliação biomecânica e histórico do paciente:
            
1. RECOMENDAÇÃO DE TIPO: TRANSITION (Índice ~70%)
Devido ao histórico de desconforto no joelho anterior (femoropatelar) e experiência recreativa (>6 meses), o ideal é buscar tênis com Índice de Minimalismo acima de 70% ou modelos de Transição. Isso ajuda a reduzir a carga no joelho através de uma cadência naturalmente maior.

2. TRANSIÇÃO E ADAPTAÇÃO:
- Semana 1-2: Usar o novo tênis apenas em treinos curtos (ou caminhadas).
- Semana 3-4: Alternar com o tênis antigo (50/50).
- Mês 2: Uso contínuo se não houver dores na panturrilha/tendão de Aquiles.

3. O QUE BUSCAR NO TÊNIS:
- Drop: Preferência por < 6mm.
- Peso: < 250g (quanto mais leve, melhor para a mecânica).
- Flexibilidade: Moderada a Alta.
- Stack: Moderado (evitar >30mm se buscar propriocepção).`}
                        />
                        <div className="absolute top-2 right-2">
                            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                                IA Gerada
                            </span>
                        </div>
                    </div>
                </div>

                {/* GLOSSARY OF VARIABLES (Infographic Content) */}
                <div className="mt-6 border-t pt-4">
                    <Label className="flex items-center gap-2 text-muted-foreground font-semibold text-xs uppercase mb-4">
                        <Info className="h-4 w-4" />
                        Entenda as Variáveis (Critérios do Índice Minimalista)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                            <div className="flex-none h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                <RotateCcw className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-1">Flexibilidade</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    O tênis é testado para ver o quanto dobra para frente e para os lados (torção).
                                    Quanto mais flexível, maior a pontuação neste critério.
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                            <div className="flex-none h-10 w-10 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                <Scale className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-1">Peso</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Basta pesar o tênis em uma balança. Quanto mais leve for o calçado,
                                    maior será a pontuação neste critério do Índice Minimalista.
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                            <div className="flex-none h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                                <Layers className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-1">Stack Height (Altura da Sola)</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Medida no centro do calcanhar, avalia a espessura total entre onde seu pé fica e o chão.
                                    Quanto mais fina a sola, maior a pontuação.
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                            <div className="flex-none h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                                <ArrowDownRight className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-1">Drop (Salto)</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Diferença de altura entre o calcanhar e a ponta do pé.
                                    Quanto mais próximo de zero, maior a pontuação no Índice Minimalista.
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border md:col-span-2 flex gap-3">
                            <div className="flex-none h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <Shield className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-1">Estabilidade e Controle</h4>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Identifique tecnologias usadas para controlar a pisada (placas, postes duros).
                                    Menos tecnologias (mais naturalidade) significa uma pontuação maior.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground text-right">
                        Fonte: TheRunningClinic.com
                    </div>
                </div>
            </>
        )
    };

    return (
        <div className="grid gap-2">
            <Label className="flex items-center gap-2">
                <span className="text-primary"><Calculator className="w-4 h-4" /></span>
                {field.label || 'Recomendação de Calçados'}
            </Label>
            {isPreview ? getShoeRecommendation() : (
                <div className="p-4 border border-dashed rounded text-center text-muted-foreground text-sm bg-gray-50">
                    Tabela de Recomendação de Tênis (Visível no Relatório/Preview)
                </div>
            )}
        </div>
    );
};

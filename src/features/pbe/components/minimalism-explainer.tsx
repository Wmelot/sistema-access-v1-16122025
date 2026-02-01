import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import {
    RotateCcw,
    Scale,
    Layers,
    ArrowDownRight,
    Shield,
    Info
} from "lucide-react"

export function MinimalismExplainer() {
    return (
        <div className="space-y-4 mt-8 print:break-inside-avoid">
            <div className="flex items-center gap-2 text-slate-500 mb-4">
                <Info className="w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                    ENTENDA AS VARIÁVEIS (CRITÉRIOS DO ÍNDICE MINIMALISTA)
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FLEXIBILIDADE */}
                <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Flexibilidade</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                O tênis é testado para ver o quanto dobra para frente e para os lados
                                (torção). Quanto mais flexível, maior a pontuação neste critério.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* PESO */}
                <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0">
                            <Scale className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Peso</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Basta pesar o tênis em uma balança. Quanto mais leve for o calçado, maior
                                será a pontuação neste critério do Índice Minimalista.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* STACK HEIGHT */}
                <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Stack Height (Altura da Sola)</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Medida no centro do calcanhar, avalia a espessura total entre onde seu pé
                                fica e o chão. Quanto mais fina a sola, maior a pontuação.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* DROP */}
                <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
                            <ArrowDownRight className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Drop (Salto)</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Diferença de altura entre o calcanhar e a ponta do pé. Quanto mais próximo
                                de zero, maior a pontuação no Índice Minimalista.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* ESTABILIDADE */}
                <Card className="bg-slate-50/50 border-slate-100 shadow-sm md:col-span-2">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Estabilidade e Controle</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Identifique tecnologias usadas para controlar a pisada (placas, postes duros).
                                Menos tecnologias (mais naturalidade) significa uma pontuação maior.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-right text-[10px] text-slate-400 mt-2">
                Fonte: TheRunningClinic.com
            </div>
        </div>
    )
}

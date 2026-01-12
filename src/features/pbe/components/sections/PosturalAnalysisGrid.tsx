
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Ruler, UserCheck } from "lucide-react"

export function PosturalAnalysisGrid() {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-500" />
                    Avaliação Postural (Fotos)
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {['Vista Anterior', 'Vista Posterior', 'Vista Lateral Direita', 'Vista Lateral Esquerda'].map((view) => (
                        <div key={view} className="aspect-[3/4] bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-white group-hover:scale-110 transition-transform">
                                <Ruler className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-700 text-center px-4">{view}</span>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold group-hover:text-indigo-400">Adicionar Foto</span>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
                            <Ruler className="w-4 h-4" />
                            Observações Gerais
                        </h4>
                        <textarea
                            className="w-full bg-white border-slate-200 rounded min-h-[100px] text-sm p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
                            placeholder="Descreva desvios posturais observados..."
                        ></textarea>
                    </div>
                    <div className="flex flex-col justify-center text-sm text-slate-500 space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="font-bold text-yellow-700 block mb-1">Dica de Avaliação:</span>
                        <p>Certifique-se que o paciente esteja posicionado no centro do grid demarcado no chão/parede.</p>
                        <p>Utilize o aplicativo móvel para capturar as fotos diretamente para o prontuário.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

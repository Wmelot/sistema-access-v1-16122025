
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText, ExternalLink, Clock, Send, AlertTriangle, CheckCircle, Activity, ChevronRight, Ruler, UserCheck, Accessibility } from 'lucide-react'
import { cn } from "@/lib/utils"

interface LumbarSpineFormProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function LumbarSpineForm({ data, updateField, readOnly }: LumbarSpineFormProps) {
    // Simulação de dados vindos do módulo de questionários
    const patientOutcomeData = {
        startBack: { status: 'completed', score: 'Médio Risco', date: '02/01/2026' },
        oswestry: { status: 'pending', score: null, date: null },
    };

    return (
        <div className="space-y-6">
            {/* --- WIDGET DE INTEGRAÇÃO PROMS --- */}
            <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <FileText className="mr-2 text-indigo-500 h-5 w-5" />
                        Indicadores e Questionários
                    </h3>
                    <button className="text-indigo-600 text-sm font-semibold flex items-center hover:underline">
                        Ir para Módulo de Follow-up <ExternalLink size={14} className="ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: STarT Back */}
                    <div className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Triagem Psicossocial</span>
                            <div className="text-indigo-900 font-bold text-lg mt-1">STarT Back</div>
                        </div>
                        <div className="mt-3">
                            {patientOutcomeData.startBack.status === 'completed' ? (
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> {patientOutcomeData.startBack.score}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Respondido em: {patientOutcomeData.startBack.date}
                                    </p>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm flex items-center"><Clock size={14} className="mr-1" /> Pendente</span>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Oswestry (ODI) */}
                    <div className="border rounded-lg p-4 bg-gray-50 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Incapacidade Funcional</span>
                            <div className="text-indigo-900 font-bold text-lg">Oswestry (ODI)</div>
                        </div>
                        <div className="mt-3">
                            <button className="w-full flex items-center justify-center px-3 py-1.5 border border-indigo-300 shadow-sm text-xs font-medium rounded text-indigo-700 bg-white hover:bg-indigo-50 transition-colors">
                                <Send size={12} className="mr-1.5" /> Enviar para Paciente
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- NAVEGAÇÃO POR POSIÇÃO --- */}
            <Tabs defaultValue="standing" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg mb-6">
                    <TabsTrigger value="standing" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-semibold">
                        🧍 Ortostatismo (Em Pé)
                    </TabsTrigger>
                    <TabsTrigger value="sitting" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-semibold">
                        🪑 Sentado
                    </TabsTrigger>
                    <TabsTrigger value="lying" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-semibold">
                        🛌 Deitado (Supino/Prono)
                    </TabsTrigger>
                </TabsList>


                {/* === ABA 1: ORTOSTATISMO === */}
                <TabsContent value="standing" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">

                    {/* --- CARD AVALIAÇÃO POSTURAL (NOVO) --- */}
                    <Card>
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-indigo-500" />
                                Avaliação Postural
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Grid de Fotos */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                {['Vista anterior', 'Vista posterior', 'Vista lateral Direita', 'Vista lateral esquerda'].map((view) => (
                                    <div key={view} className="aspect-[3/4] bg-white border border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors group relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                                        <Ruler className="w-6 h-6 text-slate-300 group-hover:text-indigo-400 mb-2" />
                                        <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600 text-center px-1">{view}</span>
                                        <span className="text-[10px] text-slate-400 mt-1">(Clique para add)</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                                <Ruler className="w-3 h-3" />
                                <span>As fotos serão salvas automaticamente com o grid de referência sobreposto.</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Accessibility className="w-5 h-5 text-indigo-500" />
                                Avaliação do Movimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            {/* Shift Lateral */}
                            <div className="grid md:grid-cols-2 gap-4 bg-blue-50/30 p-4 rounded-lg border border-blue-100">
                                <div className="space-y-2">
                                    <Label className="uppercase text-xs font-bold text-slate-500">Shift Lateral</Label>
                                    <Select value={data.physicalExam?.mckenzie?.shift || 'absent'} onValueChange={(v) => updateField('physicalExam.mckenzie.shift', v)}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="absent">Ausente</SelectItem>
                                            <SelectItem value="present_right">Presente (Direita)</SelectItem>
                                            <SelectItem value="present_left">Presente (Esquerda)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase text-xs font-bold text-slate-500">Correção Relevante?</Label>
                                    <Select value={data.physicalExam?.mckenzie?.correction || 'none'} onValueChange={(v) => updateField('physicalExam.mckenzie.correction', v)}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="--" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">--</SelectItem>
                                            <SelectItem value="yes">Sim</SelectItem>
                                            <SelectItem value="no">Não (Irrelevante)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Movimentos Repetidos (Expandido) */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 text-indigo-800">1. Movimentos Repetidos (Carga)</h4>
                                <div className="border rounded-md overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-12 bg-slate-100 p-2 text-xs font-bold text-slate-600 uppercase border-b">
                                        <div className="col-span-4 pl-2">Movimento</div>
                                        <div className="col-span-4">Resposta Sintomática</div>
                                        <div className="col-span-4">Fenômeno</div>
                                    </div>
                                    {[
                                        { id: 'flex_stand', label: 'Flexão (Em pé)' },
                                        { id: 'ext_stand', label: 'Extensão (Em pé)' },
                                        { id: 'side_glide_r', label: 'Inclinação Lateral (D)' },
                                        { id: 'side_glide_l', label: 'Inclinação Lateral (E)' },
                                        { id: 'rot_r', label: 'Rotação (D)' },
                                        { id: 'rot_l', label: 'Rotação (E)' },
                                        { id: 'shift_corr', label: 'Correção de Shift' }
                                    ].map((move, idx) => (
                                        <div key={move.id} className={cn("grid grid-cols-12 p-2 items-center gap-2 border-b last:border-0", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                            <div className="col-span-4 font-medium text-sm pl-2">{move.label}</div>
                                            <div className="col-span-4">
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.response || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.response`, v)}>
                                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="better">Melhora</SelectItem>
                                                        <SelectItem value="worse">Piora</SelectItem>
                                                        <SelectItem value="no_effect">Sem efeito</SelectItem>
                                                        <SelectItem value="produce">Produz dor</SelectItem>
                                                        <SelectItem value="abolish">Abole dor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-4">
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.phenomenon`, v)}>
                                                    <SelectTrigger className={cn("h-8 text-xs transition-colors",
                                                        data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon === 'centralize' ? "bg-green-50 text-green-700 border-green-200 font-medium" :
                                                            data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon === 'peripheralize' ? "bg-red-50 text-red-700 border-red-200 font-medium" : "bg-white border-slate-200"
                                                    )}>
                                                        <SelectValue placeholder="--" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">--</SelectItem>
                                                        <SelectItem value="centralize" className="text-green-600 font-medium">Centraliza</SelectItem>
                                                        <SelectItem value="peripheralize" className="text-red-600 font-medium">Periferaliza</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Testes Funcionais */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 text-indigo-800 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> 2. Testes Funcionais & Marcha
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className={cn("flex items-center gap-2 border p-2 rounded w-full transition-all", data.physicalExam?.functional?.gait?.heels ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
                                            <Checkbox
                                                id="heel_walk"
                                                checked={data.physicalExam?.functional?.gait?.heels}
                                                onCheckedChange={(c) => updateField('physicalExam.functional.gait.heels', c)}
                                                className="data-[state=checked]:bg-red-600 border-slate-300"
                                            />
                                            <Label htmlFor="heel_walk" className={cn("cursor-pointer flex items-center", data.physicalExam?.functional?.gait?.heels ? "text-red-700 font-bold" : "text-slate-700")}>
                                                Caminhada Calcanhares (L5)
                                                {data.physicalExam?.functional?.gait?.heels && <span className="ml-1 text-red-600 font-extrabold text-[10px] uppercase tracking-wider">POSITIVO (+)</span>}
                                            </Label>
                                        </div>
                                        <div className={cn("flex items-center gap-2 border p-2 rounded w-full transition-all", data.physicalExam?.functional?.gait?.toes ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
                                            <Checkbox
                                                id="toe_walk"
                                                checked={data.physicalExam?.functional?.gait?.toes}
                                                onCheckedChange={(c) => updateField('physicalExam.functional.gait.toes', c)}
                                                className="data-[state=checked]:bg-red-600 border-slate-300"
                                            />
                                            <Label htmlFor="toe_walk" className={cn("cursor-pointer flex items-center", data.physicalExam?.functional?.gait?.toes ? "text-red-700 font-bold" : "text-slate-700")}>
                                                Caminhada Ponta dos Pés (S1)
                                                {data.physicalExam?.functional?.gait?.toes && <span className="ml-1 text-red-600 font-extrabold text-[10px] uppercase tracking-wider">POSITIVO (+)</span>}
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {['Direito', 'Esquerdo'].map((side) => {
                                            const key = side === 'Direito' ? 'right' : 'left'
                                            return (
                                                <div key={key} className="bg-slate-50 p-3 rounded-lg border">
                                                    <span className="font-semibold text-sm block mb-2">Apoio Unipodal ({side})</span>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span>Equilíbrio</span>
                                                            <Select value={data.physicalExam?.functional?.singleLeg?.[key]?.balance || 'normal'} onValueChange={(v) => updateField(`physicalExam.functional.singleLeg.${key}.balance`, v)}>
                                                                <SelectTrigger className="w-[110px] h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                                                                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="reduced">Reduzido</SelectItem></SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span>Controle Motor</span>
                                                            <Select value={data.physicalExam?.functional?.singleLeg?.[key]?.control || 'normal'} onValueChange={(v) => updateField(`physicalExam.functional.singleLeg.${key}.control`, v)}>
                                                                <SelectTrigger className="w-[110px] h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                                                                <SelectContent><SelectItem value="normal">Bom</SelectItem><SelectItem value="poor">Pobre</SelectItem></SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span>Queda Pélvica</span>
                                                            <Select value={data.physicalExam?.functional?.singleLeg?.[key]?.pelvicDrop || 'normal'} onValueChange={(v) => updateField(`physicalExam.functional.singleLeg.${key}.pelvicDrop`, v)}>
                                                                <SelectTrigger className="w-[110px] h-7 text-xs bg-white"><SelectValue /></SelectTrigger>
                                                                <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="increased">Aumentada</SelectItem></SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === ABA 2: SENTADO === */}
                <TabsContent value="sitting" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Card>
                        <CardHeader className="pb-3 border-b bg-purple-50/50">
                            <CardTitle className="text-base flex items-center gap-2 text-purple-900">
                                <Activity className="w-5 h-5 text-purple-500" />
                                Exame Neurológico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                {/* LEFT: Reflexos */}
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <Label className="flex items-center gap-2 text-amber-600 font-bold mb-4">
                                        ⚡ Reflexos (Osteotendíneos)
                                    </Label>
                                    <div className="grid md:grid-cols-1 gap-2">
                                        {[
                                            { key: 'patelar', label: 'Patelar', roots: 'L3, L4' },
                                            { key: 'tibial_posterior', label: 'Tibial Posterior', roots: 'L4, L5' },
                                            { key: 'semitendineo', label: 'Semitendíneo', roots: 'L5, S1' },
                                            { key: 'biceps_femoral', label: 'Bíceps Femoral', roots: 'S1, S2' },
                                            { key: 'aquileu', label: 'Aquileu', roots: 'S1, S2' }
                                        ].map((ref) => (
                                            <div key={ref.key} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-slate-700">{ref.label}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{ref.roots}</span>
                                                </div>
                                                <Select value={data.neurological?.reflexes?.[ref.key] || 'normal'} onValueChange={(v) => updateField(`neurological.reflexes.${ref.key}`, v)}>
                                                    <SelectTrigger className="w-[140px] h-8 bg-transparent border-none shadow-none text-right font-medium">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent align="end">
                                                        <SelectItem value="normal">Normal (2+)</SelectItem>
                                                        <SelectItem value="hiper">Hiper (3+/4+)</SelectItem>
                                                        <SelectItem value="hipo">Hipo (1+)</SelectItem>
                                                        <SelectItem value="arreflexia">Ausente (0)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT: Visual Map Image */}
                                <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white h-full">
                                    <Label className="text-slate-500 font-semibold mb-2 self-start">Mapa de Referência</Label>
                                    <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden rounded bg-slate-100">
                                        <img
                                            src="/images/dermatomes.jpg"
                                            alt="Mapa de Dermátomos"
                                            className="object-contain w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Miótomos & Dermátomos */}
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Miótomos */}
                                <div>
                                    <Label className="flex items-center gap-2 text-blue-600 font-bold mb-4">
                                        4 Miótomos (Força/Déficit)
                                    </Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="grid grid-cols-12 bg-slate-100 p-2 text-[10px] font-bold text-slate-500 uppercase">
                                            <div className="col-span-2">Raíz</div>
                                            <div className="col-span-8">Músculo Chave</div>
                                            <div className="col-span-2 text-center">Alt.</div>
                                        </div>
                                        {[
                                            { root: 'L2', muscle: 'Iliopsoas', action: 'Flexão de Quadril' },
                                            { root: 'L3', muscle: 'Quadríceps', action: 'Extensão de Joelho' },
                                            { root: 'L4', muscle: 'Tibial Anterior', action: 'Dorsiflexão de Tornozelo' },
                                            { root: 'L5', muscle: 'Extensor Hálux', action: 'Extensão de Hálux' },
                                            { root: 'S1', muscle: 'Tríceps Sural', action: 'Flexão Plantar de Tornozelo' },
                                        ].map((item) => (
                                            <div key={item.root} className="grid grid-cols-12 p-3 items-center border-t bg-white">
                                                <div className="col-span-2 font-bold text-slate-800">{item.root}</div>
                                                <div className="col-span-8 flex flex-col">
                                                    <span className="font-medium text-sm text-slate-700">{item.muscle}</span>
                                                    <span className="text-[10px] text-slate-400">{item.action}</span>
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <Checkbox
                                                        checked={data.neurological?.myotomes?.[item.root] === 'WEAK'}
                                                        onCheckedChange={(c) => updateField(`neurological.myotomes.${item.root}`, c ? 'WEAK' : 'NORMAL')}
                                                        className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Dermátomos & Tensão Neural */}
                                <div className="space-y-6">
                                    <div className="border rounded-lg p-4 bg-white text-center">
                                        <Label className="flex items-center gap-2 text-purple-600 font-bold mb-4 justify-center">
                                            ✋ Dermátomos (Sensibilidade)
                                        </Label>
                                        <div className="text-xs text-muted-foreground mb-4">Selecione raízes com alteração:</div>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {['L1', 'L2', 'L3', 'L4', 'L5', 'S1', 'S2', 'S3', 'S4', 'S5'].map(root => (
                                                <div
                                                    key={root}
                                                    onClick={() => {
                                                        const current = data.neurological?.dermatomes || []
                                                        const updated = current.includes(root)
                                                            ? current.filter((r: string) => r !== root)
                                                            : [...current, root]
                                                        updateField('neurological.dermatomes', updated)
                                                    }}
                                                    className={cn(
                                                        "w-10 h-10 rounded border flex items-center justify-center cursor-pointer font-bold transition-all",
                                                        data.neurological?.dermatomes?.includes(root)
                                                            ? "bg-purple-100 border-purple-500 text-purple-700 ring-2 ring-purple-200"
                                                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                                    )}
                                                >
                                                    {root}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tensão Neural (Moved here) */}
                                    <div className="">
                                        <Label className="flex items-center gap-2 text-slate-800 font-bold mb-3 text-sm">
                                            ⓘ Testes de Tensão Neural
                                        </Label>
                                        <div className="space-y-2">
                                            {[
                                                { id: 'slr', label: 'SLR (Elevação Perna Reta)', type: 'Ciático' },
                                                { id: 'slump', label: 'Slump Test', type: 'Dural/Ciático' },
                                                { id: 'pkb', label: 'Prone Knee Bend (Femoral)', type: 'Femoral' }
                                            ].map(test => (
                                                <div key={test.id} className="flex justify-between items-center bg-white p-3 rounded border">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{test.label}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{test.type}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <Checkbox id={`${test.id}-d`} checked={data.physicalExam?.specialTests?.[`${test.id}_d`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.${test.id}_d`, c)} />
                                                            <Label htmlFor={`${test.id}-d`} className="text-xs mr-2">D</Label>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Checkbox id={`${test.id}-e`} checked={data.physicalExam?.specialTests?.[`${test.id}_e`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.${test.id}_e`, c)} />
                                                            <Label htmlFor={`${test.id}-e`} className="text-xs">E</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === ABA 3: DEITADO === */}
                <TabsContent value="lying" className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Card>
                        <CardHeader className="pb-3 border-b bg-green-50/50">
                            <CardTitle className="text-base flex items-center gap-2 text-green-900">
                                <Ruler className="w-5 h-5 text-green-500" />
                                Testes Especiais & Capacidade
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            {/* Palpação */}
                            <div>
                                <Label className="text-sm font-bold text-slate-700 mb-2 block">Palpação & Tecidos Moles</Label>
                                <Textarea
                                    className="min-h-[100px] bg-slate-50"
                                    placeholder="Descreva trigger points, espasmos, mobilidade acessória (PA), dor a palpação..."
                                    value={data.physicalExam?.palpation || ''}
                                    onChange={(e) => updateField('physicalExam.palpation', e.target.value)}
                                />
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Movimentos Repetidos (Deitado) */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-3">Movimentos Repetidos (Sem Carga)</h4>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'flex_sup', label: 'Flexão (Deitado)' },
                                            { id: 'ext_prone', label: 'Extensão (Deitado)' }
                                        ].map(move => (
                                            <div key={move.id} className="flex gap-2 items-center border p-2 rounded bg-white">
                                                <span className="text-sm font-medium w-32">{move.label}</span>
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.response || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.response`, v)}>
                                                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Resp." /></SelectTrigger>
                                                    <SelectContent><SelectItem value="better">Melhora</SelectItem><SelectItem value="worse">Piora</SelectItem><SelectItem value="produce">Dor</SelectItem></SelectContent>
                                                </Select>
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.phenomenon`, v)}>
                                                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Fen." /></SelectTrigger>
                                                    <SelectContent><SelectItem value="centralize">Centraliza</SelectItem><SelectItem value="peripheralize">Perif.</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Testes de Instabilidade/Mecânicos */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-3">Testes de Controle & Instabilidade</h4>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'prone_instability', label: 'Teste de Instabilidade (Prona)' },
                                            { id: 'quadrant', label: 'Teste do Quadrante (Kemp)' },
                                        ].map(test => (
                                            <div key={test.id} className="flex justify-between items-center border p-2 rounded bg-white">
                                                <span className="text-sm text-slate-700">{test.label}</span>
                                                <div className="flex gap-2">
                                                    <Checkbox id={test.id} checked={data.physicalExam?.specialTests?.[test.id]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.${test.id}`, c)} />
                                                    <Label htmlFor={test.id} className="text-xs">Positivo</Label>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Rigidez Rotadores */}
                                        <div className="border p-2 rounded bg-white">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm text-slate-700">Rigidez Rotadores (Graus)</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input placeholder="D" className="h-8 w-16 text-center" onChange={(e) => updateField('physicalExam.specialTests.rotatorStiff_r', e.target.value)} />
                                                <Input placeholder="E" className="h-8 w-16 text-center" onChange={(e) => updateField('physicalExam.specialTests.rotatorStiff_l', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Cluster Sacroilíaca */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3">Cluster Sacroilíaca (Laslett) - 3/6 Positivos = Dor SIJ</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'sij_distraction', label: 'Distração' },
                                        { id: 'sij_compression', label: 'Compressão' },
                                        { id: 'sij_thigh_thrust', label: 'Thigh Thrust' },
                                        { id: 'sij_sacral_thrust', label: 'Sacral Thrust' },
                                        { id: 'sij_gaenslen_r', label: 'Gaenslen (D)' },
                                        { id: 'sij_gaenslen_l', label: 'Gaenslen (E)' },
                                        { id: 'sij_faber', label: 'FABER' },
                                    ].map(test => (
                                        <div key={test.id} className="flex items-center gap-2 border p-2 rounded hover:bg-slate-50 transition-colors">
                                            <Checkbox id={test.id} checked={data.physicalExam?.specialTests?.[`sij_${test.id}`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.sij_${test.id}`, c)} />
                                            <Label htmlFor={test.id} className="text-xs font-medium cursor-pointer">{test.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Capacity / Resistência */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3">Capacity / Resistência Muscular (Segundos)</h4>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'sorensen', label: 'Extensores (Sorensen)', hint: 'Prono' },
                                        { id: 'plank', label: 'Prancha Frontal', hint: 'Prono' },
                                        { id: 'bridge', label: 'Ponte Unilateral', hint: 'Supino' }
                                    ].map(test => (
                                        <div key={test.id} className="bg-white p-3 rounded-xl border shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <Label className="text-sm font-semibold text-slate-800">{test.label}</Label>
                                                <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-1 rounded">{test.hint}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="0"
                                                    className="h-10 text-lg text-center font-bold border-slate-300 w-full"
                                                    type="number"
                                                    value={data.functional?.strength?.[`${test.id}_time`] || ''}
                                                    onChange={(e) => updateField(`functional.strength.${test.id}_time`, e.target.value)}
                                                />
                                                <span className="text-xs font-medium text-slate-500">seg</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}

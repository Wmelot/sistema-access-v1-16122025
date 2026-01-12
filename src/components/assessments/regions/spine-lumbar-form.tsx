import React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText, ExternalLink, Clock, AlertTriangle, Activity, Ruler, UserCheck, Accessibility } from 'lucide-react'
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
        <div className="space-y-8">
            {/* --- WIDGET DE INTEGRAÇÃO PROMS --- */}
            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        Indicadores & Questionários (PROMs)
                    </h3>
                    <button className="text-indigo-600 text-[10px] font-bold uppercase hover:underline flex items-center transition-colors">
                        Módulo de Follow-up <ExternalLink size={10} className="ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: STarT Back */}
                    <div className="border rounded bg-white p-3 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Triagem</span>
                            <span className="text-indigo-900 font-bold text-sm">STarT Back</span>
                        </div>
                        <div className="mt-2">
                            {patientOutcomeData.startBack.status === 'completed' ? (
                                <div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> {patientOutcomeData.startBack.score}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-xs flex items-center"><Clock size={12} className="mr-1" /> Pendente</span>
                            )}
                        </div>
                    </div>

                    {/* Card 2: Oswestry (ODI) */}
                    <div className="border rounded bg-white p-3 flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Incapacidade</span>
                            <div className="text-indigo-900 font-bold text-sm">ODI</div>
                        </div>
                        <div className="mt-2">
                            <button className="w-full text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">
                                Enviar Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NAVEGAÇÃO POR POSIÇÃO --- */}
            <Tabs defaultValue="standing" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 mb-6 rounded-md">
                    <TabsTrigger value="standing" className="text-xs uppercase font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                        Em Pé (Ortostatismo)
                    </TabsTrigger>
                    <TabsTrigger value="sitting" className="text-xs uppercase font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                        Sentado
                    </TabsTrigger>
                    <TabsTrigger value="lying" className="text-xs uppercase font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                        Deitado (Maca)
                    </TabsTrigger>
                </TabsList>


                {/* === ABA 1: ORTOSTATISMO === */}
                <TabsContent value="standing" className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">

                    {/* Postural Analysis */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-indigo-500" /> Avaliação Postural
                        </h4>

                        {/* Photo Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {['Anterior', 'Posterior', 'Lateral D', 'Lateral E'].map((view) => (
                                <div key={view} className="aspect-[3/4] bg-slate-50 border border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-colors group">
                                    <Ruler className="w-5 h-5 text-slate-300 group-hover:text-slate-500 mb-2 transition-colors" />
                                    <span className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-slate-600">{view}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Movement Analysis */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                            <Accessibility className="w-4 h-4 text-indigo-500" /> Avaliação do Movimento
                        </h4>

                        <div className="space-y-6">
                            {/* Shift Lateral */}
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="uppercase text-[10px] font-bold text-slate-500">Shift Lateral</Label>
                                    <Select value={data.physicalExam?.mckenzie?.shift || 'absent'} onValueChange={(v) => updateField('physicalExam.mckenzie.shift', v)}>
                                        <SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="absent">Ausente</SelectItem>
                                            <SelectItem value="present_right">Presente (Direita)</SelectItem>
                                            <SelectItem value="present_left">Presente (Esquerda)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="uppercase text-[10px] font-bold text-slate-500">Relevância</Label>
                                    <Select value={data.physicalExam?.mckenzie?.correction || 'none'} onValueChange={(v) => updateField('physicalExam.mckenzie.correction', v)}>
                                        <SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="--" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">--</SelectItem>
                                            <SelectItem value="yes">Relevante</SelectItem>
                                            <SelectItem value="no">Irrelevante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Repetitive Movements Table */}
                            <div>
                                <h5 className="font-bold text-xs text-slate-600 uppercase mb-2 pl-1">Movimentos Repetidos (Carga)</h5>
                                <div className="border rounded-md overflow-hidden bg-white">
                                    <div className="grid grid-cols-12 bg-slate-100/50 p-2 text-[10px] font-bold text-slate-500 uppercase border-b">
                                        <div className="col-span-4 pl-2">Movimento</div>
                                        <div className="col-span-4">Sintoma</div>
                                        <div className="col-span-4">Fenômeno</div>
                                    </div>
                                    {[
                                        { id: 'flex_stand', label: 'Flexão' },
                                        { id: 'ext_stand', label: 'Extensão' },
                                        { id: 'side_glide_r', label: 'Inclin. Lat. (D)' },
                                        { id: 'side_glide_l', label: 'Inclin. Lat. (E)' },
                                        { id: 'rot_r', label: 'Rotação (D)' },
                                        { id: 'rot_l', label: 'Rotação (E)' },
                                        { id: 'shift_corr', label: 'Correção Shift' }
                                    ].map((move, idx) => (
                                        <div key={move.id} className={cn("grid grid-cols-12 p-2 items-center gap-2 border-b last:border-0", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                            <div className="col-span-4 font-medium text-xs text-slate-700 pl-2">{move.label}</div>
                                            <div className="col-span-4">
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.response || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.response`, v)}>
                                                    <SelectTrigger className="h-7 text-[10px] bg-white border-slate-200"><SelectValue placeholder="-" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="better">Melhora</SelectItem>
                                                        <SelectItem value="worse">Piora</SelectItem>
                                                        <SelectItem value="no_effect">S/ Efeito</SelectItem>
                                                        <SelectItem value="produce">Produz</SelectItem>
                                                        <SelectItem value="abolish">Abole</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-4">
                                                <Select value={data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon || ''} onValueChange={(v) => updateField(`physicalExam.mckenzie.movements.${move.id}.phenomenon`, v)}>
                                                    <SelectTrigger className={cn("h-7 text-[10px]",
                                                        data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon === 'centralize' ? "text-green-600 bg-green-50 border-green-200" :
                                                            data.physicalExam?.mckenzie?.movements?.[move.id]?.phenomenon === 'peripheralize' ? "text-red-600 bg-red-50 border-red-200" : "bg-white border-slate-200"
                                                    )}>
                                                        <SelectValue placeholder="-" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-</SelectItem>
                                                        <SelectItem value="centralize">Centraliza</SelectItem>
                                                        <SelectItem value="peripheralize">Periferaliza</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Functional Tests */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 border-b pb-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" /> Funcional & Marcha
                            </h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={cn("flex items-center gap-2 p-3 rounded-md border transition-all", data.physicalExam?.functional?.gait?.heels ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
                                        <Checkbox
                                            id="heel_walk"
                                            checked={data.physicalExam?.functional?.gait?.heels}
                                            onCheckedChange={(c) => updateField('physicalExam.functional.gait.heels', c)}
                                            className="data-[state=checked]:bg-red-600 border-slate-300"
                                        />
                                        <Label htmlFor="heel_walk" className="cursor-pointer text-xs font-medium text-slate-700">
                                            Marcha Calcanhares (L5)
                                        </Label>
                                    </div>
                                    <div className={cn("flex items-center gap-2 p-3 rounded-md border transition-all", data.physicalExam?.functional?.gait?.toes ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
                                        <Checkbox
                                            id="toe_walk"
                                            checked={data.physicalExam?.functional?.gait?.toes}
                                            onCheckedChange={(c) => updateField('physicalExam.functional.gait.toes', c)}
                                            className="data-[state=checked]:bg-red-600 border-slate-300"
                                        />
                                        <Label htmlFor="toe_walk" className="cursor-pointer text-xs font-medium text-slate-700">
                                            Marcha Ponta Pés (S1)
                                        </Label>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {['Direito', 'Esquerdo'].map((side) => {
                                        const key = side === 'Direito' ? 'right' : 'left'
                                        return (
                                            <div key={key} className="bg-slate-50/50 p-3 rounded-md border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Unipodal {side}</span>
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 items-center gap-2">
                                                        <Label className="text-xs text-slate-600">Equilíbrio</Label>
                                                        <Select value={data.physicalExam?.functional?.singleLeg?.[key]?.balance || 'normal'} onValueChange={(v) => updateField(`physicalExam.functional.singleLeg.${key}.balance`, v)}>
                                                            <SelectTrigger className="h-6 text-[10px] bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                                            <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="reduced">Reduzido</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-2 items-center gap-2">
                                                        <Label className="text-xs text-slate-600">Controle</Label>
                                                        <Select value={data.physicalExam?.functional?.singleLeg?.[key]?.control || 'normal'} onValueChange={(v) => updateField(`physicalExam.functional.singleLeg.${key}.control`, v)}>
                                                            <SelectTrigger className="h-6 text-[10px] bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                                            <SelectContent><SelectItem value="normal">Bom</SelectItem><SelectItem value="poor">Pobre</SelectItem></SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* === ABA 2: SENTADO === */}
                <TabsContent value="sitting" className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-500" /> Neurológico
                        </h4>

                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Reflexes */}
                            <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                                <Label className="flex items-center gap-2 text-slate-700 font-bold mb-4 text-xs uppercase tracking-wide">
                                    Reflexos (L4-S1)
                                </Label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'patelar', label: 'Patelar', roots: 'L3/L4' },
                                        { key: 'aquileu', label: 'Aquileu', roots: 'S1/S2' }
                                    ].map((ref) => (
                                        <div key={ref.key} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs text-slate-700">{ref.label}</span>
                                                <span className="text-[9px] text-slate-400 font-mono">{ref.roots}</span>
                                            </div>
                                            <Select value={data.neurological?.reflexes?.[ref.key] || 'normal'} onValueChange={(v) => updateField(`neurological.reflexes.${ref.key}`, v)}>
                                                <SelectTrigger className="w-[100px] h-7 text-[10px] bg-transparent border-none shadow-none text-right">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="normal">Normal (2+)</SelectItem>
                                                    <SelectItem value="hiper">Hiper (3+)</SelectItem>
                                                    <SelectItem value="hipo">Hipo (1+)</SelectItem>
                                                    <SelectItem value="arreflexia">Ausente (0)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Myotomes Grid */}
                            <div className="border rounded-lg overflow-hidden bg-white">
                                <div className="bg-purple-50 p-2 border-b">
                                    <h5 className="text-[10px] font-bold text-purple-800 uppercase text-center">Miótomos (Força L2-S1)</h5>
                                </div>
                                <div className="divide-y">
                                    {[
                                        { root: 'L2', muscle: 'Iliopsoas' },
                                        { root: 'L3', muscle: 'Quadríceps' },
                                        { root: 'L4', muscle: 'Tibial Ant.' },
                                        { root: 'L5', muscle: 'Ext. Hálux' },
                                        { root: 'S1', muscle: 'Tríceps Sural' },
                                    ].map((item) => (
                                        <div key={item.root} className="flex items-center justify-between p-2 hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{item.root}</span>
                                                <span className="text-xs text-slate-700">{item.muscle}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`myo-${item.root}`} className="text-[10px] text-slate-400 cursor-pointer">Déficit?</Label>
                                                <Checkbox
                                                    id={`myo-${item.root}`}
                                                    checked={data.neurological?.myotomes?.[item.root] === 'WEAK'}
                                                    onCheckedChange={(c) => updateField(`neurological.myotomes.${item.root}`, c ? 'WEAK' : 'NORMAL')}
                                                    className="data-[state=checked]:bg-red-500 border-slate-300 w-4 h-4"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Neural Tension */}
                        <div className="mt-6">
                            <Label className="uppercase text-[10px] font-bold text-slate-500 mb-2 block">Tensão Neural</Label>
                            <div className="grid md:grid-cols-3 gap-3">
                                {[
                                    { id: 'slr', label: 'SLR (Ciático)' },
                                    { id: 'slump', label: 'Slump (Dural)' },
                                    { id: 'pkb', label: 'PKB (Femoral)' }
                                ].map(test => (
                                    <div key={test.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                                        <span className="text-xs font-medium text-slate-700">{test.label}</span>
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1">
                                                <Checkbox className="w-3 h-3 border-slate-300" id={`${test.id}-d`} checked={data.physicalExam?.specialTests?.[`${test.id}_d`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.${test.id}_d`, c)} />
                                                <Label htmlFor={`${test.id}-d`} className="text-[10px] text-slate-500">D</Label>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Checkbox className="w-3 h-3 border-slate-300" id={`${test.id}-e`} checked={data.physicalExam?.specialTests?.[`${test.id}_e`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.${test.id}_e`, c)} />
                                                <Label htmlFor={`${test.id}-e`} className="text-[10px] text-slate-500">E</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* === ABA 3: DEITADO === */}
                <TabsContent value="lying" className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    {/* Palpation */}
                    <div>
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Palpação & Tecidos</Label>
                        <Textarea
                            className="min-h-[80px] text-sm bg-white border-slate-200"
                            placeholder="Descreva pontos gatilho, espasmos, mobilidade acessória (PA)..."
                            value={data.physicalExam?.palpation || ''}
                            onChange={(e) => updateField('physicalExam.palpation', e.target.value)}
                        />
                    </div>

                    <Separator className="bg-slate-100" />

                    {/* Special Tests & Capacity */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Cluster SIJ */}
                        <div>
                            <h5 className="font-bold text-xs text-slate-700 uppercase mb-3 text-center md:text-left">Cluster Sacroilíaca (Laslett)</h5>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'sij_distraction', label: 'Distração' },
                                    { id: 'sij_compression', label: 'Compressão' },
                                    { id: 'sij_thigh_thrust', label: 'Thigh Thrust' },
                                    { id: 'sij_sacral_thrust', label: 'Sacral Thrust' },
                                    { id: 'sij_gaenslen_r', label: 'Gaenslen D' },
                                    { id: 'sij_gaenslen_l', label: 'Gaenslen E' },
                                ].map(test => (
                                    <div key={test.id} className="flex items-center gap-2 border p-2 rounded bg-white hover:bg-slate-50 transition-colors">
                                        <Checkbox className="w-4 h-4" id={test.id} checked={data.physicalExam?.specialTests?.[`sij_${test.id}`]} onCheckedChange={(c) => updateField(`physicalExam.specialTests.sij_${test.id}`, c)} />
                                        <Label htmlFor={test.id} className="text-[11px] font-medium cursor-pointer text-slate-700">{test.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Capacity */}
                        <div>
                            <h5 className="font-bold text-xs text-slate-700 uppercase mb-3 text-center md:text-left">Capacidade (Sorensen/Prancha)</h5>
                            <div className="space-y-3">
                                {[
                                    { id: 'sorensen', label: 'Extensores' },
                                    { id: 'plank', label: 'Prancha Frontal' }
                                ].map(test => (
                                    <div key={test.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-xs text-slate-600 font-medium">{test.label}</span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="0"
                                                className="h-7 w-16 text-center text-xs font-bold"
                                                type="number"
                                                value={data.functional?.strength?.[`${test.id}_time`] || ''}
                                                onChange={(e) => updateField(`functional.strength.${test.id}_time`, e.target.value)}
                                            />
                                            <span className="text-[10px] text-slate-400">seg</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    )
}

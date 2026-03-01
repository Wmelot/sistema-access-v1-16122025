"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasteUploadZone } from "@/components/ui/paste-upload-zone";
import { ReferenceStatus } from "../ui/ReferenceStatus";
import { User, Activity, Scan, Target } from "lucide-react";

// Internal helper for Side-by-Side layout with Reference Status
const ClinicalSideBySide = ({
    label,
    leftName,
    rightName,
    control,
    type = "number",
    suffix = "",
    referenceType
}: {
    label: string,
    leftName: string,
    rightName: string,
    control: any,
    type?: string,
    suffix?: string,
    referenceType?: string
}) => {
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2">
            {/* Esquerdo */}
            <div className="flex flex-col items-end gap-1">
                <FormField control={control} name={leftName} render={({ field }) => (
                    <FormItem className="relative w-full max-w-[100px]">
                        <FormControl>
                            <Input
                                {...field}
                                type={type}
                                className="h-9 text-sm text-center font-bold bg-white border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg shadow-sm"
                                placeholder="Esquerdo"
                            />
                        </FormControl>
                        {suffix && <span className="absolute right-2 top-2.5 text-[10px] text-gray-400 pointer-events-none font-bold">{suffix}</span>}
                    </FormItem>
                )} />
                {referenceType && (
                    <FormField control={control} name={leftName} render={({ field }) => (
                        <ReferenceStatus value={field.value} type={referenceType} />
                    )} />
                )}
            </div>

            {/* Rótulo Central */}
            <div className="flex flex-col items-center justify-center h-9 mt-1">
                <span className="text-xs font-black text-slate-500 uppercase tracking-tight text-center leading-tight max-w-[120px]">
                    {label}
                </span>
            </div>

            {/* Direito */}
            <div className="flex flex-col items-start gap-1">
                <FormField control={control} name={rightName} render={({ field }) => (
                    <FormItem className="relative w-full max-w-[100px]">
                        <FormControl>
                            <Input
                                {...field}
                                type={type}
                                className="h-9 text-sm text-center font-bold bg-white border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 rounded-lg shadow-sm"
                                placeholder="Direito"
                            />
                        </FormControl>
                        {suffix && <span className="absolute right-2 top-2.5 text-[10px] text-gray-400 pointer-events-none font-bold">{suffix}</span>}
                    </FormItem>
                )} />
                {referenceType && (
                    <FormField control={control} name={rightName} render={({ field }) => (
                        <ReferenceStatus value={field.value} type={referenceType} />
                    )} />
                )}
            </div>
        </div>
    );
};

export const FunctionalTestsSection = () => {
    const { control, watch, setValue } = useFormContext();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Tabs defaultValue="clinico" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Avaliação Biomecânica & Funcional</h2>
                    </div>
                    <TabsList className="bg-slate-100 p-1 rounded-xl h-12 self-stretch md:self-auto">
                        <TabsTrigger value="clinico" className="rounded-lg h-10 px-6 font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                            <User className="w-4 h-4 mr-2" /> Clínico & Maca
                        </TabsTrigger>
                        <TabsTrigger value="dinamico" className="rounded-lg h-10 px-6 font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                            <Activity className="w-4 h-4 mr-2" /> Dinâmico & Marcha
                        </TabsTrigger>
                        <TabsTrigger value="baropo" className="rounded-lg h-10 px-6 font-bold text-xs uppercase data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                            <Scan className="w-4 h-4 mr-2" /> Baropodometria
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: CLÍNICO */}
                <TabsContent value="clinico" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna 1: Mobilidade */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-sm font-black uppercase text-slate-700">Mobilidade e Testes Específicos</h3>
                            </div>
                            <div className="space-y-1">
                                <ClinicalSideBySide label="Jack Test (Grau 1-3)" leftName="exame_fisico.jack_test.left" rightName="exame_fisico.jack_test.right" control={control} referenceType="jack" />
                                <ClinicalSideBySide label="Lunge Test (cm)" leftName="exame_fisico.lunge_test.left" rightName="exame_fisico.lunge_test.right" control={control} suffix="cm" referenceType="lunge" />
                                <ClinicalSideBySide label="Navicular Drop (mm)" leftName="exame_fisico.navicular_drop.left" rightName="exame_fisico.navicular_drop.right" control={control} suffix="mm" referenceType="navicular" />
                                <ClinicalSideBySide label="Mobilidade 1º Raio" leftName="exame_fisico.mobilidade.raios.left" rightName="exame_fisico.mobilidade.raios.right" control={control} />
                                <ClinicalSideBySide label="Mobilidade Mediopé" leftName="exame_fisico.mobilidade.mediope.left" rightName="exame_fisico.mobilidade.mediope.right" control={control} />
                            </div>
                        </div>

                        {/* Coluna 2: Pelve e Força */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-sm font-black uppercase text-slate-700">Pelve, Quadril & Força</h3>
                            </div>
                            <div className="space-y-1">
                                <ClinicalSideBySide label="Força Glúteo Médio (0-5)" leftName="exame_fisico.forca_gluteo.medio.left" rightName="exame_fisico.forca_gluteo.medio.right" control={control} referenceType="glute_strength" />
                                <ClinicalSideBySide label="Força Glúteo Máximo (0-5)" leftName="exame_fisico.forca_gluteo.maximo.left" rightName="exame_fisico.forca_gluteo.maximo.right" control={control} referenceType="glute_strength" />

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <div className="grid grid-cols-3 gap-4">
                                        <FormField control={control} name="exame_fisico.thomas_test" render={({ field }) => (
                                            <div className="text-center group">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block group-hover:text-indigo-600 transition-colors">Thomas</label>
                                                <FormControl><Input {...field} className="h-10 font-bold text-center bg-slate-50 border-slate-200" placeholder="Graus" /></FormControl>
                                            </div>
                                        )} />
                                        <FormField control={control} name="exame_fisico.isquiotibiais" render={({ field }) => (
                                            <div className="text-center group">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block group-hover:text-indigo-600 transition-colors">Isquios (SLR)</label>
                                                <FormControl><Input {...field} className="h-10 font-bold text-center bg-slate-50 border-slate-200" placeholder="Graus" /></FormControl>
                                            </div>
                                        )} />
                                        <FormField control={control} name="exame_fisico.craig_anteversao" render={({ field }) => (
                                            <div className="text-center group">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block group-hover:text-indigo-600 transition-colors">Craig (Rot)</label>
                                                <FormControl><Input {...field} className="h-10 font-bold text-center bg-slate-50 border-slate-200" placeholder="Graus" /></FormControl>
                                            </div>
                                        )} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: DINÂMICO & MARCHA */}
                <TabsContent value="dinamico" className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-sm font-black uppercase text-slate-700 mb-4 border-b border-slate-50 pb-2">Análise de Marcha Digital (DFI)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Lado Esquerdo */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Pé Esquerdo
                                </label>
                                <FormField control={control} name="exame_fisico.gait_analysis.left_image" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <PasteUploadZone
                                                value={field.value?.[0] || null}
                                                onChange={(val) => field.onChange(val ? [val] : [])} // Wrap in array
                                                className="aspect-video bg-blue-50/20 border-blue-100 hover:border-blue-300"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={control} name="exame_fisico.gait_analysis.left_obs" render={({ field }) => (
                                    <Input {...field} className="text-xs bg-slate-50 border-none" placeholder="Obs. marcha esquerda..." />
                                )} />
                            </div>

                            {/* Lado Direito */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" /> Pé Direito
                                </label>
                                <FormField control={control} name="exame_fisico.gait_analysis.right_image" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <PasteUploadZone
                                                value={field.value?.[0] || null}
                                                onChange={(val) => field.onChange(val ? [val] : [])}
                                                className="aspect-video bg-green-50/20 border-green-100 hover:border-green-300"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={control} name="exame_fisico.gait_analysis.right_obs" render={({ field }) => (
                                    <Input {...field} className="text-xs bg-slate-50 border-none" placeholder="Obs. marcha direita..." />
                                )} />
                            </div>
                        </div>

                        {/* Y-Balance */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Y-Balance Test</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ClinicalSideBySide label="Comprimento Perna (cm)" leftName="exame_fisico.ybalance.legLength.left" rightName="exame_fisico.ybalance.legLength.right" control={control} suffix="cm" />
                                <ClinicalSideBySide label="Pontuação Composite (%)" leftName="exame_fisico.ybalance.composite.left" rightName="exame_fisico.ybalance.composite.right" control={control} suffix="%" referenceType="ybalance_composite" />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 3: BAROPODOMETRIA */}
                <TabsContent value="baropo" className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black uppercase text-slate-700">Baropodometria Computadorizada</h3>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">Imagens Estáticas & Dinâmicas</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase">Estática (Pressão Plantar)</label>
                                <FormField control={control} name="exame_fisico.baropodometria.static_image" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <PasteUploadZone
                                                value={field.value?.[0] || null}
                                                onChange={(val) => field.onChange(val ? [val] : [])}
                                                className="aspect-[4/3]"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase">Estabilometria / Dinâmica</label>
                                <FormField control={control} name="exame_fisico.baropodometria.dynamic_image" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <PasteUploadZone
                                                value={field.value?.[0] || null}
                                                onChange={(val) => field.onChange(val ? [val] : [])}
                                                className="aspect-[4/3]"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                        <div className="mt-6">
                            <FormField control={control} name="exame_fisico.baropodometria.observacoes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Laudo / Observações Baropodométricas</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <span className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 pointer-events-none">IA ANALYZER</span>
                                            <textarea {...field} className="w-full min-h-[100px] p-4 text-sm bg-slate-50 border-none rounded-2xl resize-none focus:ring-2 focus:ring-indigo-100" placeholder="Descreva os achados de pico de pressão, centro de massa, etc..." />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

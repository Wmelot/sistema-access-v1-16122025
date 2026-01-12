"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Internal helper for Side-by-Side layout
const ClinicalSideBySide = ({
    label,
    leftName,
    rightName,
    control,
    type = "number",
    suffix = ""
}: {
    label: string,
    leftName: string,
    rightName: string,
    control: any,
    type?: string,
    suffix?: string
}) => {
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
            {/* Esquerdo */}
            <div className="flex justify-end">
                <FormField control={control} name={leftName} render={({ field }) => (
                    <FormItem className="relative w-24">
                        <FormControl>
                            <Input
                                {...field}
                                type={type}
                                className="h-7 text-xs text-center bg-blue-50/30 border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                placeholder="Esq"
                            />
                        </FormControl>
                        {suffix && <span className="absolute right-1 top-1.5 text-[9px] text-gray-400 pointer-events-none">{suffix}</span>}
                    </FormItem>
                )} />
            </div>

            {/* Rótulo Central */}
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-tight w-40 text-center leading-tight">
                {label}
            </div>

            {/* Direito */}
            <div className="flex justify-start">
                <FormField control={control} name={rightName} render={({ field }) => (
                    <FormItem className="relative w-24">
                        <FormControl>
                            <Input
                                {...field}
                                type={type}
                                className="h-7 text-xs text-center bg-green-50/30 border-slate-200 focus:border-green-400 focus:ring-1 focus:ring-green-400"
                                placeholder="Dir"
                            />
                        </FormControl>
                        {suffix && <span className="absolute right-1 top-1.5 text-[9px] text-gray-400 pointer-events-none">{suffix}</span>}
                    </FormItem>
                )} />
            </div>
        </div>
    );
};

export const FunctionalTestsSection = () => {
    const { control } = useFormContext();

    return (
        <section>
            <h2 className="text-xs font-black uppercase text-slate-400 mb-2 border-b border-slate-200 pb-1">05. Avaliação Funcional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Coluna 1: Mobilidade */}
                <div className="border border-slate-200 rounded-sm bg-white">
                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">Mobilidade & Testes Específicos</div>
                    <div className="p-2 space-y-0">
                        <ClinicalSideBySide label="Jack Test (Grau 0-3)" leftName="exame_fisico.jack_test.left" rightName="exame_fisico.jack_test.right" control={control} />
                        <ClinicalSideBySide label="Lunge Test (cm)" leftName="exame_fisico.lunge_test.left" rightName="exame_fisico.lunge_test.right" control={control} suffix="cm" />
                        <ClinicalSideBySide label="Navicular Drop (mm)" leftName="exame_fisico.navicular_drop.left" rightName="exame_fisico.navicular_drop.right" control={control} suffix="mm" />
                        <ClinicalSideBySide label="Mobilidade 1º Raio" leftName="exame_fisico.mobilidade.raios.left" rightName="exame_fisico.mobilidade.raios.right" control={control} />
                        <ClinicalSideBySide label="Mobilidade Mediopé" leftName="exame_fisico.mobilidade.mediope.left" rightName="exame_fisico.mobilidade.mediope.right" control={control} />
                    </div>
                </div>

                {/* Coluna 2: Pelve e Força */}
                <div className="border border-slate-200 rounded-sm bg-white">
                    <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">Pelve & Força Muscular</div>
                    <div className="p-2 space-y-0">
                        <ClinicalSideBySide label="Força Glúteo Médio (0-5)" leftName="exame_fisico.forca_gluteo.medio.left" rightName="exame_fisico.forca_gluteo.medio.right" control={control} />
                        <ClinicalSideBySide label="Força Glúteo Máximo (0-5)" leftName="exame_fisico.forca_gluteo.maximo.left" rightName="exame_fisico.forca_gluteo.maximo.right" control={control} />

                        <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                            <FormField control={control} name="exame_fisico.thomas_test" render={({ field }) => (
                                <div className="text-center">
                                    <label className="text-[9px] font-bold text-slate-500 block">THOMAS</label>
                                    <FormControl><Input {...field} className="h-7 text-xs text-center" placeholder="Graus" /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="exame_fisico.isquiotibiais" render={({ field }) => (
                                <div className="text-center">
                                    <label className="text-[9px] font-bold text-slate-500 block">ISQUIOS</label>
                                    <FormControl><Input {...field} className="h-7 text-xs text-center" placeholder="Graus" /></FormControl>
                                </div>
                            )} />
                            <FormField control={control} name="exame_fisico.craig_anteversao" render={({ field }) => (
                                <div className="text-center">
                                    <label className="text-[9px] font-bold text-slate-500 block">CRAIG</label>
                                    <FormControl><Input {...field} className="h-7 text-xs text-center" placeholder="Graus" /></FormControl>
                                </div>
                            )} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

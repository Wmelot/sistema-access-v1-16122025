import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePasteUploader } from '@/components/inputs/image-paste-uploader'

interface PosturalStepProps {
    data: any
    updateField: (path: string, val: any) => void
    readOnly?: boolean
}

export function PosturalStep({ data, updateField, readOnly }: PosturalStepProps) {
    return (
        <div className="space-y-6">
            {/* Baropodometria */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Baropodometria 2D</CardTitle></CardHeader>
                    <CardContent>
                        <ImagePasteUploader
                            label="Colar Imagem 2D"
                            value={data.baro2d}
                            onChange={(v) => updateField('baro2d', v)}
                            readOnly={readOnly}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Baropodometria 3D</CardTitle></CardHeader>
                    <CardContent>
                        <ImagePasteUploader
                            label="Colar Imagem 3D"
                            value={data.baro3d}
                            onChange={(v) => updateField('baro3d', v)}
                            readOnly={readOnly}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Antropometria & Shoe */}
            <Card>
                <CardHeader><CardTitle>Avaliação Estática</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Dismetria (mm)</Label>
                            <div className="flex gap-2">
                                <div className="relative w-full">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">E</span>
                                    <Input
                                        className="pl-6"
                                        placeholder="0"
                                        type="number"
                                        value={data.anthropometry.legLengthLeft}
                                        onChange={e => updateField('anthropometry.legLengthLeft', +e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">D</span>
                                    <Input
                                        className="pl-6"
                                        placeholder="0"
                                        type="number"
                                        value={data.anthropometry.legLengthRight}
                                        onChange={e => updateField('anthropometry.legLengthRight', +e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-slate-500">Naviculômetro (mm)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="E"
                                    type="number"
                                    value={data.anthropometry.navicularLeft}
                                    onChange={e => updateField('anthropometry.navicularLeft', +e.target.value)}
                                    disabled={readOnly}
                                />
                                <Input
                                    placeholder="D"
                                    type="number"
                                    value={data.anthropometry.navicularRight}
                                    onChange={e => updateField('anthropometry.navicularRight', +e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border">
                        <div className="space-y-1">
                            <Label>Nº Calçado (BR)</Label>
                            <Input
                                type="number"
                                value={data.shoeSize}
                                onChange={e => updateField('shoeSize', +e.target.value)}
                                className="bg-white"
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Tipo de Arco (Auto)</Label>
                            <div className="flex gap-2 text-[10px] text-center font-medium uppercase">
                                <div className="flex-1 bg-white p-2 rounded border">
                                    {data.anthropometry.archTypeLeft}
                                </div>
                                <div className="flex-1 bg-white p-2 rounded border">
                                    {data.anthropometry.archTypeRight}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

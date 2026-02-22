
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Target, RotateCcw, Plus } from "lucide-react";

// Simplified Pain Map for PBE
export function PainMapSection({ data, updateField, readOnly }: any) {
    const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

    const handlePointClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readOnly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newPoint = {
            id: crypto.randomUUID(),
            x,
            y,
            label: view === 'anterior' ? 'Ant' : 'Post'
        };

        const currentPoints = data.painMap?.points || [];
        updateField('painMap.points', [...currentPoints, newPoint]);
    };

    const removePoint = (id: string) => {
        if (readOnly) return;
        const currentPoints = data.painMap?.points || [];
        updateField('painMap.points', currentPoints.filter((p: any) => p.id !== id));
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-500" />
                    Mapa de Dor
                </CardTitle>
                <CardDescription>
                    Clique na imagem para marcar os pontos de dor relatados pelo paciente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="anterior">Vista Anterior</TabsTrigger>
                        <TabsTrigger value="posterior">Vista Posterior</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 flex justify-center bg-slate-100 rounded-lg p-4 border border-slate-200">
                        <div
                            className="relative w-[300px] h-[500px] bg-white shadow-sm cursor-crosshair select-none"
                            onClick={handlePointClick}
                        >
                            {/* Background Image Placeholder - In real app use /body-map-anterior.jpg */}
                            <img
                                src={view === 'anterior' ? '/body-map-anterior.jpg' : '/body-map-posterior.jpg'}
                                alt={`Vista ${view}`}
                                className="w-full h-full object-contain pointer-events-none"
                                onError={(e) => {
                                    // Fallback if image missing
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.style.backgroundImage = 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)';
                                    e.currentTarget.parentElement!.style.backgroundSize = '20px 20px';
                                }}
                            />

                            {/* Points Overlay */}
                            {(data.painMap?.points || []).map((point: any) => (
                                <div
                                    key={point.id}
                                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500/80 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold cursor-pointer hover:scale-110 transition-transform"
                                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removePoint(point.id);
                                    }}
                                    title="Clique para remover"
                                >
                                    !
                                </div>
                            ))}
                        </div>
                    </div>
                </Tabs>

                <div className="space-y-2">
                    <Label htmlFor="obs">Observações sobre a Dor</Label>
                    <Textarea
                        id="obs"
                        placeholder="Descreva características da dor (queimação, pontada, irradiação)..."
                        value={data.painMap?.observations || ''}
                        onChange={(e) => updateField('painMap.observations', e.target.value)}
                        readOnly={readOnly}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

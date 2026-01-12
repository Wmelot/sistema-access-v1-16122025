"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Point {
    id: string;
    x: number;
    y: number;
    label?: string;
    view: string; // 'anterior' | 'posterior' | 'feet' | 'lateral'
}

interface BodyPainMapProps {
    value?: { points: Point[], observacoes?: string };
    onChange: (val: { points: Point[], observacoes?: string }) => void;
    readOnly?: boolean;
}

const DraggablePoint = ({ point, onMove, onRemove, readOnly }: { point: Point, onMove: (id: string, x: number, y: number) => void, onRemove: (id: string) => void, readOnly?: boolean }) => {
    const startDrag = (e: React.PointerEvent) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLDivElement;
        const parent = target.parentElement?.getBoundingClientRect();
        if (!parent) return;

        target.setPointerCapture(e.pointerId);

        const onPointerMove = (ev: PointerEvent) => {
            const newX = ((ev.clientX - parent.left) / parent.width) * 100;
            const newY = ((ev.clientY - parent.top) / parent.height) * 100;
            onMove(point.id, Math.max(0, Math.min(100, newX)), Math.max(0, Math.min(100, newY)));
        };

        const onPointerUp = (ev: PointerEvent) => {
            target.releasePointerCapture(ev.pointerId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div
            className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-10 group",
                !readOnly && "cursor-move"
            )}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onPointerDown={startDrag}
        >
            <div className="w-4 h-4 bg-red-500/80 rounded-full border-2 border-white shadow-sm ring-1 ring-red-200 animate-in fade-in zoom-in duration-200"></div>

            {!readOnly && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(point.id); }}
                    className="absolute -top-3 -right-3 bg-slate-800 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X size={10} />
                </button>
            )}
        </div>
    );
};

export const BodyPainMap = ({ value, onChange, readOnly = false }: BodyPainMapProps) => {
    const [activeTab, setActiveTab] = useState("anterior");
    const points = value?.points || [];

    const handleAddPoint = (e: React.MouseEvent<HTMLDivElement>) => {
        if (readOnly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newPoint: Point = {
            id: crypto.randomUUID(),
            x,
            y,
            view: activeTab,
            label: "Dor"
        };

        onChange({ ...value, points: [...points, newPoint] });
    };

    const handleMovePoint = (id: string, x: number, y: number) => {
        const newPoints = points.map(p => p.id === id ? { ...p, x, y } : p);
        onChange({ ...value, points: newPoints });
    };

    const handleRemovePoint = (id: string) => {
        const newPoints = points.filter(p => p.id !== id);
        onChange({ ...value, points: newPoints });
    };

    const currentPoints = points.filter(p => p.view === activeTab);

    // Map images
    const images: Record<string, string> = {
        anterior: '/body-map-anterior.jpg',
        posterior: '/body-map-posterior.jpg',
        feet: '/body-map-feet.jpg',
        lateral: '/body-map-3d.png'
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="bg-slate-50 border-b border-slate-200 px-2 py-1 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Mapa de Dor</span>
                    <TabsList className="h-6">
                        <TabsTrigger value="anterior" className="text-[10px] h-5 px-2">Frente</TabsTrigger>
                        <TabsTrigger value="posterior" className="text-[10px] h-5 px-2">Costas</TabsTrigger>
                        <TabsTrigger value="lateral" className="text-[10px] h-5 px-2">Lateral</TabsTrigger>
                        <TabsTrigger value="feet" className="text-[10px] h-5 px-2">Pés</TabsTrigger>
                    </TabsList>
                </div>

                <div className="relative aspect-[3/4] max-w-[300px] mx-auto bg-slate-100 cursor-crosshair" onClick={handleAddPoint}>
                    <img
                        src={images[activeTab]}
                        alt={activeTab}
                        className="w-full h-full object-contain pointer-events-none select-none mix-blend-multiply opacity-90"
                    />

                    {currentPoints.map(point => (
                        <DraggablePoint
                            key={point.id}
                            point={point}
                            onMove={handleMovePoint}
                            onRemove={handleRemovePoint}
                            readOnly={readOnly}
                        />
                    ))}

                    {!readOnly && currentPoints.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">Clique para marcar</span>
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    );
};

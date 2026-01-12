"use client";

import React, { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { XCircle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 1. Ajuste na Interface (use hífens ou nomes sem espaços)
export interface PainPoint {
    id: string;
    x: number;
    y: number;
    label?: string;
    view?: "anterior" | "posterior" | "left-feet" | "right-feet";
}

interface BodyPainMapProps {
    points: PainPoint[];
    onAdd: (point: Omit<PainPoint, "id">) => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, point: PainPoint) => void;
}

export function BodyPainMap({ points, onAdd, onRemove, onUpdate }: BodyPainMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // 2. Estado inicial tipado corretamente
    const [activeView, setActiveView] = useState<PainPoint["view"]>("anterior");
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [isNamingOpen, setIsNamingOpen] = useState(false);
    const [pendingPoint, setPendingPoint] = useState<{ x: number, y: number } | null>(null);
    const [labelName, setLabelName] = useState("");

    // 3. Objeto com chaves entre aspas para evitar erro de sintaxe
    const viewConfig = {
        "anterior": { src: "/images/body-anterior.png", label: "Vista Anterior" },
        "posterior": { src: "/images/body-posterior.png", label: "Vista Posterior" },
        "left-feet": { src: "/images/foot-map-left.png", label: "Pé Esquerdo" },
        "right-feet": { src: "/images/foot-map-right.png", label: "Pé Direito" },
    };

    // Filtra os pontos que pertencem à vista atual
    const visiblePoints = points.filter(p => (p.view || "anterior") === activeView);

    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        if (draggingId || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setPendingPoint({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100
        });
        setLabelName("");
        setIsNamingOpen(true);
    };

    const confirmAddPoint = () => {
        if (pendingPoint) {
            onAdd({
                x: pendingPoint.x,
                y: pendingPoint.y,
                view: activeView, // Salva em qual pé/vista o ponto foi clicado
                label: labelName || "Ponto de Dor"
            });
            toast.success("Ponto registrado!");
        }
        setIsNamingOpen(false);
        setPendingPoint(null);
    };

    const handlePointContextMenu = (e: MouseEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        const realIndex = points.findIndex(p => p.id === id);
        if (realIndex !== -1) onRemove(realIndex);
    };

    return (
        <div className="space-y-4">
            {/* Abas de Navegação */}
            <div className="flex p-1 bg-muted rounded-lg w-full gap-1 overflow-x-auto">
                {(Object.keys(viewConfig) as Array<keyof typeof viewConfig>).map((view) => (
                    <button
                        key={view}
                        type="button"
                        onClick={() => setActiveView(view)}
                        className={cn(
                            "flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                            activeView === view ? "bg-white shadow" : "text-muted-foreground hover:bg-white/50"
                        )}
                    >
                        {viewConfig[view].label}
                    </button>
                ))}
            </div>

            {/* Container do Mapa */}
            <div
                ref={containerRef}
                onClick={handleContainerClick}
                className="relative w-full aspect-[3/4] md:aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-200 cursor-crosshair shadow-inner"
            >
                <Image
                    src={viewConfig[activeView!].src}
                    alt={viewConfig[activeView!].label}
                    fill
                    className="object-contain pointer-events-none p-4"
                />

                {visiblePoints.map((point) => (
                    <div
                        key={point.id}
                        onContextMenu={(e) => handlePointContextMenu(e, point.id)}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingId(point.id); }}
                        title={point.label}
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                    >
                        <span className="text-[10px] text-white font-bold">
                            {point.label?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                Clique para marcar • Botão direito para remover
            </p>

            {/* Modal de Identificação */}
            <Dialog open={isNamingOpen} onOpenChange={setIsNamingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-500" /> Identificar Dor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Região (ex: Hálux, Calcâneo, Arco)</Label>
                        <Input
                            autoFocus
                            className="mt-2"
                            placeholder="Descreva o local..."
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmAddPoint()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNamingOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmAddPoint} className="bg-red-600 hover:bg-red-700">Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
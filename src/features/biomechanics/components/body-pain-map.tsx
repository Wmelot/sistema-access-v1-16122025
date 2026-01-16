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

    const [activeView, setActiveView] = useState<PainPoint["view"]>("anterior");
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const [isNamingOpen, setIsNamingOpen] = useState(false);
    const [pendingPoint, setPendingPoint] = useState<{ x: number, y: number } | null>(null);
    const [labelName, setLabelName] = useState("");

    const viewConfig = {
        "anterior": { src: "/images/body-anterior.png", label: "Vista Anterior" },
        "posterior": { src: "/images/body-posterior.png", label: "Vista Posterior" },
        "left-feet": { src: "/images/foot-map-left.png", label: "Pé Esquerdo" },
        "right-feet": { src: "/images/foot-map-right.png", label: "Pé Direito" },
    };

    const visiblePoints = points.filter(p => (p.view || "anterior") === activeView);

    // Configuração de Hotspots (Zonas Fixas) para os Pés
    const getHotspots = (view: string) => {
        // REMOVIDO: Hotspots desativados a pedido do usuário para permitir marcação livre (freetext)
        // A lógica de clique livre será assumida pelo handleContainerClick
        return []
        return []
    }

    const currentHotspots = getHotspots(activeView!)
    const hasHotspots = currentHotspots.length > 0

    const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
        // Bloqueia marcação livre se houver hotspots definidos para a view
        if (hasHotspots) return

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

    const handleHotspotClick = (e: MouseEvent<HTMLDivElement>, zone: any) => {
        e.stopPropagation()
        onAdd({
            x: zone.x,
            y: zone.y,
            view: activeView,
            label: zone.label
        });
        toast.success(`Ponto "${zone.label}" adicionado!`);
    }

    const confirmAddPoint = () => {
        if (pendingPoint) {
            onAdd({
                x: pendingPoint.x,
                y: pendingPoint.y,
                view: activeView,
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
                className={cn(
                    "relative w-full aspect-[3/4] md:aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner select-none",
                    hasHotspots ? "cursor-default" : "cursor-crosshair"
                )}
            >
                <Image
                    src={viewConfig[activeView!].src}
                    alt={viewConfig[activeView!].label}
                    fill
                    className="object-contain pointer-events-none p-4"
                />

                {/* Hotspots (Apenas para Pés) */}
                {currentHotspots.map((zone) => (
                    <div
                        key={zone.id}
                        onClick={(e) => handleHotspotClick(e, zone)}
                        style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                            width: `${zone.w}%`,
                            height: `${zone.h}%`
                        }}
                        className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 cursor-pointer z-20",
                            "hover:border-2 hover:border-white hover:shadow-lg opacity-0 hover:opacity-100", // Invisível até hover
                            zone.color
                        )}
                        title={zone.label}
                    />
                ))}

                {/* Pontos Marcados */}
                {visiblePoints.map((point) => (
                    <div
                        key={point.id}
                        onContextMenu={(e) => handlePointContextMenu(e, point.id)}
                        onMouseDown={(e) => { e.stopPropagation(); setDraggingId(point.id); }}
                        title={point.label}
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-30"
                    >
                        <span className="text-[10px] text-white font-bold">
                            {point.label?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                {hasHotspots
                    ? "Clique nas áreas destacadas para marcar • Botão direito para remover"
                    : "Clique para marcar • Botão direito para remover"
                }
            </p>

            {/* Modal de Identificação (Para marcação livre) */}
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
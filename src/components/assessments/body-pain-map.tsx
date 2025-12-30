"use client"

import React, { useState } from 'react'
import Image from 'next/image'

interface Point {
    x: number
    y: number
    label?: string
}

interface BodyPainMapProps {
    value?: {
        anterior: Point[];
        posterior: Point[];
        feet: Point[];
    };
    onChange?: (value: any) => void;
    readOnly?: boolean;
}

export function BodyPainMap({ value, onChange, readOnly = false }: BodyPainMapProps) {

    const anteriorPoints = value?.anterior || []
    const posteriorPoints = value?.posterior || []
    const feetPoints = value?.feet || []

    const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>, type: 'anterior' | 'posterior' | 'feet') => {
        if (readOnly) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const newPoint = { x, y }

        // Determine which list to modify
        let currentList: Point[] = []
        if (type === 'anterior') currentList = anteriorPoints
        else if (type === 'posterior') currentList = posteriorPoints
        else if (type === 'feet') currentList = feetPoints

        // Remove if close to existing (toggle)
        const existingIndex = currentList.findIndex(p => Math.hypot(p.x - x, p.y - y) < 5)

        let newList
        if (existingIndex >= 0) {
            newList = [...currentList]
            newList.splice(existingIndex, 1)
        } else {
            newList = [...currentList, newPoint]
        }

        onChange?.({
            ...value,
            [type]: newList
        })
    }

    return (
        <div className="w-full select-none space-y-8">

            {/* BODY VIEWS */}
            <div className="grid grid-cols-2 gap-4">
                {/* Anterior View */}
                <div className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border cursor-crosshair group" onClick={(e) => handleBodyClick(e, 'anterior')}>
                    <img
                        src="/body-map-anterior.jpg"
                        alt="Mapa Corporal Anterior"
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase pointer-events-none">Anterior</div>

                    {/* Render Points */}
                    {anteriorPoints.map((p, i) => (
                        <div
                            key={i}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500/60 rounded-full border-2 border-red-100 shadow-md animate-in zoom-in duration-200 pointer-events-none"
                        />
                    ))}
                </div>

                {/* Posterior View */}
                <div className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border cursor-crosshair group" onClick={(e) => handleBodyClick(e, 'posterior')}>
                    <img
                        src="/body-map-posterior.jpg"
                        alt="Mapa Corporal Posterior"
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase pointer-events-none">Posterior</div>

                    {posteriorPoints.map((p, i) => (
                        <div
                            key={i}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            className="absolute w-6 h-6 -ml-3 -mt-3 bg-orange-500/60 rounded-full border-2 border-orange-100 shadow-md animate-in zoom-in duration-200 pointer-events-none"
                        />
                    ))}
                </div>
            </div>

            {/* FEET VIEW */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Mapeamento dos Pés</h3>
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100 rounded-lg overflow-hidden border cursor-crosshair group" onClick={(e) => handleBodyClick(e, 'feet')}>
                    {/* Using body-map-feet.jpg which likely contains both feet */}
                    <img
                        src="/body-map-feet.jpg"
                        alt="Mapa dos Pés"
                        className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity mix-blend-multiply"
                    />

                    {feetPoints.map((p, i) => (
                        <div
                            key={i}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            className="absolute w-4 h-4 -ml-2 -mt-2 bg-blue-500/60 rounded-full border-2 border-blue-100 shadow-md animate-in zoom-in duration-200 pointer-events-none"
                        />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Clique e aponte o local exato da dor (Fáscia, Metatarsos, Calcâneo)</p>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-2">
                Clique nas áreas para adicionar/remover pontos de dor.
            </p>
        </div>
    )
}

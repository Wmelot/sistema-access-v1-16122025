"use client"

import React, { useState } from 'react'

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
    const [view, setView] = useState<'body' | 'feet'>('body')

    const anteriorPoints = value?.anterior || []
    const posteriorPoints = value?.posterior || []
    const feetPoints = value?.feet || []

    const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>, type: 'anterior' | 'posterior') => {
        if (readOnly) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        const newPoint = { x, y }
        const currentList = type === 'anterior' ? anteriorPoints : posteriorPoints

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

    // Placeholder Images (In real app, use processed SVG/Images)
    // Using CSS shapes for now to visualize structure
    return (
        <div className="w-full select-none">
            <div className="flex justify-center mb-4 space-x-4">
                <button
                    onClick={() => setView('body')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'body' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                >
                    Corpo (Ant/Post)
                </button>
                <button
                    onClick={() => setView('feet')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'feet' ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
                >
                    Pés (Detalhe)
                </button>
            </div>

            <div className="relative aspect-[16/9] bg-slate-50 border rounded-lg overflow-hidden">
                {/* This is a placeholder visualizer. Ideally, we would load the user's uploaded images or standard anatomical charts. */}
                {view === 'body' ? (
                    <div className="grid grid-cols-2 h-full divide-x">
                        {/* Anterior View */}
                        <div className="relative h-full cursor-crosshair group" onClick={(e) => handleBodyClick(e, 'anterior')}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                                <span className="text-4xl font-bold uppercase rotate-90 tracking-widest text-slate-400">Anterior</span>
                            </div>
                            {/* Render Points */}
                            {anteriorPoints.map((p, i) => (
                                <div
                                    key={i}
                                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-500/50 rounded-full border-2 border-red-600 animate-pulse shadow-lg"
                                />
                            ))}
                        </div>

                        {/* Posterior View */}
                        <div className="relative h-full cursor-crosshair group" onClick={(e) => handleBodyClick(e, 'posterior')}>
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity">
                                <span className="text-4xl font-bold uppercase rotate-90 tracking-widest text-slate-400">Posterior</span>
                            </div>
                            {posteriorPoints.map((p, i) => (
                                <div
                                    key={i}
                                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                    className="absolute w-6 h-6 -ml-3 -mt-3 bg-orange-500/50 rounded-full border-2 border-orange-600 animate-pulse shadow-lg"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="relative h-full w-full bg-white flex items-center justify-center">
                        <p className="text-muted-foreground">Mapa de Pés (Em construção)</p>
                    </div>
                )}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
                Clique nas áreas para marcar/desmarcar pontos de dor.
            </p>
        </div>
    )
}

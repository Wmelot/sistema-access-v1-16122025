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

export function BodyPainMap({ painPoints, onChange, readOnly = false }: any) {

    const togglePoint = (key: string, side: 'left' | 'right') => {
        if (readOnly) return
        onChange?.({
            ...painPoints,
            [key]: {
                ...painPoints[key],
                [side]: !painPoints[key]?.[side]
            }
        })
    }

    const Point = ({ x, y, active, onClick, label }: any) => (
        <button
            onClick={onClick}
            title={label}
            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 shadow-md transition-all z-10 
            ${active ? 'bg-red-500 border-white scale-110' : 'bg-white/50 border-red-500 hover:bg-red-200'}`}
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            <span className="sr-only">{label}</span>
        </button>
    )

    return (
        <div className="w-full select-none space-y-8">
            <div className="grid grid-cols-2 gap-4">
                {/* ANTERIOR VIEW (Front) - Knees, Hips - Using approximate positions based on generic body map */}
                <div className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border">
                    <img src="/body-map-anterior.jpg" className="w-full h-full object-cover opacity-90" alt="Anterior" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase">Frente</div>

                    {/* Hip (Quadril) */}
                    <Point x={35} y={45} active={painPoints.hip?.right} onClick={() => togglePoint('hip', 'right')} label="Quadril Direito" />
                    <Point x={65} y={45} active={painPoints.hip?.left} onClick={() => togglePoint('hip', 'left')} label="Quadril Esquerdo" />

                    {/* Knee (Joelho) */}
                    <Point x={35} y={70} active={painPoints.knee?.right} onClick={() => togglePoint('knee', 'right')} label="Joelho Direito" />
                    <Point x={65} y={70} active={painPoints.knee?.left} onClick={() => togglePoint('knee', 'left')} label="Joelho Esquerdo" />
                </div>

                {/* POSTERIOR VIEW (Back) - Achilles, Calcaneus (Heel from back) */}
                <div className="relative aspect-[9/16] bg-slate-100 rounded-lg overflow-hidden border">
                    <img src="/body-map-posterior.jpg" className="w-full h-full object-cover opacity-90" alt="Posterior" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase">Costas</div>

                    {/* Achilles (Aquiles) */}
                    <Point x={40} y={85} active={painPoints.achilles?.left} onClick={() => togglePoint('achilles', 'left')} label="Aquiles Esquerdo" />
                    <Point x={60} y={85} active={painPoints.achilles?.right} onClick={() => togglePoint('achilles', 'right')} label="Aquiles Direito" />
                </div>
            </div>

            {/* FEET VIEW (Soles) - Metatarsals, Arch, Calcaneus (Plantar) */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Pontos de Dor nos Pés (Plantar)</h3>
                <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100 rounded-lg overflow-hidden border">
                    <img src="/body-map-feet.jpg" className="w-full h-full object-contain opacity-90 mix-blend-multiply" alt="Pés" />

                    {/* LEFT FOOT (Actually rendered on Left side of image usually, but verify image. Assuming standard feet map logic) */}
                    {/* Adjust coordinates based on typical "feet sole" maps where Left Foot is on Left Side */}

                    {/* Calcaneus (Calcanhar) */}
                    <Point x={25} y={80} active={painPoints.calcaneus?.left} onClick={() => togglePoint('calcaneus', 'left')} label="Calcâneo Esquerdo" />
                    <Point x={75} y={80} active={painPoints.calcaneus?.right} onClick={() => togglePoint('calcaneus', 'right')} label="Calcâneo Direito" />

                    {/* Arch (Fáscia/Arco) */}
                    <Point x={30} y={55} active={painPoints.arch?.left} onClick={() => togglePoint('arch', 'left')} label="Arco/Fáscia Esquerdo" />
                    <Point x={70} y={55} active={painPoints.arch?.right} onClick={() => togglePoint('arch', 'right')} label="Arco/Fáscia Direito" />

                    {/* Metatarsal 1 (Big Toe joint) - Inside */}
                    <Point x={35} y={30} active={painPoints.metatarsal1?.left} onClick={() => togglePoint('metatarsal1', 'left')} label="Metatarso 1 Esquerdo" />
                    <Point x={65} y={30} active={painPoints.metatarsal1?.right} onClick={() => togglePoint('metatarsal1', 'right')} label="Metatarso 1 Direito" />

                    {/* Metatarsal 3 (Middle) */}
                    <Point x={28} y={25} active={painPoints.metatarsal3?.left} onClick={() => togglePoint('metatarsal3', 'left')} label="Metatarso 3 Esquerdo" />
                    <Point x={72} y={25} active={painPoints.metatarsal3?.right} onClick={() => togglePoint('metatarsal3', 'right')} label="Metatarso 3 Direito" />

                    {/* Metatarsal 5 (Pinky joint) - Outside */}
                    <Point x={15} y={35} active={painPoints.metatarsal5?.left} onClick={() => togglePoint('metatarsal5', 'left')} label="Metatarso 5 Esquerdo" />
                    <Point x={85} y={35} active={painPoints.metatarsal5?.right} onClick={() => togglePoint('metatarsal5', 'right')} label="Metatarso 5 Direito" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                    <p className="text-center">Pé Esquerdo</p>
                    <p className="text-center">Pé Direito</p>
                </div>
            </div>

        </div>
    )
}

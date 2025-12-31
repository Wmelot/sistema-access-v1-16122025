"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Save, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

// Initial Coordinates extracted from previous hardcoded values
const INITIAL_COORDS = {
    head: {},
    cervical: {},
    thoracic: {},
    lumbar: {},
    sacrum: {},
    hip: {},
    knee: {},
    ankle: {},
    // Views
    anterior: {},
    posterior: {},
    feet: {}
}

export interface CustomPoint {
    id: string;
    x: number;
    y: number;
    view: 'anterior' | 'posterior' | 'feetLeft' | 'feetRight';
    label: string;
    active?: boolean;
}

interface BodyPainMapProps {
    painPoints: any;
    onChange: (points: any) => void;
    customPoints?: CustomPoint[];
    onCustomPointsChange?: (points: CustomPoint[]) => void;
    readOnly?: boolean;
}

// Drag State Definition
type DragState =
    | { type: 'standard'; view: string; key: string; side: string }
    | { type: 'custom'; view: string; id: string; startX?: number; startY?: number }

export function BodyPainMap({ painPoints, onChange, customPoints = [], onCustomPointsChange, readOnly = false }: BodyPainMapProps) {
    const [coords, setCoords] = useState(INITIAL_COORDS)
    const [isCalibration, setIsCalibration] = useState(false)
    const [showStandard, setShowStandard] = useState(true) // [NEW] Toggle standard points visibility
    const [dragging, setDragging] = useState<DragState | null>(null)
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null) // [NEW] Track hovered point label

    // Track movement to distinguish click vs drag for popovers
    const interactionRef = useRef<{ startX: number; startY: number; moved: boolean }>({ startX: 0, startY: 0, moved: false })

    const containerRefs = {
        anterior: useRef<HTMLDivElement>(null),
        posterior: useRef<HTMLDivElement>(null),
        feetLeft: useRef<HTMLDivElement>(null),
        feetRight: useRef<HTMLDivElement>(null),
    }

    const togglePoint = (key: string, side: 'left' | 'right') => {
        if (readOnly || isCalibration) return // Disable toggle in calibration
        onChange?.({
            ...painPoints,
            [key]: {
                ...painPoints[key],
                [side]: !painPoints[key]?.[side]
            }
        })
    }

    const handleClearAll = () => {
        if (confirm("Deseja limpar todo o mapa? Isso desmarcará todos os pontos padrão e removerá os pontos personalizados.")) {
            // 1. Reset Standard Points (Deep Reset)
            const resetPoints: any = {}
            Object.keys(painPoints).forEach(key => {
                resetPoints[key] = {}
                if (painPoints[key]?.left !== undefined) resetPoints[key].left = false
                if (painPoints[key]?.right !== undefined) resetPoints[key].right = false
            })
            onChange?.(resetPoints)

            // 2. Clear Custom Points
            onCustomPointsChange?.([])

            // 3. Keep showing the map (don't hide the layer, just empty it)
            setShowStandard(true)

            // 4. Force exit Calibration Mode (so points don't look blue)
            setIsCalibration(false)

            toast.success("Mapa limpo com sucesso!")
        }
    }

    // --- UNDO HISTORY ---
    const historyRef = useRef<CustomPoint[][]>([])

    const addToHistory = () => {
        // Limit history to 20 steps
        if (historyRef.current.length > 20) historyRef.current.shift()
        historyRef.current.push([...customPoints])
    }

    const handleUndo = useCallback(() => {
        if (historyRef.current.length === 0) return

        const previousState = historyRef.current.pop()
        if (previousState) {
            onCustomPointsChange?.(previousState)
            toast.info("Ação desfeita")
        }
    }, [onCustomPointsChange]) // No dependency on customPoints needed for the restore action itself, but historyRef is stable

    // Keyboard Listener for Undo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                handleUndo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo])


    const handleBackgroundClick = (e: React.MouseEvent, view: 'anterior' | 'posterior' | 'feetLeft' | 'feetRight') => {
        if (readOnly || isCalibration) return;
        // Check if target is a button (existing point), if so, ignore
        if ((e.target as HTMLElement).closest('button')) return;

        const ref = containerRefs[view];
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const newPoint: CustomPoint = {
            id: crypto.randomUUID(),
            x,
            y,
            view,
            label: "Dor Local",
            active: true
        };

        addToHistory()
        onCustomPointsChange?.([...customPoints, newPoint]);
    };

    const updateCustomPoint = (id: string, updates: Partial<CustomPoint>) => {
        if (updates.label) {
            addToHistory()
        }
        const updated = customPoints.map(p => p.id === id ? { ...p, ...updates } : p);
        onCustomPointsChange?.(updated);
    }

    const deleteCustomPoint = (id: string) => {
        addToHistory()
        const updated = customPoints.filter(p => p.id !== id);
        onCustomPointsChange?.(updated);
    }

    // Generic Mouse Down Handler
    const handleMouseDown = (e: React.MouseEvent, params: DragState) => {
        // Only allow left click (button 0) for dragging
        if (e.button !== 0) return

        // Red (Standard) points only move in Calibration Mode
        if (params.type === 'standard' && !isCalibration) return

        // Blue (Custom) points move always (Edit mode implicit)
        if (params.type === 'custom') {
            addToHistory()
        }

        e.stopPropagation()
        setDragging(params)
        interactionRef.current = { startX: e.clientX, startY: e.clientY, moved: false }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return

        // Find correct ref
        let ref = containerRefs.anterior
        // @ts-ignore
        if (dragging.view === 'posterior') ref = containerRefs.posterior
        // @ts-ignore
        if (dragging.view === 'feetLeft') ref = containerRefs.feetLeft
        // @ts-ignore
        if (dragging.view === 'feetRight') ref = containerRefs.feetRight

        if (!ref.current) return

        const rect = ref.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Clamp 0-100
        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        // Check significant movement (for popover vs drag distinction)
        if (Math.abs(e.clientX - interactionRef.current.startX) > 5 || Math.abs(e.clientY - interactionRef.current.startY) > 5) {
            interactionRef.current.moved = true
        }

        // Apply Update
        if (dragging.type === 'standard') {
            setCoords(prev => {
                // @ts-ignore
                const viewGroup = dragging.view.startsWith('feet') ? 'feet' : dragging.view
                return {
                    ...prev,
                    [viewGroup]: {
                        // @ts-ignore
                        ...prev[viewGroup],
                        [dragging.key]: {
                            // @ts-ignore
                            ...prev[viewGroup][dragging.key],
                            [dragging.side]: { x: clampedX, y: clampedY }
                        }
                    }
                }
            })
        } else if (dragging.type === 'custom') {
            updateCustomPoint(dragging.id, { x: clampedX, y: clampedY })
        }
    }

    const handleMouseUp = () => {
        setDragging(null)
    }

    // Attach global listeners for drag
    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove as any)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove as any)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragging])

    const copyConfig = () => {
        // Export both standard (current empty) and custom (user created) for dev calibration
        const exportData = {
            standard: coords,
            custom: customPoints
        }
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2))
        toast.success("Dados copiados (Padrão + Personalizados)!")
    }

    // Point Component
    const Point = ({
        x,
        y,
        active,
        onClick,
        label,
        onMouseDown,
        onMouseEnter, // [NEW]
        onMouseLeave, // [NEW]
        readOnly,
        isCalibration
    }: {
        x: number
        y: number
        active?: boolean
        onClick?: (e: React.MouseEvent) => void
        label: string
        onMouseDown?: (e: React.MouseEvent) => void
        onMouseEnter?: () => void
        onMouseLeave?: () => void
        readOnly?: boolean
        isCalibration?: boolean
    }) => (
        <ContextMenu>
            <ContextMenuTrigger asChild disabled={readOnly || isCalibration}>
                <button
                    type="button"
                    onClick={(e) => {
                        // Only handle Left Click interaction here
                        // Right Click is handled by ContextMenuTrigger
                        e.stopPropagation()
                        if (onClick) onClick(e)
                    }}
                    onMouseDown={(e) => {
                        if (onMouseDown) onMouseDown(e)
                    }}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    title={label}
                    className={`absolute rounded-full border shadow-md transition-all z-10 flex items-center justify-center
        ${isCalibration ? 'w-6 h-6 border-blue-500 bg-blue-200/50 cursor-move' : 'w-5 h-5 -ml-2.5 -mt-2.5'}
        ${!isCalibration && active ? 'bg-red-500 border-white scale-125' : ''}
        ${!isCalibration && !active ? 'bg-white/60 border-red-500 hover:bg-red-200' : ''}
        `}
                    style={{ left: `${x}%`, top: `${y}%`, transform: isCalibration ? 'translate(-50%, -50%)' : undefined }}
                >
                    <span className="sr-only">{label}</span>
                    {isCalibration && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
                </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onSelect={(e) => {
                        // Only delete (toggle off) if active
                        if (active && onClick) onClick(e as any)
                    }}
                    disabled={!active}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )

    // Custom Point Component with Context Menu
    const CustomPointMarker = ({
        point,
        readOnly,
        onUpdate,
        onDelete,
        onMouseDown
    }: {
        point: CustomPoint
        readOnly?: boolean
        onUpdate: (id: string, updates: Partial<CustomPoint>) => void
        onDelete: (id: string) => void
        onMouseDown: (e: React.MouseEvent) => void
    }) => {
        // We use Radix Context Menu for robust Right Click handling
        const [label, setLabel] = useState(point.label)

        // Sync local state if prop changes
        useEffect(() => {
            setLabel(point.label)
        }, [point.label])

        const handleSave = () => {
            if (label !== point.label) {
                onUpdate(point.id, { label })
            }
        }

        const isActive = point.active !== false // Default to true if undefined

        return (
            <ContextMenu>
                <ContextMenuTrigger asChild disabled={readOnly}>
                    {/* The draggable button */}
                    <button
                        type="button"
                        className={`absolute -ml-2.5 -mt-2.5 rounded-full z-20 transition-all duration-300 flex items-center justify-center
                            ${isActive
                                ? 'w-5 h-5 bg-blue-500 border-2 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.3)] animate-pulse'
                                : 'w-4 h-4 bg-transparent border-2 border-blue-500 hover:bg-blue-50'
                            }
                            ${!readOnly ? 'cursor-pointer hover:scale-110' : ''}
                        `}
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        onMouseDown={(e) => {
                            // Stop propagation to prevent map drag/click
                            e.stopPropagation()
                            onMouseDown(e)
                        }}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!readOnly) {
                                onUpdate(point.id, { active: !isActive })
                            }
                        }}
                        title={point.label}
                    >
                        <span className="sr-only">{point.label}</span>
                    </button>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-64 p-3 gap-2">
                    <div className="space-y-2 mb-2" onSelect={(e) => e.preventDefault()}>
                        <h4 className="font-medium text-sm leading-none">Editar Ponto</h4>
                        <p className="text-xs text-muted-foreground">Nomeie a dor ou exclua.</p>
                    </div>

                    {/* Custom Input Item */}
                    <div className="flex gap-2 items-center mb-1">
                        <Input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            className="h-8 text-sm"
                            placeholder="Nome da dor..."
                            // Prevent menu closing when clicking input
                            onClick={(e) => e.stopPropagation()}
                            onKeyDownCapture={(e) => e.stopPropagation()}
                        />
                    </div>

                    <ContextMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        onSelect={() => onDelete(point.id)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Ponto
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        )
    }

    return (
        <div className="w-full select-none space-y-8">
            <div className="flex flex-wrap gap-2 justify-between items-center bg-slate-50 p-3 rounded-lg border">
                <div className="flex gap-2 items-center">
                    <Button
                        type="button"
                        variant={showStandard ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowStandard(!showStandard)}
                        className={showStandard ? 'bg-slate-700 hover:bg-slate-800' : ''}
                    >
                        {showStandard ? 'Ocultar Pontos Padrão' : 'Mostrar Pontos Padrão'}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAll}
                        className="gap-2"
                        disabled={readOnly}
                    >
                        <Trash2 className="w-4 h-4" /> Limpar Mapa
                    </Button>
                </div>

                {/* Hover Label Indicator - [NEW] */}
                <div className="flex-1 flex justify-center h-6">
                    {hoveredLabel && (
                        <div className="bg-black/75 text-white px-3 py-1 rounded-full text-xs font-bold uppercase animate-in fade-in zoom-in duration-200">
                            {hoveredLabel}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCalibration(!isCalibration)}
                        className="text-xs text-slate-400"
                    >
                        {isCalibration ? 'Modo Visualização' : 'Ajustar Posições'}
                    </Button>
                    {isCalibration && (
                        <Button type="button" size="sm" onClick={copyConfig} className="gap-2">
                            <Copy className="w-4 h-4" /> Copiar Coordenadas
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* ANTERIOR VIEW */}
                <div
                    ref={containerRefs.anterior}
                    className={`relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border ${!readOnly && !isCalibration ? 'cursor-crosshair' : ''}`}
                    onClick={(e) => handleBackgroundClick(e, 'anterior')}
                >
                    <img src="/body-map-anterior.jpg" className="w-full h-full object-cover opacity-90" alt="Anterior" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase pointer-events-none">Frente</div>

                    {/* Standard Points - CONDITIONAL */}
                    {showStandard && Object.entries(coords.anterior || {}).map(([key, sides]) => (
                        Object.entries(sides as any).map(([side, pos]: any) => (
                            <Point
                                key={`ant-${key}-${side}`}
                                label={`${key} (${side})`}
                                x={pos.x}
                                y={pos.y}
                                active={painPoints[key]?.[side]}
                                onClick={() => togglePoint(key, side as 'left' | 'right')}
                                onMouseDown={(e) => handleMouseDown(e, { type: 'standard', view: 'anterior', key, side })}
                                onMouseEnter={() => setHoveredLabel(`${key} (${side === 'left' ? 'Esq' : 'Dir'})`)}
                                onMouseLeave={() => setHoveredLabel(null)}
                                readOnly={readOnly}
                                isCalibration={isCalibration}
                            />
                        ))
                    ))}

                    {/* Custom Points */}
                    {customPoints.filter(p => p.view === 'anterior').map(p => (
                        <CustomPointMarker
                            key={p.id}
                            point={p}
                            readOnly={readOnly}
                            onUpdate={updateCustomPoint}
                            onDelete={deleteCustomPoint}
                            onMouseDown={(e) => handleMouseDown(e, { type: 'custom', view: 'anterior', id: p.id })}
                        />
                    ))}
                </div>

                {/* POSTERIOR VIEW */}
                <div
                    ref={containerRefs.posterior}
                    className={`relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border ${!readOnly && !isCalibration ? 'cursor-crosshair' : ''}`}
                    onClick={(e) => handleBackgroundClick(e, 'posterior')}
                >
                    <img src="/body-map-posterior.jpg" className="w-full h-full object-cover opacity-90" alt="Posterior" />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded uppercase pointer-events-none">Costas</div>

                    {/* Standard Points - CONDITIONAL */}
                    {showStandard && Object.entries(coords.posterior || {}).map(([key, sides]) => (
                        Object.entries(sides as any).map(([side, pos]: any) => (
                            <Point
                                key={`post-${key}-${side}`}
                                label={`${key} (${side})`}
                                x={pos.x}
                                y={pos.y}
                                active={painPoints[key]?.[side]}
                                onClick={() => togglePoint(key, side as 'left' | 'right')}
                                onMouseDown={(e) => handleMouseDown(e, { type: 'standard', view: 'posterior', key, side })}
                                onMouseEnter={() => setHoveredLabel(`${key} (${side === 'left' ? 'Esq' : 'Dir'})`)}
                                onMouseLeave={() => setHoveredLabel(null)}
                                readOnly={readOnly}
                                isCalibration={isCalibration}
                            />
                        ))
                    ))}

                    {/* Custom Points */}
                    {customPoints.filter(p => p.view === 'posterior').map(p => (
                        <CustomPointMarker
                            key={p.id}
                            point={p}
                            readOnly={readOnly}
                            onUpdate={updateCustomPoint}
                            onDelete={deleteCustomPoint}
                            onMouseDown={(e) => handleMouseDown(e, { type: 'custom', view: 'posterior', id: p.id })}
                        />
                    ))}
                </div>
            </div>

            {/* FEET VIEW SPLIT */}
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Pontos de Dor nos Pés</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* LEFT FOOT CONTAINER */}
                    <div className="space-y-2">
                        <div
                            ref={containerRefs.feetLeft}
                            className={`relative aspect-square bg-slate-100 rounded-lg overflow-hidden border ${!readOnly && !isCalibration ? 'cursor-crosshair' : ''}`}
                            onClick={(e) => handleBackgroundClick(e, 'feetLeft')}
                        >
                            <img src="/body-map-feet.jpg" className="w-full h-full object-contain opacity-90 mix-blend-multiply" alt="Pé Esquerdo" />
                            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                <span className="px-2 py-1 bg-slate-900/10 text-slate-600 text-xs rounded font-bold uppercase">Esquerdo</span>
                            </div>

                            {/* Standard Points REMOVED */}

                            {/* Custom Points */}
                            {customPoints.filter(p => p.view === 'feetLeft').map(p => (
                                <CustomPointMarker
                                    key={p.id}
                                    point={p}
                                    readOnly={readOnly}
                                    onUpdate={updateCustomPoint}
                                    onDelete={deleteCustomPoint}
                                    onMouseDown={(e) => handleMouseDown(e, { type: 'custom', view: 'feetLeft', id: p.id })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT FOOT CONTAINER */}
                    <div className="space-y-2">
                        <div
                            ref={containerRefs.feetRight}
                            className={`relative aspect-square bg-slate-100 rounded-lg overflow-hidden border ${!readOnly && !isCalibration ? 'cursor-crosshair' : ''}`}
                            onClick={(e) => handleBackgroundClick(e, 'feetRight')}
                        >
                            <img src="/body-map-feet.jpg" className="w-full h-full object-contain opacity-90 mix-blend-multiply scale-x-[-1]" alt="Pé Direito" />
                            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                                <span className="px-2 py-1 bg-slate-900/10 text-slate-600 text-xs rounded font-bold uppercase">Direito</span>
                            </div>

                            {/* Standard Points - RESTORED */}
                            {showStandard && Object.entries(coords.feet || {}).map(([key, sides]: any) => (
                                sides.right ? (
                                    <Point
                                        key={`feet-right-${key}`}
                                        label={`${key} (Right)`}
                                        x={sides.right.x}
                                        y={sides.right.y}
                                        active={painPoints[key]?.right}
                                        onClick={() => togglePoint(key, 'right')}
                                        onMouseDown={(e) => handleMouseDown(e, { type: 'standard', view: 'feetRight', key, side: 'right' })}
                                        onMouseEnter={() => setHoveredLabel(`${key}`)}
                                        onMouseLeave={() => setHoveredLabel(null)}
                                        readOnly={readOnly}
                                        isCalibration={isCalibration}
                                    />
                                ) : null
                            ))}

                            {/* Custom Points */}
                            {customPoints.filter(p => p.view === 'feetRight').map(p => (
                                <CustomPointMarker
                                    key={p.id}
                                    point={p}
                                    readOnly={readOnly}
                                    onUpdate={updateCustomPoint}
                                    onDelete={deleteCustomPoint}
                                    onMouseDown={(e) => handleMouseDown(e, { type: 'custom', view: 'feetRight', id: p.id })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* DEBUG OUTPUT */}
            {isCalibration && (
                <div className="p-4 bg-slate-900 rounded-lg overflow-auto max-h-40">
                    <pre className="text-xs text-green-400 font-mono">
                        {JSON.stringify(coords, null, 2)}
                    </pre>
                </div>
            )}

        </div>
    )
}

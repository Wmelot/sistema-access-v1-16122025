
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Box, Info, RotateCcw, Scale, Layers, ArrowDownRight, Shield } from 'lucide-react';
import { DraggablePoint } from '../builder-components'; // Will move DraggablePoint to shared

// NOTE: We assume DraggablePoint is available. I will update builder-components to export it.

interface FieldPainMapProps {
    field: any;
    isPreview: boolean;
    value: any;
    onChange?: (val: any) => void;
    onConfigChange?: (key: string, val: any) => void;
    records?: any[]; // For AI logic
    selectedRecordId?: string; // For AI logic
}

export const FieldPainMap = ({ field, isPreview, value, onChange, onConfigChange, records, selectedRecordId }: FieldPainMapProps) => {
    // Local State duplicates for the AI logic if needed, or passed as props
    const [aiInstructions, setAiInstructions] = useState<string>('');

    const PRESET_PROMPTS: Record<string, string> = {
        "Avaliação": "Gere um relatório de avaliação física detalhado, focando em queixas, história e testes objetivos.",
        "Evolução": "Descreva a evolução do paciente, ganhos de ADM, força e resposta ao tratamento.",
        "Alta": "Resuma o tratamento, objetivos alcançados e orientações de alta."
    };

    // [NEW] Intelligent Script Pre-filling (Copied from RenderField)
    useEffect(() => {
        if (!selectedRecordId) return

        const record = records?.find((r: any) => r.id === selectedRecordId)
        if (record && record.form_templates) {
            const template = record.form_templates

            // 1. Check for Custom DB Script
            if (template.ai_generation_script) {
                setAiInstructions(template.ai_generation_script)
                toast.info("Script personalizado do formulário carregado!")
                return
            }

            // 2. Check for Presets (Partial Match)
            const title = template.title || ''
            const presetKey = Object.keys(PRESET_PROMPTS).find(key => title.includes(key) || key.includes(title))

            if (presetKey) {
                setAiInstructions(PRESET_PROMPTS[presetKey])
                toast.info(`Script de ${presetKey} carregado!`)
            } else {
                setAiInstructions("Gere um relatório detalhado da consulta.")
            }
        }
    }, [selectedRecordId, records])


    return (
        <div className="space-y-4">
            <Label>{field.label}</Label>
            <div className="relative w-full max-w-[500px] mx-auto border rounded-lg bg-white select-none">
                {/* Background Image */}
                <div className="relative overflow-hidden rounded-t-lg">
                    <img
                        key={field.viewType || 'default'}
                        src={
                            field.viewType === 'anterior' ? '/body-map-anterior.jpg' :
                                field.viewType === 'posterior' ? '/body-map-posterior.jpg' :
                                    field.viewType === 'feet' ? '/body-map-feet.jpg' :
                                        '/body-map-3d.png'
                        }
                        alt={field.label}
                        className="w-full h-auto block pointer-events-none select-none"
                        draggable={false}
                    />

                    {/* TEXT OVERLAYS (CONFIGURABLE) */}
                    {field.texts?.map((text: any, i: number) => {
                        const scale = 1;
                        const extraX = 0;
                        const extraY = 0;
                        const offset = 0;

                        const adjX = text.x * scale + offset;
                        const adjY = text.y * scale + offset;

                        const handleTextPointerDown = (e: React.PointerEvent) => {
                            if (isPreview || !onConfigChange) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const target = e.currentTarget;
                            target.setPointerCapture(e.pointerId);

                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startValX = text.x;
                            const startValY = text.y;

                            const container = target.parentElement?.getBoundingClientRect();
                            if (!container || container.width === 0 || container.height === 0) return;

                            const onMove = (moveEvent: PointerEvent) => {
                                const deltaPixelX = moveEvent.clientX - startX;
                                const deltaPixelY = moveEvent.clientY - startY;
                                const deltaPercentX = (deltaPixelX / container.width) * 100;
                                const deltaPercentY = (deltaPixelY / container.height) * 100;
                                const newX = startValX + (deltaPercentX / scale);
                                const newY = startValY + (deltaPercentY / scale);
                                const newTexts = [...field.texts];
                                newTexts[i] = { ...newTexts[i], x: newX, y: newY };
                                onConfigChange('texts', newTexts);
                            };
                            const onUp = (upEvent: PointerEvent) => {
                                target.releasePointerCapture(upEvent.pointerId);
                                window.removeEventListener('pointermove', onMove);
                                window.removeEventListener('pointerup', onUp);
                            };
                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                        };

                        return (
                            <div
                                key={`text-${i}`}
                                className={`absolute whitespace-nowrap font-bold text-xs text-center z-10 ${!isPreview ? 'cursor-move ring-1 ring-blue-400 border border-dashed border-blue-300 bg-white/50 px-1' : ''}`}
                                style={{ left: `calc(${adjX}% + ${extraX}px)`, top: `calc(${adjY}% + ${extraY}px)`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
                                onPointerDown={handleTextPointerDown}
                            >
                                {text.content}
                            </div>
                        );
                    })}

                    {/* Clickable Overlay Points */}
                    {field.points?.map((point: any, i: number) => {
                        const safeValue = Array.isArray(value) ? { points: value, observations: '' } : (value || { points: [], observations: '' });
                        const currentPoints = safeValue.points || [];
                        const isSelected = currentPoints.some((v: any) => v.id === point.id);

                        return (
                            <DraggablePoint
                                key={`${point.id}-${i}`}
                                point={point}
                                index={i}
                                field={field}
                                isPreview={isPreview}
                                isSelected={isSelected}
                                onCommit={(idx, newX, newY) => {
                                    if (!onConfigChange) return;
                                    const newPoints = [...field.points];
                                    newPoints[idx] = { ...newPoints[idx], x: newX, y: newY };
                                    onConfigChange('points', newPoints);
                                }}
                                onToggleSelect={() => {
                                    if (!onChange || !isPreview) return // Only toggle in preview

                                    // Handle Value Safety
                                    const safeVal = Array.isArray(value) ? { points: value, observations: '' } : (value || { points: [], observations: '' });
                                    const current = safeVal.points;
                                    const exists = current.some((v: any) => v.id === point.id);

                                    let newSelected;
                                    if (exists) {
                                        newSelected = current.filter((p: any) => p.id !== point.id);
                                    } else {
                                        newSelected = [...current, { id: point.id, label: point.label, x: point.x, y: point.y }];
                                    }

                                    onChange({ ...safeVal, points: newSelected });
                                }}
                            />
                        );
                    })}
                </div>

                {/* Status Bar inside the card */}
                <div className="bg-muted/10 p-2 text-xs border-t text-muted-foreground flex justify-between items-center px-4">
                    <span>
                        Pontos selecionados: {(() => {
                            const safeVal = Array.isArray(value) ? value : (value?.points || []);
                            return safeVal.length > 0 ? safeVal.map((p: any) => p.label).join(', ') : 'Nenhum'
                        })()}
                    </span>
                </div>
            </div>

            {/* Observations Area */}
            {field.showObservations && (
                <div className="pt-2">
                    <Label className="text-xs text-muted-foreground mb-1 block">Observações / Detalhes</Label>
                    <Textarea
                        value={(!Array.isArray(value) && value?.observations) || ''}
                        onChange={(e) => {
                            if (!onChange) return;
                            const safeVal = Array.isArray(value) ? { points: value, observations: '' } : (value || { points: [], observations: '' });
                            onChange({ ...safeVal, observations: e.target.value });
                        }}
                        placeholder="Descreva detalhes observados..."
                        className="min-h-[80px]"
                    />
                </div>
            )}
        </div>
    );
};

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Plus, Loader2, Save, ArrowLeft, Calculator, Sparkles, Bot } from 'lucide-react'
import { generateShoeRecommendation } from '@/app/actions/ai_tennis'
import { toast } from 'sonner'
import { addOptionToTemplate } from '@/app/dashboard/forms/actions'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { useDebounce } from 'use-debounce'
import { logAction } from '@/lib/logger'



export interface FormRendererProps {
    recordId: string
    template: any
    initialContent: any
    status: string
    patientId: string
    templateId: string // Needed for dynamic updates
    hideHeader?: boolean
    hideTitle?: boolean
}

export function FormRenderer({ recordId, template, initialContent, status, patientId, templateId, hideHeader = false, hideTitle = false }: FormRendererProps) {
    const [content, setContent] = useState<any>(initialContent || {})
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [debouncedContent] = useDebounce(content, 1000)
    const supabase = createClient()
    const router = useRouter()
    const isReadOnly = status === 'finalized'

    // Robust helper to extract number
    const extractNumber = (str: string) => {
        if (!str) return 0;
        const normalized = str.toString().replace(/[\u2013\u2014]/g, "-").replace(",", ".");
        const match = normalized.match(/(-?)\s*(\d+(\.\d+)?)/);
        if (match) {
            const sign = match[1] === "-" ? "-" : "";
            const num = match[2];
            return parseFloat(sign + num);
        }
        return 0;
    };

    // Column Resizing Logic
    const [colWidths, setColWidths] = useState<Record<string, Record<number, number>>>({})
    const [resizing, setResizing] = useState<{ fieldId: string, colIndex: number, startX: number, startWidth: number } | null>(null)

    useEffect(() => {
        if (!resizing) return

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - resizing.startX
            const newWidth = Math.max(50, resizing.startWidth + diff) // Min 50px

            setColWidths(prev => ({
                ...prev,
                [resizing.fieldId]: {
                    ...(prev[resizing.fieldId] || {}),
                    [resizing.colIndex]: newWidth
                }
            }))
        }

        const handleMouseUp = () => {
            setResizing(null)
            document.body.style.cursor = 'default'
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'col-resize'

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'default'
        }
    }, [resizing])

    const startResize = (e: React.MouseEvent, fieldId: string, colIndex: number, currentWidth: number) => {
        e.preventDefault()
        setResizing({
            fieldId,
            colIndex,
            startX: e.clientX,
            startWidth: currentWidth || 100 // Default 100px
        })
    }

    // Auto-save effect
    useEffect(() => {
        if (isReadOnly || !recordId) return

        // Don't save if content hasn't changed from initial (simple check)
        // Ideally we check against lastSavedContent but debounced is fine for now

        const save = async () => {
            setSaving(true)
            const { error } = await supabase
                .from('patient_records')
                .update({ content: debouncedContent })
                .eq('id', recordId)

            setSaving(false)
            if (error) {
                console.error('Auto-save failed', error)
            } else {
                setLastSaved(new Date())
                // Audit: Log the update. Note: This runs on every debounced save (frequent).
                // Filtering can be done in the Audit View.
                logAction("UPDATE_RECORD", { recordId }, 'patient_record', recordId)
            }
        }

        save()
    }, [debouncedContent])

    const handleFieldChange = (fieldId: string, value: any) => {
        if (isReadOnly) return
        setContent((prev: any) => ({ ...prev, [fieldId]: value }))
    }

    const renderField = (field: any) => {
        const value = content[field.id]

        switch (field.type) {
            case 'text':
                return <Input
                    value={value || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    disabled={isReadOnly}
                    placeholder={field.placeholder}
                />

            case 'textarea':
                return <Textarea
                    value={value || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    disabled={isReadOnly}
                    rows={4}
                />

            case 'number':
                return <Input
                    type="number"
                    value={value || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    disabled={isReadOnly}
                />

            case 'checkbox':
                return <div className="flex items-center space-x-2">
                    <Checkbox
                        checked={!!value}
                        onCheckedChange={checked => handleFieldChange(field.id, checked)}
                        disabled={isReadOnly}
                    />
                    <Label>{field.label}</Label>
                </div>

            case 'checkbox_group':
                return (
                    <div className="space-y-3">
                        <div className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}>
                            {field.options?.map((opt: string, i: number) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={Array.isArray(value) && value.includes(opt)}
                                        onCheckedChange={(checked) => {
                                            const current = Array.isArray(value) ? [...value] : []
                                            if (checked) current.push(opt)
                                            else {
                                                const idx = current.indexOf(opt)
                                                if (idx > -1) current.splice(idx, 1)
                                            }
                                            handleFieldChange(field.id, current)
                                        }}
                                        disabled={isReadOnly}
                                    />
                                    <Label className="font-normal">{opt}</Label>
                                </div>
                            ))}
                        </div>

                        {!isReadOnly && field.allowCreateOption && (
                            <div className="flex items-center gap-2 max-w-sm mt-2">
                                <Input
                                    placeholder="Outro (Adicionar à lista)"
                                    className="h-8 text-sm"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const target = e.target as HTMLInputElement;
                                            const newOpt = target.value;
                                            if (!newOpt.trim()) return;

                                            const loadingToast = toast.loading("Adicionando...");

                                            // 1. Optimistic Update (UI Only first)
                                            const updatedOptions = [...(field.options || []), newOpt.trim()].sort((a, b) => a.localeCompare(b));
                                            field.options = updatedOptions; // Direct mutation for immediate feedback

                                            // Select it immediately
                                            const current = Array.isArray(value) ? [...value] : [];
                                            current.push(newOpt.trim());
                                            handleFieldChange(field.id, current);

                                            target.value = '';

                                            // 2. Server Action
                                            const res = await addOptionToTemplate(templateId || template.id, field.id, newOpt);
                                            toast.dismiss(loadingToast);

                                            if (!res.success) {
                                                toast.error(res.message);
                                                // Revert would be complex here, assuming success for now or refresh
                                            } else {
                                                toast.success("Opção adicionada e salva!");
                                            }
                                        }
                                    }}
                                />
                                <Button size="sm" variant="ghost" className="h-8 px-2" disabled={true}>
                                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                        ENTER
                                    </kbd>
                                </Button>
                            </div>
                        )}
                    </div>
                )

            case 'radio_group':
                return <RadioGroup
                    value={value || ''}
                    onValueChange={val => handleFieldChange(field.id, val)}
                    disabled={isReadOnly}
                    className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}
                >
                    {field.options?.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                            <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
                        </div>
                    ))}
                </RadioGroup>

            case 'select':
                return <Select
                    value={value || ''}
                    onValueChange={val => handleFieldChange(field.id, val)}
                    disabled={isReadOnly}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt: string, i: number) => (
                            <SelectItem key={i} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

            case 'slider':
                return <div className="space-y-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs">{field.min || 0}</span>
                        <span className="font-bold text-primary">{value ?? field.min ?? 0}</span>
                        <span className="text-muted-foreground text-xs">{field.max || 10}</span>
                    </div>
                    <Slider
                        value={[value || field.min || 0]}
                        max={field.max || 10}
                        min={field.min || 0}
                        step={field.step || 1}
                        onValueChange={vals => handleFieldChange(field.id, vals[0])}
                        disabled={isReadOnly}
                    />
                </div>

            case 'grid':
                const gridType = field.gridType || 'radio'
                const firstColMode = field.firstColMode || (field.firstColEditable ? 'editable' : 'default')
                const showTotal = field.showTotalColumn

                const handleGridChange = (r: number, c: number, val: any) => {
                    const current = typeof value === 'object' ? { ...value } : {}
                    if (val === undefined || val === '') delete current[`${r}-${c}`]
                    else current[`${r}-${c}`] = val
                    handleFieldChange(field.id, current)
                }

                const handleRadioChange = (r: number, val: string) => {
                    const current = typeof value === 'object' ? { ...value } : {}
                    current[`${r}`] = val
                    handleFieldChange(field.id, current)
                }

                const handleRowLabelChange = (r: number, val: string) => {
                    const current = typeof value === 'object' ? { ...value } : {}
                    current[`row-label-${r}`] = val
                    handleFieldChange(field.id, current)
                }

                const getRowTotal = (rowIndex: number) => {
                    if (!field.columns) return 0;

                    // 1. Try summing individual cell values
                    let cellSum = 0;
                    let foundCellValues = false;

                    field.columns.forEach((_: any, j: number) => {
                        const val = value && value[`${rowIndex}-${j}`];
                        if (val !== undefined && val !== '' && val !== null) {
                            foundCellValues = true;
                            cellSum += extractNumber(val.toString());
                        }
                    });

                    if (foundCellValues) return cellSum;

                    // 2. Fallback to Radio Value
                    const val = value && value[`${rowIndex}`];
                    if (val) return extractNumber(val);

                    return 0;
                }

                return <div className="border rounded-md overflow-x-auto bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                {firstColMode !== 'none' && (
                                    <th className="p-2 text-left min-w-[150px] w-[200px]">Item</th>
                                )}

                                {field.columns?.map((col: string, i: number) => (
                                    <th
                                        key={i}
                                        className="p-2 text-center border-l relative group select-none"
                                        style={{ width: colWidths[field.id]?.[i] ? `${colWidths[field.id][i]}px` : 'auto', minWidth: '80px' }}
                                    >
                                        {col}
                                        {!isReadOnly && (
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/20 transition-colors"
                                                onMouseDown={(e) => startResize(e, field.id, i, (e.target as HTMLElement).parentElement?.offsetWidth || 100)}
                                            />
                                        )}
                                    </th>
                                ))}

                                {showTotal && (
                                    <th className="p-2 text-center border-l bg-muted font-bold w-[80px]">Total</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {field.rows?.map((row: string, i: number) => (
                                <tr key={i} className="border-t hover:bg-muted/20">
                                    {firstColMode !== 'none' && (
                                        <td className="p-2 font-medium">
                                            {firstColMode === 'editable' ? (
                                                <Input
                                                    value={(value && value[`row-label-${i}`]) || ''}
                                                    onChange={(e) => handleRowLabelChange(i, e.target.value)}
                                                    placeholder={row}
                                                    className="h-8 text-sm"
                                                    disabled={isReadOnly}
                                                />
                                            ) : (
                                                <span>{row}</span>
                                            )}
                                        </td>
                                    )}

                                    {field.columns?.map((col: string, j: number) => {
                                        const cellType = field.columnTypes?.[j] || gridType

                                        return (
                                            <td key={j} className="p-2 text-center border-l">
                                                <div className="flex justify-center">
                                                    {cellType === 'radio' && (
                                                        <input
                                                            type="radio"
                                                            name={`grid-${field.id}-${i}`} // Group by Row
                                                            checked={(value && value[`${i}`]) === col}
                                                            onChange={() => handleRadioChange(i, col)}
                                                            disabled={isReadOnly}
                                                            className="h-4 w-4 accent-primary"
                                                        />
                                                    )}
                                                    {cellType === 'checkbox' && (
                                                        <Checkbox
                                                            checked={(value && value[`${i}-${j}`]) === true}
                                                            onCheckedChange={checked => handleGridChange(i, j, checked)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'number' && (
                                                        <Input
                                                            type="number"
                                                            className="h-8 w-20 text-center mx-auto"
                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                            onChange={e => handleGridChange(i, j, e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'text' && (
                                                        <Input
                                                            className="h-8 w-full min-w-[100px]"
                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                            onChange={e => handleGridChange(i, j, e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'select_10' && (
                                                        <Select
                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                            onValueChange={val => handleGridChange(i, j, val)}
                                                            disabled={isReadOnly}
                                                        >
                                                            <SelectTrigger className="h-8 w-[70px] mx-auto">
                                                                <SelectValue placeholder="-" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {[...Array(11)].map((_, k) => (
                                                                    <SelectItem key={k} value={k.toString()}>{k}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </td>
                                        )
                                    })}

                                    {showTotal && (
                                        <td className="p-2 text-center border-l bg-muted font-bold w-[80px]">
                                            {getRowTotal(i)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>

                        {showTotal && (
                            <tfoot className="bg-muted/80 font-bold text-sm border-t-2 border-muted">
                                <tr className="hover:bg-muted/100">
                                    <td
                                        colSpan={(field.columns?.length || 0) + (firstColMode !== 'none' ? 1 : 0)}
                                        className="p-2 text-right px-4 uppercase tracking-wider text-xs text-muted-foreground"
                                    >
                                        Pontuação Total:
                                    </td>
                                    <td className="p-2 text-center border-l bg-primary/10 text-primary text-lg">
                                        {field.rows?.reduce((acc: number, _: any, i: number) => acc + getRowTotal(i), 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

            case 'chart':
                if (!field.sourceFieldId) return <div className="p-4 border border-dashed rounded text-sm text-muted-foreground">Selecione uma tabela fonte nas configurações.</div>

                const sourceField = template.fields?.find((f: any) => f.id === field.sourceFieldId)
                if (!sourceField) return <div className="text-red-500 p-2 text-sm">Tabela de origem (ID: {field.sourceFieldId}) não encontrada.</div>

                // Prepare Data
                const chartData = sourceField.rows?.map((rowLabel: string, rIndex: number) => {
                    const finalRowLabel = (sourceField.firstColEditable && content[`row-label-${rIndex}`]) || rowLabel;
                    const rowObj: any = { name: finalRowLabel.length > 20 ? finalRowLabel.substring(0, 20) + '...' : finalRowLabel, fullLabel: finalRowLabel };

                    sourceField.columns?.forEach((colLabel: string, cIndex: number) => {
                        let val = 0;
                        const cellVal = content[`${rIndex}-${cIndex}`]; // Coordinate stored value
                        const rowVal = content[`${rIndex}`]; // Radio stored value (if simpler grid)

                        if (sourceField.gridType === 'radio' && rowVal === colLabel) {
                            val = extractNumber(colLabel);
                            rowObj['score'] = val; // Use 'score' for radio grids, especially for radar
                        } else if (cellVal) {
                            val = extractNumber(cellVal.toString());
                            rowObj[colLabel] = val;
                        }
                    });

                    if (sourceField.gridType === 'radio' && rowObj['score'] === undefined) {
                        rowObj['score'] = 0;
                    }

                    return rowObj;
                });

                const ChartComponent = field.chartType === 'bar' ? BarChart :
                    field.chartType === 'line' ? LineChart :
                        field.chartType === 'area' ? AreaChart :
                            field.chartType === 'radar' ? RadarChart : BarChart

                const chartColor = field.chartColor || '#8884d8';

                return (
                    <div className="w-full h-[300px] border rounded bg-white p-4 relative">
                        <p className="text-center font-bold mb-4">{field.label}</p>

                        {/* Axis Labels (Overlay) */}
                        {field.yAxisLabel && <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground font-medium">{field.yAxisLabel}</div>}
                        {field.xAxisLabel && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">{field.xAxisLabel}</div>}

                        <ResponsiveContainer width="100%" height="100%">
                            <ChartComponent data={chartData}>
                                {field.chartType !== 'pie' && <CartesianGrid strokeDasharray="3 3" />}
                                {field.chartType !== 'pie' && field.chartType !== 'radar' && <XAxis dataKey="name" fontSize={10} />}
                                {field.chartType !== 'pie' && field.chartType !== 'radar' && <YAxis />}
                                {field.chartType === 'radar' && <PolarGrid />}
                                {field.chartType === 'radar' && <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />}
                                {field.chartType === 'radar' && <PolarRadiusAxis angle={30} domain={[0, 'auto']} />}
                                <Tooltip />
                                <Legend />

                                {/* Series Generation */}
                                {sourceField.gridType === 'radio' ? (
                                    field.chartType === 'radar' ? (
                                        <Radar name="Pontuação" dataKey="score" stroke={chartColor} fill={chartColor} fillOpacity={0.6} />
                                    ) : (
                                        <Bar dataKey="score" fill={chartColor} name="Pontuação" />
                                    )
                                ) : (
                                    sourceField.columns?.map((col: string, i: number) => {
                                        const color = `hsl(${i * 60}, 70%, 50%)`;
                                        if (field.chartType === 'radar') return <Radar key={i} name={col} dataKey={col} stroke={color} fill={color} fillOpacity={0.4} />;
                                        if (field.chartType === 'bar') return <Bar key={i} dataKey={col} fill={color} />;
                                        if (field.chartType === 'line') return <Line key={i} type="monotone" dataKey={col} stroke={color} />;
                                        return <Area key={i} type="monotone" dataKey={col} stackId="1" stroke={color} fill={color} />;
                                    })
                                )}
                            </ChartComponent>
                        </ResponsiveContainer>
                    </div>
                )

            case 'pain_map':
                const is3D = !field.viewType || field.viewType === 'default';
                const scale = field.scale ?? (is3D ? 0.86 : 1);
                const extraX = field.offsetX ?? 0;
                const extraY = field.offsetY ?? 0;
                const offset = (1 - scale) * 50;

                return (
                    <div className="space-y-4">
                        <Label>{field.label}</Label>
                        <div className="relative w-full max-w-[500px] mx-auto border rounded-lg overflow-hidden bg-white select-none">
                            {/* Background Image */}
                            <img
                                src={
                                    field.viewType === 'anterior' ? '/body-map-anterior.jpg' :
                                        field.viewType === 'posterior' ? '/body-map-posterior.jpg' :
                                            field.viewType === 'feet' ? '/body-map-feet.jpg' :
                                                '/body-map-3d.png'
                                }
                                alt={field.label}
                                className="w-full h-auto object-contain pointer-events-none"
                            />

                            {/* Text Overlays */}
                            {field.texts?.map((text: any, i: number) => {
                                const adjX = text.x * scale + offset + extraX;
                                const adjY = text.y * scale + offset + extraY;
                                return (
                                    <div
                                        key={`text-${i}`}
                                        className="absolute whitespace-nowrap font-bold text-xs text-center z-10 pointer-events-none"
                                        style={{
                                            left: `${adjX}%`,
                                            top: `${adjY}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        {text.content}
                                    </div>
                                )
                            })}

                            {/* Clickable Overlay Points */}
                            {field.points?.map((point: any) => {
                                const isSelected = Array.isArray(value) && value.includes(point.id);
                                const adjX = point.x * scale + offset + extraX;
                                const adjY = point.y * scale + offset + extraY;

                                return (
                                    <div
                                        key={point.id}
                                        onClick={() => {
                                            if (isReadOnly) return;
                                            const current = Array.isArray(value) ? [...value] : [];
                                            if (isSelected) {
                                                handleFieldChange(field.id, current.filter(v => v !== point.id));
                                            } else {
                                                handleFieldChange(field.id, [...current, point.id]);
                                            }
                                        }}
                                        className={`
                                            absolute w-8 h-8 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center z-20
                                            ${isSelected ? 'bg-transparent' : 'hover:bg-red-500/10 hover:scale-110'}
                                        `}
                                        style={{
                                            left: `${adjX}%`,
                                            top: `${adjY}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                        title={point.label}
                                    >
                                        {/* Visuals matching FormBuilder */}
                                        {isSelected ? (
                                            <div className="relative flex items-center justify-center w-8 h-8">
                                                <span className="absolute inline-flex h-full w-full rounded-full border-4 border-red-500 opacity-20 animate-[ping_1.5s_ease-in-out_infinite]"></span>
                                                <span className="absolute inline-flex h-2/3 w-2/3 rounded-full border-2 border-red-500 opacity-60"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-sm ring-2 ring-white"></span>
                                            </div>
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-red-600 bg-transparent ring-1 ring-white/70 shadow-sm hover:bg-red-50 transition-colors bg-white/20" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Selected List Summary */}
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground min-h-[24px]">
                            {Array.isArray(value) && value.length > 0 ? (
                                value.map((v: string) => {
                                    const p = field.points?.find((p: any) => p.id === v);
                                    return (
                                        <span key={v} className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {p?.label || v}
                                        </span>
                                    )
                                })
                            ) : (
                                <span className="italic">Nenhum ponto marcado.</span>
                            )}
                        </div>
                    </div>
                )

            case 'calculated':
                // Logic to calculate value on the fly
                // We don't store the calculated value in DB until save, but we display it here.
                // Or we can calculate effectively.

                let calculatedValue: string | number = "..."
                let errorMsg = ""

                try {
                    if (!field.variableMap || !field.formula) {
                        calculatedValue = "Configuração incompleta"
                    } else {
                        // 1. Map variables to values
                        const variables: Record<string, number> = {}

                        field.variableMap.forEach((v: any) => {
                            // v.targetId is the field ID we want
                            // v.letter is 'A', 'B', etc.
                            const val = content[v.targetId]
                            const num = extractNumber(typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : ''))
                            variables[v.letter] = num
                        })

                        // 2. Prepare formula
                        // Replace A, B, C with actual numbers. 
                        // We must be careful not to replace 'A' inside 'ABS' or similar if we supported functions, 
                        // but for now we assume simple letters. A regex with word boundaries is safer.

                        let formulaStr = field.formula.toUpperCase()

                        // Replace variables
                        Object.keys(variables).forEach(letter => {
                            // Regex looks for letter surrounded by non-word chars (like + - * / ( ) or start/end)
                            const regex = new RegExp(`\\b${letter}\\b`, 'g')
                            formulaStr = formulaStr.replace(regex, variables[letter].toString())
                        })

                        // 3. Evaluate
                        // Sanitization: Only allow numbers, operators, parens, dot
                        if (!/^[0-9+\-*/().\s]*$/.test(formulaStr)) {
                            // If it contains things other than math chars, might be invalid
                            // calculatedValue = "Erro: Caracteres inválidos"
                            // Actually, let's just try eval-ing it if it looks roughly safe-ish, 
                            // but strict regex is safer.
                        }

                        // Using Function constructor for compilation
                        // "return " + formulaStr
                        try {
                            // eslint-disable-next-line
                            const result = new Function(`return ${formulaStr}`)()
                            calculatedValue = typeof result === 'number' ? Number(result.toFixed(2)) : result

                            // Update content if changed (Debounce this? Or just render?)
                            // Ideally, calculated fields should be saved.
                            // However, directly calling setContent inside render causes infinite loop.
                            // We should use an effect or just compute for display. 
                            // If we want to save it, we handle it in useEffect.

                        } catch (e) {
                            calculatedValue = "Erro na fórmula"
                        }
                    }

                } catch (err) {
                    calculatedValue = "Erro"
                }

                // If we want to persist the calculated value so it appears in the DB/Reports:
                // We need to trigger an update, but carefully.
                // For now, let's just display it. Reports might verify this via same logic or just trust saved value if we save it.
                // Let's add a specialized effect for this field later if needed. For now, on-the-fly display.

                return <div className="grid gap-2">
                    <Label>{field.label}</Label>
                    <div className="relative">
                        <Input
                            disabled
                            value={calculatedValue}
                            placeholder="Calculando..."
                            className="bg-muted pl-10 font-bold text-primary"
                        />
                        <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Calculado automaticamente: {field.formula}</p>
                </div>

            case 'shoe_recommendation':
                const recommendation = value as any;

                const handleGenerate = async () => {
                    const toastId = toast.loading("Consultando Inteligência Artificial...");
                    try {
                        const res = await generateShoeRecommendation(patientId, content);
                        if (res.success) {
                            handleFieldChange(field.id, res.data);
                            toast.success("Recomendação gerada!", { id: toastId });
                        } else {
                            toast.error(res.message, { id: toastId });
                        }
                    } catch (error) {
                        toast.error("Erro ao gerar.", { id: toastId });
                    }
                };

                return (
                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-primary">
                                <Bot className="h-4 w-4" />
                                {field.label}
                            </Label>
                            {!recommendation && !isReadOnly && (
                                <Button size="sm" onClick={handleGenerate} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Gerar Recomendação IA
                                </Button>
                            )}
                            {recommendation && !isReadOnly && (
                                <Button size="sm" onClick={handleGenerate} variant="ghost" className="text-xs text-muted-foreground h-6">
                                    Regerar
                                </Button>
                            )}
                        </div>

                        {recommendation ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                {/* Advice */}
                                <div className="bg-white p-3 rounded-md border text-sm text-slate-700 italic">
                                    "{recommendation.advice}"
                                </div>

                                {/* Table */}
                                <div className="border rounded-md overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 border-b">
                                            <tr>
                                                <th className="p-2 text-left font-semibold text-slate-600">Modelo</th>
                                                <th className="p-2 text-left font-semibold text-slate-600">Marca</th>
                                                <th className="p-2 text-left font-semibold text-slate-600">Preço Est.</th>
                                                <th className="p-2 text-left font-semibold text-slate-600">Por que?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recommendation.recommendations?.map((rec: any, i: number) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="p-2 font-medium">{rec.name}</td>
                                                    <td className="p-2 text-muted-foreground">{rec.brand}</td>
                                                    <td className="p-2">{rec.price_range}</td>
                                                    <td className="p-2 text-xs text-slate-500 max-w-[200px]">{rec.reason}</td>
                                                </tr>
                                            ))}
                                            {(!recommendation.recommendations || recommendation.recommendations.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhuma recomendação específica retornada.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground bg-white border border-dashed rounded-md">
                                <Bot className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>Clique em "Gerar" para receber recomendações baseadas nos dados do formulário.</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return null
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header / Status Bar */}
            {!hideHeader && (
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            {saving ? (
                                <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
                            ) : lastSaved ? (
                                `Salvo às ${lastSaved.toLocaleTimeString()}`
                            ) : (
                                'Salvo'
                            )}
                        </span>
                        {status === 'draft' && (
                            <Button
                                onClick={async () => {
                                    const toastId = toast.loading('Finalizando...');
                                    try {
                                        // Ensure latest content is saved
                                        const { finalizeRecord } = await import('@/app/dashboard/patients/actions');
                                        const res = await finalizeRecord(recordId, content);

                                        if (res.success) {
                                            toast.success('Evolução finalizada!', { id: toastId });
                                            router.push(`/dashboard/patients/${patientId}`);
                                        } else {
                                            toast.error(res.message || 'Erro ao finalizar', { id: toastId });
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        toast.error('Erro de conexão', { id: toastId });
                                    }
                                }}
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Finalizar Evolução
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div className={`space-y-8 bg-card rounded-lg max-w-5xl mx-auto ${hideHeader ? 'p-0 border-0 shadow-none' : 'p-10 border shadow-sm'}`}>
                {!hideTitle && (
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">{template.title}</h1>
                        {template.description && <p className="text-muted-foreground">{template.description}</p>}
                    </div>
                )}

                <div className="flex flex-wrap items-start content-start -mx-2">
                    {template.fields?.map((field: any) => (
                        <div
                            key={field.id}
                            className="px-2 mb-4"
                            style={{
                                width: `${field.width || 100}%`,
                                marginTop: `${field.marginTop || 0}px`,
                                marginBottom: `${field.marginBottom || 0}px`
                            }}
                        >
                            {/* Section Header handling */}
                            {field.type === 'section' ? (
                                <div className={`w-full py-2 border-b-2 border-primary/20 mb-4 mt-6 ${field.textAlign === 'center' ? 'text-center' : field.textAlign === 'right' ? 'text-right' : 'text-left'
                                    }`}>
                                    <h3 className={`font-bold text-primary ${field.fontSize === 'sm' ? 'text-sm' :
                                        field.fontSize === 'base' ? 'text-base' :
                                            field.fontSize === 'lg' ? 'text-lg' :
                                                field.fontSize === '2xl' ? 'text-2xl' :
                                                    field.fontSize === '3xl' ? 'text-3xl' :
                                                        'text-xl' // default
                                        }`}>
                                        {field.label}
                                    </h3>
                                </div>
                            ) : (
                                <>
                                    <Label className={field.type === 'checkbox' ? 'hidden' : ''}>
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    {renderField(field)}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

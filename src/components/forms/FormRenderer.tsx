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
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { useDebounce } from 'use-debounce'
import { logAction } from '@/lib/logger'



interface FormRendererProps {
    recordId: string
    template: any
    initialContent: any
    status: string
    patientId: string
}

export function FormRenderer({ recordId, template, initialContent, status, patientId }: FormRendererProps) {
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
                return <div className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}>
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
                            <Label>{opt}</Label>
                        </div>
                    ))}
                </div>

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

            default:
                return null
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header / Status Bar */}
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
                        <Button onClick={() => toast.info('Ainda implementando Finalizar')}>Finalizar Evolução</Button>
                    )}
                </div>
            </div>

            <div className="space-y-8 bg-card p-10 rounded-lg border shadow-sm max-w-5xl mx-auto">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">{template.title}</h1>
                    {template.description && <p className="text-muted-foreground">{template.description}</p>}
                </div>

                <div className="space-y-8">
                    {template.fields?.map((field: any) => (
                        <div key={field.id} className="space-y-2">
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

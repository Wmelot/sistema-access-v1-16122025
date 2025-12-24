'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import * as React from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Loader2, Save, ArrowLeft, Calculator, Sparkles, Bot, Calendar, Clock, Activity, PenTool, Paperclip, FileJson, Trash2, Upload, Eraser, List, AlignLeft, Info, Mic, StopCircle, CheckCircle, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { generateShoeRecommendation } from '@/app/actions/ai_tennis'
import { toast } from 'sonner'
import { addOptionToTemplate } from '@/app/dashboard/forms/actions'
import { transcribeAndOrganize } from '@/app/dashboard/attendance/organize-evolution' // [NEW] AI Action
import { useAudioRecorder } from '@/hooks/use-audio-recorder' // [NEW] Mic Hook
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
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
    onChange?: (content: any) => void // [NEW] Expose changes
    appointmentId?: string
    patientName?: string
}

// Robust helper to extract primitives
const safeValue = (val: any): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'string') return val
    if (typeof val === 'number') return String(val)
    if (typeof val === 'boolean') return val ? 'true' : 'false'
    if (typeof val === 'object' && 'value' in val) return String(val.value) // Handle {label, value}
    return '' // Fallback
}

export function FormRenderer({ recordId, template, initialContent, status, patientId, templateId, hideHeader = false, hideTitle = false, onChange, appointmentId, patientName }: FormRendererProps) {
    const [content, setContent] = useState<any>(initialContent || {})
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [debouncedContent] = useDebounce(content, 1000)
    const supabase = createClient()
    const router = useRouter()
    const isReadOnly = status === 'finalized'

    // [NEW] Report Modal State
    const [reportOpen, setReportOpen] = useState(false)
    const [viewingTemplate, setViewingTemplate] = useState<any>(null)
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([])

    // Load templates if needed
    useEffect(() => {
        if (!reportOpen) return
        import('@/app/dashboard/settings/reports/actions').then(mod => {
            mod.getReportTemplates().then(setAvailableTemplates)
        })
    }, [reportOpen])


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

    // [NEW] Report Viewer Component (Lazy Load or Import)
    const ReportViewer = useMemo(() => React.lazy(() => import('@/components/reports/ReportViewer').then(module => ({ default: module.ReportViewer }))), [])

    // Auto-calculate dynamic values from formulas
    useEffect(() => {
        (template.fields || []).forEach((field: any) => {
            if (field.defaultValueFormula) {
                const formula = field.defaultValueFormula;
                // Simple variable replacement {var}
                let valStr = formula;
                const matches = formula.match(/\{([^}]+)\}/g);
                let hasEmptyDependency = false;

                if (matches) {
                    matches.forEach((match: string) => {
                        const varId = match.replace(/[{}]/g, '');
                        // Check if it's a field ID or label
                        const targetField = template.fields?.find((f: any) => f.id === varId || f.label === varId);
                        const actualId = targetField?.id || varId;
                        const varVal = content[actualId];

                        if (varVal === undefined || varVal === '') {
                            hasEmptyDependency = true;
                        }

                        const numericVal = extractNumber(varVal || '0');
                        valStr = valStr.replace(match, numericVal.toString());
                    });
                }

                if (hasEmptyDependency && !content[field.id]) return;

                try {
                    // eslint-disable-next-line
                    const result = new Function(`return ${valStr}`)();
                    if (typeof result === 'number' && !isNaN(result)) {
                        const formatted = result.toFixed(field.type === 'number' ? (field.step?.toString().split('.')[1]?.length || 0) : 0);
                        if (content[field.id] !== formatted) {
                            handleFieldChange(field.id, formatted);
                        }
                    } else if (typeof result === 'string' && content[field.id] !== result) {
                        handleFieldChange(field.id, result);
                    }
                } catch (e) { /* ignore calculation errors */ }
            }
        });
    }, [content, template.fields]);

    const [subTemplates, setSubTemplates] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchSubTemplates = async () => {
            const qFields = template.fields?.filter((f: any) => f.type === 'questionnaire' && f.questionnaireId);
            if (!qFields?.length) return;

            const ids = qFields.map((f: any) => f.questionnaireId);
            const { data } = await supabase.from('form_templates').select('*').in('id', ids);

            if (data) {
                const map: Record<string, any> = {};
                data.forEach((t: any) => map[t.id] = t);
                setSubTemplates(prev => ({ ...prev, ...map }));
            }
        };
        fetchSubTemplates();
    }, [template.fields]);

    // [NEW] Extract Tab Groups Logic for Navigation
    const tabGroups = React.useMemo(() => {
        const groups: { label: string, fields: any[] }[] = [];
        let currentTabFields: any[] = [];
        let currentTabLabel = "Geral";

        (template.fields || []).forEach((field: any) => {
            if (field.type === 'tab') {
                if (currentTabFields.length > 0 || groups.length > 0) {
                    groups.push({ label: currentTabLabel, fields: currentTabFields });
                }
                currentTabLabel = field.label || "Nova Aba";
                currentTabFields = [];
            } else {
                currentTabFields.push(field);
            }
        });

        if (currentTabFields.length > 0 || groups.length > 0) {
            groups.push({ label: currentTabLabel, fields: currentTabFields });
        }
        return groups;
    }, [template.fields]);

    const [activeTab, setActiveTab] = useState<string>('');

    // Initialize active tab
    useEffect(() => {
        if (tabGroups.length > 0 && !activeTab) {
            setActiveTab(tabGroups[0].label);
        }
    }, [tabGroups, activeTab]);

    const handleNextTab = () => {
        const idx = tabGroups.findIndex(g => g.label === activeTab);
        if (idx < tabGroups.length - 1) setActiveTab(tabGroups[idx + 1].label);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handlePrevTab = () => {
        const idx = tabGroups.findIndex(g => g.label === activeTab);
        if (idx > 0) setActiveTab(tabGroups[idx - 1].label);
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        if (isReadOnly) return
        const newContent = { ...content, [fieldId]: value }
        setContent(newContent)
        if (onChange) onChange(newContent) // [NEW] Notify parent
    }

    const renderField = (field: any) => {
        const value = content[field.id]

        switch (field.type) {
            case 'text':
                return (
                    <div className="relative">
                        <Input
                            disabled={isReadOnly}
                            value={safeValue(value)}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            className="bg-white"
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <EnhancedTextarea
                        field={field}
                        value={value}
                        onChange={(val: string) => handleFieldChange(field.id, val)}
                        isReadOnly={isReadOnly}
                    />
                );

            case 'number':
                return (
                    <div className="relative flex items-center">
                        <Input
                            type="number"
                            disabled={isReadOnly}
                            value={safeValue(value)}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="bg-white pr-10"
                        />
                        {field.suffix && (
                            <span className="absolute right-3 text-xs text-muted-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded border">
                                {field.suffix}
                            </span>
                        )}
                    </div>
                );

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
                    <div className="space-y-4">
                        <div className={`grid gap-4 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}>
                            {field.options?.map((opt: any, i: number) => {
                                const label = typeof opt === 'object' ? opt.label : opt
                                const val = typeof opt === 'object' ? opt.value : opt

                                return (
                                    <div key={i} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={Array.isArray(value) && value.includes(val)}
                                            onCheckedChange={(checked) => {
                                                const current = Array.isArray(value) ? [...value] : []
                                                if (checked) current.push(val)
                                                else {
                                                    const idx = current.indexOf(val)
                                                    if (idx > -1) current.splice(idx, 1)
                                                }
                                                handleFieldChange(field.id, current)
                                            }}
                                            disabled={isReadOnly}
                                        />
                                        <Label className="font-normal">{label}</Label>
                                    </div>
                                )
                            })}
                        </div>

                        {!isReadOnly && field.allowCreateOption && (
                            <div className="flex items-center gap-2 max-w-sm mt-4">
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
                    value={safeValue(value)}
                    onValueChange={val => handleFieldChange(field.id, val)}
                    disabled={isReadOnly}
                    className={`grid gap-2 ${field.columns ? `grid-cols-${field.columns}` : 'grid-cols-1'}`}
                >
                    {field.options?.map((opt: any, i: number) => {
                        const label = typeof opt === 'object' ? opt.label : opt
                        const val = typeof opt === 'object' ? opt.value : opt
                        return (
                            <div key={i} className="flex items-center space-x-2">
                                <RadioGroupItem value={val} id={`${field.id}-${i}`} />
                                <Label htmlFor={`${field.id}-${i}`}>{label}</Label>
                            </div>
                        )
                    })}
                </RadioGroup>

            case 'select':
                return <Select
                    value={safeValue(value)}
                    onValueChange={val => handleFieldChange(field.id, val)}
                    disabled={isReadOnly}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt: any, i: number) => {
                            const label = typeof opt === 'object' ? opt.label : opt
                            const val = typeof opt === 'object' ? opt.value : opt
                            return <SelectItem key={i} value={val}>{label}</SelectItem>
                        })}
                    </SelectContent>
                </Select>

            case 'slider':
                const rawSliderVal = content[field.id]
                const hasSliderVal = rawSliderVal !== undefined && rawSliderVal !== ''
                const currentSliderVal = hasSliderVal ? extractNumber(safeValue(rawSliderVal)) : (field.min ?? 0)

                return <div className="space-y-6 pt-2 pb-4 px-2">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm font-medium">{field.min || 0}</span>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-primary">{currentSliderVal}</span>
                            {field.suffix && <span className="text-xs text-muted-foreground">{field.suffix}</span>}
                        </div>
                        <span className="text-muted-foreground text-sm font-medium">{field.max || 10}</span>
                    </div>
                    <Slider
                        value={[currentSliderVal]}
                        max={field.max || 10}
                        min={field.min || 0}
                        step={field.step || 1}
                        onValueChange={vals => handleFieldChange(field.id, vals[0])}
                        disabled={isReadOnly}
                        className="py-2"
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
                    if (val) return extractNumber(safeValue(val));

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
                                                    value={safeValue((value && value[`row-label-${i}`]) || '')}
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
                                                            checked={safeValue(value && value[`${i}`]) === col}
                                                            onChange={() => handleRadioChange(i, col)}
                                                            disabled={isReadOnly}
                                                            className="h-4 w-4 accent-primary"
                                                        />
                                                    )}
                                                    {cellType === 'checkbox' && (
                                                        <Checkbox
                                                            checked={Boolean(value && value[`${i}-${j}`])}
                                                            onCheckedChange={checked => handleGridChange(i, j, checked)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'number' && (
                                                        <Input
                                                            type="number"
                                                            className="h-8 w-20 text-center mx-auto"
                                                            value={safeValue((value && value[`${i}-${j}`]) || '')}
                                                            onChange={e => handleGridChange(i, j, e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'text' && (
                                                        <Input
                                                            className="h-8 w-full min-w-[100px]"
                                                            value={safeValue((value && value[`${i}-${j}`]) || '')}
                                                            onChange={e => handleGridChange(i, j, e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    )}
                                                    {cellType === 'select_10' && (
                                                        <Select
                                                            value={safeValue((value && value[`${i}-${j}`]) || '')}
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

                        {(showTotal || (field.columnCalculations && Object.values(field.columnCalculations).some(v => v !== 'none'))) && (
                            <tfoot className="bg-muted/80 font-bold text-sm border-t-2 border-muted">
                                <tr className="hover:bg-muted/100">
                                    {firstColMode !== 'none' && (
                                        <td className="p-2 text-right px-4 uppercase tracking-wider text-xs text-muted-foreground">
                                            Total / Média:
                                        </td>
                                    )}

                                    {field.columns?.map((_: string, j: number) => {
                                        const calcType = field.columnCalculations?.[j] || 'none'
                                        let result: string | number = '-'

                                        if (calcType !== 'none') {
                                            const values = field.rows?.map((_: any, rIndex: number) => {
                                                const val = value && value[`${rIndex}-${j}`]
                                                // Handle Radio mapping (if simplified grid)
                                                if (!val && field.gridType === 'radio' && value && value[`${rIndex}`] === field.columns?.[j]) {
                                                    // For radio grids, usually the column label itself is NOT the value, 
                                                    // but if it's "select_10" or "number" types mixed in columns, we extract.
                                                    // However, standard radio grid means column IS the value? No, usually column is "Option Label".
                                                    // If we want to assign scores to columns, that's another feature.
                                                    // Assuming for now we extract number from column label if radio selected
                                                    return extractNumber(field.columns?.[j] || '0')
                                                }
                                                return val ? extractNumber(val.toString()) : 0
                                            }) || []

                                            const sum = values.reduce((a: number, b: number) => a + b, 0)

                                            if (calcType === 'sum') result = sum
                                            if (calcType === 'average') result = (sum / (values.length || 1)).toFixed(1)
                                        }

                                        return (
                                            <td key={j} className="p-2 text-center border-l text-primary">
                                                {result !== '-' ? result : ''}
                                            </td>
                                        )
                                    })}

                                    {showTotal && (
                                        <td className="p-2 text-center border-l bg-primary/10 text-primary text-lg">
                                            {field.rows?.reduce((acc: number, _: any, i: number) => acc + getRowTotal(i), 0)}
                                        </td>
                                    )}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

            case 'chart':
                if (!field.sourceFieldId) return <div className="p-4 border border-dashed rounded text-sm text-muted-foreground">Selecione uma tabela fonte nas configurações.</div>

                const sourceField = template.fields?.find((f: any) => f.id === field.sourceFieldId)
                if (!sourceField) return <div className="text-red-500 p-2 text-sm">Tabela de origem (ID: {field.sourceFieldId}) não encontrada.</div>

                // Prepare Data based on Mode
                let chartData = [];

                if (field.chartDataMode === 'average' || field.chartDataMode === 'sum') {
                    // Aggregate from multiple number/calculated fields
                    const sourceIds = (field.sourceFieldIds || [field.sourceFieldId]).filter(Boolean);
                    chartData = sourceIds.map((sid: string) => {
                        const f = template.fields?.find((tf: any) => tf.id === sid);
                        const val = extractNumber(safeValue(content[sid]));
                        return {
                            name: f?.label || 'N/A',
                            value: val,
                            // For backward compat or mixed modes
                            average: field.chartDataMode === 'average' ? val : 0,
                            total: field.chartDataMode === 'sum' ? val : 0
                        };
                    });
                } else {
                    // Traditional Grid/Table source
                    chartData = sourceField.rows?.map((rowLabel: string, rIndex: number) => {
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
                                val = extractNumber(safeValue(cellVal));
                                rowObj[colLabel] = val;
                            }
                        });

                        if (sourceField.gridType === 'radio' && rowObj['score'] === undefined) {
                            rowObj['score'] = 0;
                        }

                        return rowObj;
                    }) || [];
                }

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
                                {field.chartDataMode === 'average' || field.chartDataMode === 'sum' ? (
                                    // Aggregate mode - use sourceFieldIds (plural)
                                    (() => {
                                        const sourceIds = (field.sourceFieldIds || [field.sourceFieldId]).filter(Boolean);
                                        const color = field.chartColor || '#8884d8';
                                        const dataKey = field.chartDataMode === 'average' ? 'average' : 'total';
                                        const name = field.chartDataMode === 'average' ? 'Média' : 'Soma Total';

                                        if (field.chartType === 'radar') return <Radar name={name} dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.6} />;
                                        if (field.chartType === 'bar') return <Bar dataKey={dataKey} fill={color} name={name} />;
                                        if (field.chartType === 'line') return <Line type="monotone" dataKey={dataKey} stroke={color} name={name} />;
                                        return <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} name={name} />;
                                    })()
                                ) : (
                                    // Individual mode or backward compatibility
                                    sourceField.gridType === 'radio' ? (
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
                                    )
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
                let calculatedValue: string | number = "..."
                let errorMsg = ""

                try {
                    const isHealthPreset = ['imc', 'pollock3', 'pollock7', 'guedes', 'harris_benedict', 'minimalist_index'].includes(field.calculationType);

                    if (!isHealthPreset && (!field.variableMap || !field.formula) && field.calculationType !== 'sum') {
                        calculatedValue = "Configuração incompleta"
                    } else {
                        // HEALTH PRESETS LOGIC
                        if (field.calculationType === 'imc') {
                            const peso = extractNumber(safeValue(content[field.targetIds?.[0]]));
                            const altura = extractNumber(safeValue(content[field.targetIds?.[1]]));
                            if (peso > 0 && altura > 0) {
                                const hInM = altura > 3 ? altura / 100 : altura;
                                calculatedValue = (peso / (hInM * hInM)).toFixed(1);
                            } else calculatedValue = "Aguardando peso/altura";

                        } else if (field.calculationType === 'sum') {
                            const ids = field.targetIds || [];
                            calculatedValue = ids.reduce((acc: number, id: string) => acc + extractNumber(safeValue(content[id])), 0);

                        } else if (field.calculationType === 'pollock3' || field.calculationType === 'pollock7' || field.calculationType === 'guedes') {
                            const sex = field.sex || 'masculino';
                            const age = extractNumber(content[field.targetIds?.[7]] || '0'); // Pollock7 age index is 7
                            // For others, age might be elsewhere, but let's assume standard indexes from builder
                            // Actually builder specifices targetIds per input.
                            // Pollock3: Pectoral, Abdominal, Thigh (Men) or Triceps, Suprailiac, Thigh (Women)

                            const folds = (field.targetIds || []).slice(0, field.calculationType === 'pollock7' ? 7 : 3).map((id: string) => extractNumber(safeValue(content[id])));
                            const sumFolds = folds.reduce((a: number, b: number) => a + b, 0);
                            const ageVal = field.calculationType === 'pollock7' ? extractNumber(safeValue(content[field.targetIds?.[7]])) : extractNumber(safeValue(content[field.targetIds?.[3]])); // Pollock3 age is 4th input (index 3) usually?

                            let bd = 0;
                            if (field.calculationType === 'pollock3') {
                                if (sex === 'masculino') bd = 1.10938 - (0.0008267 * sumFolds) + (0.0000016 * (sumFolds * sumFolds)) - (0.0002574 * ageVal);
                                else bd = 1.0994921 - (0.0009929 * sumFolds) + (0.0000023 * (sumFolds * sumFolds)) - (0.0001392 * ageVal);
                            } else if (field.calculationType === 'pollock7') {
                                if (sex === 'masculino') bd = 1.112 - (0.00043499 * sumFolds) + (0.00000055 * (sumFolds * sumFolds)) - (0.00028826 * ageVal);
                                else bd = 1.097 - (0.00046971 * sumFolds) + (0.00000056 * (sumFolds * sumFolds)) - (0.00012828 * ageVal);
                            } else if (field.calculationType === 'guedes') {
                                // Guedes uses 3 folds but specific ones.
                                if (sex === 'masculino') bd = 1.17136 - (0.06706 * Math.log10(sumFolds));
                                else bd = 1.1665 - (0.07063 * Math.log10(sumFolds));
                            }

                            if (bd > 0) {
                                const fatPercent = ((4.95 / bd) - 4.5) * 100;
                                calculatedValue = fatPercent.toFixed(1) + "%";
                            } else calculatedValue = "Insira as dobras";

                        } else if (field.calculationType === 'harris_benedict') {
                            const sex = field.sex || 'masculino';
                            const peso = extractNumber(safeValue(content[field.targetIds?.[0]]));
                            const altura = extractNumber(safeValue(content[field.targetIds?.[1]]));
                            const idade = extractNumber(safeValue(content[field.targetIds?.[2]]));
                            const act = parseFloat(field.activityLevel || '1.2');

                            if (peso > 0 && altura > 0 && idade > 0) {
                                let bmr = 0;
                                if (sex === 'masculino') bmr = 66.47 + (13.75 * peso) + (5.003 * altura) - (6.755 * idade);
                                else bmr = 655.1 + (9.563 * peso) + (1.85 * altura) - (4.676 * idade);
                                calculatedValue = Math.round(bmr * act) + " kcal";
                            } else calculatedValue = "Insira dados vitais";

                        } else if (field.calculationType === 'minimalist_index') {
                            const scores = (field.targetIds || []).map((id: string) => extractNumber(safeValue(content[id])));
                            const total = scores.reduce((a: number, b: number) => a + b, 0);
                            calculatedValue = ((total / 25) * 100).toFixed(0) + "%";

                        } else {
                            // CUSTOM FORMULA
                            const variables: Record<string, any> = {}
                            field.variableMap?.forEach((v: any) => {
                                const val = content[v.targetId]
                                variables[v.letter] = val
                            })

                            const TODAY = () => new Date();
                            const DAYS_DIFF = (d1: any, d2: any) => {
                                const date1 = new Date(d1);
                                const date2 = new Date(d2);
                                if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
                                return Math.ceil(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
                            };
                            const WEEKS_DIFF = (d1: any, d2: any) => Math.floor(DAYS_DIFF(d1, d2) / 7);

                            let formulaStr = (field.formula || "").toUpperCase()
                            Object.keys(variables).forEach(letter => {
                                const regex = new RegExp(`\\b${letter}\\b`, 'g')
                                const val = variables[letter]
                                const replacement = typeof val === 'string' ? `"${val}"` : (val ?? 0).toString()
                                formulaStr = formulaStr.replace(regex, replacement)
                            })

                            const isSafe = /^[A-Z0-9+\-*/().\s,"']*$/.test(formulaStr);
                            if (isSafe && formulaStr) {
                                try {
                                    // eslint-disable-next-line
                                    const result = new Function('DAYS_DIFF', 'WEEKS_DIFF', 'TODAY', `return ${formulaStr}`)(DAYS_DIFF, WEEKS_DIFF, TODAY)
                                    calculatedValue = typeof result === 'number' ? Number(result.toFixed(2)) : result
                                } catch (e) { calculatedValue = "Erro na fórmula" }
                            } else {
                                calculatedValue = "Fórmula inválida"
                            }
                        }
                    }
                } catch (err) {
                    calculatedValue = "Erro"
                }

                return <div className="grid gap-2">
                    <div className="relative">
                        <Input
                            disabled
                            value={calculatedValue}
                            placeholder="Calculando..."
                            className="bg-muted pl-10 font-bold text-primary"
                        />
                        <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

            case 'questionnaire':
                const subTemplate = subTemplates[field.questionnaireId];
                if (!subTemplate) {
                    return (
                        <div className="p-4 border border-dashed rounded flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Carregando questionário...</span>
                        </div>
                    );
                }

                return (
                    <div className="border rounded-md overflow-hidden">
                        <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                            <span className="font-semibold text-sm">{field.label || subTemplate.title}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Questionário</span>
                        </div>
                        <div className="p-4 bg-white/50">
                            <FormRenderer
                                recordId={''} // Disable auto-save
                                template={subTemplate}
                                initialContent={value || {}}
                                status={status}
                                patientId={patientId}
                                templateId={subTemplate.id}
                                hideHeader={true}
                                hideTitle={true}
                                onChange={(subContent) => handleFieldChange(field.id, subContent)}
                            />
                        </div>
                    </div>
                );

            case 'date':
                return (
                    <div className="relative">
                        <Input
                            type="date"
                            disabled={isReadOnly}
                            value={value || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="pl-10 h-10"
                            min={field.min}
                            max={field.max}
                        />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                );

            case 'datetime':
                return (
                    <div className="relative">
                        <Input
                            type="datetime-local"
                            disabled={isReadOnly}
                            value={value || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="pl-10 h-10"
                            min={field.min}
                            max={field.max}
                        />
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                );

            case 'vitals':
                const vitals = typeof value === 'object' ? value : { pa: '', fc: '', spo2: '', temp: '' };
                const updateVital = (key: string, val: string) => {
                    handleFieldChange(field.id, { ...vitals, [key]: val });
                };

                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-slate-50/50">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">PA (Sist/Diast)</Label>
                            <Input
                                placeholder="120/80"
                                disabled={isReadOnly}
                                value={vitals.pa || ''}
                                onChange={(e) => updateVital('pa', e.target.value)}
                                className="h-9 font-mono border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">FC (bpm)</Label>
                            <Input
                                placeholder="72"
                                disabled={isReadOnly}
                                value={vitals.fc || ''}
                                onChange={(e) => updateVital('fc', e.target.value)}
                                className="h-9 font-mono border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">SpO2 (%)</Label>
                            <Input
                                placeholder="98"
                                disabled={isReadOnly}
                                value={vitals.spo2 || ''}
                                onChange={(e) => updateVital('spo2', e.target.value)}
                                className="h-9 font-mono border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Temp (°C)</Label>
                            <Input
                                placeholder="36.5"
                                disabled={isReadOnly}
                                value={vitals.temp || ''}
                                onChange={(e) => updateVital('temp', e.target.value)}
                                className="h-9 font-mono border-slate-200"
                            />
                        </div>
                    </div>
                );

            case 'signature': {
                const canvasRef = (el: HTMLCanvasElement | null) => {
                    if (!el || isReadOnly) return;
                    let isDrawing = false;
                    const ctx = el.getContext('2d');
                    if (!ctx) return;

                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';

                    const start = (e: any) => {
                        isDrawing = true;
                        const rect = el.getBoundingClientRect();
                        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
                        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                    };

                    const move = (e: any) => {
                        if (!isDrawing) return;
                        const rect = el.getBoundingClientRect();
                        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
                        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
                        ctx.lineTo(x, y);
                        ctx.stroke();
                        e.preventDefault();
                    };

                    const stop = () => {
                        if (!isDrawing) return;
                        isDrawing = false;
                        handleFieldChange(field.id, el.toDataURL());
                    };

                    el.onmousedown = start;
                    el.onmousemove = move;
                    el.onmouseup = stop;
                    el.onmouseleave = stop;
                    el.ontouchstart = start;
                    el.ontouchmove = move;
                    el.ontouchend = stop;
                };

                return (
                    <div className="relative border-2 rounded-lg bg-white overflow-hidden group">
                        {value ? (
                            <div className="relative h-40 flex items-center justify-center p-4">
                                <img src={value} alt="Assinatura" className="max-h-full object-contain" />
                                {!isReadOnly && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleFieldChange(field.id, null)}
                                    >
                                        <Eraser className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="h-40 relative">
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={160}
                                    className="w-full h-full cursor-crosshair touch-none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                                    <span className="text-xs uppercase tracking-widest font-medium">Assine aqui</span>
                                </div>
                            </div>
                        )}
                        {!isReadOnly && !value && <p className="text-[10px] text-muted-foreground text-center py-2 border-t bg-slate-50/50">Use o mouse ou o dedo para assinar no espaço acima.</p>}
                    </div>
                );
            }

            case 'attachments': {
                const attachments = Array.isArray(value) ? value : [];

                const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            const newAttachment = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: ev.target?.result,
                                date: new Date().toISOString()
                            };
                            handleFieldChange(field.id, [...attachments, newAttachment]);
                        };
                        reader.readAsDataURL(file);
                    });
                };

                const removeAttachment = (idx: number) => {
                    handleFieldChange(field.id, attachments.filter((_, i) => i !== idx));
                };

                return (
                    <div className="space-y-3">
                        {!isReadOnly && (
                            <div
                                className="border-2 border-dashed rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 cursor-pointer"
                                onClick={() => document.getElementById(`attach-${field.id}`)?.click()}
                            >
                                <input
                                    type="file"
                                    id={`attach-${field.id}`}
                                    multiple
                                    className="hidden"
                                    onChange={handleUpload}
                                />
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs font-medium">Adicionar arquivos / exames</span>
                            </div>
                        )}

                        <div className="grid gap-2">
                            {attachments.map((file: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 border rounded-lg bg-white group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-primary/10 rounded">
                                            <Paperclip className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-medium truncate">{file.name}</span>
                                            <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB • {new Date(file.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <a href={file.data} download={file.name}>
                                                <Bot className="h-4 w-4" /> {/* Bot icon used as download for now or something else? Lucide has Download but not sure if imported */}
                                            </a>
                                        </Button>
                                        {!isReadOnly && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeAttachment(i)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            case 'rich_text': {
                const handleToolbarCommand = (cmd: string, val?: string) => {
                    document.execCommand(cmd, false, val);
                };

                return (
                    <div className="border rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/20">
                        {!isReadOnly && (
                            <div className="bg-slate-50 p-1.5 border-b flex flex-wrap gap-0.5 items-center">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('bold')}><span className="font-bold">B</span></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('italic')}><span className="italic">I</span></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('underline')}><span className="underline">U</span></Button>
                                <div className="h-4 w-px bg-slate-200 mx-1" />
                                <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('insertUnorderedList')}><List className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()} onClick={() => handleToolbarCommand('justifyLeft')}><AlignLeft className="h-3.5 w-3.5" /></Button>
                            </div>
                        )}
                        <div
                            contentEditable={!isReadOnly}
                            className={`p-4 min-h-[150px] outline-none text-sm leading-relaxed prose prose-slate max-w-none ${isReadOnly ? 'bg-slate-50/30' : ''}`}
                            onBlur={(e) => handleFieldChange(field.id, e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: value || '' }}
                            onFocus={(e) => {
                                if (!value) e.currentTarget.innerHTML = value || '';
                            }}
                        />
                    </div>
                );
            }

            case 'image':
            case 'map': // Handle map as image for now if it's just a visual field
                const handleImageUpload = async (file: File) => {
                    const loadingToast = toast.loading("Processando imagem...");
                    try {
                        // Compression Logic
                        const image = new Image();
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 800; // Max width/height

                        image.onload = () => {
                            let width = image.width;
                            let height = image.height;

                            if (width > height) {
                                if (width > maxSize) {
                                    height *= maxSize / width;
                                    width = maxSize;
                                }
                            } else {
                                if (height > maxSize) {
                                    width *= maxSize / height;
                                    height = maxSize;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx?.drawImage(image, 0, 0, width, height);

                            // High compression for storage efficiency
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                            handleFieldChange(field.id, dataUrl);
                            toast.dismiss(loadingToast);
                            toast.success("Imagem adicionada!");
                        };
                        image.onerror = () => {
                            toast.dismiss(loadingToast);
                            toast.error("Erro ao processar imagem.");
                        };
                        image.src = URL.createObjectURL(file);

                    } catch (e) {
                        console.error(e);
                        toast.error("Erro ao salvar imagem.");
                    }
                };

                const handlePaste = (e: React.ClipboardEvent) => {
                    if (isReadOnly) return;
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const file = items[i].getAsFile();
                            if (file) handleImageUpload(file);
                        }
                    }
                };

                return <div className="space-y-4">
                    {!isReadOnly ? (
                        <div
                            tabIndex={0}
                            className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 focus:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                            onPaste={handlePaste}
                            onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (isReadOnly) return;
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith('image/')) handleImageUpload(file);
                            }}
                        >
                            <input
                                id={`file-${field.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file);
                                }}
                            />
                            {value ? (
                                <div className="space-y-2">
                                    <img src={value} alt="Preview" className="max-h-[300px] mx-auto rounded-md shadow-sm" />
                                    <p className="text-xs text-muted-foreground">Clique ou Cole (Ctrl+V) para substituir</p>
                                </div>
                            ) : (
                                <div className="space-y-2 text-muted-foreground">
                                    <Sparkles className="h-8 w-8 mx-auto opacity-20" />
                                    <p className="text-sm">Clique para selecionar ou <strong>Cole (Ctrl+V)</strong> um print aqui.</p>
                                    <p className="text-xs opacity-70">A imagem será otimizada automaticamente.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        value ? (
                            <img src={value} alt="Saved" className="max-h-[400px] rounded-md border" />
                        ) : (
                            <span className="text-sm text-muted-foreground italic">Sem imagem.</span>
                        )
                    )}
                </div>
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

    // [NEW] Tab Styling & Render Logic (Hoisted)
    const hasTabs = tabGroups.length > 1;
    const firstTabField = (template.fields || []).find((f: any) => f.type === 'tab');
    const tabStyle = firstTabField?.tabStyle || 'pills';
    const tabColor = firstTabField?.tabColor || '#84c8b9';
    const tabAnimation = firstTabField?.tabAnimation || 'fade';
    const tabAlignment = firstTabField?.tabAlignment || 'left';
    const tabSize = firstTabField?.tabSize || 'md';
    const showBadges = firstTabField?.showTabBadges || false;

    const animationMap: Record<string, string> = {
        none: "",
        fade: "animate-in fade-in duration-500",
        slide: "animate-in slide-in-from-right-8 fade-in duration-500",
        zoom: "animate-in zoom-in-95 fade-in duration-500"
    };
    const animationClasses = animationMap[tabAnimation] || animationMap.fade;

    const sizeMap: Record<string, string> = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "px-8 py-3.5 text-base"
    };
    const sizeClasses = sizeMap[tabSize] || sizeMap.md;

    const alignmentMap: Record<string, string> = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end"
    };
    const alignmentClasses = alignmentMap[tabAlignment] || alignmentMap.left;

    const listStylesMap: Record<string, string> = {
        pills: `mb-8 w-full ${alignmentClasses} overflow-x-auto bg-slate-100/50 p-1.5 h-auto flex-wrap gap-1 border rounded-lg`,
        underline: `mb-8 w-full ${alignmentClasses} overflow-x-auto bg-transparent border-b h-auto flex-wrap gap-4 px-0 pb-0 rounded-none`,
        enclosed: `mb-8 w-full ${alignmentClasses} overflow-x-auto bg-slate-100/30 p-0 h-auto flex-wrap gap-0 border rounded-t-lg overflow-hidden`,
        minimal: `mb-8 w-full ${alignmentClasses} overflow-x-auto bg-transparent p-0 h-auto flex-wrap gap-2`
    };

    const triggerStylesMap: Record<string, string> = {
        pills: `${sizeClasses} data-[state=active]:text-white data-[state=active]:shadow-md rounded-md font-medium transition-all`,
        underline: `px-4 py-3 data-[state=active]:text-primary border-b-2 border-transparent rounded-none bg-transparent shadow-none font-semibold transition-all`,
        enclosed: `${sizeClasses} data-[state=active]:bg-white data-[state=active]:border-x data-[state=active]:border-t border-x border-t border-transparent rounded-t-md rounded-b-none font-medium transition-all -mb-[1px] shadow-none`,
        minimal: `px-4 py-2 data-[state=active]:bg-primary/10 rounded-full font-medium transition-all hover:bg-slate-100 shadow-none border-none`
    };

    const listStyles = listStylesMap[tabStyle] || listStylesMap.pills;
    const triggerStyles = triggerStylesMap[tabStyle] || triggerStylesMap.pills;

    const renderFields = (fields: any[]) => (
        <div className="flex flex-wrap items-start content-start -mx-2">
            {fields.map((field: any) => (
                <div
                    key={field.id}
                    className="px-2 mb-6 flex flex-col gap-2"
                    style={{
                        width: `${field.width || 100}%`,
                        flex: `0 0 ${field.width || 100}%`,
                        maxWidth: `${field.width || 100}%`,
                        marginTop: `${field.marginTop || 0}px`,
                        marginBottom: `${field.marginBottom || 0}px`
                    }}
                >
                    {field.type === 'section' ? (
                        <div className={`w-full py-2 border-b-2 border-primary/20 mb-6 mt-10 ${field.textAlign === 'center' ? 'text-center' : field.textAlign === 'right' ? 'text-right' : 'text-left'}`}>
                            <h3 className={`font-bold text-primary ${field.fontSize === 'sm' ? 'text-sm' :
                                field.fontSize === 'base' ? 'text-base' :
                                    field.fontSize === 'lg' ? 'text-lg' :
                                        field.fontSize === '2xl' ? 'text-2xl' :
                                            field.fontSize === '3xl' ? 'text-3xl' :
                                                'text-xl'
                                }`}>
                                {field.label}
                            </h3>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <Label className={field.type === 'checkbox' ? 'hidden' : ''}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {field.helpText && !['checkbox'].includes(field.type) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-muted-foreground/60 cursor-help hover:text-primary transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[250px] text-[10px] leading-snug">
                                            {field.helpText}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                            {renderField(field)}
                        </>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <TooltipProvider delayDuration={1000}>
            <div className="space-y-6 max-w-4xl mx-auto pb-20">
                {/* Header / Status Bar */}
                {!hideHeader && (
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar
                        </Button>
                        {isReadOnly && (
                            <div className="flex gap-2">
                                {appointmentId && (
                                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/attendance/${appointmentId}`)}>
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Corrigir / Editar
                                    </Button>
                                )}
                                <Button size="sm" onClick={() => setReportOpen(true)}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Gerar Relatório
                                </Button>
                            </div>
                        )}
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

                <div className={`space-y-8 bg-card rounded-lg max-w-5xl mx-auto h-fit ${hideHeader ? 'p-0 border-0 shadow-none' : 'p-10 border shadow-sm'}`}>
                    {!hideTitle && (
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">{template.title}</h1>
                            {template.description && <p className="text-muted-foreground">{template.description}</p>}
                        </div>
                    )}

                    {hasTabs ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={listStyles}>
                                {tabGroups.map((group) => (
                                    <TabsTrigger
                                        key={group.label}
                                        value={group.label}
                                        className={triggerStyles}
                                        style={
                                            tabStyle === 'pills' ? { '--active-bg': tabColor } as any :
                                                tabStyle === 'underline' ? { '--active-border': tabColor, color: 'inherit' } as any :
                                                    { color: 'inherit' }
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            {group.label}
                                            {showBadges && (
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full opacity-70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                                                    {group.fields.length}
                                                </span>
                                            )}
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                    [data-state=active].rounded-md { background-color: ${tabColor} !important; }
                                    [data-state=active].border-b-2 { border-color: ${tabColor} !important; color: ${tabColor} !important; }
                                    .TabsTrigger[data-state=active] { color: ${tabStyle === 'pills' ? 'white' : tabColor} !important; }
                                `}} />
                            {tabGroups.map((group, index) => (
                                <TabsContent
                                    key={group.label}
                                    value={group.label}
                                    className={`mt-0 focus-visible:ring-0 ${animationClasses}`}
                                >
                                    {renderFields(group.fields)}

                                    {/* [NEW] Navigation Buttons */}
                                    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                                        <Button
                                            variant="outline"
                                            onClick={handlePrevTab}
                                            disabled={index === 0}
                                            className={index === 0 ? "opacity-0 pointer-events-none" : "gap-2"}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Anterior
                                        </Button>

                                        {index < tabGroups.length - 1 ? (
                                            <Button
                                                onClick={handleNextTab}
                                                className="gap-2 bg-primary hover:bg-primary/90"
                                            >
                                                Próximo
                                                <ArrowLeft className="h-4 w-4 rotate-180" />
                                            </Button>
                                        ) : (
                                            // Optional: Show nothing or "Finish" logic if desired
                                            <div />
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        renderFields(template.fields || [])
                    )}
                </div>

                {/* Report Selection Modal */}
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Gerar Relatório do Prontuário</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-2 py-4">
                            {availableTemplates.map(t => (
                                <Button key={t.id} variant="outline" className="justify-start" onClick={() => setViewingTemplate(t)}>
                                    {t.title}
                                </Button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Actual Report Viewer */}
                <React.Suspense fallback={null}>
                    {viewingTemplate && (
                        <ReportViewer
                            template={{
                                ...viewingTemplate,
                                // Injection Logic:
                                // Only inject Form Fields if the report implies it needs them (Smart/Standard)
                                // AND it doesn't look like a pure text report (Content present)
                                fields: (
                                    (viewingTemplate.type === 'smart_report' || viewingTemplate.type === 'standard') &&
                                    (!viewingTemplate.content || viewingTemplate.content.length < 50) && // Heuristic: If content exists, it's likely a text report
                                    (!viewingTemplate.fields || viewingTemplate.fields.length === 0)
                                )
                                    ? (template.fields || [])
                                    : (viewingTemplate.fields || [])
                            }}
                            data={{
                                patient: { id: patientId, name: patientName || 'Paciente' },
                                record: {
                                    id: recordId,
                                    form_data: content
                                }
                            }}
                            onClose={() => setViewingTemplate(null)}
                        />
                    )}
                </React.Suspense>
            </div>
        </TooltipProvider>
    );

}

// [NEW] Sub-component for Textarea with Voice Support
function EnhancedTextarea({ field, value, onChange, isReadOnly }: { field: any, value: string, onChange: (val: string) => void, isReadOnly: boolean }) {
    const { isRecording, recordingTime, startRecording, stopRecording, formatTime } = useAudioRecorder()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleMicClick = async () => {
        if (isRecording) {
            // STOP
            const blob = await stopRecording()
            setIsProcessing(true)
            const toastId = toast.loading("Processando áudio com IA...")

            try {
                // Send to Server Action
                const formData = new FormData()
                formData.append('file', blob, 'audio.webm')

                const res = await transcribeAndOrganize(formData)

                if (res.success && res.text) {
                    // Append or Replace? Let's Append if content exists.
                    const newText = value ? value + "\n\n" + res.text : res.text
                    onChange(newText)
                    toast.success("Evolução transcrita com sucesso!")
                } else {
                    toast.error(res.msg || "Erro na transcrição.")
                }
            } catch (e) {
                toast.error("Erro ao enviar áudio.")
            }

            toast.dismiss(toastId)
            setIsProcessing(false)
        } else {
            // START
            try {
                await startRecording()
            } catch (e) {
                toast.error("Erro ao acessar microfone. Verifique as permissões.")
                console.error(e)
            }
        }
    }

    return (
        <div className="relative">
            <Textarea
                disabled={isReadOnly || isProcessing}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                maxLength={field.maxLength}
                className="min-h-[120px] bg-white pr-10" // Space for Mic
            />

            {!isReadOnly && (
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    {isRecording && (
                        <span className="text-xs font-mono font-medium text-red-500 animate-pulse">
                            {formatTime(recordingTime)}
                        </span>
                    )}
                    <Button
                        type="button"
                        size="icon"
                        variant={isRecording ? "destructive" : "secondary"}
                        className={`h-8 w-8 rounded-full shadow-sm transition-all ${isRecording ? 'animate-pulse scale-110' : 'hover:scale-105'}`}
                        onClick={handleMicClick}
                        disabled={isProcessing}
                        title={isRecording ? "Parar e Transcrever" : "Gravar Evolução (IA)"}
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isRecording ? (
                            <StopCircle className="h-4 w-4" />
                        ) : (
                            <Mic className="h-4 w-4 text-primary" />
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

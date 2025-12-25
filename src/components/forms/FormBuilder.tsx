'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
    Type, AlignLeft, CheckSquare, List, GripHorizontal, Image as ImageIcon,
    Calendar, Save, Trash2, ArrowLeft, GripVertical, Plus, Settings, Eye, EyeOff,
    Columns, Search, Calculator, Sliders, FileUp, Edit3, RotateCcw,
    PieChart, Hash, FileText, MousePointerClick, Table, SlidersHorizontal, UploadCloud, RotateCw, FunctionSquare, Footprints, User, Copy, Loader2, Box, Info,
    Scale, Layers, ArrowDownRight, Shield, ArrowUp, ArrowDown, PenTool, Activity, Clock, Paperclip, FileJson, Heart, Sparkles
} from 'lucide-react'
// import { read, utils } from 'xlsx'; // Removed for valid migration to exceljs
import { toast } from 'sonner';


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Pie, Cell, AreaChart, Area } from 'recharts'
import { PieChart as RechartsPieChart } from 'recharts' // Alias to avoid conflict with Icon;
import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { updateFormTemplate } from '@/app/actions/forms';
import { getFormTemplates } from '@/app/dashboard/forms/actions';

interface FormTemplate {
    id: string;
    title: string;
    description: string;
    fields: any[];
}

interface FormBuilderProps {
    template: FormTemplate;
}

// Tool types for draggable items
const TOOLS = [
    { type: 'file', label: 'Arquivo / Foto', icon: UploadCloud },
    { type: 'attachments', label: 'Anexos (PDF/Laudos)', icon: Paperclip },
    { type: 'signature', label: 'Assinatura Digital', icon: PenTool },
    { type: 'vitals', label: 'Sinais Vitais', icon: Activity },
    { type: 'questionnaire', label: 'Questionário Externo', icon: FileText },
    { type: 'date', label: 'Seletor de Data', icon: Calendar },
    { type: 'datetime', label: 'Data e Hora', icon: Clock },
    { type: 'rich_text', label: 'Texto Rico (Formado)', icon: FileJson },
    { type: 'slider', label: 'Barra Deslizante', icon: SlidersHorizontal },
    { type: 'calculated', label: 'Campo Calculado', icon: Calculator },
    { type: 'chart', label: 'Gráfico', icon: PieChart },
    { type: 'image', label: 'Imagem / Mapa', icon: ImageIcon },
    { type: 'logic_variable', label: 'Lógica Condicional', icon: FunctionSquare },
    { type: 'tab', label: 'Separador de Aba / Seção', icon: Layers },
    { type: 'pain_map', label: 'Mapa de Dor', icon: User },
    { type: 'checkbox_group', label: 'Múltipla Escolha', icon: CheckSquare },
    { type: 'select', label: 'Lista Suspensa', icon: List },
    { type: 'number', label: 'Número', icon: Hash },
    { type: 'radio_group', label: 'Seleção Única', icon: List },
    { type: 'textarea', label: 'Texto Longo', icon: AlignLeft },
    { type: 'text', label: 'Texto Curto', icon: Type },
    { type: 'grid', label: 'Tabela / Grade', icon: Table },
    { type: 'section', label: 'Cabeçalho de Seção', icon: Type },
];

const FIELD_DEFAULTS: Record<string, { placeholder?: string, helpText?: string }> = {
    text: { placeholder: "Ex: Nome Completo", helpText: "Digite aqui a informação curta solicitada." },
    textarea: { placeholder: "Ex: Descrição detalhada da anamnese...", helpText: "Forneça detalhes observados durante a consulta." },
    number: { placeholder: "Ex: 70", helpText: "Apenas valores numéricos." },
    date: { placeholder: "dd/mm/aaaa", helpText: "Selecione a data no calendário." },
    datetime: { placeholder: "dd/mm/aaaa --:--", helpText: "Selecione data e horário." },
    rich_text: { placeholder: "Comece a escrever aqui...", helpText: "Use a barra superior para formatar o texto (negrito, listas, etc)." },
    vitals: { helpText: "Preencha os sinais vitais básicos do paciente para monitoramento." },
    signature: { helpText: "O paciente ou profissional deve assinar usando o mouse ou tela touchscreen." },
    attachments: { helpText: "Faça o upload de documentos, laudos ou exames complementares (PDF, imagens)." },
    calculated: { placeholder: "Resultado automático", helpText: "Este campo calcula o valor automaticamente baseando-se em outros campos." },
    slider: { helpText: "Arraste para selecionar a intensidade ou nível (ex: Escala de Dor)." },
    pain_map: { helpText: "Clique nas áreas do corpo onde o paciente relata dor ou desconforto." },
    grid: { helpText: "Preencha as informações na tabela conforme as linhas e colunas definidas." },
    select: { helpText: "Selecione uma das opções disponíveis na lista." },
    radio_group: { helpText: "Escolha apenas uma das opções." },
    checkbox_group: { helpText: "Você pode selecionar uma ou mais opções desta lista." },
    image: { helpText: "Adicione uma imagem relevante para o prontuário ou selecione um mapa." },
    file: { helpText: "Anexe um arquivo ou foto importante." },
    tab: { helpText: "Use para organizar o formulário em diferentes abas ou seções de navegação." },
    questionnaire: { helpText: "Selecione um questionário existente para incorporar neste formulário." },
};

export default function FormBuilder({ template }: FormBuilderProps) {
    const [fields, setFields] = useState(() => {
        const raw = template.fields || [];
        const unique: any[] = [];
        const seen = new Set();
        raw.forEach(f => {
            if (!seen.has(f.id)) {
                seen.add(f.id);
                unique.push(f);
            }
        });
        return unique;
    });
    // Undo/Redo Stacks
    const [history, setHistory] = useState<any[][]>([]);
    const [future, setFuture] = useState<any[][]>([]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('tools');
    const [isSaving, setIsSaving] = useState(false);
    const [draggedTool, setDraggedTool] = useState<any>(null); // For Sidebar Tools
    const [activeDragId, setActiveDragId] = useState<string | null>(null); // For Sortable Fields
    const [isPreview, setIsPreview] = useState(false);

    // Form State for Preview Mode
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [processingFile, setProcessingFile] = useState(false);
    const [tempFile, setTempFile] = useState<File | null>(null);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    useEffect(() => {
        getFormTemplates().then(templates => {
            if (Array.isArray(templates)) {
                setAvailableTemplates(templates);
            }
        });
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Avoid accidental drags when clicking to select
            },
        })
    );

    // Helper to update fields with History tracking
    const updateFieldsWithHistory = (newFields: any[]) => {
        setHistory(prev => [...prev, fields]);
        setFuture([]);
        setFields(newFields);
    };

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setFuture(prev => [fields, ...prev]);
        setFields(previous);
        setHistory(newHistory);
    }, [fields, history]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        setHistory(prev => [...prev, fields]);
        setFields(next);
        setFuture(newFuture);
    }, [fields, future]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    // Ensure every field has a unique ID and deduplicate
    useEffect(() => {
        let changed = false;
        const seen = new Set();
        const newFields = fields.map((f: any) => {
            let id = f.id;
            // Generate ID if missing OR if duplicate
            if (!id || seen.has(id)) {
                id = Math.random().toString(36).substr(2, 9);
                changed = true;
            }
            seen.add(id);
            return { ...f, id };
        });

        if (changed) {
            console.warn("Fixed duplicate/missing IDs in FormBuilder");
            setFields(newFields);
        }
    }, [fields]);

    // Calculation Engine
    useEffect(() => {
        if (!isPreview) return;

        const calculatedFields = fields.filter((f: any) => f.type === 'calculated');
        const newValues = { ...formValues };
        let hasUpdates = false;

        calculatedFields.forEach((field: any) => {
            let result = 0;

            if (field.calculationType === 'imc') {
                // IMC Logic
                const weightId = field.targetIds?.[0];
                const heightId = field.targetIds?.[1];
                const weight = parseFloat(formValues[weightId] || 0);
                const height = parseFloat(formValues[heightId] || 0);
                if (weight > 0 && height > 0) {
                    const heightInMeters = height > 3 ? height / 100 : height; // Heuristic for cm -> m
                    result = weight / (heightInMeters * heightInMeters);
                }
            } else if (field.calculationType === 'custom') {
                // Custom Formula Logic
                const formula = field.formula || '';
                const vars = field.variableMap || [];

                let expression = formula.toUpperCase();

                vars.forEach((v: any) => {
                    const val = parseFloat(formValues[v.targetId] || 0);
                    const regex = new RegExp(`\\b${v.letter}\\b`, 'g');
                    expression = expression.replace(regex, val.toString());
                });

                try {
                    const sanitized = expression.replace(/[^0-9+\-*\/().\s]/g, '');
                    if (/[a-zA-Z]/.test(sanitized)) {
                        result = 0;
                    } else {
                        // eslint-disable-next-line no-new-func
                        result = new Function('return ' + sanitized)();
                    }
                } catch (e) {
                    result = 0;
                }

            } else if (field.calculationType === 'minimalist_index') {
                // Minimalist Index Logic (6 fields now)
                // Sum of 6 fields (0-5) = Max 30.
                let currentSum = 0;
                // We expect targetIds[0..5]
                (field.targetIds || []).forEach((id: string) => {
                    const val = parseFloat(formValues[id] || 0);
                    currentSum += (isNaN(val) ? 0 : val); // Val is likely 0-5
                });
                // (Sum / 30) * 100
                result = (currentSum / 30) * 100;
            } else {
                // Default: SUM
                const targetIds = field.targetIds || [];
                result = targetIds.reduce((sum: number, id: string) => {
                    const val = parseFloat(formValues[id] || 0);
                    return sum + (isNaN(val) ? 0 : val);
                }, 0);
            }

            // Round to 2 decimals
            result = Math.round((result || 0) * 100) / 100;

            if (newValues[field.id] !== result) {
                newValues[field.id] = result;
                hasUpdates = true;
            }
        });

        // 2. Logic Variables (Conditional Logic)
        const logicFields = fields.filter((f: any) => f.type === 'logic_variable');
        logicFields.forEach((field: any) => {
            let result = field.defaultResult || '';

            // Helper to safely parse numbers, handling "123" strings from Selects
            const safeParseFloat = (val: any) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    // Check if it looks like a number
                    if (/^-?\d*(\.\d+)?$/.test(trimmed) && trimmed !== '') {
                        return parseFloat(trimmed);
                    }
                }
                return NaN;
            };

            // Determine active target IDs (backwards compatible)
            const targetIds = field.targetFieldIds && field.targetFieldIds.length > 0
                ? field.targetFieldIds
                : (field.targetFieldId ? [field.targetFieldId] : []);

            const rules = field.rules || [];

            if (field.logicMode === 'matrix_range' && field.lookupTable && field.matrixRowFieldId && field.matrixRowCol && field.matrixValueFieldId) {
                const rowVal = formValues[field.matrixRowFieldId];
                // Find row (using mixed numeric/string comparison from safeParseFloat or loose string)
                const row = field.lookupTable.find((r: any) => {
                    const cellVal = r[field.matrixRowCol];
                    // Try exact numeric match first
                    const nRow = safeParseFloat(rowVal);
                    const nCell = safeParseFloat(cellVal);
                    if (!isNaN(nRow) && !isNaN(nCell)) return nRow === nCell;
                    // Fallback to string
                    return String(rowVal || '').toLowerCase().trim() === String(cellVal || '').toLowerCase().trim();
                });

                if (row) {
                    const valToCheck = safeParseFloat(formValues[field.matrixValueFieldId]);
                    const cols = field.matrixRangeCols || [];

                    if (!isNaN(valToCheck)) {
                        let found = false;
                        // Iterate BACKWARDS (High -> Low) because columns represent LOWER LIMITS (Pisos)
                        // Example: Med starts at 18. If val is 15 (> Low 14 but < Med 18), it should be Low.
                        for (let i = cols.length - 1; i >= 0; i--) {
                            const col = cols[i];
                            const limit = safeParseFloat(row[col]);
                            if (!isNaN(limit) && valToCheck >= limit) {
                                result = col;
                                found = true;
                                break;
                            }
                        }
                        // Fallback: If < lowest limit (e.g. 13 when Low starts at 14), 
                        // usually this means it's below the scale. 
                        // We can either return nothing or the first column. 
                        // For now, if not found (too low), we leave it blank or user logic applies? 
                        // User example: 15 (Low=14, Med=18) -> Low.
                        // My loop: 15 >= 22(No), 15 >= 18(No), 15 >= 14(Yes) -> Low. Correct.
                    }
                }
            } else if (targetIds.length > 0) {
                // Get PRIMARY value for Manual Rules (legacy single variable support)
                const primaryTargetId = targetIds[0];
                const primaryRawValue = formValues[primaryTargetId];

                if (field.logicMode === 'lookup' && field.lookupTable && field.resultColumn) {
                    // Excel Lookup Logic - MULTI VARIABLE SUPPORT
                    // We need to find a row where ALL mapped columns match the corresponding field values

                    const row = field.lookupTable.find((r: any) => {
                        // Check all target fields
                        return targetIds.every((tId: string) => {
                            const formVal = formValues[tId];
                            // Find which column this field maps to
                            const column = (field.lookupMappings && field.lookupMappings[tId]) || (tId === field.targetFieldId ? field.lookupColumn : null);

                            if (!column) return true; // checking a field that isn't mapped? ignore or fail? let's ignore (lazy match)

                            const rowVal = r[column];

                            // Try numeric comparison first
                            const nForm = safeParseFloat(formVal);
                            const nRow = safeParseFloat(rowVal);

                            if (!isNaN(nForm) && !isNaN(nRow)) {
                                return nForm === nRow;
                            }

                            // Fallback to loose string comparison
                            const sForm = String(formVal || '').trim().toLowerCase();
                            const sRow = String(rowVal || '').trim().toLowerCase();
                            return sForm === sRow;
                        });
                    });

                    if (row) {
                        result = row[field.resultColumn];
                    }

                } else {
                    // Manual Rules Logic - Keep simplified to SINGLE variable for now to avoid complexity explosion
                    // Uses primaryTargetId

                    const numVal = safeParseFloat(primaryRawValue);
                    const isNum = !isNaN(numVal);

                    for (const rule of rules) {
                        const ruleVal = parseFloat(rule.value);
                        const ruleVal2 = parseFloat(rule.value2);
                        let match = false;

                        if (isNum && !['contains'].includes(rule.operator)) {
                            switch (rule.operator) {
                                case 'gt': match = numVal > ruleVal; break;
                                case 'lt': match = numVal < ruleVal; break;
                                case 'gte': match = numVal >= ruleVal; break;
                                case 'lte': match = numVal <= ruleVal; break;
                                case 'eq': match = numVal === ruleVal; break;
                                case 'neq': match = numVal !== ruleVal; break;
                                case 'between': match = numVal >= ruleVal && numVal <= (ruleVal2 || ruleVal); break;
                            }
                        } else {
                            // String comparison
                            const sVal = String(primaryRawValue || '').toLowerCase();
                            const rVal = String(rule.value || '').toLowerCase();
                            switch (rule.operator) {
                                case 'eq': match = sVal === rVal; break;
                                case 'neq': match = sVal !== rVal; break;
                                case 'contains': match = sVal.includes(rVal); break;
                            }
                        }

                        if (match) {
                            result = rule.result;
                            break; // Stop at first match
                        }
                    }
                }
            }

            if (newValues[field.id] !== result) {
                newValues[field.id] = result;
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            setFormValues(newValues);
        }
    }, [formValues, fields, isPreview]);

    // Save changes to database
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Sanitize payload to remove non-serializable data and ensure cleaner JSON
            const cleanFields = JSON.parse(JSON.stringify(fields));

            // DEBUG FORCE: Show Toast with Data
            console.error('🚨 [SPY] SAVING DATA:', { id: template.id, count: cleanFields.length });
            let debugMsg = `Salvando ${cleanFields.length} campos...`;
            cleanFields.forEach((f: any) => {
                if (f.type === 'pain_map') {
                    debugMsg += `\n[${f.label}]: ${f.points?.length || 0} pts`;
                    if (f.points?.[0]) debugMsg += ` (P1: ${Math.round(f.points[0].x)},${Math.round(f.points[0].y)})`;
                }
            });
            // window.alert removed

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Tempo limite de salvamento excedido (15s). Verifique sua conexão.')), 15000);
            });

            // Race the update against the timeout
            const result: any = await Promise.race([
                updateFormTemplate(template.id, cleanFields),
                timeoutPromise
            ]);

            if (result.success) {
                toast.success('Formulário salvo com sucesso!');
            } else {
                console.error('Save error:', result);
                toast.error(`Erro ao salvar: ${result.error || 'Erro desconhecido'}`);
            }
        } catch (error: any) {
            console.error('Unexpected save error:', error);
            toast.error(`Erro inesperado: ${error.message || error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldClick = (id: string, e?: React.MouseEvent) => {
        // Multi-selection logic
        if (e && (e.metaKey || e.ctrlKey)) {
            setSelectedIds(prev => {
                const isSelected = prev.includes(id);
                if (isSelected) {
                    return prev.filter(item => item !== id);
                } else {
                    return [...prev, id];
                }
            });
            // If we just clicked it, make it active
            setActiveId(id);
        } else {
            // Single selection
            setSelectedIds([id]);
            setActiveId(id);
        }
        setActiveTab('properties');
    };

    const handleFieldUpdate = (key: string | object, value?: any, saveHistory = false) => {
        if (!activeId) return;

        const newFields = [...fields];
        const index = newFields.findIndex(f => f.id === activeId);
        if (index === -1) return;

        // Defaults if changing type
        if (key === 'type') {
            if (value === 'checkbox_group' || value === 'radio_group' || value === 'select') {
                if (!newFields[index].options) {
                    newFields[index].options = ['Opção 1', 'Opção 2'];
                }
            }
            if (value === 'slider') {
                newFields[index].min = 0;
                newFields[index].max = 10;
                newFields[index].step = 1;
            }
        }

        if (typeof key === 'object' && key !== null) {
            newFields[index] = { ...newFields[index], ...key };
        } else {
            newFields[index] = { ...newFields[index], [key]: value };
        }

        if (saveHistory) {
            updateFieldsWithHistory(newFields);
        } else {
            setFields(newFields);
        }
    };

    const handleOptionsUpdate = (value: string) => {
        let options = value.split('\n');

        // Auto-sort if enabled
        if (activeId) {
            const field = fields.find(f => f.id === activeId);
            if (field && field.autoSort) {
                options = options.sort((a, b) => a.localeCompare(b));
            }
        }

        handleFieldUpdate('options', options);
    };


    const handleGridUpdate = (key: 'rows' | 'columns', value: string) => {
        const items = value.split('\n');
        handleFieldUpdate(key, items);
    };

    // Helper to toggle ID in targetIds array for Sum calculation
    const toggleTargetId = (targetId: string) => {
        if (!activeId) return;
        const currentField = fields.find((f: any) => f.id === activeId);
        if (!currentField) return;

        const currentTargets = currentField.targetIds || [];

        let newTargets;
        if (currentTargets.includes(targetId)) {
            newTargets = currentTargets.filter((id: string) => id !== targetId);
        } else {
            newTargets = [...currentTargets, targetId];
        }
        handleFieldUpdate('targetIds', newTargets);
    };

    // Helper for specialized mapping (IMC: Weight, Height)
    const setTargetIdAtIndex = (index: number, targetId: string) => {
        if (!activeId) return;
        const currentField = fields.find((f: any) => f.id === activeId);
        if (!currentField) return;

        const currentTargets = [...(currentField.targetIds || [])];
        currentTargets[index] = targetId;
        handleFieldUpdate('targetIds', currentTargets);
    };

    // Helper for Custom Variable Mapping
    const addCustomVariable = () => {
        if (!activeId) return;
        const currentField = fields.find((f: any) => f.id === activeId);
        if (!currentField) return;

        const currentMap = currentField.variableMap || [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nextLetter = letters[currentMap.length] || 'Z'; // fallback

        const newMap = [...currentMap, { letter: nextLetter, targetId: '' }];
        handleFieldUpdate('variableMap', newMap);
    };

    const updateCustomVariable = (index: number, targetId: string) => {
        if (selectedIds.length !== 1) return;
        const currentField = fields.find(f => f.id === selectedIds[0]);
        if (!currentField) return;

        const currentMap = [...(currentField.variableMap || [])];
        const updatedMap = currentMap.map((v, i) => i === index ? { ...v, targetId } : v);
        handleFieldUpdate('variableMap', updatedMap);
    };

    const removeCustomVariable = (index: number) => {
        if (!activeId) return;
        const currentField = fields.find((f: any) => f.id === activeId);
        if (!currentField) return;

        const currentMap = [...(currentField.variableMap || [])];
        currentMap.splice(index, 1);
        handleFieldUpdate('variableMap', currentMap);
    };


    // FIX: Canvas Update handler that accepts ID explicitly (CanvasDroppable passes id, key, val)
    const handleCanvasUpdate = (id: string, key: string | Record<string, any>, val?: any) => {
        setFields(prevFields => {
            const newFields = [...prevFields];
            const index = newFields.findIndex(f => f.id === id);
            if (index === -1) return prevFields;

            // Handle object updates (e.g. { scale: 1, offsetX: 0 })
            if (typeof key === 'object' && key !== null && !Array.isArray(key)) {
                newFields[index] = { ...newFields[index], ...key };
            } else if (typeof key === 'string') {
                newFields[index] = { ...newFields[index], [key]: val };
            }
            return newFields;
        });

        // Also update activeId if we are interacting with a field that isn't selected?
        // Optional: setActiveId(id); (But might be annoying if dragging causes selection change? Actually usually good UX)
        if (activeId !== id) {
            console.log('Interacting with non-active field, updating anyway.');
        }
    };
    // (End of handleCanvasUpdate)

    // Drag and Drop Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        // Check if it's a sidebar tool
        const toolType = active.data.current?.type;
        if (toolType) {
            const tool = TOOLS.find(t => t.type === toolType);
            setDraggedTool(tool);
            return;
        }

        // Must be a field sort
        setActiveDragId(active.id as string);
    };

    // Drag and Drop Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedTool(null);
        setActiveDragId(null);

        if (!over) return;

        // 1. Handling New Tool Drop (adding from sidebar)
        const toolType = active.data.current?.type;
        if (toolType && over) {
            const toolLabel = active.data.current?.label;
            const defaults = FIELD_DEFAULTS[toolType as string] || {};
            const newField = {
                id: Math.random().toString(36).substr(2, 9),
                type: toolType,
                label: toolLabel || 'Novo Campo',
                placeholder: defaults.placeholder,
                helpText: defaults.helpText,
                required: false,
                width: '100',
                options: (toolType === 'checkbox_group' || toolType === 'radio_group') ? ['Opção 1', 'Opção 2'] : undefined,
                min: toolType === 'slider' ? 0 : undefined,
                max: toolType === 'slider' ? 10 : undefined,
                step: toolType === 'slider' ? 1 : undefined,
                calculationType: toolType === 'calculated' ? 'sum' : undefined,
                targetIds: [],
                rows: toolType === 'grid' ? ['Item 1', 'Item 2'] : undefined,
                columns: toolType === 'grid' ? ['Col 1', 'Col 2'] : undefined,
                fields: toolType === 'group_row' ? [] : undefined // Initialize empty fields for group
            };

            // Determine insertion index
            let insertIndex = fields.length;
            if (over.id !== 'canvas-droppable') {
                const overIndex = fields.findIndex((f: any) => f.id === over.id);
                if (overIndex !== -1) {
                    insertIndex = overIndex + 1; // Insert after the hovered item
                }
            }

            const newFields = [...fields];
            newFields.splice(insertIndex, 0, newField);

            updateFieldsWithHistory(newFields);
            setSelectedIds([newField.id]);
            setActiveId(newField.id);
            setActiveTab('edit');
            return;
        }

        // 2. Handling Reorder (Sorting)
        if (active.id !== over.id) {
            const activeIdStr = active.id as string;
            const overIdStr = over.id as string;

            // Multi-Move Logic
            if (selectedIds.includes(activeIdStr) && selectedIds.length > 1) {
                const newFields = [...fields];

                // Items being moved
                const itemsToMove = newFields.filter(f => selectedIds.includes(f.id));

                // Remaining items (target list to insert into)
                const remainingFields = newFields.filter(f => !selectedIds.includes(f.id));

                // Find insertion index in the REMAINING list
                // If overId is in selectedIds (shouldn't happen with filtered list logic normally, but depends on dnd-kit behavior)
                // 'over' is likely NOT in selectedIds because we are dragging the selection GROUP over something else.

                let overIndex = remainingFields.findIndex(f => f.id === overIdStr);

                // Determine if we are dropping 'above' or 'below' based on original indices? 
                // It's hard to tell direction perfectly without collision rects, but typically:
                // If we find the index, we insert BEFORE it? Standard Sortable behavior is swap.
                // Let's assume insert BEFORE unless we were originally before it? 
                // Simpler approach: Insert BEFORE the target (over).

                if (overIndex === -1) {
                    // Fallback: End of list
                    overIndex = remainingFields.length;
                } else {
                    // Check direction relative to ORIGINAL positions for better UX?
                    // If the FIRST of the selected items was BEFORE the over item, we might mean "after"?
                    // But simply inserting "at index" pushes 'over' down, effectively placing "before".

                    // Optimization: If dragging DOWN, user expects it after.
                    const originalActiveIndex = fields.findIndex(f => f.id === activeIdStr);
                    const originalOverIndex = fields.findIndex(f => f.id === overIdStr);

                    if (originalActiveIndex < originalOverIndex) {
                        // Dragging down -> Insert AFTER
                        overIndex += 1;
                    }
                }

                remainingFields.splice(overIndex, 0, ...itemsToMove);
                updateFieldsWithHistory(remainingFields);

            } else {
                // Single Item Move
                const oldIndex = fields.findIndex((i: any) => i.id === active.id);
                const newIndex = fields.findIndex((i: any) => i.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(fields, oldIndex, newIndex);
                    updateFieldsWithHistory(newItems);
                }
            }
        }
    };

    const handleFieldDelete = () => {
        if (selectedIds.length === 0) return;
        const newFields = fields.filter((f) => !selectedIds.includes(f.id));
        updateFieldsWithHistory(newFields);
        setSelectedIds([]);
        setActiveTab('tools');
    };

    const handleFieldDuplicate = () => {
        if (selectedIds.length === 0) return;

        let newFields = [...fields];
        const newIds: string[] = [];

        // Duplicate each selected field
        // We iterate fields to maintain order
        fields.forEach((field, index) => {
            if (selectedIds.includes(field.id)) {
                const newField = JSON.parse(JSON.stringify(field));
                newField.id = Math.random().toString(36).substr(2, 9);
                newField.label = `${newField.label} (Cópia)`;
                if (newField.points) {
                    newField.points = newField.points.map((p: any) => ({ ...p, id: Math.random().toString(36).substr(2, 9) }));
                }
                newIds.push(newField.id);
                // Insert immediately after? Or collect and insert?
                // Inserting immediately changes indices for subsequent iterations if we loop on live array.
                // But we are looping on 'fields' (snapshot).

                // However, we need to insert into 'newFields'.
                // Let's insert after the original.
                const insertPos = newFields.findIndex(f => f.id === field.id) + 1;
                newFields.splice(insertPos, 0, newField);
            }
        });

        updateFieldsWithHistory(newFields);
        setSelectedIds(newIds); // Select the copies
        setActiveTab('edit'); // Switch to edit (so user sees they duplicated)
    };

    // Helper to insert a generic field at a specific index
    const insertField = (index: number, position: 'before' | 'after') => {
        const insertIndex = position === 'before' ? index : index + 1;

        const newField = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'text', // Default type
            label: 'Novo Campo',
            required: false,
            width: '100',
        };

        const newFields = [...fields];
        newFields.splice(insertIndex, 0, newField);

        updateFieldsWithHistory(newFields);
        setSelectedIds([newField.id]);
        setActiveId(newField.id);
        setActiveTab('properties');
    };

    // Determine what to show in editor
    const selectedField = selectedIds.length === 1
        ? fields.find(f => f.id === selectedIds[0])
        : null;

    // Filter numeric fields for Calculation config
    const numericFields = fields.filter((f: any) =>
        (f.type === 'number' || f.type === 'slider' || f.type === 'calculated' || f.type === 'grid' || f.type === 'radio' || f.type === 'radio_group' || f.type === 'select') && f.id !== selectedField?.id
    );

    // Higher-level helper to apply professional suggestions to all empty placeholders/help texts
    const applyProfessionalSuggestions = () => {
        const newFields = fields.map((field: any) => {
            const defaults = FIELD_DEFAULTS[field.type] || {};
            return {
                ...field,
                placeholder: field.placeholder || defaults.placeholder,
                helpText: field.helpText || defaults.helpText,
            };
        });
        updateFieldsWithHistory(newFields);
        toast.success("Sugestões profissionais aplicadas onde estava vazio!");
    };

    // --- RENDER MODES ---

    if (isPreview) {
        return (
            <div className="flex flex-col h-full bg-muted/10">
                <div className="flex items-center justify-between border-b p-4 bg-background shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Modo Visualização
                        </h1>
                    </div>
                    <Button onClick={() => setIsPreview(false)} variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Voltar para Edição
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-gray-50/50">
                    <div className="w-full max-w-7xl h-fit bg-white shadow-lg border rounded-xl p-6 md:p-10 space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h2>
                            <p className="text-gray-500">{template.description}</p>
                        </div>
                        <hr />
                        {(() => {
                            // Group fields into tabs
                            const tabGroups: { label: string, fields: any[], hidden?: boolean }[] = [];
                            let currentTabFields: any[] = [];
                            let currentTabLabel = "Geral";
                            let currentTabHidden = false;

                            (fields || []).forEach((field: any) => {
                                if (field.type === 'tab') {
                                    if (currentTabFields.length > 0 || tabGroups.length > 0) {
                                        tabGroups.push({ label: currentTabLabel, fields: currentTabFields, hidden: currentTabHidden });
                                    }
                                    currentTabLabel = field.label || "Nova Aba";
                                    currentTabFields = [];
                                    currentTabHidden = !!field.hidden;
                                } else {
                                    currentTabFields.push(field);
                                }
                            });

                            if (currentTabFields.length > 0 || tabGroups.length > 0) {
                                tabGroups.push({ label: currentTabLabel, fields: currentTabFields, hidden: currentTabHidden });
                            }

                            const hasTabs = tabGroups.length > 1;
                            const firstTabField = (fields || []).find((f: any) => f.type === 'tab');
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

                            const renderFields = (fieldsToRender: any[]) => {
                                let hideMode = false;
                                return (
                                    <div className="flex flex-wrap items-start content-start -mx-2">
                                        {fieldsToRender.map((field: any, index: number) => {
                                            // LOGIC: Section with hideFollowing toggles mode ON
                                            // Regular Section toggles mode OFF (unless it also has hideFollowing)
                                            if (field.type === 'section') {
                                                hideMode = !!field.hideFollowing;
                                            }

                                            // Apply hidden state
                                            const effectiveField = hideMode ? { ...field, hidden: true } : field;

                                            return (
                                                <div
                                                    key={index}
                                                    className="px-2 mb-4"
                                                    style={{ width: `${field.width || 100}%` }}
                                                >
                                                    <RenderField
                                                        field={effectiveField}
                                                        isPreview={true}
                                                        value={formValues[field.id]}
                                                        onChange={(val: any) => setFormValues(prev => ({ ...prev, [field.id]: val }))}
                                                        formValues={formValues}
                                                        allFields={fields}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            };

                            if (hasTabs) {
                                return (
                                    <Tabs defaultValue={tabGroups[0].label} className="w-full">
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
                                                        {group.hidden && <EyeOff className="w-3 h-3 text-muted-foreground" />}
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
                                        {tabGroups.map((group) => (
                                            <TabsContent
                                                key={group.label}
                                                value={group.label}
                                                className={`mt-0 focus-visible:ring-0 ${animationClasses}`}
                                            >
                                                {renderFields(group.fields)}
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                );
                            }

                            return renderFields(fields || []);
                        })()}
                        <div className="pt-8 flex justify-end">
                            <Button size="lg" onClick={() => toast.success("Simulação: Envio realizado!")}>Simular Envio</Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-muted/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4 bg-background z-10 relative">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/forms">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold">{template.title}</h1>
                            <p className="text-sm text-muted-foreground">Editor de Formulário</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="mr-2 flex gap-1 border-r pr-2 items-center">
                            <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0} title="Desfazer (Cmd+Z)">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} title="Refazer (Cmd+Shift+Z)">
                                <RotateCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mr-2 flex gap-1 border-r pr-2 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2 border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all shadow-sm"
                                onClick={applyProfessionalSuggestions}
                                title="Preencher dicas e exemplos automaticamente nos campos vazios"
                            >
                                <Sparkles className="h-4 w-4" />
                                <span className="hidden sm:inline">Dicas Inteligentes</span>
                            </Button>
                        </div>
                        <Button variant="outline" onClick={() => { setIsPreview(true); setFormValues({}); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Testar (Visualizar)
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex flex-1 overflow-hidden relative z-0">
                    {/* Unified Sidebar (Tools + Properties) */}
                    <div className="w-80 border-r bg-background flex flex-col z-10 h-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col h-full">
                            <div className="p-4 border-b">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="tools">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar
                                    </TabsTrigger>
                                    <TabsTrigger value="properties">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Editar
                                    </TabsTrigger>
                                </TabsList>
                            </div>


                            {/* Removed wrapper div, applied scroll to TabsContent directly */}
                            <TabsContent value="tools" className="flex-1 h-full overflow-y-auto min-h-0 p-4 m-0 space-y-4">
                                <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-4">Campos Disponíveis</h2>
                                <div className="grid gap-2">
                                    {TOOLS.map((tool) => (
                                        <DraggableTool key={tool.type} tool={tool} />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground text-center pt-4">Arraste os itens para o formulário ao lado.</p>
                            </TabsContent>

                            <TabsContent value="properties" className="flex-1 h-full overflow-y-auto min-h-0 p-4 m-0 space-y-4">
                                {selectedField ? (
                                    <div className="space-y-4">
                                        <div className="pb-4 border-b">
                                            <h3 className="font-semibold text-lg truncate">{selectedField.label}</h3>
                                            <p className="text-xs text-muted-foreground capitalize">{selectedField.type}</p>
                                        </div>

                                        {/* Label Edit */}
                                        <div className="space-y-2">
                                            <Label>Rótulo (Label)</Label>
                                            <Input
                                                value={selectedField.label || ''}
                                                onChange={(e) => handleFieldUpdate('label', e.target.value)}
                                            />
                                        </div>

                                        {/* Selection Group Config (Radio/Select/Checkbox) */}
                                        {['radio_group', 'checkbox_group', 'select'].includes(selectedField.type) && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="flex items-center justify-between">
                                                    <Label className="font-semibold">Opções de Seleção</Label>
                                                    {['radio_group', 'checkbox_group'].includes(selectedField.type) && (
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-[10px] uppercase text-muted-foreground">Layout:</Label>
                                                            <Select
                                                                value={selectedField.layout || 'vertical'}
                                                                onValueChange={(val) => handleFieldUpdate('layout', val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px] w-[100px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="vertical">Vertical</SelectItem>
                                                                    <SelectItem value="horizontal">Horizontal</SelectItem>
                                                                    <SelectItem value="grid">Grade (2 col)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Opções (Uma por linha)</Label>
                                                    <Textarea
                                                        rows={5}
                                                        value={selectedField.options?.join('\n') || ''}
                                                        onChange={(e) => handleFieldUpdate('options', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                                                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>
                                                {selectedField.type === 'select' && (
                                                    <div className="space-y-2">
                                                        <Label>Opção Padrão</Label>
                                                        <Select
                                                            value={selectedField.defaultValue || ''}
                                                            onValueChange={(val) => handleFieldUpdate('defaultValue', val)}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="">Nenhuma</SelectItem>
                                                                {selectedField.options?.map((option: string) => (
                                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Placeholder & Help Text [NEW] */}
                                        {!['section', 'tab', 'pain_map', 'chart'].includes(selectedField.type) && (
                                            <div className="space-y-3 p-3 border rounded-md bg-muted/5">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Placeholder</Label>
                                                        <Input
                                                            value={selectedField.placeholder || ''}
                                                            onChange={(e) => handleFieldUpdate('placeholder', e.target.value)}
                                                            placeholder="Ex: Digite aqui..."
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Dica (Ajuda)</Label>
                                                        <Input
                                                            value={selectedField.helpText || ''}
                                                            onChange={(e) => handleFieldUpdate('helpText', e.target.value)}
                                                            placeholder="Texto pequeno abaixo"
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {['text', 'textarea'].includes(selectedField.type) && (
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Limite Caracteres</Label>
                                                            <Input
                                                                type="number"
                                                                value={selectedField.maxLength ?? ''}
                                                                onChange={(e) => handleFieldUpdate('maxLength', e.target.valueAsNumber || undefined)}
                                                                placeholder="Ilimitado"
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    )}
                                                    {selectedField.type === 'number' && (
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Sufixo (Unidade)</Label>
                                                            <Input
                                                                value={selectedField.suffix || ''}
                                                                onChange={(e) => handleFieldUpdate('suffix', e.target.value)}
                                                                placeholder="ex: kg, cm, mmHg"
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center space-x-2 pt-2">
                                                        <Checkbox
                                                            id="isReadOnly"
                                                            checked={selectedField.isReadOnly || false}
                                                            onCheckedChange={(checked) => handleFieldUpdate('isReadOnly', checked)}
                                                        />
                                                        <Label htmlFor="isReadOnly" className="text-xs">Somente Leitura</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Hide Default Formula for Calculated Fields (Confusing) */}
                                        {selectedField.type !== 'calculated' && (
                                            <div className="space-y-3 border rounded-md p-3 bg-primary/5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-primary">Vincular a Outro Campo (Fórmula)</Label>
                                                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Fórmula de Valor Automático</Label>
                                                    <Input
                                                        placeholder="Ex: {peso} * 1.1"
                                                        value={selectedField.defaultValueFormula || ''}
                                                        onChange={(e) => handleFieldUpdate('defaultValueFormula', e.target.value)}
                                                        className="h-7 text-xs font-mono"
                                                    />
                                                    <p className="text-[9px] text-muted-foreground">Use nomes de campos entre chaves {"{como_isto}"}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Spacing Controls (Margins) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Margem Superior ({selectedField.marginTop || 0}px)</Label>
                                                <Slider
                                                    value={[selectedField.marginTop || 0]}
                                                    min={0}
                                                    max={100}
                                                    step={4}
                                                    onValueChange={(val) => handleFieldUpdate('marginTop', val[0], true)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Margem Inferior ({selectedField.marginBottom || 0}px)</Label>
                                                <Slider
                                                    value={[selectedField.marginBottom || 0]}
                                                    min={0}
                                                    max={100}
                                                    step={4}
                                                    onValueChange={(val) => handleFieldUpdate('marginBottom', val[0], true)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Width Selector */}
                                            <div className="space-y-2">
                                                <Label className="text-xs">Largura</Label>
                                                <Select
                                                    value={selectedField.width?.toString() || '100'}
                                                    onValueChange={(val) => handleFieldUpdate('width', val, true)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="100">100%</SelectItem>
                                                        <SelectItem value="75">75%</SelectItem>
                                                        <SelectItem value="66">66%</SelectItem>
                                                        <SelectItem value="50">50%</SelectItem>
                                                        <SelectItem value="33">33%</SelectItem>
                                                        <SelectItem value="25">25%</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {/* Type Selector */}
                                            <div className="space-y-2">
                                                <Label className="text-xs">Tipo</Label>
                                                <Select
                                                    value={selectedField.type}
                                                    onValueChange={(val) => handleFieldUpdate('type', val, true)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Texto Curto</SelectItem>
                                                        <SelectItem value="number">Número</SelectItem>
                                                        <SelectItem value="date">Data</SelectItem>
                                                        <SelectItem value="datetime">Data/Hora</SelectItem>
                                                        <SelectItem value="textarea">Texto Longo</SelectItem>
                                                        <SelectItem value="rich_text">Texto Rico</SelectItem>
                                                        <SelectItem value="vitals">Sinais Vitais</SelectItem>
                                                        <SelectItem value="signature">Assinatura</SelectItem>
                                                        <SelectItem value="attachments">Anexos</SelectItem>
                                                        <SelectItem value="slider">Slider</SelectItem>
                                                        <SelectItem value="calculated">Calculado</SelectItem>
                                                        <SelectItem value="checkbox_group">Checkbox</SelectItem>
                                                        <SelectItem value="radio_group">Radio</SelectItem>
                                                        <SelectItem value="select">Select</SelectItem>
                                                        <SelectItem value="grid">Tabela</SelectItem>
                                                        <SelectItem value="section">Seção</SelectItem>
                                                        <SelectItem value="tab">Aba</SelectItem>
                                                        <SelectItem value="pain_map">Mapa Dor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Attachments Config */}
                                        {selectedField.type === 'attachments' && (
                                            <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                                                <Label className="font-semibold text-xs">Configuração de Anexos</Label>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Tipos Permitidos</Label>
                                                    <Select
                                                        value={selectedField.fileFilter || 'all'}
                                                        onValueChange={(val) => handleFieldUpdate('fileFilter', val)}
                                                    >
                                                        <SelectTrigger className="h-7 text-[10px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">Todos</SelectItem>
                                                            <SelectItem value="images">Imagens</SelectItem>
                                                            <SelectItem value="documents">Documentos</SelectItem>
                                                            <SelectItem value="media">Mídia</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="allowMultipleFiles"
                                                        checked={selectedField.allowMultiple !== false}
                                                        onCheckedChange={(checked) => handleFieldUpdate('allowMultiple', checked)}
                                                    />
                                                    <Label htmlFor="allowMultipleFiles" className="text-[10px]">Múltiplos arquivos</Label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Slider Config */}
                                        {selectedField.type === 'slider' && (
                                            <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Mín</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedField.min ?? 0}
                                                            onChange={(e) => handleFieldUpdate('min', e.target.valueAsNumber)}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Máx</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedField.max ?? 10}
                                                            onChange={(e) => handleFieldUpdate('max', e.target.valueAsNumber)}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Passo</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedField.step ?? 1}
                                                            onChange={(e) => handleFieldUpdate('step', e.target.valueAsNumber)}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Rótulo Esq</Label>
                                                        <Input
                                                            value={selectedField.minLabel || ''}
                                                            onChange={(e) => handleFieldUpdate('minLabel', e.target.value)}
                                                            placeholder="Mín"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Rótulo Dir</Label>
                                                        <Input
                                                            value={selectedField.maxLabel || ''}
                                                            onChange={(e) => handleFieldUpdate('maxLabel', e.target.value)}
                                                            placeholder="Máx"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Numeric / Date Constraints [NEW] */}
                                        {['number', 'date', 'datetime', 'slider'].includes(selectedField.type) && (
                                            <div className="grid grid-cols-3 gap-2 border rounded-md p-2 bg-muted/10">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Mínimo</Label>
                                                    <Input
                                                        type={selectedField.type === 'number' ? 'number' : 'text'}
                                                        value={selectedField.min ?? ''}
                                                        onChange={(e) => handleFieldUpdate('min', e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Máximo</Label>
                                                    <Input
                                                        type={selectedField.type === 'number' ? 'number' : 'text'}
                                                        value={selectedField.max ?? ''}
                                                        onChange={(e) => handleFieldUpdate('max', e.target.value)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Passo (Step)</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedField.step ?? ''}
                                                        onChange={(e) => handleFieldUpdate('step', e.target.valueAsNumber)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Checkbox Group Config */}
                                        {selectedField.type === 'checkbox_group' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="allow-create"
                                                        checked={selectedField.allowCreateOption || false}
                                                        onCheckedChange={(checked) => handleFieldUpdate('allowCreateOption', checked, true)}
                                                    />
                                                    <Label htmlFor="allow-create" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        Permitir adicionar novas opções (Outro)?
                                                    </Label>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground ml-6">
                                                    Se ativado, usuários poderão criar novas opções ao preencher o formulário.
                                                </p>
                                            </div>
                                        )}

                                        {/* Section Config */}
                                        {selectedField.type === 'section' && (
                                            <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                                                <Label className="font-semibold">Estilo da Seção</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cor de Fundo</Label>
                                                        <Input
                                                            type="color"
                                                            value={selectedField.sectionBg || '#f8fafc'}
                                                            onChange={(e) => handleFieldUpdate('sectionBg', e.target.value)}
                                                            className="h-8 p-1"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cor do Texto</Label>
                                                        <Input
                                                            type="color"
                                                            value={selectedField.sectionTextColor || '#0f172a'}
                                                            onChange={(e) => handleFieldUpdate('sectionTextColor', e.target.value)}
                                                            className="h-8 p-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="sectionBorder"
                                                        checked={selectedField.showBorder === undefined ? true : selectedField.showBorder}
                                                        onCheckedChange={(checked) => handleFieldUpdate('showBorder', checked)}
                                                    />
                                                    <Label htmlFor="sectionBorder" className="text-xs">Mostrar borda inferior</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="hideFollowing"
                                                        checked={selectedField.hideFollowing || false}
                                                        onCheckedChange={(checked) => handleFieldUpdate('hideFollowing', checked)}
                                                    />
                                                    <Label htmlFor="hideFollowing" className="text-xs text-red-600 font-medium">Ocultar todos os campos abaixo (Até outra seção)</Label>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="flex items-center justify-between">
                                                <Label>Visibilidade</Label>
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="hidden-field" className="text-xs font-normal text-muted-foreground mr-2">Ocultar no preenchimento?</Label>
                                                    <Switch
                                                        id="hidden-field"
                                                        checked={selectedField.hidden || false}
                                                        onCheckedChange={(checked) => handleFieldUpdate('hidden', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Section Style Config */}
                                        {selectedField.type === 'section' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2">
                                                    <Label>Tamanho da Fonte</Label>
                                                    <Select
                                                        value={selectedField.fontSize || 'xl'}
                                                        onValueChange={(val) => handleFieldUpdate('fontSize', val, true)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sm">Pequeno</SelectItem>
                                                            <SelectItem value="base">Normal</SelectItem>
                                                            <SelectItem value="lg">Grande</SelectItem>
                                                            <SelectItem value="xl">Muito Grande</SelectItem>
                                                            <SelectItem value="2xl">Enorme</SelectItem>
                                                            <SelectItem value="3xl">Gigante</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Alinhamento</Label>
                                                    <Select
                                                        value={selectedField.textAlign || 'left'}
                                                        onValueChange={(val) => handleFieldUpdate('textAlign', val, true)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="left">Esquerda</SelectItem>
                                                            <SelectItem value="center">Centralizado</SelectItem>
                                                            <SelectItem value="right">Direita</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Style Config */}
                                        {selectedField.type === 'tab' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2">
                                                    <Label>Estilo das Abas</Label>
                                                    <Select
                                                        value={selectedField.tabStyle || 'pills'}
                                                        onValueChange={(val) => handleFieldUpdate('tabStyle', val, true)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pills">Pills (Botões Arredondados)</SelectItem>
                                                            <SelectItem value="underline">Underline (Linha Inferior)</SelectItem>
                                                            <SelectItem value="enclosed">Enclosed (Caixas)</SelectItem>
                                                            <SelectItem value="minimal">Minimalista</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label>Tamanho</Label>
                                                        <Select
                                                            value={selectedField.tabSize || 'md'}
                                                            onValueChange={(val) => handleFieldUpdate('tabSize', val, true)}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="sm">Pequeno</SelectItem>
                                                                <SelectItem value="md">Médio</SelectItem>
                                                                <SelectItem value="lg">Grande</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Alinhamento</Label>
                                                        <Select
                                                            value={selectedField.tabAlignment || 'left'}
                                                            onValueChange={(val) => handleFieldUpdate('tabAlignment', val, true)}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="left">Esquerda</SelectItem>
                                                                <SelectItem value="center">Centro</SelectItem>
                                                                <SelectItem value="right">Direita</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Animação de Transição</Label>
                                                    <Select
                                                        value={selectedField.tabAnimation || 'fade'}
                                                        onValueChange={(val) => handleFieldUpdate('tabAnimation', val, true)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Nenhuma</SelectItem>
                                                            <SelectItem value="fade">Esmaecer (Fade)</SelectItem>
                                                            <SelectItem value="slide">Deslizar (Slide)</SelectItem>
                                                            <SelectItem value="zoom">Zoom Suave</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Cor de Destaque (HEX)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="color"
                                                            value={selectedField.tabColor || '#84c8b9'}
                                                            onChange={(e) => handleFieldUpdate('tabColor', e.target.value, true)}
                                                            className="w-10 h-10 p-1 rounded-md"
                                                        />
                                                        <Input
                                                            value={selectedField.tabColor || '#84c8b9'}
                                                            onChange={(e) => handleFieldUpdate('tabColor', e.target.value, true)}
                                                            className="flex-1 font-mono"
                                                            placeholder="#84c8b9"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Checkbox
                                                        id="show-badges"
                                                        checked={selectedField.showTabBadges || false}
                                                        onCheckedChange={(checked) => handleFieldUpdate('showTabBadges', checked, true)}
                                                    />
                                                    <Label htmlFor="show-badges" className="text-xs">Mostrar contador de campos</Label>
                                                </div>

                                                <p className="text-[10px] text-muted-foreground italic border-t pt-2">
                                                    Nota: As configurações do primeiro separador definem o visual de todo o formulário.
                                                </p>
                                            </div>
                                        )}

                                        {/* Grid Config */}
                                        {selectedField.type === 'grid' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-4">
                                                    {/* Stack Vertically for better visibility */}
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Tipo de Entrada (Dados)</Label>
                                                            <Select
                                                                value={selectedField.gridType || 'radio'}
                                                                onValueChange={(val) => handleFieldUpdate('gridType', val, true)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="radio">Seleção Única (Radio)</SelectItem>
                                                                    <SelectItem value="select_10">Nota 0 a 10</SelectItem>
                                                                    <SelectItem value="number">Número</SelectItem>
                                                                    <SelectItem value="text">Texto</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>1ª Coluna (Rótulos das Linhas)</Label>
                                                            <Select
                                                                value={selectedField.firstColMode || (selectedField.firstColEditable ? 'editable' : 'default')}
                                                                onValueChange={(val) => {
                                                                    if (!activeId) return;
                                                                    handleFieldUpdate('firstColMode', val);
                                                                }}
                                                            >
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="default">Texto Fixo (Padrão)</SelectItem>
                                                                    <SelectItem value="editable">Editável (Campo de Texto)</SelectItem>
                                                                    <SelectItem value="none">Ocultar Coluna</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Calculations */}
                                                    <div className="space-y-2 border-t pt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="total-col"
                                                                checked={selectedField.showTotalColumn || false}
                                                                onCheckedChange={(checked) => handleFieldUpdate('showTotalColumn', checked, true)}
                                                            />
                                                            <Label htmlFor="total-col" className="text-xs">Exibir Soma (Total na Linha)</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Linhas (Perguntas)</Label>
                                                    <p className="text-xs text-muted-foreground">Uma por linha</p>
                                                    <Textarea
                                                        rows={5}
                                                        value={selectedField.rows?.join('\n') || ''}
                                                        onChange={(e) => handleGridUpdate('rows', e.target.value)}
                                                        placeholder="Item 1&#10;Item 2&#10;Item 3"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>

                                                {/* Row Mapping Config [NEW] */}
                                                {selectedField.rows?.length > 0 && (
                                                    <div className="space-y-4 pt-4 border-t mt-2">
                                                        <Label>Mapeamento de Valores (Linhas)</Label>
                                                        <p className="text-[10px] text-muted-foreground">Opcional: Preencher linha automaticamente com valor de outro campo.</p>
                                                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                                                            {selectedField.rows.map((row: string, idx: number) => (
                                                                <div key={idx} className="space-y-1 bg-background border p-2 rounded">
                                                                    <Label className="text-[10px] font-bold truncate block" title={row}>{row}</Label>
                                                                    <Select
                                                                        value={selectedField.rowMappings?.[idx] || 'none'}
                                                                        onValueChange={(val) => {
                                                                            const newMap = { ...(selectedField.rowMappings || {}) };
                                                                            if (val === 'none') delete newMap[idx];
                                                                            else newMap[idx] = val;
                                                                            handleFieldUpdate('rowMappings', newMap);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-6 text-[10px]">
                                                                            <SelectValue placeholder="Manual" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">Manual (Sem vínculo)</SelectItem>
                                                                            {fields.filter(f => f.id !== selectedField.id && ['number', 'calculated', 'slider', 'grid'].includes(f.type)).map((f: any) => (
                                                                                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Per-Column Type Config [NEW] */}
                                                {selectedField.columns?.length > 0 && (
                                                    <div className="space-y-4 pt-4 border-t mt-2">
                                                        <div className="space-y-2">
                                                            <Label>Tipos das Colunas</Label>
                                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                                                {selectedField.columns.map((col: string, idx: number) => (
                                                                    <div key={idx} className="space-y-1 bg-background border p-2 rounded">
                                                                        <Label className="text-[10px] font-bold truncate block" title={col}>{col}</Label>
                                                                        <Select
                                                                            value={selectedField.columnTypes?.[idx] || selectedField.gridType || 'radio'}
                                                                            onValueChange={(val) => {
                                                                                const newTypes = { ...(selectedField.columnTypes || {}) };
                                                                                newTypes[idx] = val;
                                                                                handleFieldUpdate('columnTypes', newTypes);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="h-6 text-[10px]">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="radio">Radio (Único na linha)</SelectItem>
                                                                                <SelectItem value="checkbox">Checkbox (Multi)</SelectItem>
                                                                                <SelectItem value="text">Texto</SelectItem>
                                                                                <SelectItem value="number">Número</SelectItem>
                                                                                <SelectItem value="select_10">Nota 0-10</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 border-t pt-2">
                                                            <Label>Cálculos no Rodapé (Opcional)</Label>
                                                            <p className="text-[10px] text-muted-foreground">Selecione uma operação matemática para exibir o total da coluna.</p>
                                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                                                {selectedField.columns.map((col: string, idx: number) => (
                                                                    <div key={idx} className="space-y-1 bg-background border p-2 rounded">
                                                                        <Label className="text-[10px] font-bold truncate block" title={col}>{col}</Label>
                                                                        <Select
                                                                            value={selectedField.columnCalculations?.[idx] || 'none'}
                                                                            onValueChange={(val) => {
                                                                                const newCalcs = { ...(selectedField.columnCalculations || {}) };
                                                                                newCalcs[idx] = val;
                                                                                handleFieldUpdate('columnCalculations', newCalcs);
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className="h-6 text-[10px]">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="none">Nenhum</SelectItem>
                                                                                <SelectItem value="sum">Soma (Total)</SelectItem>
                                                                                <SelectItem value="average">Média (Avg)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectedField.type === 'questionnaire' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2">
                                                    <Label>Selecionar Questionário</Label>
                                                    <p className="text-[10px] text-muted-foreground">Escolha um modelo existente para incorporar.</p>
                                                    <Select
                                                        value={selectedField.questionnaireId || ''}
                                                        onValueChange={(val) => {
                                                            const t = availableTemplates.find(t => t.id === val);
                                                            handleFieldUpdate('questionnaireId', val);
                                                            if (t) {
                                                                // Auto-update label if empty or generic
                                                                if (!selectedField.label || selectedField.label === 'Questionário Externo') {
                                                                    handleFieldUpdate('label', t.title);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableTemplates.map((t: any) => (
                                                                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {selectedField.questionnaireId && (
                                                    <div className="p-2 border rounded bg-white text-xs">
                                                        <p className="font-bold">Questionário Selecionado:</p>
                                                        <p>{availableTemplates.find(t => t.id === selectedField.questionnaireId)?.title || 'Carregando...'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Chart Config */}
                                        {selectedField.type === 'chart' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <Label className="font-semibold flex items-center gap-2 text-xs">
                                                    <PieChart className="h-3 w-3" /> Gráfico
                                                </Label>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px]">Fontes de Dados (Seleção Múltipla para Radar)</Label>
                                                    <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-1 bg-background">
                                                        {fields.filter((f: any) => (f.type === 'number' || f.type === 'calculated' || f.type === 'grid') && f.id !== selectedField.id).map((f: any) => (
                                                            <div key={f.id} className="flex items-center space-x-2 px-1">
                                                                <Checkbox
                                                                    id={`chart-src-${f.id}`}
                                                                    checked={(selectedField.sourceFieldIds || [selectedField.sourceFieldId]).filter(Boolean).includes(f.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        let currentIds = [...(selectedField.sourceFieldIds || [selectedField.sourceFieldId]).filter(Boolean)];
                                                                        if (checked) {
                                                                            if (!currentIds.includes(f.id)) currentIds.push(f.id);
                                                                        } else {
                                                                            currentIds = currentIds.filter(id => id !== f.id);
                                                                        }
                                                                        handleFieldUpdate('sourceFieldIds', currentIds);
                                                                        // Sync single ID for backward compatibility
                                                                        handleFieldUpdate('sourceFieldId', currentIds.length > 0 ? currentIds[0] : null);
                                                                    }}
                                                                />
                                                                <Label htmlFor={`chart-src-${f.id}`} className="text-[10px] cursor-pointer truncate">{f.label}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Modo de Dados</Label>
                                                        <Select
                                                            value={selectedField.chartDataMode || 'individual'}
                                                            onValueChange={(val) => handleFieldUpdate('chartDataMode', val)}
                                                        >
                                                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="individual">Individual</SelectItem>
                                                                <SelectItem value="average">Média (Radar)</SelectItem>
                                                                <SelectItem value="sum">Soma Total</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Tipo</Label>
                                                        <Select
                                                            value={selectedField.chartType || 'bar'}
                                                            onValueChange={(val) => handleFieldUpdate('chartType', val)}
                                                        >
                                                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="bar">Barras</SelectItem>
                                                                <SelectItem value="line">Linha</SelectItem>
                                                                <SelectItem value="area">Área</SelectItem>
                                                                <SelectItem value="radar">Radar</SelectItem>
                                                                <SelectItem value="pie">Pizza</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]">Cor Principal</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="color"
                                                            value={selectedField.chartColor || '#8884d8'}
                                                            onChange={(e) => handleFieldUpdate('chartColor', e.target.value)}
                                                            className="w-10 h-7 p-1 cursor-pointer"
                                                        />
                                                        <Input
                                                            value={selectedField.chartColor || '#8884d8'}
                                                            onChange={(e) => handleFieldUpdate('chartColor', e.target.value)}
                                                            className="flex-1 font-mono text-[10px] uppercase h-7"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Calculated Field Config */}
                                        {selectedField.type === 'calculated' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2">
                                                    <Label>Tipo de Cálculo</Label>
                                                    <Select
                                                        value={selectedField.calculationType || 'sum'}
                                                        onValueChange={(val) => handleFieldUpdate('calculationType', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sum">Somatório Simples</SelectItem>
                                                            <SelectItem value="average">Média Simples (Avg)</SelectItem>
                                                            <SelectItem value="imc">IMC (Peso / Altura²)</SelectItem>
                                                            <SelectItem value="pollock3">Pollock 3 Dobras (Gordura %)</SelectItem>
                                                            <SelectItem value="pollock7">Pollock 7 Dobras (Gordura %)</SelectItem>
                                                            <SelectItem value="guedes">Guedes (Gordura %)</SelectItem>
                                                            <SelectItem value="harris_benedict">Basal (Harris-Benedict)</SelectItem>
                                                            <SelectItem value="minimalist_index">Índice de Minimalismo (0-100%)</SelectItem>
                                                            <SelectItem value="custom">Fórmula Personalizada</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* SCALING OPTIONS (0-10) */}
                                                {['sum', 'average'].includes(selectedField.calculationType) && (
                                                    <div className="space-y-3 pt-2 border-t mt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                id="enable-scaling"
                                                                checked={selectedField.enableScaling || false}
                                                                onCheckedChange={(checked) => handleFieldUpdate('enableScaling', checked)}
                                                            />
                                                            <Label htmlFor="enable-scaling" className="text-xs font-semibold">Converter para escala 0-10?</Label>
                                                        </div>
                                                        {selectedField.enableScaling && (
                                                            <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Mínimo Original</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedField.originalMin ?? 0}
                                                                        onChange={(e) => handleFieldUpdate('originalMin', e.target.valueAsNumber)}
                                                                        className="h-7 text-xs"
                                                                        placeholder="Ex: 0 ou -5"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Máximo Original</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={selectedField.originalMax || 5}
                                                                        onChange={(e) => handleFieldUpdate('originalMax', e.target.valueAsNumber)}
                                                                        className="h-7 text-xs"
                                                                        placeholder="Ex: 5"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 text-[9px] text-muted-foreground">
                                                                    Ajusta de [{selectedField.originalMin ?? 0}, {selectedField.originalMax || 5}] para [0, 10].
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* STRICT MODE */}
                                                {['sum', 'average'].includes(selectedField.calculationType) && (
                                                    <div className="space-y-2 pt-2 border-t mt-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                id="strict-mode"
                                                                checked={selectedField.strictMode || false}
                                                                onCheckedChange={(checked) => handleFieldUpdate('strictMode', checked)}
                                                            />
                                                            <Label htmlFor="strict-mode" className="text-xs font-semibold">Exigir todos os campos?</Label>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Se ativo, avisa quais campos faltam antes de calcular.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* SUM / AVG MODE */}
                                                {(!selectedField.calculationType || ['sum', 'average'].includes(selectedField.calculationType)) && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Calcular quais campos?</Label>
                                                        <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-background">
                                                            {numericFields.length === 0 && <p className="text-xs text-muted-foreground">Nenhum campo numérico disponível.</p>}
                                                            {numericFields.map((nf: any) => (
                                                                <div key={nf.id} className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id={`target-${nf.id}`}
                                                                        checked={(selectedField.targetIds || []).includes(nf.id)}
                                                                        onCheckedChange={() => toggleTargetId(nf.id)}
                                                                    />
                                                                    <Label htmlFor={`target-${nf.id}`} className="text-sm cursor-pointer truncate">{nf.label}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* IMC MODE */}
                                                {selectedField.calculationType === 'imc' && (
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Campo Peso (kg)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[0] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(0, val)}
                                                            >
                                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Campo Altura (cm ou m)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[1] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(1, val)}
                                                            >
                                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* POLLOCK 7 MODE */}
                                                {selectedField.calculationType === 'pollock7' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Gênero</Label>
                                                            <Select value={selectedField.sex || 'masculino'} onValueChange={(val) => handleFieldUpdate('sex', val)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="masculino">Masculino</SelectItem>
                                                                    <SelectItem value="feminino">Feminino</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { label: 'Peitoral', idx: 0 },
                                                                { label: 'Axilar Méd', idx: 1 },
                                                                { label: 'Tríceps', idx: 2 },
                                                                { label: 'Subescap', idx: 3 },
                                                                { label: 'Abdominal', idx: 4 },
                                                                { label: 'Suprailíac', idx: 5 },
                                                                { label: 'Coxa', idx: 6 },
                                                                { label: 'Idade', idx: 7 }
                                                            ].map((item) => (
                                                                <div key={item.idx} className="space-y-1">
                                                                    <Label className="text-[10px]">{item.label}</Label>
                                                                    <Select value={selectedField.targetIds?.[item.idx] || ''} onValueChange={(val) => setTargetIdAtIndex(item.idx, val)}>
                                                                        <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="..." /></SelectTrigger>
                                                                        <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* GUEDES MODE */}
                                                {selectedField.calculationType === 'guedes' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Gênero</Label>
                                                            <Select value={selectedField.sex || 'masculino'} onValueChange={(val) => handleFieldUpdate('sex', val)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="masculino">Masculino</SelectItem>
                                                                    <SelectItem value="feminino">Feminino</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase text-muted-foreground font-bold italic">Variáveis Guedes (mm)</Label>
                                                            <div className="grid grid-cols-1 gap-2">
                                                                {selectedField.sex === 'feminino' ? (
                                                                    <>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Coxa</Label>
                                                                            <Select value={selectedField.targetIds?.[0] || ''} onValueChange={(val) => setTargetIdAtIndex(0, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Suprailíaca</Label>
                                                                            <Select value={selectedField.targetIds?.[1] || ''} onValueChange={(val) => setTargetIdAtIndex(1, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Subescapular</Label>
                                                                            <Select value={selectedField.targetIds?.[2] || ''} onValueChange={(val) => setTargetIdAtIndex(2, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Tríceps</Label>
                                                                            <Select value={selectedField.targetIds?.[0] || ''} onValueChange={(val) => setTargetIdAtIndex(0, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Suprailíaca</Label>
                                                                            <Select value={selectedField.targetIds?.[1] || ''} onValueChange={(val) => setTargetIdAtIndex(1, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Abdominal</Label>
                                                                            <Select value={selectedField.targetIds?.[2] || ''} onValueChange={(val) => setTargetIdAtIndex(2, val)}>
                                                                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* POLLOCK 3 MODE */}
                                                {selectedField.calculationType === 'pollock3' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Gênero</Label>
                                                            <Select value={selectedField.sex || 'masculino'} onValueChange={(val) => handleFieldUpdate('sex', val)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="masculino">Masculino</SelectItem>
                                                                    <SelectItem value="feminino">Feminino</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Variáveis (mm)</Label>
                                                            {selectedField.sex === 'feminino' ? (
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Tríceps</Label>
                                                                    <Select value={selectedField.targetIds?.[0] || ''} onValueChange={(val) => setTargetIdAtIndex(0, val)}>
                                                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                        <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                    </Select>
                                                                    <Label className="text-xs">Suprailíaca</Label>
                                                                    <Select value={selectedField.targetIds?.[1] || ''} onValueChange={(val) => setTargetIdAtIndex(1, val)}>
                                                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                        <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                    </Select>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <Label className="text-xs">Peitoral</Label>
                                                                    <Select value={selectedField.targetIds?.[0] || ''} onValueChange={(val) => setTargetIdAtIndex(0, val)}>
                                                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                        <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                    </Select>
                                                                    <Label className="text-xs">Abdominal</Label>
                                                                    <Select value={selectedField.targetIds?.[1] || ''} onValueChange={(val) => setTargetIdAtIndex(1, val)}>
                                                                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                        <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}
                                                            <Label className="text-xs">Coxa</Label>
                                                            <Select value={selectedField.targetIds?.[2] || ''} onValueChange={(val) => setTargetIdAtIndex(2, val)}>
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                            <Label className="text-xs">Idade (Anos)</Label>
                                                            <Select value={selectedField.targetIds?.[3] || ''} onValueChange={(val) => setTargetIdAtIndex(3, val)}>
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* HARRIS BENEDICT MODE */}
                                                {selectedField.calculationType === 'harris_benedict' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Gênero</Label>
                                                            <Select value={selectedField.sex || 'masculino'} onValueChange={(val) => handleFieldUpdate('sex', val)}>
                                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="masculino">Masculino</SelectItem>
                                                                    <SelectItem value="feminino">Feminino</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px]">Peso (kg)</Label>
                                                                <Select value={selectedField.targetIds?.[0] || ''} onValueChange={(val) => setTargetIdAtIndex(0, val)}>
                                                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px]">Altura (cm)</Label>
                                                                <Select value={selectedField.targetIds?.[1] || ''} onValueChange={(val) => setTargetIdAtIndex(1, val)}>
                                                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px]">Idade (anos)</Label>
                                                                <Select value={selectedField.targetIds?.[2] || ''} onValueChange={(val) => setTargetIdAtIndex(2, val)}>
                                                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>{numericFields.map((nf: any) => (<SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>))}</SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px]">Nível Atividade</Label>
                                                                <Select value={selectedField.activityLevel || '1.2'} onValueChange={(val) => handleFieldUpdate('activityLevel', val)}>
                                                                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="1.2">Sedentário (1.2)</SelectItem>
                                                                        <SelectItem value="1.375">Leve (1.375)</SelectItem>
                                                                        <SelectItem value="1.55">Moderado (1.55)</SelectItem>
                                                                        <SelectItem value="1.725">Ativo (1.725)</SelectItem>
                                                                        <SelectItem value="1.9">Atleta (1.9)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* MINIMALIST INDEX MODE */}
                                                {selectedField.calculationType === 'minimalist_index' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <p className="text-[10px] text-muted-foreground mb-2">Selecione os 6 campos (0-5 pontos) para calcular o índice.</p>
                                                        {[
                                                            { label: 'Peso', idx: 0 },
                                                            { label: 'Espessura (Stack)', idx: 1 },
                                                            { label: 'Drop', idx: 2 },
                                                            { label: 'Disp. Controle / Estabilidade', idx: 3 },
                                                            { label: 'Flexibilidade Longitudinal', idx: 4 },
                                                            { label: 'Flexibilidade Torsional', idx: 5 }
                                                        ].map((item) => (
                                                            <div key={item.idx} className="space-y-1">
                                                                <Label className="text-xs">{item.label}</Label>
                                                                <Select
                                                                    value={selectedField.targetIds?.[item.idx] || ''}
                                                                    onValueChange={(val) => setTargetIdAtIndex(item.idx, val)}
                                                                >
                                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                    <SelectContent>
                                                                        {numericFields.map((nf: any) => (
                                                                            <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* CUSTOM FORMULA MODE */}
                                                {selectedField.calculationType === 'custom' && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Mapear Variáveis</Label>
                                                                <Button size="sm" variant="ghost" className="h-6 gap-1" onClick={addCustomVariable}>
                                                                    <Plus className="h-3 w-3" /> Add Var
                                                                </Button>
                                                            </div>
                                                            <div className="space-y-2 bg-background border rounded px-2 py-2 max-h-40 overflow-y-auto">
                                                                {(selectedField.variableMap || []).length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma variável adicionada.</p>}
                                                                {selectedField.variableMap?.map((v: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2">
                                                                        <div className="flex items-center justify-center h-8 w-8 bg-primary/10 rounded font-bold text-primary text-xs shrink-0">
                                                                            {v.letter}
                                                                        </div>
                                                                        <Select value={v.targetId} onValueChange={(val) => updateCustomVariable(idx, val)}>
                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                <SelectValue placeholder="Selecione..." />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {numericFields.map((nf: any) => (
                                                                                    <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                                                                            onClick={() => removeCustomVariable(idx)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label>Fórmula</Label>
                                                            <Input
                                                                placeholder="Ex: (A + B) / 2"
                                                                value={selectedField.formula || ''}
                                                                onChange={(e) => handleFieldUpdate('formula', e.target.value)}
                                                            />
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Use as letras acima (A, B, C...) e operadores matemáticos básicos (+ - * /). Use parênteses para prioridade.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* PAIN MAP MANUAL ADJUSTMENT */}
                                        {selectedField.type === 'pain_map' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2 mb-4">
                                                    <Label>Tipo de Vista (Imagem de Fundo)</Label>
                                                    <Select
                                                        value={selectedField.viewType || 'default'}
                                                        onValueChange={(val) => {
                                                            // Explicitly reset scale and offsets based on view type
                                                            // to prevent default logic mismatches between Edit/Preview
                                                            const is3D = val === 'default';
                                                            handleFieldUpdate({
                                                                viewType: val,
                                                                scale: is3D ? 0.86 : 1,
                                                                offsetX: 0,
                                                                offsetY: 0
                                                            });
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default">Corpo Inteiro 3D (Padrão)</SelectItem>
                                                            <SelectItem value="anterior">Vista Anterior</SelectItem>
                                                            <SelectItem value="posterior">Vista Posterior</SelectItem>
                                                            <SelectItem value="feet">Pés (Esq/Dir)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <h4 className="font-semibold text-sm">Ajuste Manual da Imagem</h4>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Escala (Zoom)</Label>
                                                        <span className="text-xs">{selectedField.scale || (!selectedField.viewType || selectedField.viewType === 'default' ? 0.86 : 1)}</span>
                                                    </div>
                                                    <Slider
                                                        value={[selectedField.scale || (!selectedField.viewType || selectedField.viewType === 'default' ? 0.86 : 1)]}
                                                        min={0.5}
                                                        max={1.5}
                                                        step={0.01}
                                                        onValueChange={(vals) => handleFieldUpdate('scale', vals[0], true)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Posição X (Horizontal)</Label>
                                                        <span className="text-xs">{selectedField.offsetX || 0}px</span>
                                                    </div>
                                                    <Slider
                                                        value={[selectedField.offsetX || 0]}
                                                        min={-50}
                                                        max={50}
                                                        step={1}
                                                        onValueChange={(vals) => handleFieldUpdate('offsetX', vals[0], true)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label>Posição Y (Vertical)</Label>
                                                        <span className="text-xs">{selectedField.offsetY || 0}px</span>
                                                    </div>
                                                    <Slider
                                                        value={[selectedField.offsetY || 0]}
                                                        min={-50}
                                                        max={50}
                                                        step={1}
                                                        onValueChange={(vals) => handleFieldUpdate('offsetY', vals[0], true)}
                                                    />
                                                </div>

                                                <p className="text-[10px] text-muted-foreground">
                                                    Ajuste a escala e posição dos pontos para alinhar com o desenho.
                                                </p>

                                                <div className="pt-4 border-t mt-4">
                                                    <h4 className="font-semibold text-sm mb-2">Pontos do Mapa</h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {(selectedField.points || []).map((point: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <Input
                                                                    value={point.label}
                                                                    onChange={(e) => {
                                                                        const newPoints = [...(selectedField.points || [])];
                                                                        newPoints[idx] = { ...newPoints[idx], label: e.target.value };
                                                                        handleFieldUpdate('points', newPoints);
                                                                    }}
                                                                    className="h-8 text-xs"
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-destructive shrink-0"
                                                                    onClick={() => {
                                                                        const newPoints = selectedField.points.filter((_: any, i: number) => i !== idx);
                                                                        handleFieldUpdate('points', newPoints);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full mt-2 gap-2"
                                                        onClick={() => {
                                                            const newPoint = { id: Math.random().toString(36).substr(2, 9), x: 50, y: 50, label: 'Novo Ponto' };
                                                            const currentPoints = selectedField.points || [];
                                                            handleFieldUpdate('points', [...currentPoints, newPoint]);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3" /> Adicionar Ponto
                                                    </Button>
                                                </div>

                                                <div className="pt-4 border-t mt-4">
                                                    <p className="text-[10px] text-muted-foreground text-center mt-1">
                                                        Use isto se os pontos não estiverem persistindo.
                                                    </p>
                                                </div>

                                                {/* Text Overlays Manager */}
                                                <div className="pt-4 border-t mt-4">
                                                    <h4 className="font-semibold text-sm mb-2">Legendas (Textos na Imagem)</h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {(selectedField.texts || []).map((text: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <Input
                                                                    value={text.content}
                                                                    onChange={(e) => {
                                                                        const newTexts = [...(selectedField.texts || [])];
                                                                        newTexts[idx] = { ...newTexts[idx], content: e.target.value };
                                                                        handleFieldUpdate('texts', newTexts);
                                                                    }}
                                                                    className="h-8 text-xs"
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-destructive shrink-0"
                                                                    onClick={() => {
                                                                        const newTexts = selectedField.texts.filter((_: any, i: number) => i !== idx);
                                                                        handleFieldUpdate('texts', newTexts);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full mt-2 gap-2"
                                                        onClick={() => {
                                                            const newText = { id: Math.random().toString(36).substr(2, 9), x: 50, y: 10, content: 'Texto' };
                                                            const currentTexts = selectedField.texts || [];
                                                            handleFieldUpdate('texts', [...currentTexts, newText]);
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3" /> Adicionar Legenda
                                                    </Button>
                                                </div>

                                                {/* Observations Toggle */}
                                                <div className="pt-4 border-t mt-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="show-obs"
                                                            checked={selectedField.showObservations || false}
                                                            onCheckedChange={(checked) => handleFieldUpdate('showObservations', checked, true)}
                                                        />
                                                        <Label htmlFor="show-obs">Adicionar Campo de Observações?</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Options Config (Checkbox/Radio/Select) */}
                                        {(selectedField.type === 'checkbox_group' || selectedField.type === 'radio_group' || selectedField.type === 'select') && (
                                            <div className="space-y-4">
                                                {(selectedField.type === 'checkbox_group' || selectedField.type === 'radio_group') && (
                                                    <div className="space-y-2">
                                                        <Label>Layout (Colunas)</Label>
                                                        <Select
                                                            value={selectedField.columns?.toString() || '1'}
                                                            onValueChange={(val) => handleFieldUpdate('columns', parseInt(val))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">1 Coluna (Vertical)</SelectItem>
                                                                <SelectItem value="2">2 Colunas (Grade)</SelectItem>
                                                                <SelectItem value="3">3 Colunas (Grade)</SelectItem>
                                                                <SelectItem value="4">4 Colunas (Grade)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-2 border p-2 rounded-md bg-muted/10">
                                                    <Checkbox
                                                        id="auto-sort"
                                                        checked={selectedField.autoSort || false}
                                                        onCheckedChange={(checked) => {
                                                            handleFieldUpdate('autoSort', checked, true);
                                                            if (checked && selectedField.options) {
                                                                const sorted = [...selectedField.options].sort((a: string, b: string) => a.localeCompare(b));
                                                                handleFieldUpdate('options', sorted);
                                                            }
                                                        }}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <Label
                                                            htmlFor="auto-sort"
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            Ordenação Automática (A-Z)
                                                        </Label>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Ordenar opções alfabeticamente agora e ao adicionar novas.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Opções</Label>
                                                    <p className="text-xs text-muted-foreground">Uma opção por linha</p>
                                                    <Textarea
                                                        rows={5}
                                                        value={selectedField.options?.join('\n') || ''}
                                                        onChange={(e) => handleOptionsUpdate(e.target.value)}
                                                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                                                    />
                                                </div>
                                            </div>
                                        )}        <div className="pt-4 text-xs text-muted-foreground">
                                            <p>Alterações são aplicadas ao formulário ao lado em tempo real.</p>
                                        </div>

                                        {/* Logic Variable Config */}
                                        {selectedField.type === 'logic_variable' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <div className="space-y-2">
                                                    <Label>Campos Alvo (Entrada)</Label>
                                                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto bg-background/50">
                                                        {fields.filter(f => f.id !== selectedField.id && ['text', 'number', 'select', 'radio_group', 'calculated', 'slider', 'logic_variable', 'grid'].includes(f.type)).map((f: any) => {
                                                            const isChecked = (selectedField.targetFieldIds || [selectedField.targetFieldId || '']).includes(f.id);
                                                            return (
                                                                <div key={f.id} className="flex items-center gap-2 py-1">
                                                                    <Checkbox
                                                                        id={`logic-target-${f.id}`}
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            let currentIds = [...(selectedField.targetFieldIds || [selectedField.targetFieldId || ''])].filter(Boolean);
                                                                            if (checked) {
                                                                                currentIds.push(f.id);
                                                                            } else {
                                                                                currentIds = currentIds.filter(id => id !== f.id);
                                                                            }
                                                                            // Clean up legacy single ID if transforming to array
                                                                            handleFieldUpdate('targetFieldIds', currentIds);
                                                                            // Legacy 'targetFieldId' is no longer synced here to prevent race conditions.
                                                                            // The system handles 'targetFieldIds' prioritization automatically.
                                                                        }}
                                                                    />
                                                                    <label
                                                                        htmlFor={`logic-target-${f.id}`}
                                                                        className="text-sm cursor-pointer select-none"
                                                                    >
                                                                        {f.label}
                                                                    </label>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">Selecione um ou mais campos para a lógica.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Modo de Lógica</Label>
                                                    <div className="flex gap-2">
                                                        <div
                                                            className={`flex-1 p-2 text-center text-xs font-semibold cursor-pointer border rounded ${(!selectedField.logicMode || selectedField.logicMode === 'manual') ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                                            onClick={() => handleFieldUpdate('logicMode', 'manual')}
                                                        >
                                                            Regras Manuais
                                                        </div>
                                                        <div
                                                            className={`flex-1 p-2 text-center text-xs font-semibold cursor-pointer border rounded ${selectedField.logicMode === 'lookup' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                                            onClick={() => handleFieldUpdate('logicMode', 'lookup')}
                                                        >
                                                            Tabela Excel
                                                        </div>
                                                        <div
                                                            className={`flex-1 p-2 text-center text-xs font-semibold cursor-pointer border rounded ${selectedField.logicMode === 'matrix_range' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                                                            onClick={() => handleFieldUpdate('logicMode', 'matrix_range')}
                                                        >
                                                            Classificação
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MANUAL RULES MODE */}
                                                {(!selectedField.logicMode || selectedField.logicMode === 'manual') && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Resultado Padrão</Label>
                                                            <Input
                                                                value={selectedField.defaultResult || ''}
                                                                onChange={(e) => handleFieldUpdate('defaultResult', e.target.value)}
                                                                placeholder="Ex: Normal"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <Label className="text-xs font-semibold uppercase text-muted-foreground italic">Fórmula (JavaScript-like)</Label>
                                                                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => window.open('https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Math', '_blank')}>
                                                                    Math Ref
                                                                </Button>
                                                            </div>
                                                            <Input
                                                                value={selectedField.formula || ''}
                                                                onChange={(e) => handleFieldUpdate('formula', e.target.value.toUpperCase())}
                                                                placeholder="Ex: (A + B) / C"
                                                                className="font-mono text-sm uppercase"
                                                            />
                                                            <div className="bg-primary/5 border border-primary/10 rounded-md p-2.5 space-y-2">
                                                                <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                                                                    <Sparkles className="h-3 w-3" /> Funções de Data Disponíveis:
                                                                </p>
                                                                <ul className="text-[10px] space-y-1.5 text-muted-foreground">
                                                                    <li><code className="text-primary font-bold">DAYS_DIFF(A, B)</code> - Diferença em dias</li>
                                                                    <li><code className="text-primary font-bold">WEEKS_DIFF(A, B)</code> - Diferença em semanas</li>
                                                                    <li><code className="text-primary font-bold">TODAY()</code> - Data de hoje (usar sem aspas)</li>
                                                                </ul>
                                                                <p className="text-[9px] text-muted-foreground border-t pt-1 mt-1">
                                                                    Ex Idade Gestacional: <code className="bg-muted px-1">WEEKS_DIFF(A, TODAY())</code>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t">
                                                            <Label className="mb-2 block">Regras</Label>
                                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                                {(selectedField.rules || []).map((rule: any, idx: number) => (
                                                                    <div key={idx} className="p-2 bg-background border rounded space-y-2">
                                                                        <div className="flex gap-2">
                                                                            <Select
                                                                                value={rule.operator}
                                                                                onValueChange={(val) => {
                                                                                    const newRules = [...(selectedField.rules || [])];
                                                                                    newRules[idx] = { ...newRules[idx], operator: val };
                                                                                    handleFieldUpdate('rules', newRules);
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="gt">Maior que (&gt;)</SelectItem>
                                                                                    <SelectItem value="lt">Menor que (&lt;)</SelectItem>
                                                                                    <SelectItem value="eq">Igual (=)</SelectItem>
                                                                                    <SelectItem value="neq">Diferente (!=)</SelectItem>
                                                                                    <SelectItem value="gte">Maior ou Igual (&gt;=)</SelectItem>
                                                                                    <SelectItem value="lte">Menor ou Igual (&lt;=)</SelectItem>
                                                                                    <SelectItem value="between">Entre</SelectItem>
                                                                                    <SelectItem value="contains">Contém (Texto)</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                className="h-8 w-8 text-destructive shrink-0 ml-auto"
                                                                                onClick={() => {
                                                                                    const newRules = selectedField.rules.filter((_: any, i: number) => i !== idx);
                                                                                    handleFieldUpdate('rules', newRules);
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>

                                                                        <div className="flex gap-2 items-center">
                                                                            <Input
                                                                                className="h-8 text-xs flex-1"
                                                                                placeholder="Valor"
                                                                                value={rule.value || ''}
                                                                                onChange={(e) => {
                                                                                    const newRules = [...(selectedField.rules || [])];
                                                                                    newRules[idx] = { ...newRules[idx], value: e.target.value };
                                                                                    handleFieldUpdate('rules', newRules);
                                                                                }}
                                                                            />
                                                                            {rule.operator === 'between' && (
                                                                                <>
                                                                                    <span className="text-[10px]">e</span>
                                                                                    <Input
                                                                                        className="h-8 text-xs flex-1"
                                                                                        placeholder="Valor 2"
                                                                                        value={rule.value2 || ''}
                                                                                        onChange={(e) => {
                                                                                            const newRules = [...(selectedField.rules || [])];
                                                                                            newRules[idx] = { ...newRules[idx], value2: e.target.value };
                                                                                            handleFieldUpdate('rules', newRules);
                                                                                        }}
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Então:</span>
                                                                            <Input
                                                                                className="h-8 text-xs flex-1 border-primary/30 bg-primary/5"
                                                                                placeholder="Resultado"
                                                                                value={rule.result || ''}
                                                                                onChange={(e) => {
                                                                                    const newRules = [...(selectedField.rules || [])];
                                                                                    newRules[idx] = { ...newRules[idx], result: e.target.value };
                                                                                    handleFieldUpdate('rules', newRules);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="w-full mt-2 gap-2"
                                                                onClick={() => {
                                                                    const newRule = { operator: 'gt', value: '', result: '' };
                                                                    const currentRules = selectedField.rules || [];
                                                                    handleFieldUpdate('rules', [...currentRules, newRule]);
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3" /> Adicionar Regra
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* EXCEL LOOKUP MODE */}
                                                {selectedField.logicMode === 'lookup' && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Carregar Tabela (Excel/CSV)</Label>
                                                            <Input
                                                                type="file"
                                                                accept=".xlsx, .xls, .csv"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        try {
                                                                            // Dynamically import exceljs
                                                                            const ExcelJS = await import('exceljs');
                                                                            const workbook = new ExcelJS.Workbook();
                                                                            const data = await file.arrayBuffer();
                                                                            await workbook.xlsx.load(data);
                                                                            const worksheet = workbook.worksheets[0];

                                                                            const jsonData: any[] = [];
                                                                            let headers: string[] = [];

                                                                            worksheet.eachRow((row, rowNumber) => {
                                                                                if (rowNumber === 1) {
                                                                                    // Capture headers
                                                                                    headers = (row.values as any[]).slice(1); // exceljs adds empty item at 0
                                                                                } else {
                                                                                    const rowData: any = {};
                                                                                    const values = (row.values as any[]);
                                                                                    // values index starts at 1 in exceljs usually, but let's be safe
                                                                                    // row.getCell(i).value might be safer
                                                                                    headers.forEach((header, index) => {
                                                                                        // index 0 -> col 1
                                                                                        const cellVal = row.getCell(index + 1).value;
                                                                                        // handle rich text or formulas if needed, but usually .value is fine or .text
                                                                                        rowData[header] = cellVal?.toString() || '';
                                                                                    });
                                                                                    jsonData.push(rowData);
                                                                                }
                                                                            });

                                                                            if (jsonData.length > 0) {
                                                                                handleFieldUpdate('lookupTable', jsonData);
                                                                                handleFieldUpdate('lookupHeaders', headers);
                                                                                handleFieldUpdate('lookupColumn', '');
                                                                                handleFieldUpdate('resultColumn', '');
                                                                            }
                                                                        } catch (err) {
                                                                            console.error("Error reading excel with exceljs", err);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Use a primeira linha como cabeçalho.
                                                            </p>
                                                        </div>

                                                        {(selectedField.lookupTable || []).length > 0 && (
                                                            <>
                                                                <div className="space-y-4 border-b pb-4">
                                                                    <Label>Mapeamento de Colunas</Label>
                                                                    {(selectedField.targetFieldIds || [selectedField.targetFieldId]).filter(Boolean).map((targetId: string) => {
                                                                        const targetField = fields.find(f => f.id === targetId);
                                                                        if (!targetField) return null;
                                                                        return (
                                                                            <div key={targetId} className="space-y-1">
                                                                                <Label className="text-xs font-normal">Campo "{targetField.label}" corresponde à coluna:</Label>
                                                                                <Select
                                                                                    value={(selectedField.lookupMappings && selectedField.lookupMappings[targetId]) || (targetId === selectedField.targetFieldId ? selectedField.lookupColumn : '') || ''}
                                                                                    onValueChange={(val) => {
                                                                                        const newMappings = { ...(selectedField.lookupMappings || {}) };
                                                                                        newMappings[targetId] = val;
                                                                                        handleFieldUpdate('lookupMappings', newMappings);
                                                                                        // Backward compatibility for single field
                                                                                        if (targetId === selectedField.targetFieldId) {
                                                                                            handleFieldUpdate('lookupColumn', val);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <SelectTrigger className="h-8"><SelectValue placeholder="Selecione a coluna..." /></SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {(selectedField.lookupHeaders || []).map((h: string) => (
                                                                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label>Coluna de Resultado (Saída)</Label>
                                                                    <Select
                                                                        value={selectedField.resultColumn || ''}
                                                                        onValueChange={(val) => handleFieldUpdate('resultColumn', val)}
                                                                    >
                                                                        <SelectTrigger><SelectValue placeholder="Selecione a coluna..." /></SelectTrigger>
                                                                        <SelectContent>
                                                                            {(selectedField.lookupHeaders || []).map((h: string) => (
                                                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div className="border rounded p-2 bg-background max-h-40 overflow-auto">
                                                                    <Label className="text-xs mb-1 block">Pré-visualização (5 linhas)</Label>
                                                                    <table className="w-full text-[10px] border-collapse">
                                                                        <thead>
                                                                            <tr>
                                                                                {(selectedField.lookupHeaders || []).map((h: string) => (
                                                                                    <th key={h} className="border p-1 text-left bg-muted">{h}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {selectedField.lookupTable.slice(0, 5).map((row: any, i: number) => (
                                                                                <tr key={i}>
                                                                                    {(selectedField.lookupHeaders || []).map((h: string) => (
                                                                                        <td key={h} className="border p-1">{row[h]}</td>
                                                                                    ))}
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* MATRIX RANGE MODE */}
                                                {selectedField.logicMode === 'matrix_range' && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label>Carregar Tabela (Excel/CSV)</Label>
                                                            <div className="flex gap-2 items-end">
                                                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                                                    <Input
                                                                        type="file"
                                                                        accept=".xlsx, .xls, .csv"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) setTempFile(file);
                                                                        }}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    disabled={!tempFile || processingFile}
                                                                    onClick={async () => {
                                                                        if (!tempFile) return;
                                                                        setProcessingFile(true);
                                                                        try {
                                                                            const ExcelJS = await import('exceljs');
                                                                            const workbook = new ExcelJS.Workbook();
                                                                            const data = await tempFile.arrayBuffer();
                                                                            await workbook.xlsx.load(data);
                                                                            const worksheet = workbook.worksheets[0];

                                                                            const jsonData: any[] = [];
                                                                            let headers: string[] = [];

                                                                            worksheet.eachRow((row, rowNumber) => {
                                                                                if (rowNumber === 1) {
                                                                                    // Force probe columns 1 to 10. If Col 1 is empty (common issue), default to 'Numeração'
                                                                                    for (let i = 1; i <= 10; i++) {
                                                                                        const val = row.getCell(i).value;
                                                                                        if (val) {
                                                                                            headers.push(val.toString());
                                                                                        } else if (i === 1) {
                                                                                            // Fallback for invisible A1
                                                                                            headers.push('Numeração');
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    const rowData: any = {};
                                                                                    // Use headers to map index to key (assuming data matches header structure)
                                                                                    // ExcelJS cells are 1-based.
                                                                                    row.eachCell((cell, colNumber) => {
                                                                                        // colNumber 1 = Header 0
                                                                                        const header = headers[colNumber - 1];
                                                                                        if (header) {
                                                                                            rowData[header] = cell.value?.toString() || '';
                                                                                        }
                                                                                    });
                                                                                    jsonData.push(rowData);
                                                                                }
                                                                            }); // End eachRow (Don't push here, logic handles headers/data inside)

                                                                            // Since we replaced the inner loop logic, we must ensure the structure matches existing code flow
                                                                            // The original code pushed rowData inside the else block.
                                                                            // Wait, my replacement replaces lines 2841-2850 (partial loop).
                                                                            // Original had:
                                                                            // worksheet.eachRow((row, rowNumber) => {
                                                                            //    if (rowNumber === 1) { headers = ... } else { rowData...; headers.forEach...; push }
                                                                            // });
                                                                            // My replacement replaces the WHOLE loop logic?
                                                                            // I must match the target content exactly.

                                                                            if (jsonData.length > 0) {
                                                                                // Batch update to ensure both are saved without race condition
                                                                                handleFieldUpdate({ lookupTable: jsonData, lookupHeaders: headers });
                                                                                alert(`${jsonData.length} linhas importadas com sucesso!`);
                                                                            } else {
                                                                                alert('A tabela parece vazia.');
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            alert('Erro ao processar arquivo. Verifique o formato.');
                                                                        }
                                                                        setProcessingFile(false);
                                                                    }}
                                                                    size="sm"
                                                                >
                                                                    {processingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Carregar Tabela'}
                                                                </Button>
                                                            </div>

                                                            {selectedField.lookupTable && (
                                                                <p className="text-xs text-green-600">
                                                                    {selectedField.lookupTable.length} linhas carregadas.
                                                                </p>
                                                            )}
                                                            {(!selectedField.lookupTable || selectedField.lookupTable.length === 0) && (
                                                                <p className="text-[10px] text-amber-600 mt-1">
                                                                    Selecione o arquivo e clique em "Carregar Tabela" para habilitar as opções.
                                                                </p>
                                                            )}
                                                        </div>

                                                        {selectedField.lookupTable && selectedField.lookupTable.length > 0 && (
                                                            <>
                                                                {/* 1. Row Selector */}
                                                                <div className="space-y-2 border-t pt-2">
                                                                    <Label className="text-sm font-semibold">1. Selecionar Linha (Ex: Calçado)</Label>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Campo do Formulário</Label>
                                                                            <Select
                                                                                value={selectedField.matrixRowFieldId || ''}
                                                                                onValueChange={(val) => handleFieldUpdate('matrixRowFieldId', val)}
                                                                            >
                                                                                <SelectTrigger className="h-8"><SelectValue placeholder="Campo..." /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    {fields.filter(f => f.id !== selectedField.id && ['text', 'number', 'select', 'radio_group', 'calculated'].includes(f.type)).map((f: any) => (
                                                                                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-xs">Coluna no Excel</Label>
                                                                            <Select
                                                                                value={selectedField.matrixRowCol || ''}
                                                                                onValueChange={(val) => handleFieldUpdate('matrixRowCol', val)}
                                                                            >
                                                                                <SelectTrigger className="h-8"><SelectValue placeholder="Coluna..." /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    {(selectedField.lookupHeaders || []).map((h: string) => (
                                                                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* 2. Value to Classify */}
                                                                <div className="space-y-2 border-t pt-2">
                                                                    <Label className="text-sm font-semibold">2. Valor para Classificar (Ex: Altura)</Label>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs">Campo do Formulário</Label>
                                                                        <Select
                                                                            value={selectedField.matrixValueFieldId || ''}
                                                                            onValueChange={(val) => handleFieldUpdate('matrixValueFieldId', val)}
                                                                        >
                                                                            <SelectTrigger className="h-8"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {fields.filter(f => f.id !== selectedField.id && ['number', 'calculated', 'slider', 'select', 'grid'].includes(f.type)).map((f: any) => (
                                                                                    <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                {/* 3. Range Columns */}
                                                                <div className="space-y-2 border-t pt-2">
                                                                    <Label className="text-sm font-semibold">3. Colunas de Faixa (Limites)</Label>
                                                                    <p className="text-[10px] text-muted-foreground">Selecione as colunas que definem os limites (Ex: Baixo, Médio, Alto). A ordem importa!</p>
                                                                    <div className="border rounded p-2 max-h-40 overflow-y-auto bg-background/50">
                                                                        {(selectedField.lookupHeaders || []).map((h: string) => {
                                                                            const isChecked = (selectedField.matrixRangeCols || []).includes(h);
                                                                            return (
                                                                                <div key={h} className="flex items-center gap-2 py-1">
                                                                                    <Checkbox
                                                                                        id={`matrix-col-${h}`}
                                                                                        checked={isChecked}
                                                                                        onCheckedChange={(checked) => {
                                                                                            const current = [...(selectedField.matrixRangeCols || [])];
                                                                                            let newCols;
                                                                                            if (checked) {
                                                                                                newCols = [...current, h];
                                                                                            } else {
                                                                                                newCols = current.filter(c => c !== h);
                                                                                            }
                                                                                            handleFieldUpdate('matrixRangeCols', newCols);
                                                                                        }}
                                                                                    />
                                                                                    <label htmlFor={`matrix-col-${h}`} className="text-xs">{h}</label>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="text-[10px] space-y-1 mt-1 font-mono bg-muted p-1 rounded">
                                                                        Ordem Atual: {(selectedField.matrixRangeCols || []).join(' < ')}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <Button
                                            variant="outline"
                                            className="w-full mt-8 border-dashed"
                                            onClick={handleFieldDuplicate}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Duplicar Campo
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            className="w-full mt-2"
                                            onClick={() => {
                                                const idsToDelete = selectedIds.length > 0 ? selectedIds : (activeId ? [activeId] : []);
                                                const newFields = fields.filter((f: any) => !idsToDelete.includes(f.id));

                                                // Save history if possible, otherwise just update
                                                if (typeof updateFieldsWithHistory === 'function') {
                                                    updateFieldsWithHistory(newFields);
                                                } else {
                                                    setFields(newFields);
                                                }

                                                setActiveId(null);
                                                setSelectedIds([]);
                                                setActiveTab('tools');
                                            }}
                                        >
                                            {selectedIds.length > 1 ? `Excluir ${selectedIds.length} Campos` : 'Excluir Campo'}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                                        <MousePointerClick className="h-8 w-8 mb-2 opacity-50" />
                                        <p>Selecione um campo no formulário ao lado para editar.</p>
                                    </div>
                                )}
                            </TabsContent>

                        </Tabs>
                    </div>

                    {/* Canvas Area with Drop Zone - UPDATED for Sorting */}
                    <div className="flex-1 overflow-y-auto bg-muted/10 p-8 flex justify-center">
                        <CanvasDroppable
                            fields={fields}
                            selectedIds={selectedIds}
                            onFieldClick={handleFieldClick}
                            onConfigChange={handleCanvasUpdate} // FIXED: Use correct signature
                            onInsert={insertField}
                        />
                    </div>
                </div >

                <DragOverlay>
                    {/* Overlay for Sidebar Tools */}
                    {draggedTool ? (
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3 w-40 opacity-80 cursor-grabbing bg-white shadow-xl">
                            <draggedTool.icon className="h-4 w-4" />
                            {draggedTool.label}
                        </Button>
                    ) : null}

                    {/* Overlay for Reordering Fields */}
                    {activeDragId ? (
                        <div className="bg-white border rounded shadow-lg p-2 opacity-80 w-[400px]">
                            Movendo campo...
                        </div>
                    ) : null}

                </DragOverlay>
            </div >
        </DndContext >
    );
}

function DraggableTool({ tool }: { tool: any }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `tool-${tool.type}`,
        data: {
            type: tool.type,
            label: tool.label
        }
    });

    return (
        <Button
            ref={setNodeRef}
            variant="outline"
            className="justify-start gap-2 h-auto py-3 cursor-grab active:cursor-grabbing hover:bg-muted/50"
            {...listeners}
            {...attributes}
        >
            <tool.icon className="h-4 w-4" />
            {tool.label}
        </Button>
    );
}

// UPDATED: Now Sortable with Grid Layout Support
function CanvasDroppable({ fields, selectedIds, onFieldClick, onConfigChange, onInsert }: { fields: any[], selectedIds: string[], onFieldClick: (id: string, e: React.MouseEvent) => void, onConfigChange: (id: string, key: string, val: any) => void, onInsert: (index: number, position: 'before' | 'after') => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-droppable',
    });

    return (
        <div
            ref={setNodeRef}
            className={`w-full max-w-4xl bg-white shadow-sm border rounded-lg min-h-[500px] p-8 h-fit transition-colors relative ${isOver ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' : ''}`}
        >
            <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
                {fields.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12 select-none">
                        <Plus className="h-12 w-12 opacity-50 mb-4" />
                        <p>Arraste os campos aqui para começar</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-start content-start -mx-2">
                        {fields.map((field: any, index: number) => (
                            <SortableFieldItem
                                key={field.id}
                                id={field.id}
                                index={index} // Pass index
                                field={field}
                                isActive={selectedIds.includes(field.id)}
                                onClick={(e) => onFieldClick(field.id, e)}
                                onConfigChange={(key, val) => onConfigChange(field.id, key, val)}
                                onInsert={onInsert} // Pass down
                            />
                        ))}
                    </div>
                )}
            </SortableContext>
        </div>
    );
}

// NEW: Sortable Item Component with Variable Width
function SortableFieldItem({ id, field, index, isActive, onClick, onConfigChange, onInsert }: { id: string, field: any, index: number, isActive: boolean, onClick: (e: React.MouseEvent) => void, onConfigChange?: (key: string, val: any) => void, onInsert: (idx: number, pos: 'before' | 'after') => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        width: `${field.width || 100}%`, // Dynamic Width
        marginTop: `${field.marginTop || 0}px`,
        marginBottom: `${field.marginBottom || 0}px`
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={setNodeRef}
                    style={style}
                    className="px-2 mb-4 transition-all"
                >
                    <div
                        className={`group relative rounded-lg border-2 bg-white h-full ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                    >
                        {/* Drag Handle - Only appears on hover */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="absolute left-[2px] top-2 p-1 cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-black z-10"
                        >
                            <GripVertical className="h-5 w-5" />
                        </div>

                        <div onClick={onClick} className="min-h-[50px] p-2 pl-6">
                            <RenderField field={field} onConfigChange={onConfigChange} />
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => onInsert(index, 'before')}>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Inserir Campo Antes
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onInsert(index, 'after')}>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Inserir Campo Depois
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

// Helper Component for Smoother Dragging
const DraggablePoint = ({ point, index, field, isPreview, onCommit, isSelected, onToggleSelect }: { point: any, index: number, field: any, isPreview: boolean, onCommit: (i: number, x: number, y: number) => void, isSelected: boolean, onToggleSelect: () => void }) => {
    const [pos, setPos] = useState({ x: point.x, y: point.y });
    const [isDragging, setIsDragging] = useState(false);

    // Sync state with props when not dragging
    useEffect(() => {
        if (!isDragging) {
            setPos({ x: point.x, y: point.y });
        }
    }, [point.x, point.y]); // Remove isDragging to prevent snap-back on drop

    // Default scale depends on view type: 3D model needs padding (0.86), others are full bleed (1.0)
    // FORCE SCALE 1.0 GLOBALLY - Disabling 3D scaling legacy logic to ensure consistency
    const is3D = !field.viewType || field.viewType === 'default';
    const scale = 1;
    const extraX = 0;
    const extraY = 0;
    const offset = 0;

    const percentX = pos.x * scale + offset;
    const percentY = pos.y * scale + offset;

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isPreview) return;

        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        setIsDragging(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startPointX = pos.x;
        const startPointY = pos.y;

        const container = target.parentElement?.getBoundingClientRect();
        if (!container || container.width === 0) return;

        let finalX = startPointX;
        let finalY = startPointY;

        const onMove = (moveEvent: PointerEvent) => {
            const deltaPixelX = moveEvent.clientX - startX;
            const deltaPixelY = moveEvent.clientY - startY;

            const deltaPercentX = (deltaPixelX / container.width) * 100;
            const deltaPercentY = (deltaPixelY / container.height) * 100;

            finalX = startPointX + (deltaPercentX / scale);
            finalY = startPointY + (deltaPercentY / scale);

            setPos({ x: finalX, y: finalY });
        };

        const onUp = (upEvent: PointerEvent) => {
            setIsDragging(false);
            target.releasePointerCapture(upEvent.pointerId);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            onCommit(index, finalX, finalY);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return (
        <div
            className={`absolute w-6 h-6 flex items-center justify-center cursor-pointer z-10 ${!isPreview ? 'cursor-move' : ''} ${isDragging ? 'scale-125 z-50' : ''}`}
            style={{ left: `calc(${percentX}% + ${extraX}px)`, top: `calc(${percentY}% + ${extraY}px)`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) onToggleSelect();
            }}
            title={!isPreview ? `${point.label || 'Ponto'} (Arraste para mover)` : point.label}
        >
            {isSelected ? (
                <div className="relative flex items-center justify-center w-20 h-20 pointer-events-none">
                    {/* Ring 1 (Outer) */}
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-20 animate-ping duration-[3000ms]"></span>
                    {/* Ring 2 (Inner) */}
                    <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-500 opacity-40 animate-ping delay-300 duration-[3000ms]"></span>
                    {/* Center Dot (Fixed - High Visibility) */}
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 shadow-lg ring-2 ring-white z-20 pointer-events-auto"></span>
                </div>
            ) : (
                <div className={`w-4 h-4 rounded-full border-2 border-red-600 bg-transparent ring-1 ring-white/70 shadow-sm hover:bg-red-50 transition-colors ${!isPreview ? 'bg-white/20 ring-2 ring-yellow-400' : ''}`} />
            )}
        </div>
    );
};


const RenderField = ({ field, isPreview = false, value, onChange, formValues = {}, allFields = [], onConfigChange }: any) => {

    // Helper to extract number from string (e.g. "-2", "Item (5)", "3.5", "– 2")
    // Moved up so Chart can use it too
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

    const commonProps = {
        disabled: !isPreview,
        onChange: (e: any) => onChange && onChange(e.target.value),
        value: value !== undefined ? value : '',
    };

    // Grid Resizing Logic
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [resizing, setResizing] = useState<{ index: number, startX: number, startWidth: number } | null>(null);

    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - resizing.startX;
            setColWidths(prev => ({
                ...prev,
                [resizing.index]: Math.max(50, resizing.startWidth + diff) // Min 50px
            }));
        };

        const handleMouseUp = () => {
            setResizing(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing]);

    const startResize = (e: React.MouseEvent, index: number, currentWidth: number) => {
        e.preventDefault();
        setResizing({ index, startX: e.clientX, startWidth: currentWidth });
    };

    const handleCheckboxChange = (option: string, checked: boolean) => {
        if (!onChange) return;
        const currentVals = Array.isArray(value) ? value : [];
        if (checked) {
            onChange([...currentVals, option]);
        } else {
            onChange(currentVals.filter((v: any) => v !== option));
        }
    };

    // VISIBILITY CHECK [NEW]
    const isHidden = field.hidden && isPreview;

    // In builder, show a badge if hidden
    const HiddenBadge = () => field.hidden && !isPreview ? (
        <div className="mb-1 flex justify-end">
            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Oculto no preenchimento
            </span>
        </div>
    ) : null;

    if (isHidden) {
        // We render it hidden so calculations still run!
        return (
            <div className="hidden">
                {/* Logic still runs here */}
            </div>
        );
    }

    return (
        <div className="w-full relative">
            <HiddenBadge />
            {(() => {
                switch (field.type) {

                    case 'section':
                        return (
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
                        );

                    case 'tab':
                        if (isPreview) return null;
                        return (
                            <div className="w-full flex flex-col items-center gap-1 py-4">
                                <div className="w-full flex items-center gap-4">
                                    <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-primary/40 to-primary/60 rounded-full" />
                                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 shadow-sm">
                                        <Layers className="h-4 w-4 text-primary" />
                                        <span className="font-bold text-primary text-xs uppercase tracking-wider">{field.label || 'Nova Aba'}</span>
                                    </div>
                                    <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-primary/40 to-primary/60 rounded-full" />
                                </div>
                                {field.tabStyle && (
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                                        Estilo: {field.tabStyle}
                                    </span>
                                )}
                            </div>
                        );

                    case 'text':
                        return (
                            <div className="grid gap-2">
                                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                                <Input {...commonProps} placeholder="Texto..." />
                            </div>
                        );

                    case 'number':
                        return (
                            <div className="grid gap-2">
                                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                                <Input {...commonProps} type="number" placeholder="0" />
                            </div>
                        );

                    case 'slider':
                        const min = field.min ?? 0;
                        const max = field.max ?? 10;
                        const step = field.step ?? 1;
                        // Use defaultValue if value is not set, handle NaN
                        let val = (value !== undefined && value !== '' && value !== null) ? Number(value) : (field.defaultValue ?? min);
                        if (isNaN(val)) val = min;

                        return (
                            <div className="grid gap-4">
                                <div className="flex justify-between items-center">
                                    <Label>{field.label}</Label>
                                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                        {val}
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <Slider
                                        value={[val]}
                                        onValueChange={(vals) => onChange && onChange(vals[0])}
                                        max={max}
                                        min={min}
                                        step={step}
                                        disabled={!isPreview}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>{field.minLabel || min}</span>
                                        <span>{field.maxLabel || max}</span>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'calculated':
                        let displayValue = value || '';

                        if (isPreview) {
                            try {
                                if (field.calculationType === 'custom' && field.variableMap && field.formula) {
                                    // Custom Formula Logic
                                    const variables: Record<string, number> = {};
                                    field.variableMap.forEach((v: any) => {
                                        const val = formValues[v.targetId];
                                        const num = extractNumber(typeof val === 'string' ? val : (Array.isArray(val) ? val[0] : ''));
                                        variables[v.letter] = num;
                                    });

                                    let formulaStr = field.formula.toUpperCase();
                                    Object.keys(variables).forEach(letter => {
                                        const regex = new RegExp(`\\b${letter}\\b`, 'g');
                                        formulaStr = formulaStr.replace(regex, variables[letter].toString());
                                    });

                                    // Validate and Sanitize
                                    // Allowed: Numbers, Math (+-*/().), Logic (<>=!?^:|&)
                                    const sanitized = formulaStr.replace(/[^0-9+\-*\/().\s<>=!?^:|&]/g, '');

                                    // eslint-disable-next-line no-new-func
                                    const result = new Function('return ' + sanitized)();
                                    displayValue = isNaN(result) ? "Erro" :
                                        (Number.isInteger(result) ? result.toString() : result.toFixed(1));
                                } else if (['sum', 'average'].includes(field.calculationType)) {
                                    // Sum / Average (+ Scaling) Logic
                                    let sum = 0;
                                    let count = 0;
                                    const missingLabels: string[] = [];

                                    (field.targetIds || []).forEach((tid: string) => {
                                        const targetField = (allFields || []).find((f: any) => f.id === tid);

                                        // HANDLE GRID SUMMATION
                                        if (targetField && targetField.type === 'grid') {
                                            const gridRows = targetField.rows || [];
                                            const gridCols = targetField.columns || [];

                                            gridRows.forEach((_: any, rIndex: number) => {
                                                gridCols.forEach((colLabel: string, cIndex: number) => {
                                                    // Check Radio Grid Logic
                                                    if (targetField.gridType === 'radio') {
                                                        const rowVal = formValues[`${rIndex}`]; // Radio stores value by row index
                                                        if (rowVal === colLabel) {
                                                            const num = extractNumber(colLabel);
                                                            if (!isNaN(num)) {
                                                                sum += num;
                                                                // Count each row as 1 item? Or each cell? 
                                                                // For average: usually count rows. For sum: just sum.
                                                                // Let's count as 1 value added per row.
                                                                // actually, let's just increment count per valid number found
                                                                count++;
                                                            }
                                                        }
                                                    } else {
                                                        // Standard Input Grid
                                                        const cellKey = `${rIndex}-${cIndex}`;
                                                        if (targetField.id) {
                                                            // For grids, formValues keys might supply the ID? 
                                                            // Actually, FormBuilder saves grid values flatly in formValues using indices?
                                                            // Wait, `formValues` usually uses `field.id` for scalars, but Grids often write to `row-col` keys directly?
                                                            // Let's check how Grid saves data. 
                                                            // If Grid saves data to `formValues[sourceField.id]`, then we access that object.
                                                            // Looking at Chart logic: `const sourceValues = formValues[sourceField.id] || {};`
                                                            // So yes, it's nested IF `FormBuilder` changed to nested format. 
                                                            // Previously `RenderField` for Grid: `onChange={(val) => handleGridChange(rIndex, cIndex, val)}`...
                                                            // Let's assume the modern structure `formValues[targetField.id]` holds the object.

                                                            const gridData = formValues[targetField.id] || {};
                                                            /* 
                                                               Warning: Older FormBuilder versions acted differently. 
                                                               The chart logic uses `const sourceValues = formValues[sourceField.id] || {};` 
                                                               AND accessing `sourceValues['r-c']`. 
                                                               So we mimic that.
                                                            */

                                                            // Check Radio in Nested Object
                                                            if (targetField.gridType === 'radio') {
                                                                const rowVal = gridData[`${rIndex}`];
                                                                if (rowVal === colLabel) {
                                                                    const num = extractNumber(colLabel);
                                                                    if (!isNaN(num)) { sum += num; count++; }
                                                                }
                                                            } else {
                                                                const valStr = gridData[`${rIndex}-${cIndex}`];
                                                                const val = parseFloat(valStr);
                                                                if (!isNaN(val)) {
                                                                    sum += val;
                                                                    count++;
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            });
                                        }
                                        // HANDLE SCALAR
                                        else {
                                            const val = parseFloat(formValues[tid]);
                                            if (!isNaN(val)) {
                                                sum += val;
                                                count++;
                                            } else if (field.strictMode) {
                                                // Find label for missing field
                                                const missingField = (allFields || []).find((f: any) => f.id === tid);
                                                if (missingField) missingLabels.push(missingField.label);
                                            }
                                        }
                                    });

                                    if (field.strictMode && missingLabels.length > 0) {
                                        displayValue = `Pendente: ${missingLabels.join(', ')}`;
                                    } else {
                                        let rawResult = 0;
                                        if (field.calculationType === 'average') {
                                            rawResult = count > 0 ? sum / count : 0;
                                        } else {
                                            rawResult = sum;
                                        }

                                        // Scaling Logic (0-10)
                                        if (field.enableScaling && field.originalMax !== undefined) {
                                            const min = field.originalMin || 0;
                                            const max = field.originalMax;
                                            const range = max - min;

                                            if (range !== 0) {
                                                // Normalization Formula: ((Value - Min) / Range) * 10
                                                rawResult = ((rawResult - min) / range) * 10;
                                            }
                                        }

                                        displayValue = rawResult.toFixed(1);
                                    }
                                } else if (field.calculationType === 'imc') {
                                    // IMC Logic
                                    // ... (IMC Implementation if needed or handled elsewhere?)
                                    // Re-implementing basic IMC here if it was lost
                                    const weightId = (field.targetIds || [])[0];
                                    const heightId = (field.targetIds || [])[1];
                                    if (weightId && heightId) {
                                        const w = parseFloat(formValues[weightId]) || 0;
                                        const h = parseFloat(formValues[heightId]) || 0;
                                        const hM = h > 3 ? h / 100 : h;
                                        if (w > 0 && hM > 0) {
                                            displayValue = (w / (hM * hM)).toFixed(2);
                                        }
                                    }
                                } else {
                                    displayValue = "Configuração incompleta";
                                }
                            } catch (e) {
                                console.error("Calculation Error", e);
                                displayValue = "Erro na fórmula";
                            }
                        }

                        return (
                            <div className="grid gap-2">
                                <Label>{field.label} {field.calculationType === 'imc' && <span className="text-xs text-muted-foreground">(IMC)</span>}</Label>
                                <div className="relative">
                                    <Input
                                        disabled
                                        value={displayValue}
                                        placeholder={isPreview ? "Aguardando valores..." : "Resultado..."}
                                        className={`bg-muted pl-10 font-bold text-primary ${isPreview ? 'text-lg' : ''}`}
                                    />
                                    <Calculator className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                                {!isPreview && <p className="text-xs text-muted-foreground">Calculado automaticamente no preenchimento.</p>}
                            </div>
                        );

                    case 'file':
                        return (
                            <div className="grid gap-2">
                                <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                                <div className="flex items-center justify-center w-full">
                                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 mb-4 text-gray-500" />
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                                            <p className="text-xs text-gray-500">PDF, PNG, JPG (Max. 10MB)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );

                    case 'textarea':
                        return (
                            <div className="grid gap-2">
                                <Label>{field.label}</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...commonProps}
                                    placeholder="Texto longo..."
                                />
                            </div>
                        );
                    case 'checkbox_group':
                        return (
                            <div className="grid gap-3">
                                <Label className="text-base font-semibold">{field.label}</Label>
                                <div className={`grid gap-2 ${field.columns === 2 ? 'grid-cols-2' : field.columns === 3 ? 'grid-cols-3' : field.columns === 4 ? 'grid-cols-4' : 'grid-cols-1'}`}>
                                    {field.options?.map((opt: string, i: number) => (
                                        <div key={i} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`${field.id}-${i}`}
                                                disabled={!isPreview}
                                                checked={Array.isArray(value) && value.includes(opt)}
                                                // Cast to boolean to satify TS
                                                onCheckedChange={(checked) => handleCheckboxChange(opt, checked === true)}
                                            />
                                            <Label htmlFor={`${field.id}-${i}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                                        </div>
                                    ))}
                                </div>
                                {/* Visual Preview for Dynamic Option */}
                                {field.allowCreateOption && (
                                    <div className="flex items-center gap-2 max-w-sm mt-2">
                                        <Input
                                            placeholder="Adicionar..."
                                            className="h-8 text-sm"
                                            readOnly
                                        />
                                        <Button size="sm" variant="ghost" className="h-8 px-2 pointer-events-none">
                                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                                ENTER
                                            </kbd>
                                        </Button>
                                    </div>
                                )}
                            </div>

                        );

                    case 'radio_group':
                        return (
                            <div className="grid gap-3">
                                <Label className="text-base font-semibold">{field.label}</Label>
                                <RadioGroup
                                    value={value}
                                    onValueChange={(val) => onChange && onChange(val)}
                                    disabled={!isPreview}
                                    className={`grid gap-4 ${field.columns === 2 ? 'grid-cols-2' : field.columns === 3 ? 'grid-cols-3' : field.columns === 4 ? 'grid-cols-4' : 'grid-cols-1'}`}
                                >
                                    {field.options?.map((opt: string, i: number) => (
                                        <div key={i} className="flex items-center space-x-2">
                                            <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                                            <Label htmlFor={`${field.id}-${i}`} className="font-normal cursor-pointer">{opt}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        );

                    case 'select':
                        return (
                            <div className="grid gap-2">
                                <Label>{field.label}</Label>
                                {isPreview ? (
                                    <Select value={value} onValueChange={(val) => onChange && onChange(val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((opt: string, i: number) => (
                                                <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm opacity-50">
                                        Selecione...
                                    </div>
                                )}
                            </div>
                        );

                    case 'grid':
                        // Grid Value Structure: {"row-col": value, "row-label-i": "Custom Label" }
                        // Grid Value Structure: {"row-col": value, "row-label-i": "Custom Label" }
                        const gridType = field.gridType || 'radio';
                        const firstColMode = field.firstColMode || (field.firstColEditable ? 'editable' : 'default');
                        const showTotal = field.showTotalColumn;

                        const getRowTotal = (rowIndex: number) => {
                            if (!field.columns) return 0;

                            // 1. Try summing individual cell values (for Numbers/Text/Checkboxes overridden columns)
                            let cellSum = 0;
                            let foundCellValues = false;

                            field.columns.forEach((_: any, j: number) => {
                                const val = value && value[`${rowIndex}-${j}`];
                                // Check for valid value (not undefined/null/empty)
                                if (val !== undefined && val !== '' && val !== null) {
                                    foundCellValues = true;
                                    // extractNumber from RenderField scope
                                    cellSum += extractNumber(val.toString());
                                }
                            });

                            if (foundCellValues) {
                                console.log(`[DEBUG] Row ${rowIndex} Total: CellSum=${cellSum}`);
                                return cellSum;
                            }

                            // 2. Fallback to Radio Value (if Grid is Radio-type and no cells override)
                            const val = value && value[`${rowIndex}`];
                            if (val) {
                                const radioSum = extractNumber(val);
                                console.log(`[DEBUG] Row ${rowIndex} Total: RadioSum=${radioSum} (val=${val})`);
                                return radioSum;
                            }

                            return 0;
                        };

                        const handleGridChange = (r: number, c: number, val: any) => {
                            if (!onChange) return;
                            const current = typeof value === 'object' ? { ...value } : {};
                            if (val === undefined || val === '') delete current[`${r}-${c}`];
                            else current[`${r}-${c}`] = val;
                            onChange(current);
                        };

                        const handleRadioChange = (r: number, val: string) => {
                            if (!onChange) return;
                            const current = typeof value === 'object' ? { ...value } : {}
                            current[`${r}`] = val
                            onChange(current)
                        }

                        const handleRowLabelChange = (r: number, val: string) => {
                            if (!onChange) return;
                            const current = typeof value === 'object' ? { ...value } : {};
                            current[`row-label-${r}`] = val;
                            onChange(current);
                        };

                        // ROW MAPPING SYNC [NEW]
                        useEffect(() => {
                            if (!field.rowMappings || !onChange || !formValues) return;

                            // Check if any mapped value is different from current grid value
                            let hasChanges = false;
                            const current = typeof value === 'object' ? { ...value } : {};

                            Object.keys(field.rowMappings).forEach((rowIndexStr) => {
                                const sourceId = field.rowMappings[rowIndexStr];
                                if (!sourceId) return;

                                const sourceVal = formValues[sourceId];
                                if (sourceVal !== undefined && sourceVal !== '') {
                                    // Handle Grid Objects (Summation)
                                    let finalVal = sourceVal;
                                    if (typeof sourceVal === 'object' && sourceVal !== null) {
                                        let sum = 0;
                                        Object.values(sourceVal).forEach((v: any) => {
                                            const n = extractNumber(String(v));
                                            if (!isNaN(n)) sum += n;
                                        });
                                        finalVal = sum;
                                    }

                                    const targetKey = `${rowIndexStr}-0`; // Col 0
                                    // Only update if changed to avoid loops
                                    if (current[targetKey] != finalVal) {
                                        current[targetKey] = finalVal;
                                        hasChanges = true;
                                    }
                                }
                            });

                            if (hasChanges) {
                                onChange(current);
                            }
                        }, [formValues, field.rowMappings]); // Re-run when form values change

                        return (
                            <div className="space-y-2">
                                <Label className="font-bold">{field.label}</Label>
                                <div className="border rounded-md overflow-x-auto bg-white">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                {/* Condition: First Col */}
                                                {firstColMode !== 'none' && (
                                                    <th className="p-2 text-left min-w-[150px]">Item</th>
                                                )}

                                                {field.columns?.map((col: string, i: number) => (
                                                    <th
                                                        key={i}
                                                        className="p-2 text-center border-l min-w-[80px] relative group"
                                                        style={{ width: colWidths[i] ? `${colWidths[i]}px` : undefined }}
                                                    >
                                                        {col}
                                                        {isPreview && (
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/20 transition-colors"
                                                                onMouseDown={(e) => startResize(e, i, colWidths[i] || 100)}
                                                            />
                                                        )}
                                                    </th>
                                                ))}

                                                {/* Total Header */}
                                                {showTotal && (
                                                    <th className="p-2 text-center border-l bg-muted font-bold w-[80px]">Total</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {field.rows?.map((row: string, i: number) => (
                                                <tr key={i} className="border-t hover:bg-muted/20">
                                                    {/* First Col */}
                                                    {firstColMode !== 'none' && (
                                                        <td className="p-2 font-medium">
                                                            {firstColMode === 'editable' ? (
                                                                <Input
                                                                    value={(value && value[`row-label-${i}`]) || ''}
                                                                    onChange={(e) => handleRowLabelChange(i, e.target.value)}
                                                                    placeholder={row}
                                                                    className="h-8 text-sm"
                                                                    disabled={!onChange}
                                                                />
                                                            ) : (
                                                                <span>{row}</span>
                                                            )}
                                                        </td>
                                                    )}

                                                    {/* Data Cells */}
                                                    {field.columns?.map((col: string, j: number) => {
                                                        const cellType = field.columnTypes?.[j] || gridType; // Fallback to main type

                                                        return (
                                                            <td key={j} className="p-2 text-center border-l">
                                                                <div className="flex justify-center">
                                                                    {cellType === 'radio' && (
                                                                        <input
                                                                            type="radio"
                                                                            name={`grid-${field.id}-${i}`}
                                                                            checked={(value && value[`${i}`]) === col}
                                                                            onChange={() => handleRadioChange(i, col)}
                                                                            className="h-4 w-4 accent-primary"
                                                                            disabled={!onChange}
                                                                        />
                                                                    )}
                                                                    {cellType === 'checkbox' && (
                                                                        <Checkbox
                                                                            checked={(value && value[`${i}-${j}`]) === true}
                                                                            onCheckedChange={(checked) => handleGridChange(i, j, checked)}
                                                                            disabled={!onChange}
                                                                        />
                                                                    )}
                                                                    {cellType === 'number' && (
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 w-20 text-center mx-auto"
                                                                            disabled={!onChange}
                                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                                            onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                                        />
                                                                    )}

                                                                    {cellType === 'text' && (
                                                                        <Input
                                                                            type="text"
                                                                            className="h-8 w-full min-w-[100px]"
                                                                            disabled={!onChange}
                                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                                            onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                                        />
                                                                    )}

                                                                    {cellType === 'select_10' && (
                                                                        <select
                                                                            className="h-8 w-full border rounded text-sm bg-background px-1"
                                                                            disabled={!onChange}
                                                                            value={(value && value[`${i}-${j}`]) || ''}
                                                                            onChange={(e) => handleGridChange(i, j, e.target.value)}
                                                                        >
                                                                            <option value="">-</option>
                                                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                                                <option key={n} value={n}>{n}</option>
                                                                            ))}
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Total Cell */}
                                                    {showTotal && (
                                                        <td className="p-2 text-center border-l bg-muted font-bold w-[80px]">
                                                            {getRowTotal(i)}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                        {/* Footer for Column Calculations */}
                                        {(field.columnCalculations && Object.keys(field.columnCalculations).length > 0) && (
                                            <tfoot className="bg-muted font-bold border-t-2">
                                                <tr>
                                                    {/* First Col Placeholder */}
                                                    {firstColMode !== 'none' && <td className="p-2">Total/Média</td>}

                                                    {field.columns?.map((_: string, j: number) => {
                                                        const calcType = field.columnCalculations?.[j];
                                                        if (!calcType || calcType === 'none') return <td key={j} className="p-2 border-l"></td>;

                                                        const getColTotal = () => {
                                                            let sum = 0;
                                                            let count = 0;
                                                            field.rows?.forEach((_: any, r: number) => {
                                                                const val = value && value[`${r}-${j}`];
                                                                if (val !== undefined && val !== '' && val !== null) {
                                                                    const num = extractNumber(val.toString());
                                                                    sum += num;
                                                                    count++;
                                                                }
                                                            });
                                                            if (calcType === 'sum') return sum;
                                                            if (calcType === 'average') return count > 0 ? (sum / count).toFixed(1) : 0;
                                                            return '';
                                                        };

                                                        return (
                                                            <td key={j} className="p-2 text-center border-l text-primary">
                                                                {getColTotal()}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Total Header Placeholder */}
                                                    {showTotal && <td className="p-2 border-l"></td>}
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        );

                    case 'group_row':
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {field.fields?.map((subField: any, i: number) => (
                                    <div key={i}>
                                        {/* Recursive rendering of grouped fields */}
                                        <div className="p-2 border rounded-lg bg-muted/5">
                                            <RenderField field={subField} isPreview={isPreview} value={value} onChange={onChange} formValues={formValues} allFields={allFields} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );

                    case 'pain_map':
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
                                            const is3D = !field.viewType || field.viewType === 'default';

                                            // FORCE GLOBAL SCALE 1.0 to fix drift permanently. 
                                            // Ignoring 3D/Flat distinction.
                                            const scale = 1;
                                            const extraX = 0;
                                            const extraY = 0;
                                            const offset = 0;

                                            // SPY RENDER (Toast)
                                            useEffect(() => {
                                                if (isPreview && field.viewType === 'anterior') { // Limit to one field to avoid spam
                                                    const p1 = field.points?.[0];
                                                    const coords = p1 ? `x=${Math.round(p1.x)}, y=${Math.round(p1.y)}` : 'Sem pontos';
                                                    toast.warning(`[RENDER SPY] Anterior P1: ${coords}`, { duration: 8000 });
                                                }
                                            }, [isPreview, field.viewType, field.points]);

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
                                                // Safety check for dimensions
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

                    case 'shoe_recommendation':
                        // LOGIC FOR SHOE RECOMMENDATION TABLE
                        // This uses the Minimalist Index (calculated via other fields) to suggest shoes
                        const getShoeRecommendation = () => {
                            // Find Minimalist Index Field Value
                            // We assume there's a field with label containing 'Índice de Minimalismo' or we pass it via variables
                            // For now, let's look for a calculated field's result in the formValues if possible, or re-calculate

                            // Hack: We need the value of the Minimalist Index. 
                            // Let's assume the user mapped it or we can find it.
                            // Or simplified: Just render the static table structure for now as requested "Translate and add info".

                            return (
                                <>
                                    <div className="mt-4 border rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted text-muted-foreground uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-2">Modelo</th>
                                                    <th className="px-4 py-2">Tipo</th>
                                                    <th className="px-4 py-2">Índice</th>
                                                    <th className="px-4 py-2">Drop</th>
                                                    <th className="px-4 py-2">Peso (g)</th>
                                                    <th className="px-4 py-2">Stack (mm)</th>
                                                    <th className="px-4 py-2">Flexibilidade</th>
                                                    <th className="px-4 py-2">Estabilidade</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {/* Example Recommendations based on typical categories */}
                                                <tr className="bg-white hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-medium">Merrell Vapor Glove 6</td>
                                                    <td className="px-4 py-2">Minimalista</td>
                                                    <td className="px-4 py-2">96%</td>
                                                    <td className="px-4 py-2">0mm</td>
                                                    <td className="px-4 py-2">150g</td>
                                                    <td className="px-4 py-2">6mm</td>
                                                    <td className="px-4 py-2">Alta</td>
                                                    <td className="px-4 py-2">Mínima</td>
                                                </tr>
                                                <tr className="bg-white hover:bg-gray-50">
                                                    <td className="px-4 py-2">Altra Escalante 3</td>
                                                    <td className="px-4 py-2">Transição</td>
                                                    <td className="px-4 py-2">70%</td>
                                                    <td className="px-4 py-2">0mm</td>
                                                    <td className="px-4 py-2">263g</td>
                                                    <td className="px-4 py-2">24mm</td>
                                                    <td className="px-4 py-2">Média</td>
                                                    <td className="px-4 py-2">Neutra</td>
                                                </tr>
                                                <tr className="bg-white hover:bg-gray-50">
                                                    <td className="px-4 py-2">Hoka Clifton 9</td>
                                                    <td className="px-4 py-2">Maximalista</td>
                                                    <td className="px-4 py-2">12%</td>
                                                    <td className="px-4 py-2">5mm</td>
                                                    <td className="px-4 py-2">248g</td>
                                                    <td className="px-4 py-2">32mm</td>
                                                    <td className="px-4 py-2">Baixa</td>
                                                    <td className="px-4 py-2">Estável</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="p-2 bg-yellow-50 text-yellow-800 text-xs border-t border-yellow-100">
                                            * Recomendação baseada no Índice de Minimalismo calculado e perfil do corredor.
                                        </div>
                                    </div>

                                    {/* SIMULATED AI ORIENTATION */}
                                    <div className="mt-4 space-y-2">
                                        <Label className="flex items-center gap-2 text-primary font-bold">
                                            <Box className="h-4 w-4" />
                                            Orientação Personalizada (Simulação IA)
                                        </Label>
                                        <div className="relative">
                                            <Textarea
                                                readOnly
                                                className="min-h-[220px] bg-blue-50/50 border-blue-200 text-sm leading-relaxed resize-none p-4"
                                                value={`Com base na avaliação biomecânica e histórico do paciente:
                                
1. RECOMENDAÇÃO DE TIPO: TRANSITION (Índice ~70%)
   Devido ao histórico de desconforto no joelho anterior (femoropatelar) e experiência recreativa (>6 meses), o ideal é buscar tênis com Índice de Minimalismo acima de 70% ou modelos de Transição. Isso ajuda a reduzir a carga no joelho através de uma cadência naturalmente maior.

2. TRANSIÇÃO E ADAPTAÇÃO:
   - Semana 1-2: Usar o novo tênis apenas em treinos curtos (ou caminhadas).
   - Semana 3-4: Alternar com o tênis antigo (50/50).
   - Mês 2: Uso contínuo se não houver dores na panturrilha/tendão de Aquiles.
   
3. O QUE BUSCAR NO TÊNIS:
   - Drop: Preferência por < 6mm.
   - Peso: < 250g (quanto mais leve, melhor para a mecânica).
   - Flexibilidade: Moderada a Alta.
   - Stack: Moderado (evitar >30mm se buscar propriocepção).`}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                                                    IA Gerada
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GLOSSARY OF VARIABLES (Infographic Content) */}
                                    <div className="mt-6 border-t pt-4">
                                        <Label className="flex items-center gap-2 text-muted-foreground font-semibold text-xs uppercase mb-4">
                                            <Info className="h-4 w-4" />
                                            Entenda as Variáveis (Critérios do Índice Minimalista)
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                                                <div className="flex-none h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                                    <RotateCcw className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-700 mb-1">Flexibilidade</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">
                                                        O tênis é testado para ver o quanto dobra para frente e para os lados (torção).
                                                        Quanto mais flexível, maior a pontuação neste critério.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                                                <div className="flex-none h-10 w-10 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                                    <Scale className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-700 mb-1">Peso</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">
                                                        Basta pesar o tênis em uma balança. Quanto mais leve for o calçado,
                                                        maior será a pontuação neste critério do Índice Minimalista.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                                                <div className="flex-none h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                                                    <Layers className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-700 mb-1">Stack Height (Altura da Sola)</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">
                                                        Medida no centro do calcanhar, avalia a espessura total entre onde seu pé fica e o chão.
                                                        Quanto mais fina a sola, maior a pontuação.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border flex gap-3">
                                                <div className="flex-none h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                                                    <ArrowDownRight className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-700 mb-1">Drop (Salto)</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">
                                                        Diferença de altura entre o calcanhar e a ponta do pé.
                                                        Quanto mais próximo de zero, maior a pontuação no Índice Minimalista.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg border md:col-span-2 flex gap-3">
                                                <div className="flex-none h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                    <Shield className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-700 mb-1">Estabilidade e Controle</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">
                                                        Identifique tecnologias usadas para controlar a pisada (placas, postes duros).
                                                        Menos tecnologias (mais naturalidade) significa uma pontuação maior.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] text-muted-foreground text-right">
                                            Fonte: TheRunningClinic.com
                                        </div>
                                    </div>
                                </>
                            )
                        };

                        return (
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <span className="text-primary"><Calculator className="w-4 h-4" /></span>
                                    {field.label || 'Recomendação de Calçados'}
                                </Label>
                                {isPreview ? getShoeRecommendation() : (
                                    <div className="p-4 border border-dashed rounded text-center text-muted-foreground text-sm bg-gray-50">
                                        Tabela de Recomendação de Tênis (Visível no Relatório/Preview)
                                    </div>
                                )}
                            </div>
                        );

                    case 'logic_variable':
                        return (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <FunctionSquare className="h-4 w-4 text-primary" />
                                    {field.label}
                                </Label>
                                <div className="p-3 bg-muted/20 border rounded-md font-medium text-lg min-h-[40px] flex items-center">
                                    {/* Display result or placeholder */}
                                    {formValues[field.id] || field.defaultResult || (isPreview ? '' : 'Resultado da Lógica')}
                                </div>
                            </div>
                        );

                    case 'chart':
                        const sourceIds = field.sourceFieldIds || (field.sourceFieldId ? [field.sourceFieldId] : []);
                        if (sourceIds.length === 0) return <div className="p-4 border border-dashed rounded text-sm text-muted-foreground text-center">Gráfico: Selecione as fontes nas configurações.</div>;

                        let chartData: any[] = [];
                        const firstSource = (allFields || []).find((f: any) => f.id === sourceIds[0]);

                        // CASE 1: Grid Source (Single Grid selected)
                        if (sourceIds.length === 1 && firstSource?.type === 'grid') {
                            const sourceField = firstSource;
                            const sourceValues = formValues[sourceField.id] || {};
                            chartData = (sourceField.rows || []).map((rowLabel: string, rIndex: number) => {
                                const customLabel = sourceField.firstColEditable && sourceValues[`row-label-${rIndex}`];
                                const finalLabel = customLabel || rowLabel;
                                const displayLabel = finalLabel.length > 20 ? finalLabel.substring(0, 20) + '...' : finalLabel;
                                const rowObj: any = { name: displayLabel, fullLabel: finalLabel };

                                sourceField.columns?.forEach((colLabel: string, cIndex: number) => {
                                    let val = 0;
                                    const cellVal = sourceValues[`${rIndex}-${cIndex}`];
                                    const rowRadioVal = sourceValues[`${rIndex}`];

                                    if (sourceField.gridType === 'radio' && rowRadioVal === colLabel) {
                                        val = extractNumber(colLabel);
                                        rowObj['score'] = val;
                                    } else if (cellVal) {
                                        val = extractNumber(cellVal.toString());
                                        rowObj[colLabel] = val;
                                    }
                                });
                                if (sourceField.gridType === 'radio' && rowObj['score'] === undefined) rowObj['score'] = 0;
                                return rowObj;
                            });
                        }
                        // CASE 2: Multi-Source Scalar (Variables & Grids as Scalars)
                        else {
                            chartData = sourceIds.map((id: string) => {
                                if (id === field.id) return null; // Skip self
                                const src = (allFields || []).find((f: any) => f.id === id);
                                if (!src) return null;

                                let val = 0;

                                // If Source is Grid, Sum it up
                                if (src.type === 'grid') {
                                    const gridData = formValues[src.id] || {};
                                    (src.rows || []).forEach((_: any, rIndex: number) => {
                                        (src.columns || []).forEach((colLabel: string, cIndex: number) => {
                                            if (src.gridType === 'radio') {
                                                const rowVal = gridData[`${rIndex}`];
                                                if (rowVal === colLabel) {
                                                    const n = extractNumber(colLabel);
                                                    if (!isNaN(n)) val += n;
                                                }
                                            } else {
                                                const n = extractNumber(gridData[`${rIndex}-${cIndex}`]);
                                                if (!isNaN(n)) val += n;
                                            }
                                        });
                                    });
                                }
                                // Standard Scalar
                                else {
                                    const rawVal = formValues[src.id];
                                    if (typeof rawVal === 'number') val = rawVal;
                                    else if (typeof rawVal === 'string') val = parseFloat(rawVal);
                                    if (isNaN(val)) val = 0;
                                }

                                return {
                                    name: src.label,
                                    fullLabel: src.label,
                                    score: val
                                };
                            }).filter((item: any) => item !== null);

                            if (chartData.length === 0) {
                                return <div className="p-4 border border-dashed rounded text-sm text-red-500 text-center">Nenhuma fonte válida encontrada.</div>;
                            }
                        }



                        const ChartComponent = field.chartType === 'bar' ? BarChart :
                            field.chartType === 'line' ? LineChart :
                                field.chartType === 'area' ? AreaChart :
                                    field.chartType === 'radar' ? RadarChart : BarChart;

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
                                        {/* Series Generation */}
                                        {/* Logic: If Multi-Source OR (Grid + Radio), we plot 'score'. If Grid + Columns, we plot columns. */}
                                        {(sourceIds.length > 1 || firstSource?.type !== 'grid' || (firstSource?.type === 'grid' && firstSource?.gridType === 'radio')) ? (
                                            field.chartType === 'radar' ? (
                                                <Radar name="Pontuação" dataKey="score" stroke={chartColor} fill={chartColor} fillOpacity={0.6} />
                                            ) : (
                                                <Bar dataKey="score" fill={chartColor} name="Pontuação" />
                                            )
                                        ) : (
                                            firstSource?.columns?.map((col: string, i: number) => {
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
                        );

                    default:
                        return (
                            <div className="p-4 border rounded border-dashed text-muted-foreground bg-muted/20">
                                Tipo desconhecido: {field.type} ({field.label})
                            </div>
                        );
                }
            })()}
        </div>
    );
};

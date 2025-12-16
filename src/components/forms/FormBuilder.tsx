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
    Type, AlignLeft, CheckSquare, List, GripHorizontal, Image as ImageIcon,
    Calendar, Save, Trash2, ArrowLeft, GripVertical, Plus, Settings, Eye,
    Columns, Search, Calculator, Sliders, FileUp, Edit3, RotateCcw,
    PieChart, Hash, FileText, MousePointerClick, Table, SlidersHorizontal, UploadCloud, RotateCw, FunctionSquare
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Pie, Cell, AreaChart, Area } from 'recharts'
import { PieChart as RechartsPieChart } from 'recharts' // Alias to avoid conflict with Icon;
import Link from 'next/link';
import { updateFormTemplate } from '@/app/actions/forms';
import { toast } from 'sonner';

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
    { type: 'text', label: 'Texto Curto', icon: Type },
    { type: 'number', label: 'Número', icon: Hash },
    { type: 'textarea', label: 'Texto Longo', icon: FileText },
    { type: 'slider', label: 'Barra Deslizante', icon: SlidersHorizontal },
    { type: 'calculated', label: 'Campo Calculado', icon: Calculator },
    { type: 'checkbox_group', label: 'Múltipla Escolha', icon: CheckSquare },
    { type: 'radio_group', label: 'Seleção Única', icon: MousePointerClick },
    { type: 'grid', label: 'Tabela / Grade', icon: Table },
    { type: 'image', label: 'Imagem / Mapa', icon: ImageIcon },
    { type: 'file', label: 'Arquivo / Foto', icon: UploadCloud },
    { type: 'section', label: 'Seção (Título)', icon: GripVertical },
    { type: 'chart', label: 'Gráfico', icon: PieChart },
];

export default function FormBuilder({ template }: FormBuilderProps) {
    const [fields, setFields] = useState(template.fields || []);
    // Undo/Redo Stacks
    const [history, setHistory] = useState<any[][]>([]);
    const [future, setFuture] = useState<any[][]>([]);

    const [activeId, setActiveId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('tools');
    const [isSaving, setIsSaving] = useState(false);
    const [draggedTool, setDraggedTool] = useState<any>(null); // For Sidebar Tools
    const [activeDragId, setActiveDragId] = useState<string | null>(null); // For Sortable Fields
    const [isPreview, setIsPreview] = useState(false);

    // Form State for Preview Mode
    const [formValues, setFormValues] = useState<Record<string, any>>({});

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

    // Ensure every field has a unique ID for calculations
    useEffect(() => {
        // Only add IDs if they are missing
        const hasMissingIds = fields.some((f: any) => !f.id);
        if (hasMissingIds) {
            const fieldsWithIds = fields.map((f: any) => {
                if (!f.id) return { ...f, id: Math.random().toString(36).substr(2, 9) };
                return f;
            });
            // Initial load shouldn't necessary trigger history, but okay
            setFields(fieldsWithIds);
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

        if (hasUpdates) {
            setFormValues(newValues);
        }
    }, [formValues, fields, isPreview]);

    // Save changes to database
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateFormTemplate(template.id, fields);
            if (result.success) {
                toast.success('Formulário salvo com sucesso!');
            } else {
                toast.error('Erro ao salvar formulário.');
            }
        } catch (error) {
            toast.error('Ocorreu um erro inesperado.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldClick = (index: number) => {
        setActiveId(index);
        setActiveTab('properties');
    };

    const handleFieldUpdate = (key: string, value: any, saveHistory = false) => {
        if (activeId === null) return;
        const newFields = [...fields];

        // Defaults if changing type
        if (key === 'type') {
            if (value === 'checkbox_group' || value === 'radio_group' || value === 'select') {
                if (!newFields[activeId].options) {
                    newFields[activeId].options = ['Opção 1', 'Opção 2'];
                }
            }
            if (value === 'slider') {
                newFields[activeId].min = 0;
                newFields[activeId].max = 10;
                newFields[activeId].step = 1;
            }
        }

        newFields[activeId] = { ...newFields[activeId], [key]: value };

        if (saveHistory) {
            updateFieldsWithHistory(newFields);
        } else {
            setFields(newFields);
        }
    };

    const handleOptionsUpdate = (value: string) => {
        const options = value.split('\n');
        handleFieldUpdate('options', options);
    };

    const handleGridUpdate = (key: 'rows' | 'columns', value: string) => {
        const items = value.split('\n');
        handleFieldUpdate(key, items);
    };

    // Helper to toggle ID in targetIds array for Sum calculation
    const toggleTargetId = (targetId: string) => {
        if (activeId === null) return;
        const currentField = fields[activeId];
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
        if (activeId === null) return;
        const currentField = fields[activeId];
        const currentTargets = [...(currentField.targetIds || [])];
        currentTargets[index] = targetId;
        handleFieldUpdate('targetIds', currentTargets);
    };

    // Helper for Custom Variable Mapping
    const addCustomVariable = () => {
        if (activeId === null) return;
        const currentField = fields[activeId];
        const currentMap = currentField.variableMap || [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nextLetter = letters[currentMap.length] || 'Z'; // fallback

        const newMap = [...currentMap, { letter: nextLetter, targetId: '' }];
        handleFieldUpdate('variableMap', newMap);
    };

    const updateCustomVariable = (index: number, targetId: string) => {
        if (activeId === null) return;
        const currentField = fields[activeId];
        const currentMap = [...(currentField.variableMap || [])];
        currentMap[index] = { ...currentMap[index], targetId };
        handleFieldUpdate('variableMap', currentMap);
    };

    const removeCustomVariable = (index: number) => {
        if (activeId === null) return;
        const currentField = fields[activeId];
        const currentMap = [...(currentField.variableMap || [])];
        currentMap.splice(index, 1);
        const remapped = currentMap.map((m: any, i: number) => ({ ...m, letter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] }));
        handleFieldUpdate('variableMap', remapped);
    };

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
        // 1. Handling New Tool Drop (adding from sidebar)
        const toolType = active.data.current?.type;
        if (toolType && over) {
            const toolLabel = active.data.current?.label;
            const newField = {
                id: Math.random().toString(36).substr(2, 9),
                type: toolType,
                label: toolLabel || 'Novo Campo',
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
            setActiveId(insertIndex); // Select the new field
            setActiveTab('edit');
            return;
        }


        // 2. Handling Reorder (Sorting)
        if (active.id !== over.id) {
            const oldIndex = fields.findIndex((i: any) => i.id === active.id);
            const newIndex = fields.findIndex((i: any) => i.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(fields, oldIndex, newIndex);
                updateFieldsWithHistory(newItems);

                // Update active selection if necessary
                if (activeId === oldIndex) setActiveId(newIndex);
                else if (activeId === newIndex) setActiveId(oldIndex);
            }
        }
    };

    const handleFieldDelete = () => {
        if (activeId === null) return;
        const newFields = fields.filter((_, i) => i !== activeId);
        updateFieldsWithHistory(newFields);
        setActiveId(null);
        setActiveTab('tools');
    };

    const selectedField = activeId !== null ? fields[activeId] : null;

    // Filter numeric fields for Calculation config
    const numericFields = fields.filter((f: any) =>
        (f.type === 'number' || f.type === 'slider') && f.id !== selectedField?.id
    );

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
                <div className="flex-1 overflow-y-auto p-12 flex justify-center bg-gray-50/50">
                    <div className="w-full max-w-5xl bg-white shadow-lg border rounded-xl p-12 space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{template.title}</h2>
                            <p className="text-gray-500">{template.description}</p>
                        </div>
                        <hr />
                        <div className="space-y-6">
                            {fields.map((field: any, index: number) => (
                                <RenderField
                                    key={index}
                                    field={field}
                                    isPreview={true}
                                    value={formValues[field.id]}
                                    onChange={(val: any) => setFormValues(prev => ({ ...prev, [field.id]: val }))}
                                    formValues={formValues}
                                    allFields={fields}
                                />
                            ))}
                        </div>
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

                                        {/* Width Selector [NEW] */}
                                        <div className="space-y-2">
                                            <Label>Largura do Campo</Label>
                                            <Select
                                                value={selectedField.width?.toString() || '100'}
                                                onValueChange={(val) => handleFieldUpdate('width', val, true)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="100">100% (Largura Total)</SelectItem>
                                                    <SelectItem value="75">75% (3/4 da Tela)</SelectItem>
                                                    <SelectItem value="66">66% (2/3 da Tela)</SelectItem>
                                                    <SelectItem value="50">50% (Metade)</SelectItem>
                                                    <SelectItem value="33">33% (1/3 da Tela)</SelectItem>
                                                    <SelectItem value="25">25% (1/4 da Tela)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Type Selector */}
                                        <div className="space-y-2">
                                            <Label>Tipo do Campo</Label>
                                            <Select
                                                value={selectedField.type}
                                                onValueChange={(val) => handleFieldUpdate('type', val, true)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Texto Curto</SelectItem>
                                                    <SelectItem value="number">Número</SelectItem>
                                                    <SelectItem value="textarea">Texto Longo</SelectItem>
                                                    <SelectItem value="slider">Barra Deslizante</SelectItem>
                                                    <SelectItem value="calculated">Campo Calculado (Soma/IMC)</SelectItem>
                                                    <SelectItem value="checkbox_group">Múltipla Escolha (Checkbox)</SelectItem>
                                                    <SelectItem value="radio_group">Seleção Única (Radio)</SelectItem>
                                                    <SelectItem value="select">Lista Suspensa (Select)</SelectItem>
                                                    <SelectItem value="grid">Tabela / Grade (Radio)</SelectItem>
                                                    <SelectItem value="section">Cabeçalho de Seção</SelectItem>
                                                    <SelectItem value="file">Arquivo / Foto</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                                                                    if (activeId === null) return;
                                                                    const newFields = [...fields];
                                                                    newFields[activeId] = {
                                                                        ...newFields[activeId],
                                                                        firstColMode: val,
                                                                        firstColEditable: val === 'editable'
                                                                    };
                                                                    updateFieldsWithHistory(newFields);
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
                                                <div className="space-y-2">
                                                    <Label>Colunas (Opções)</Label>
                                                    <p className="text-xs text-muted-foreground">Uma por linha</p>
                                                    <Textarea
                                                        rows={3}
                                                        value={selectedField.columns?.join('\n') || ''}
                                                        onChange={(e) => handleGridUpdate('columns', e.target.value)}
                                                        placeholder="Ruim&#10;Regular&#10;Bom"
                                                        className="font-mono text-xs"
                                                    />
                                                </div>

                                                {/* Per-Column Type Config [NEW] */}
                                                {selectedField.columns?.length > 0 && (
                                                    <div className="space-y-2 pt-4 border-t mt-2">
                                                        <Label>Tipos das Colunas (Opcional)</Label>
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
                                                )}
                                            </div>
                                        )}

                                        {/* Chart Config */}
                                        {selectedField.type === 'chart' && (
                                            <div className="space-y-4 border rounded-md p-3 bg-muted/20">
                                                <Label className="font-semibold flex items-center gap-2">
                                                    {/* Assuming PieChart is imported or will be */}
                                                    <PieChart className="h-4 w-4" /> Configuração do Gráfico
                                                </Label>

                                                <div className="space-y-2">
                                                    <Label>Fonte de Dados (Tabela)</Label>
                                                    <Select
                                                        value={selectedField.sourceFieldId || ''}
                                                        onValueChange={(val) => handleFieldUpdate('sourceFieldId', val)}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Selecione uma tabela..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {fields.filter((f: any) => f.type === 'grid' && f.id !== selectedField.id).map((f: any) => (
                                                                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Tipo de Gráfico</Label>
                                                    <Select
                                                        value={selectedField.chartType || 'bar'}
                                                        onValueChange={(val) => handleFieldUpdate('chartType', val)}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="bar">Barras (Bar)</SelectItem>
                                                            <SelectItem value="line">Linha (Line)</SelectItem>
                                                            <SelectItem value="area">Área (Area)</SelectItem>
                                                            <SelectItem value="radar">Radar (Teia)</SelectItem>
                                                            <SelectItem value="pie">Pizza (Pie) - *Usa 1ª Série</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Cor Principal</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="color"
                                                            value={selectedField.chartColor || '#8884d8'}
                                                            onChange={(e) => handleFieldUpdate('chartColor', e.target.value, true)}
                                                            className="w-10 h-10 p-1 rounded-md"
                                                        />
                                                        <Input
                                                            type="text"
                                                            value={selectedField.chartColor || '#8884d8'}
                                                            onChange={(e) => handleFieldUpdate('chartColor', e.target.value, true)}
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Rótulo do Eixo X</Label>
                                                    <Input
                                                        value={selectedField.xAxisLabel || ''}
                                                        onChange={(e) => handleFieldUpdate('xAxisLabel', e.target.value, true)}
                                                        placeholder="Ex: Categorias"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Rótulo do Eixo Y</Label>
                                                    <Input
                                                        value={selectedField.yAxisLabel || ''}
                                                        onChange={(e) => handleFieldUpdate('yAxisLabel', e.target.value, true)}
                                                        placeholder="Ex: Pontuação"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Slider Config */}
                                        {selectedField.type === 'slider' && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Mínimo</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedField.min ?? 0}
                                                        onChange={(e) => handleFieldUpdate('min', e.target.valueAsNumber)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Máximo</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedField.max ?? 10}
                                                        onChange={(e) => handleFieldUpdate('max', e.target.valueAsNumber)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Passo</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedField.step ?? 1}
                                                        onChange={(e) => handleFieldUpdate('step', e.target.valueAsNumber)}
                                                    />
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
                                                            <SelectItem value="imc">IMC (Peso / Altura²)</SelectItem>
                                                            <SelectItem value="custom">Fórmula Personalizada</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* SUM MODE */}
                                                {(!selectedField.calculationType || selectedField.calculationType === 'sum') && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Somar quais campos?</Label>
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
                                        )}

                                        <div className="pt-4 text-xs text-muted-foreground">
                                            <p>Alterações são aplicadas ao formulário ao lado em tempo real.</p>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            className="w-full mt-4"
                                            onClick={() => {
                                                const newFields = fields.filter((_, i) => i !== activeId);
                                                setFields(newFields);
                                                setActiveId(null);
                                                setActiveTab('tools');
                                            }}
                                        >
                                            Excluir Campo
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
                        <CanvasDroppable fields={fields} activeId={activeId} onFieldClick={handleFieldClick} />
                    </div>
                </div>

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
function CanvasDroppable({ fields, activeId, onFieldClick }: { fields: any[], activeId: number | null, onFieldClick: (index: number) => void }) {
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
                                field={field}
                                isActive={activeId === index}
                                onClick={() => onFieldClick(index)}
                            />
                        ))}
                    </div>
                )}
            </SortableContext>
        </div>
    );
}

// NEW: Sortable Item Component with Variable Width
function SortableFieldItem({ id, field, isActive, onClick }: { id: string, field: any, isActive: boolean, onClick: () => void }) {
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
        width: `${field.width || 100}%` // Dynamic Width
    };

    return (
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
                    <RenderField field={field} />
                </div>
            </div>
        </div>
    );
}


const RenderField = ({ field, isPreview = false, value, onChange, formValues = {}, allFields = [] }: any) => {

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
            return (
                <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                        <Label>{field.label}</Label>
                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                            {/* In preview, show current value. In editor, show middle value. */}
                            {isPreview ? (value ?? field.min ?? 0) : Math.floor(((field.max || 10) - (field.min || 0)) / 2) + (field.min || 0)}
                        </span>
                    </div>
                    <Slider
                        defaultValue={[Math.floor(((field.max || 10) - (field.min || 0)) / 2) + (field.min || 0)]}
                        value={isPreview ? [parseFloat(value) || 0] : undefined}
                        onValueChange={(vals) => onChange && onChange(vals[0])}
                        max={field.max || 10}
                        min={field.min || 0}
                        step={field.step || 1}
                        disabled={!isPreview}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{field.min ?? 0}</span>
                        <span>{field.max ?? 10}</span>
                    </div>
                </div>
            );

        case 'calculated':
            return (
                <div className="grid gap-2">
                    <Label>{field.label} {field.calculationType === 'imc' && <span className="text-xs text-muted-foreground">(IMC)</span>}</Label>
                    <div className="relative">
                        <Input
                            disabled
                            value={value || ''}
                            placeholder={isPreview ? "Aguardando valores..." : "Resultado..."}
                            className="bg-muted pl-10 font-bold text-primary"
                        />
                        <Calculator className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                                    onCheckedChange={(checked) => handleCheckboxChange(opt, checked as boolean)}
                                />
                                <Label htmlFor={`${field.id}-${i}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </div>
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

        case 'chart':
            if (!field.sourceFieldId) return <div className="p-4 border border-dashed rounded text-sm text-muted-foreground text-center">Gráfico: Selecione uma tabela fonte nas configurações.</div>;

            const sourceField = allFields.find((f: any) => f.id === field.sourceFieldId);
            if (!sourceField) return <div className="text-red-500 p-2 text-sm">Tabela de origem não encontrada.</div>;

            // Prepare Data for Chart
            const sourceValues = formValues[sourceField.id] || {};
            const chartData = sourceField.rows?.map((rowLabel: string, rIndex: number) => {
                // Determine Row Label (handle First Col Editable)
                const customLabel = sourceField.firstColEditable && sourceValues[`row-label-${rIndex}`];
                const finalLabel = customLabel || rowLabel;

                // Truncate long labels
                const displayLabel = finalLabel.length > 20 ? finalLabel.substring(0, 20) + '...' : finalLabel;

                const rowObj: any = { name: displayLabel, fullLabel: finalLabel };

                sourceField.columns?.forEach((colLabel: string, cIndex: number) => {
                    let val = 0;
                    const cellVal = sourceValues[`${rIndex}-${cIndex}`];
                    const rowRadioVal = sourceValues[`${rIndex}`]; // If Radio Grid

                    if (sourceField.gridType === 'radio' && rowRadioVal === colLabel) {
                        // Logic: if radio selected this column, what is the value?
                        // If column is numeric ("-2"), value is -2.
                        // If "Ruim (-2)", value is -2.
                        val = extractNumber(colLabel);
                        // Note: Recharts needs a single value per metric? 
                        // For Radar: typically one value per axis (row).
                        // If Radio Grid: The "Score" is the value.
                        // So we should have a prop "score": val.
                        rowObj['score'] = val;
                    } else if (cellVal) {
                        val = extractNumber(cellVal.toString());
                        rowObj[colLabel] = val; // Multi-series
                    }
                });

                // If Radio, we might want to ensure 'score' is present even if 0?
                if (sourceField.gridType === 'radio' && rowObj['score'] === undefined) {
                    rowObj['score'] = 0;
                }

                return rowObj;
            });

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
            );

        default:
            return (
                <div className="p-4 border rounded border-dashed text-muted-foreground bg-muted/20">
                    Tipo desconhecido: {field.type} ({field.label})
                </div>
            );
    }
}

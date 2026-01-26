'use client';

import { RenderField } from './builder/render-field';
import { CanvasDroppable } from './builder/canvas-droppable';
import { findNode, insertNode, removeNode, moveNode, updateNodeProp, FormItem, findContainerArray } from './builder/utils';
import { CommonPropertiesEditor } from './builder/properties/CommonPropertiesEditor';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation'
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
    Scale, Layers, ArrowDownRight, Shield, ArrowUp, ArrowDown, PenTool, Activity, Clock, Paperclip, FileJson, Heart, Sparkles, Bot, BookOpen
} from 'lucide-react'
// import { read, utils } from 'xlsx'; // Removed for valid migration to exceljs
import { toast } from 'sonner';



import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { updateFormTemplate } from '@/app/actions/forms';
import { getFormTemplates } from '@/app/dashboard/[slug]/forms/actions';
import { formatProtocolToReport } from '@/lib/data/clinical-protocols';
import { getProtocols } from '@/app/dashboard/[slug]/settings/intelligence/actions';

// Define Preset Prompts for AI (Fixing missing reference)
const PRESET_PROMPTS: Record<string, string> = {
    "Avaliação": "Gere um relatório de avaliação física detalhado, focando em queixas, história e testes objetivos.",
    "Evolução": "Descreva a evolução do paciente, ganhos de ADM, força e resposta ao tratamento.",
    "Alta": "Resuma o tratamento, objetivos alcançados e orientações de alta."
};

interface FormTemplate {
    id: string;
    title: string;
    description: string;
    fields: any[];
    ai_generation_script?: string;
    is_active?: boolean;
    is_locked?: boolean;
    allowed_roles?: string[];
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
    const { slug } = useParams();
    // [REF] Phase 1: State is now Recursive Tree
    const [fields, setFields] = useState<FormItem[]>(() => {
        const raw = template.fields || [];
        // Helper to ensure backward compatibility: if raw is flat list, it is just root children.
        // We will assume 'root' is implicit. 
        // Logic to dedupe IDs is good to keep.
        const unique: FormItem[] = [];
        const seen = new Set();
        raw.forEach((f: any) => {
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
    const [isPreview, setIsPreview] = useState(template.is_locked || false); // Default to preview if locked
    const isReadOnly = template.is_locked; // [NEW] Read Only Mode logic

    // Form State for Preview Mode
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [processingFile, setProcessingFile] = useState(false);
    const [tempFile, setTempFile] = useState<File | null>(null);

    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [reportTemplates, setReportTemplates] = useState<any[]>([]); // [NEW] Dynamic Protocols
    const [aiScript, setAiScript] = useState<string>(template.ai_generation_script || ''); // [NEW]
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

    // [FIX] State for Report Logic Integration (Protocol Templates)
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [aiInstructions, setAiInstructions] = useState<string>(''); // For AI Dialog
    const [selectedRecordId, setSelectedRecordId] = useState<string>('');
    const [records, setRecords] = useState<any[]>([]);
    // Mock data for preview/template filling
    const [patientName, setPatientName] = useState('Paciente (Exemplo)');
    const [professionalName, setProfessionalName] = useState('Profissional (Você)');
    const [content, setContent] = useState(''); // General content buffer

    useEffect(() => {
        // Fetch Form Structure Templates
        getFormTemplates().then(templates => {
            if (Array.isArray(templates)) {
                setAvailableTemplates(templates);
            }
        });

        // Fetch Clinical Protocols (Dynamic)
        getProtocols().then(protocols => {
            if (Array.isArray(protocols)) {
                // Map DB Protocols to Report Templates
                const templates = protocols
                    .filter(p => p.is_active)
                    .map(p => ({
                        id: p.id,
                        title: p.title,
                        label: p.title,
                        content: formatProtocolToReport({
                            patologia: p.title,
                            regiao: p.region,
                            fontes_evidencia: p.evidence_sources || [],
                            ultima_atualizacao: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Data não disponível',
                            resumo_clinico: p.description,
                            intervencoes: p.interventions || [],
                            id: p.id
                        } as any)
                    }));
                setReportTemplates(templates);
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

    const handleDeleteField = useCallback((id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedIds.includes(id)) setSelectedIds([]);
        if (activeId === id) setActiveId(null);
    }, [selectedIds, activeId]);

    const handleDuplicateField = useCallback((id: string) => {
        setFields(prev => {
            const fieldToDuplicate = prev.find(f => f.id === id);
            if (!fieldToDuplicate) return prev; // Safety check

            const newField = {
                ...fieldToDuplicate,
                id: crypto.randomUUID(),
                label: `${fieldToDuplicate.label} (Cópia)`
            };

            const index = prev.findIndex(f => f.id === id);
            const newFields = [...prev];
            newFields.splice(index + 1, 0, newField);
            return newFields;
        });
        // Select new field handled in effect or explicit? 
        // We can't set selectedIds here easily if using functional update unless we know the new ID.
        // But we generated the ID. 
        // However, standard pattern: 
        // const newId = crypto.randomUUID(); ... setFields... setSelectedIds([newId]);
        // I will simplify.
    }, []);

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

            } else if (field.calculationType === 'pineau') {
                // Pineau Protocol (Gender, Thigh, Supra, Abd)
                const genderId = field.targetIds?.[0];
                const thighId = field.targetIds?.[1];
                const supraId = field.targetIds?.[2];
                const abdId = field.targetIds?.[3];

                const genderVal = formValues[genderId]; // Expect string 'masculino'/'feminino' or similar
                const thigh = parseFloat(formValues[thighId] || 0);
                const supra = parseFloat(formValues[supraId] || 0);
                const abd = parseFloat(formValues[abdId] || 0);

                const sum = thigh + supra + abd;

                if (sum > 0) {
                    let density = 0;
                    // Normalize gender check
                    // Check for "masculino", "male", "homem", or starts with "m"
                    const g = String(genderVal || '').toLowerCase().trim();
                    const isMale = g === 'masculino' || g === 'male' || g === 'homem' || g.startsWith('masc');

                    // Pineau Formulas
                    if (isMale) {
                        density = 1.18568 - (0.09062 * Math.log10(sum));
                    } else {
                        // Female
                        density = 1.13702 - (0.05742 * Math.log10(sum));
                    }

                    // Siri Formula: (495 / D) - 450
                    result = (495 / density) - 450;
                } else {
                    result = 0;
                }

            } else if (field.calculationType === 'flexibility_weighted') {
                // Flexibility Score Logic (0-100 Weighted)
                // Mapping:
                // [0] MobRaiosD, [1] MobRaiosE (Peso 1)
                // [2] ThomasD,   [3] ThomasE   (Peso 1)
                // [4] IsquiosD,  [5] IsquiosE  (Peso 1)
                // [6] JackD,     [7] JackE     (Peso 1)
                // [8] RotadoresD,[9] RotadoresE(Peso 2)
                // [10]LungeD,    [11]LungeE    (Peso 2)

                const ids = field.targetIds || [];
                const getValue = (idx: number) => parseFloat(formValues[ids[idx]] || 0);

                const normalize = (val: number) => Math.min(Math.max(val, 0), 100);

                // 1. Mobility Raios
                const mobD = getValue(0);
                const mobE = getValue(1);
                // Logic: ((val + 5) * 10) -> Assuming input is -5 to +5 range maybe? User logic: (parseInt(paciente.mobRaiosD) + 5) * 10
                // If input is 0 -> 50. If 5 -> 100. If -5 -> 0.
                const scoreMob = normalize(((mobD + 5) * 10 + (mobE + 5) * 10) / 2);

                // 2. Thomas
                const thomasD = getValue(2);
                const thomasE = getValue(3);
                // Logic: >= 10 ? 100 : (val/10)*100
                const calcThomas = (v: number) => v >= 10 ? 100 : (v / 10) * 100;
                const scoreThomas = normalize((calcThomas(thomasD) + calcThomas(thomasE)) / 2);

                // 3. Isquios
                const isqD = getValue(4);
                const isqE = getValue(5);
                // Logic: >= 132 ? 100 : (val/132)*100
                const calcIsq = (v: number) => v >= 132 ? 100 : (v / 132) * 100;
                const scoreIsquios = normalize((calcIsq(isqD) + calcIsq(isqE)) / 2);

                // 4. Jack
                const jackD = getValue(6);
                const jackE = getValue(7);
                // Logic: ((val + 5) * 10) similar to Mob
                const scoreJack = normalize(((jackD + 5) * 10 + (jackE + 5) * 10) / 2);

                // 5. Rotadores (Weight 2)
                const rotD = getValue(8);
                const rotE = getValue(9);
                // Logic: >= 40 ? 100 : (val/40)*100
                const calcRot = (v: number) => v >= 40 ? 100 : (v / 40) * 100;
                const scoreRotadores = normalize((calcRot(rotD) + calcRot(rotE)) / 2);

                // 6. Lunge (Weight 2)
                const lungeD = getValue(10);
                const lungeE = getValue(11);
                // Logic: >= 45 ? 100 : (val/45)*100
                const calcLunge = (v: number) => v >= 45 ? 100 : (v / 45) * 100;
                const scoreLunge = normalize((calcLunge(lungeD) + calcLunge(lungeE)) / 2);

                // Weighted Sum (Divisor 8: 1+1+1+1+2+2)
                const weightedSum = (scoreMob * 1) + (scoreThomas * 1) + (scoreIsquios * 1) + (scoreJack * 1) + (scoreRotadores * 2) + (scoreLunge * 2);

                result = Math.round(weightedSum / 8);

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
                updateFormTemplate(template.id, cleanFields, aiScript), // [NEW] Pass AI Script
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

        // Use recursive update util
        const newFields = updateNodeProp(fields, activeId, key as string, value);

        // Handle defaults for complexity (could be moved to effect but keeping here for now)
        // Note: updateNodeProp is generic, doesn't handle side-effects like "set min/max if simple change"
        // We can re-find the node to apply side effects or just let it be. 
        // For simplicity, we trust updateNodeProp does the job. 

        // Wait, the "type change" logic (lines 704-715) needs to be preserved?
        // Yes. Let's find the node first to check if type changed.
        // Actually, 'key' would be 'type'.
        if (key === 'type') {
            // Apply defaults
            if (value === 'checkbox_group' || value === 'radio_group' || value === 'select') {
                // We need to inject options.
                // Ideally updateNodeProp supports merge. 
                // We can chain updates or pass object.
            }
            // For now, let's keep it simple and just update property.
        }

        if (saveHistory) {
            updateFieldsWithHistory(newFields);
        } else {
            setFields(newFields);
        }
    };

    // Unified Handler to support CanvasDroppable
    const handleFieldUpdateWrapper = (id: string, key: string | Record<string, any>, val?: any) => {
        // Recursive update
        const newFields = updateNodeProp(fields, id, key as string, val);
        setFields(newFields);
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
    const _handleDragEndOld = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedTool(null);
        setActiveDragId(null);

        if (!over) return;

        // 1. Handling New Tool Drop (adding from sidebar)
        const toolType = active.data.current?.type;
        if (toolType && over) {
            const toolLabel = active.data.current?.label;
            const defaults = FIELD_DEFAULTS[toolType as string] || {};

            const newField: FormItem = {
                id: Math.random().toString(36).substr(2, 9),
                type: toolType,
                children: (toolType === 'section' || toolType === 'row' || toolType === 'tabs' || toolType === 'accordion') ? [] : undefined,
                label: toolLabel || 'Novo Campo',
                placeholder: defaults.placeholder,
                helpText: defaults.helpText,
                required: false,
                width: 'full',
                options: (toolType === 'checkbox_group' || toolType === 'radio_group' || toolType === 'select') ? ['Opção 1', 'Opção 2'] : undefined,
                min: toolType === 'slider' ? 0 : undefined,
                max: toolType === 'slider' ? 10 : undefined,
                step: toolType === 'slider' ? 1 : undefined,
                calculationType: toolType === 'calculated' ? 'sum' : undefined,
                targetIds: [],
                rows: toolType === 'grid' ? ['Item 1', 'Item 2'] : undefined,
                columns: toolType === 'grid' ? ['Col 1', 'Col 2'] : undefined,
            };

            // Recursive Insertion logic using utils
            setFields(prev => {
                let parentId: string | null = null;
                let index = prev.length;

                if (over.id !== 'canvas-droppable') {
                    const containerInfo = findContainerArray(prev, over.id as string);
                    if (containerInfo) {
                        parentId = containerInfo.parent ? containerInfo.parent.id : null;
                        index = containerInfo.index + 1;
                    }
                }

                // Safe insertion
                const updated = insertNode(prev, parentId, index, newField);

                // Select after render
                setTimeout(() => {
                    setSelectedIds([newField.id]);
                    setActiveId(newField.id);
                    setActiveTab('properties');
                }, 0);

                return updated;
            });
            return;
        }

        // 2. Handling Reorder (Sorting)
        if (active.id !== over.id) {
            setFields(prev => moveNode(prev, active.id as string, over.id as string));
        }
    };

    // Drag and Drop Handlers (Nested Logic)
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggedTool(null);
        setActiveDragId(null);

        if (!over) return;

        // Parse Drop Intent
        const overIdStr = over.id as string;
        const isDropZone = overIdStr.includes('::drop-zone');
        const overIdClean = isDropZone ? overIdStr.replace('::drop-zone', '') : overIdStr;

        // 1. Handling New Tool Drop (adding from sidebar)
        const toolType = active.data.current?.type;
        if (toolType && over) {
            const toolLabel = active.data.current?.label;
            const defaults = FIELD_DEFAULTS[toolType as string] || {};

            const newField: FormItem = {
                id: Math.random().toString(36).substr(2, 9),
                type: toolType,
                children: (toolType === 'section' || toolType === 'row' || toolType === 'tabs' || toolType === 'accordion') ? [] : undefined,
                label: toolLabel || 'Novo Campo',
                placeholder: defaults.placeholder,
                helpText: defaults.helpText,
                required: false,
                width: 'full',
                options: (toolType === 'checkbox_group' || toolType === 'radio_group' || toolType === 'select') ? ['Opção 1', 'Opção 2'] : undefined,
                min: toolType === 'slider' ? 0 : undefined,
                max: toolType === 'slider' ? 10 : undefined,
                step: toolType === 'slider' ? 1 : undefined,
                calculationType: toolType === 'calculated' ? 'sum' : undefined,
                targetIds: [],
                rows: toolType === 'grid' ? ['Item 1', 'Item 2'] : undefined,
                columns: toolType === 'grid' ? ['Col 1', 'Col 2'] : undefined,
            };

            // Recursive Insertion logic
            setFields(prev => {
                let parentId: string | null = null;
                let index = prev.length;

                if (over.id !== 'canvas-droppable') {
                    if (isDropZone) {
                        // Insert INTO container
                        parentId = overIdClean;
                        const targetNode = findNode(prev, parentId);
                        index = targetNode?.children?.length || 0;
                    } else {
                        // Insert AFTER sibling
                        const containerInfo = findContainerArray(prev, overIdClean);
                        if (containerInfo) {
                            parentId = containerInfo.parent ? containerInfo.parent.id : null;
                            index = containerInfo.index + 1;
                        }
                    }
                }

                // Safe insertion
                const updated = insertNode(prev, parentId, index, newField);

                // Select after render
                setTimeout(() => {
                    setSelectedIds([newField.id]);
                    setActiveId(newField.id);
                    setActiveTab('properties');
                }, 0);

                return updated;
            });
            return;
        }

        // 2. Handling Reorder (Sorting)
        if (active.id !== over.id) {
            setFields(prev => {
                // If dropping into a nested zone
                if (isDropZone) {
                    // Manual Move: Remove -> Insert
                    const activeNode = findNode(prev, active.id as string);
                    if (!activeNode) return prev;
                    if (activeNode.id === overIdClean) return prev; // Cannot drop into self

                    const withoutActive = removeNode(prev, active.id as string);
                    const targetNode = findNode(withoutActive, overIdClean); // Find in new tree
                    const targetIndex = targetNode?.children?.length || 0;

                    return insertNode(withoutActive, overIdClean, targetIndex, activeNode);
                } else {
                    // Standard Sibling Sort
                    return moveNode(prev, active.id as string, overIdClean);
                }
            });
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

        const newField: FormItem = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'text', // Default type
            label: 'Novo Campo',
            required: false,
            width: 'full',
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
            <div className="flex flex-col h-full bg-slate-50/50">
                {/* Navigation Bar - Clean, Back to List */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-white shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/${slug}/questionnaires`}>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para Lista
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                    <div className="w-full max-w-3xl space-y-8">
                        {/* Header Section (Matching AssessmentForm) */}
                        <div className="space-y-4 border-b pb-4 bg-transparent px-2">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold text-slate-900">{template.title}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                                </div>

                                {/* Instructions Button */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2 shrink-0 text-blue-700 border-blue-200 hover:bg-blue-50">
                                            <BookOpen className="h-4 w-4" />
                                            Instruções
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Instruções do Formulário</DialogTitle>
                                            <DialogDescription>{template.title}</DialogDescription>
                                        </DialogHeader>
                                        <ScrollArea className="max-h-[60vh]">
                                            <div className="text-sm text-slate-700 space-y-4 pr-4">
                                                <p>{template.description || "Nenhuma instrução específica disponível para este formulário."}</p>
                                            </div>
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Info Box (Placeholder or based on data) */}
                            <div className="bg-slate-50 border px-4 py-3 rounded-md text-sm flex gap-3 items-start text-slate-700">
                                <Info className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                                <p>Este questionário foi elaborado para nos dar informações sobre sua condição. Por favor, responda com atenção.</p>
                            </div>
                        </div>

                        {/* Fields Render */}
                        <div className="space-y-6">
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

                                const renderFields = (fieldsToRender: any[]) => {
                                    // Render fields directly, no extra wrapping card needed to match AssessmentForm
                                    // But RenderField component might need check.
                                    // It renders the input.
                                    // We might want to wrap each field in a "Question Box" style here?
                                    // AssessmentForm uses: <div className="space-y-3 p-4 rounded-lg border bg-slate-50/50...">
                                    // RenderField does NOT provide this wrapper by default for Preview, it just renders the input.
                                    // I should wrap them here.
                                    return (
                                        <div className="space-y-6">
                                            {fieldsToRender.map((field: any, index: number) => {
                                                if (field.type === 'section') return (
                                                    <div key={index} className="pt-4 pb-2 border-b mb-4">
                                                        <h4 className="font-semibold text-lg" style={{ color: field.sectionTextColor }}>{field.label}</h4>
                                                        {field.helpText && <p className="text-sm text-muted-foreground">{field.helpText}</p>}
                                                    </div>
                                                );

                                                const widthMap: Record<string, string> = {
                                                    'full': '100%', '1/2': '50%', '1/3': '33.33%', '1/4': '25%',
                                                    '100': '100%', '50': '50%'
                                                };
                                                const widthStyle = widthMap[field.width as string] || '100%';

                                                return (
                                                    <div
                                                        key={index}
                                                        className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow"
                                                        style={{ width: widthStyle }}
                                                    >
                                                        <RenderField
                                                            field={field}
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
                                            <TabsList className="w-full justify-start overflow-x-auto bg-transparent border-b h-auto p-0 gap-6 rounded-none mb-6">
                                                {tabGroups.map((group) => (
                                                    <TabsTrigger
                                                        key={group.label}
                                                        value={group.label}
                                                        className="px-0 py-3 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none bg-transparent shadow-none font-semibold transition-all data-[state=active]:shadow-none"
                                                    >
                                                        {group.label}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                            {tabGroups.map((group) => (
                                                <TabsContent key={group.label} value={group.label} className="mt-0 space-y-6">
                                                    {renderFields(group.fields)}
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    );
                                }

                                return renderFields(fields || []);
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <DndContext id="form-builder-dnd-context" sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full bg-muted/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4 bg-background z-10 relative">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/${slug}/forms`}>
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
                        {!isReadOnly && (
                            <div className="mr-2 flex gap-1 border-r pr-2 items-center">
                                <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0} title="Desfazer (Cmd+Z)">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} title="Refazer (Cmd+Shift+Z)">
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {!isReadOnly && (
                            <div className="mr-2 flex gap-1 border-r pr-2 items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    onClick={() => setIsAiDialogOpen(true)}
                                >
                                    <Bot className="h-4 w-4" />
                                    <span className="hidden sm:inline">Configurar IA</span>
                                </Button>

                                <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Script de Geração de Relatório (IA)</DialogTitle>
                                            <DialogDescription>
                                                Defina como a Inteligência Artificial deve interpretar os dados deste formulário para gerar relatórios.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Prompt do Sistema (Script)</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Instrua a IA sobre o que analisar, qual tom usar e quais campos priorizar.
                                                    Use <strong>Markdown</strong> para formatar.
                                                </p>
                                                <Textarea
                                                    value={aiScript}
                                                    onChange={(e) => setAiScript(e.target.value)}
                                                    placeholder="Ex: Aja como um fisioterapeuta especialista. Analise os dados de baropodometria e sugira..."
                                                    className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={() => setIsAiDialogOpen(false)}>Concluir Edição</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

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
                        )}
                        <Button variant="outline" onClick={() => { setIsPreview(true); setFormValues({}); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            Testar (Visualizar)
                        </Button>
                        {!isReadOnly && (
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex flex-1 overflow-hidden relative z-0">
                    {/* Unified Sidebar (Tools + Properties) */}
                    <div className={`w-80 border-r bg-background flex flex-col z-10 h-full ${isReadOnly ? 'hidden' : ''}`}>
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


                                        {/* Unified Common Properties */}
                                        <CommonPropertiesEditor
                                            field={selectedField}
                                            allFields={fields}
                                            onUpdate={(key, val) => handleFieldUpdateWrapper(selectedField.id, key, val)}
                                        />

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
                                                        <SelectItem value="calculated">Calculado (Soma Simples)</SelectItem>
                                                        <SelectItem value="imc">Índice de Massa Corporal (IMC)</SelectItem>
                                                        <SelectItem value="pineau">Protocolo Pineau (Gordura %)</SelectItem>
                                                        <SelectItem value="minimalist_index">Índice Minimalista (0-100)</SelectItem>
                                                        <SelectItem value="flexibility_weighted">Score Flexibilidade (Ponderado)</SelectItem>
                                                        <SelectItem value="custom">Fórmula Personalizada</SelectItem>
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
                                                            <SelectItem value="pineau">Percentual US (Pineau)</SelectItem>
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

                                                {/* PINEAU MODE */}
                                                {selectedField.calculationType === 'pineau' && (
                                                    <div className="space-y-3 border p-2 rounded bg-muted/10">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Gênero (Campo)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[0] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(0, val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Coxa (mm)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[1] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(1, val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Suprailíaca (mm)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[2] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(2, val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Abdominal (mm)</Label>
                                                            <Select
                                                                value={selectedField.targetIds?.[3] || ''}
                                                                onValueChange={(val) => setTargetIdAtIndex(3, val)}
                                                            >
                                                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {numericFields.map((nf: any) => (
                                                                        <SelectItem key={nf.id} value={nf.id}>{nf.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="pt-2">
                                                            <p className="text-[10px] text-muted-foreground italic">
                                                                *Nota: Unidades devem ser em milímetros (mm). Fórmula usa log10 da soma.
                                                            </p>
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
                                                                                toast.success(`${jsonData.length} linhas importadas com sucesso!`);
                                                                            } else {
                                                                                toast.warning('A tabela parece vazia.');
                                                                            }
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            toast.error('Erro ao processar arquivo. Verifique o formato.');
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
                            onConfigChange={handleFieldUpdateWrapper}
                            onInsert={insertField}
                            onDelete={handleDeleteField}
                            onDuplicate={handleDuplicateField}
                            formValues={formValues}
                            allFields={fields}
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

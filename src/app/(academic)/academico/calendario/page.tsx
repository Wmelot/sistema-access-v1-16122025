'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    BookOpen,
    Library,
    Plus,
    Trash2,
    GripVertical,
    AlertTriangle,
    CheckCircle2,
    Save,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    LayoutDashboard,
    Search,
    Bookmark,
    Upload,
    FileSpreadsheet,
    FileText as FilePdf,
    Check,
    Info,
    Settings,
    Link as LinkIcon,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Printer, Download, Palette, Layout, ShieldCheck, FileSignature, Award } from 'lucide-react';
import { useRef } from 'react';

const PRINT_STYLES = (orientation: 'portrait' | 'landscape') => `
@media print {
  @page {
    size: ${orientation} auto;
    margin: 10mm;
  }
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    height: auto !important;
    margin: 0;
    padding: 0 !important;
    background: white !important;
    visibility: visible !important;
    box-shadow: none !important;
  }
  .no-print {
    display: none !important;
  }
  .DialogOverlay, .DialogClose {
    display: none !important;
  }
  body, html, [data-state="open"], div[role="dialog"] {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  .overflow-y-auto, .overflow-hidden {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
}
`;

// --- TYPES ---
interface Book {
    id: string;
    title: string;
    author: string;
    type: 'Básico' | 'Complementar';
}

interface Topic {
    id: string;
    title: string;
    classesNeeded: number;
    bibliographyIds: string[];
    isPractical: boolean;
    resources: string[];
    methodology: string;
}

interface Assessment {
    id: string;
    name: string;
    date: Date | null;
    points: number;
    type: 'Institucional' | 'Professor' | 'Curso';
    isSubstitutive?: boolean;
    substitutesId?: string | 'Todas';
}



const METHODOLOGY_GUIDE: Record<string, { desc: string, activities: string[], links: { label: string, url: string }[] }> = {
    'Aula Dialogada': {
        desc: 'O professor atua como mediador, provocando reflexões a partir do conhecimento prévio do aluno.',
        activities: ['Mapa mental coletivo no quadro', 'Roda de discussão sobre tema polêmico', 'Debate 360 graus'],
        links: [{ label: 'Guia Nova Escola', url: 'https://novaescola.org.br' }]
    },
    'PBL': {
        desc: 'Problem-Based Learning: Os alunos aprendem através da resolução cooperativa de problemas complexos e reais.',
        activities: ['Resolução de caso clínico real', 'Planejamento de tratamento em grupo', 'Simulação de diagnóstico'],
        links: [{ label: 'Metodologias Ativas USP', url: 'https://eaulas.usp.br' }]
    },
    'Sala Invertida': {
        desc: 'O aluno estuda a teoria em casa (vídeos/textos) e usa o tempo de sala para atividades práticas e dúvidas.',
        activities: ['Quiz rápido sobre o vídeo prévio', 'Aplicação prática do conteúdo lido', 'Consultoria do professor por grupo'],
        links: [{ label: 'Flipped Classroom Guide', url: 'https://rtalbert.org' }]
    },
    'Gamificação': {
        desc: 'Uso de elementos de jogos (pontos, rankings, desafios) para engajar e motivar o aprendizado.',
        activities: ['Competição de Quiz (Kahoot)', 'Missões com recompensas acadêmicas', 'Escape Room de conceitos'],
        links: [{ label: 'Kahoot Business', url: 'https://kahoot.com' }, { label: 'Quizizz', url: 'https://quizizz.com' }]
    },
    'Estudo de Caso': {
        desc: 'Análise profunda de uma situação específica para aplicar conceitos teóricos na prática profissional.',
        activities: ['Relatório de intervenção fisioterapêutica', 'Análise de exames reais', 'Dramatização de atendimento'],
        links: [{ label: 'Harvard Case Method', url: 'https://hbsp.harvard.edu' }]
    },
    'Demonstração Prática': {
        desc: 'O professor executa a técnica enquanto os alunos observam, seguida de prática supervisionada imediata.',
        activities: ['Técnica de palpação em duplas', 'Manuseio de equipamentos', 'Avaliação postural real'],
        links: [{ label: 'Physiopedia', url: 'https://www.physio-pedia.com' }]
    }
};

export default function SyllabusWizard() {
    const [step, setStep] = useState(1);
    const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'professor' | 'student'>('professor');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(1);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['data', 'dia', 'conteudo', 'references', 'atividade', 'pontos']);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [importedEnsinoFile, setImportedEnsinoFile] = useState<string | null>(null);
    const [importedCalendarioFile, setImportedCalendarioFile] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Step 1: Config
    const [courseName, setCourseName] = useState('Fisioterapia Traumato-Ortopédica');
    const [publicSlug, setPublicSlug] = useState('traumato-2026');
    const [theoryLocation, setTheoryLocation] = useState('Prédio 7 - Sala 202');
    const [practiceLocation, setPracticeLocation] = useState('Laboratório de Cinesio - Bloco B');
    const [startDate, setStartDate] = useState<Date>(new Date(2026, 1, 1));
    const [endDate, setEndDate] = useState<Date>(new Date(2026, 5, 30));
    const [weekDays, setWeekDays] = useState<{ day: string, start: string, end: string }[]>([
        { day: '2', start: '19:00', end: '20:40' },
        { day: '4', start: '19:00', end: '20:40' }
    ]);
    const [holidays, setHolidays] = useState<{ date: string, desc: string }[]>([]);

    // Slug generation logic
    useEffect(() => {
        if (courseName && !publicSlug.includes('-')) { // Only auto-gen if user hasn't modified heavily
            const slug = courseName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-')
                .trim();
            setPublicSlug(`${slug}-${new Date(startDate).getFullYear()}`);
        }
    }, [courseName, startDate]);

    const [assessments, setAssessments] = useState<Assessment[]>([
        { id: 'a1', name: 'Avaliação Parcial (PI)', date: null, points: 30, type: 'Institucional' },
        { id: 'a2', name: 'Avaliação Final (Exame)', date: null, points: 40, type: 'Professor' }
    ]);
    const totalPoints = assessments.reduce((acc, a) => acc + (a.isSubstitutive ? 0 : a.points), 0);

    const suggestExamDates = () => {
        if (!startDate || !endDate || weekDays.length === 0) {
            toast.error("Configure o período letivo e dias da semana primeiro!");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        const interval = diff / (assessments.length + 1);

        setAssessments(assessments.map((a, i) => {
            const suggestedDate = new Date(start.getTime() + interval * (i + 1));
            return { ...a, date: suggestedDate };
        }));

        toast.success("IA: Datas sugeridas com base no cronograma pedagógico!");
    };

    const isDateDisabled = (date: Date) => {
        if (startDate && date < new Date(startDate.setHours(0, 0, 0, 0))) return true;
        if (endDate && date > new Date(endDate.setHours(23, 59, 59, 999))) return true;

        const jsDay = date.getDay() === 0 ? '7' : date.getDay().toString();
        const activeDays = weekDays.map(w => w.day);
        if (!activeDays.includes(jsDay)) return true;

        const dateStr = date.toISOString().split('T')[0];
        if (holidays.some(h => h.date === dateStr)) return true;

        return false;
    };

    // Step 2: Bibliography
    const [books, setBooks] = useState<Book[]>([
        { id: 'b1', title: 'Tratado de Fisioterapia Traumato-Ortopédica', author: 'Dutton', type: 'Básico' },
        { id: 'b2', title: 'Cinesiologia do Aparelho Musculoesquelético', author: 'Neumann', type: 'Básico' }
    ]);
    const [newBook, setNewBook] = useState<Omit<Book, 'id'>>({ title: '', author: '', type: 'Básico' });

    // Step 3: Content
    const [topics, setTopics] = useState<Topic[]>([
        { id: 't1', title: 'Introdução à Propedêutica Ortopédica', classesNeeded: 2, bibliographyIds: ['b1'], isPractical: false, resources: ['Projetor', 'Artigos'], methodology: 'Aula Dialogada' },
        { id: 't2', title: 'Avaliação Funcional da Coluna Vertebral', classesNeeded: 3, bibliographyIds: ['b1', 'b2'], isPractical: true, resources: ['Macas', 'Esqueleto'], methodology: 'Prática Clínica' }
    ]);

    // Derived Logic: Overflow
    const [availableDays, setAvailableDays] = useState(0);
    const [requiredDays, setRequiredDays] = useState(0);

    useEffect(() => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        let current = new Date(start);

        const activeDays = weekDays.map(w => w.day);

        while (current <= end) {
            const jsDay = current.getDay() === 0 ? '7' : current.getDay().toString();
            if (activeDays.includes(jsDay)) {
                const dateStr = current.toISOString().split('T')[0];
                const isHoliday = holidays.some(h => h.date === dateStr);
                if (!isHoliday) count++;
            }
            current.setDate(current.getDate() + 1);
        }
        setAvailableDays(count);

        const needed = topics.reduce((acc, t) => acc + t.classesNeeded, 0);
        setRequiredDays(needed);
    }, [startDate, endDate, weekDays, holidays, topics]);

    const isOverflow = requiredDays > availableDays;

    const generateFullSchedule = () => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const schedule = [];
        let current = new Date(start);
        const activeDays = weekDays.map(w => w.day);

        let topicIdx = 0;

        while (current <= end) {
            const jsDayNum = current.getDay();
            const jsDay = jsDayNum === 0 ? '7' : jsDayNum.toString();

            if (activeDays.includes(jsDay)) {
                const dateStr = current.toISOString().split('T')[0];
                const holiday = holidays.find(h => h.date === dateStr);
                const dayConfig = weekDays.find(w => w.day === jsDay);

                const assessment = assessments.find(a => {
                    if (!a.date) return false;
                    const aDate = new Date(a.date);
                    return aDate.toISOString().split('T')[0] === dateStr;
                });

                const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const diaSemana = dayNames[jsDayNum];

                if (holiday) {
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'holiday',
                        content: holiday.desc,
                        activity: 'Recesso Escolar',
                        points: null,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        bibliographyIds: []
                    });
                } else if (assessment) {
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'assessment',
                        content: assessment.name,
                        activity: 'Avaliação ' + assessment.type,
                        points: assessment.points,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        bibliographyIds: []
                    });
                } else if (topicIdx < topics.length) {
                    const topic = topics[topicIdx];
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'topic',
                        content: topic.title,
                        activity: topic.methodology,
                        points: null,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        isPractical: topic.isPractical,
                        bibliographyIds: topic.bibliographyIds
                    });
                    topicIdx++;
                } else {
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'empty',
                        content: 'Planejamento em Aberto',
                        activity: '---',
                        points: null,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        bibliographyIds: []
                    });
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return schedule;
    };

    const saveDraft = () => {
        const draft = {
            courseName,
            publicSlug,
            theoryLocation,
            practiceLocation,
            startDate,
            endDate,
            weekDays,
            assessments,
            books,
            topics
        };
        localStorage.setItem('axiom_syllabus_draft', JSON.stringify(draft));
        toast.success("Rascunho do cronograma salvo com sucesso!");
    };

    const loadDraft = () => {
        const d = localStorage.getItem('axiom_syllabus_draft');
        if (d) {
            try {
                const draft = JSON.parse(d);
                if (draft.courseName) setCourseName(draft.courseName);
                if (draft.publicSlug) setPublicSlug(draft.publicSlug);
                if (draft.theoryLocation) setTheoryLocation(draft.theoryLocation);
                if (draft.practiceLocation) setPracticeLocation(draft.practiceLocation);
                if (draft.startDate) setStartDate(new Date(draft.startDate));
                if (draft.endDate) setEndDate(new Date(draft.endDate));
                if (draft.weekDays) setWeekDays(draft.weekDays);
                if (draft.assessments) {
                    setAssessments(draft.assessments.map((a: any) => ({ ...a, date: a.date ? new Date(a.date) : null })));
                }
                if (draft.books) setBooks(draft.books);
                if (draft.topics) setTopics(draft.topics);
                toast.success("Rascunho carregado com sucesso!");
            } catch (e) {
                toast.error("Erro ao carregar o rascunho.");
            }
        } else {
            toast.info("Nenhum rascunho encontrado.");
        }
    };

    // Handlers Bibliography
    const addBook = () => {
        if (!newBook.title || !newBook.author) return;
        setBooks([...books, { ...newBook, id: Math.random().toString(36).substr(2, 9) }]);
        setNewBook({ title: '', author: '', type: 'Básico' });
    };

    const removeBook = (id: string) => {
        setBooks(books.filter(b => b.id !== id));
        // Also remove from topics
        setTopics(topics.map(t => ({
            ...t,
            bibliographyIds: t.bibliographyIds.filter(bid => bid !== id)
        })));
    };

    // Handlers Topics
    const addTopic = () => {
        setTopics([...topics, {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            classesNeeded: 1,
            bibliographyIds: [],
            isPractical: false,
            resources: [],
            methodology: 'Aula Teórica'
        }]);
    };

    const generateAIContent = () => {
        const isPhysio = courseName.toLowerCase().includes('fisio');
        const suggestedTopics: Topic[] = isPhysio ? [
            { id: 'ai1', title: 'Bases da Biofísica Aplicada', classesNeeded: 2, bibliographyIds: [], isPractical: false, resources: ['Projetor'], methodology: 'Aula Invertida' },
            { id: 'ai2', title: 'Anatomia Palpatória de MMSS', classesNeeded: 4, bibliographyIds: [], isPractical: true, resources: ['Modelos 3D'], methodology: 'Estudo de Caso' },
            { id: 'ai3', title: 'Cinesiologia Assistida', classesNeeded: 2, bibliographyIds: [], isPractical: true, resources: ['Instrumentos'], methodology: 'Demonstração Prática' },
            { id: 'ai4', title: 'Semiologia do Joelho e Tornozelo', classesNeeded: 4, bibliographyIds: [], isPractical: true, resources: ['Macas'], methodology: 'Problematização (PBL)' }
        ] : [
            { id: 'ai1', title: 'Fundamentos e Contextualização', classesNeeded: 2, bibliographyIds: [], isPractical: false, resources: ['Projetor'], methodology: 'Aula Dialogada' },
            { id: 'ai2', title: 'Metodologias e Práticas Nível I', classesNeeded: 4, bibliographyIds: [], isPractical: true, resources: [], methodology: 'PBL' }
        ];

        setTopics([...topics, ...suggestedTopics]);
        toast.success("IA: Sugestões de conteúdo inseridas com sucesso!");
    };

    const updateTopic = (id: string, updates: Partial<Topic>) => {
        setTopics(topics.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTopic = (id: string) => {
        setTopics(topics.filter(t => t.id !== id));
    };

    const onDragEnd = (result: any) => {
        const { destination, source, combine } = result;

        // Handle Topic Merging (Combine)
        if (combine) {
            const newTopics = Array.from(topics);
            const sourceIndex = source.index;
            const targetId = combine.draggableId;
            const targetIndex = newTopics.findIndex(t => t.id === targetId);

            if (targetIndex !== -1) {
                const sourceTopic = newTopics[sourceIndex];
                const targetTopic = newTopics[targetIndex];

                // Merge logic
                targetTopic.title = `${targetTopic.title} & ${sourceTopic.title}`;
                targetTopic.classesNeeded += sourceTopic.classesNeeded;
                targetTopic.resources = Array.from(new Set([...targetTopic.resources, ...sourceTopic.resources]));
                targetTopic.bibliographyIds = Array.from(new Set([...targetTopic.bibliographyIds, ...sourceTopic.bibliographyIds]));

                newTopics.splice(sourceIndex, 1);
                setTopics(newTopics);
                toast.success(`Tópicos mesclados: ${targetTopic.title}`);
                return;
            }
        }

        if (!destination) return;
        const items = Array.from(topics);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setTopics(items);
    };

    // UI Modules
    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-12 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all",
                        step === i ? "bg-[#8C132C] text-white scale-110 shadow-lg shadow-[#8C132C]/20" :
                            step > i ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        {step > i ? <CheckCircle2 size={18} /> :
                            i === 4 ? <Sparkles size={16} /> : i}
                    </div>
                    {i < 4 && <div className={cn("w-14 h-1 mx-2 rounded-full", step > i ? "bg-emerald-500" : "bg-slate-100")} />}
                </div>
            ))}
        </div>
    );

    const toggleTopicCompletion = (id: string) => {
        setCompletedTopicIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
        if (!completedTopicIds.includes(id)) {
            toast.success("Aula marcada como concluída! Progresso atualizado.");
        }
    };

    const handlePrint = () => {
        if (printRef.current) {
            window.print();
        }
    };

    const handleExportSyllabus = () => {
        const data = {
            courseName,
            publicSlug,
            theoryLocation,
            practiceLocation,
            startDate,
            endDate,
            weekDays,
            assessments,
            books,
            topics: topics.map(t => ({ ...t, id: t.id.startsWith('import-') ? t.id : `import-${t.id}` }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cronograma-${publicSlug}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Dossiê exportado com sucesso!");
    };

    const handleImportSyllabus = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.courseName) setCourseName(data.courseName);
                if (data.publicSlug) setPublicSlug(data.publicSlug + '-copia');
                if (data.theoryLocation) setTheoryLocation(data.theoryLocation);
                if (data.practiceLocation) setPracticeLocation(data.practiceLocation);
                if (data.weekDays) setWeekDays(data.weekDays);
                if (data.assessments) setAssessments(data.assessments.map((a: any) => ({ ...a, date: a.date ? new Date(a.date) : null })));
                if (data.assessments) setAssessments(data.assessments);
                if (data.books) setBooks(data.books);
                if (data.topics) setTopics(data.topics);
                toast.success("Dossiê importado! Conteúdo preenchido automaticamente.");
            } catch (err) {
                toast.error("Erro ao importar: Arquivo inválido.");
            }
        };
        reader.readAsText(file);
    };
    const handleAutoLinkBibliography = (topicId: string) => {
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;
        const matchedIds = books
            .filter(b => {
                const words = topic.title.toLowerCase().split(' ');
                return words.some(w => w.length > 4 && b.title.toLowerCase().includes(w));
            })
            .map(b => b.id);
        if (matchedIds.length > 0) {
            updateTopic(topicId, { bibliographyIds: Array.from(new Set([...topic.bibliographyIds, ...matchedIds])) });
            toast.success(`IA: Encontramos ${matchedIds.length} referências relacionadas!`);
        } else {
            toast.info("IA: Nenhuma referência direta encontrada na biblioteca.");
        }
    };

    const handleImportFromDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setImportedEnsinoFile(e.target.files[0].name);
        setIsAnalyzing(true);
        // Simulação de IA processando PDF/Word
        setTimeout(() => {
            setBooks([
                ...books,
                { id: 'ia-b1', title: 'Biomecânica Básica', author: 'Susan Hall', type: 'Básico' },
                { id: 'ia-b2', title: 'Cinesiologia Clínica e Anatomia', author: 'Lippert', type: 'Básico' },
                { id: 'ia-b3', title: 'Cadeias Musculares', author: 'Leopold Busquet', type: 'Complementar' }
            ]);

            setTopics([
                { id: 'ia-1', title: 'Fundamentos de Biomecânica', classesNeeded: 2, bibliographyIds: ['ia-b1', 'b1'], isPractical: false, resources: ['Projetor', 'Artigos'], methodology: 'Aula Dialogada' },
                { id: 'ia-2', title: 'Cadeias Musculares e Postura', classesNeeded: 4, bibliographyIds: ['ia-b1', 'ia-b3'], isPractical: true, resources: ['Macas'], methodology: 'Estudo de Caso' },
                { id: 'ia-3', title: 'Avaliação da Marcha Humana', classesNeeded: 2, bibliographyIds: ['ia-b2'], isPractical: true, resources: ['Câmera', 'Laboratório'], methodology: 'Demonstração Prática' },
                { id: 'ia-4', title: 'Cinesiologia do Membro Superior', classesNeeded: 3, bibliographyIds: ['ia-b2', 'b2'], isPractical: false, resources: ['Esqueleto Anatômico'], methodology: 'PBL' }
            ]);

            setAssessments([
                { id: 'ia-a1', name: 'Avaliação Parcial (PI)', date: null, points: 30, type: 'Professor' },
                { id: 'ia-a2', name: 'Relatório Prático / Casos Clínicos', date: null, points: 30, type: 'Curso' },
                { id: 'ia-a3', name: 'Avaliação Global (PII)', date: null, points: 40, type: 'Institucional' },
                { id: 'ia-a4', name: 'Prova Substitutiva', date: null, points: 40, type: 'Institucional', isSubstitutive: true }
            ]);

            setIsAnalyzing(false);
            e.target.value = ''; // Reset input
            toast.success("IA: Cronograma antigo processado! Tópicos e critérios de provas importados automaticamente.");
        }, 2500);
    };
    return (
        <>
            <div className="min-h-screen bg-[#FDFDFD] p-8 max-w-6xl mx-auto font-sans">
                <style>{PRINT_STYLES(orientation)}</style>
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-[#363636] tracking-tight">Design de Cronograma 2.0</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestor Estratégico de Conteúdo Acadêmico</p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={loadDraft} variant="ghost" className="rounded-2xl font-black text-xs uppercase tracking-widest h-12 text-slate-500 hover:text-indigo-600 transition-all">
                            Carregar Rascunho
                        </Button>
                        <Button onClick={saveDraft} variant="outline" className="rounded-2xl border-slate-100 font-black text-xs uppercase tracking-widest h-12 hover:border-[#8C132C]/20 hover:bg-[#8C132C]/5 transition-all">
                            <Save size={16} className="mr-2" /> Salvar Rascunho
                        </Button>
                        <Button onClick={() => setShowPreviewModal(true)} className="bg-[#363636] rounded-2xl font-black text-xs uppercase tracking-widest h-12 shadow-xl shadow-slate-200">
                            Visualizar Cronograma <ChevronRight size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>

                <StepIndicator />

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <Card className="p-10 rounded-[44px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-[#8C132C] mb-8 flex items-center gap-3">
                                        <LayoutDashboard size={24} /> Identificação do Cronograma
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Nome da Disciplina / Curso</Label>
                                        <Input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Ex: Traumato-Ortopedia" className="rounded-2xl bg-slate-50 border-none font-bold h-12" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Link Público (Slug)</Label>
                                            <div className="relative">
                                                <Input value={publicSlug} onChange={e => setPublicSlug(e.target.value)} className="rounded-2xl bg-slate-50 border-none font-bold h-12 pl-4 text-[#8C132C]" />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-20 uppercase">/cronograma/</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Sala de Aula (Teórica)</Label>
                                            <Input value={theoryLocation} onChange={e => setTheoryLocation(e.target.value)} placeholder="Ex: Sala 202" className="rounded-2xl bg-slate-50 border-none font-bold h-12" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Laboratório / Local (Prática)</Label>
                                            <Input value={practiceLocation} onChange={e => setPracticeLocation(e.target.value)} placeholder="Ex: Lab de Cinesio" className="rounded-2xl bg-slate-50 border-none font-bold h-12" />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 space-y-4">
                                        <h4 className="text-sm font-black text-slate-400 flex items-center gap-2">
                                            <CalendarIcon size={16} /> Período Letivo
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Início</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" className="w-full justify-start rounded-2xl bg-slate-50 border-none font-bold h-14 hover:bg-slate-100 px-6">
                                                            <CalendarIcon size={18} className="mr-3 opacity-30" />
                                                            {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecionar..."}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-[28px] border-none shadow-2xl overflow-hidden" align="start">
                                                        <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus locale={ptBR} />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Dias da Semana e Horários</Label>
                                        <div className="grid gap-4">
                                            <div className="flex gap-2">
                                                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => {
                                                    const val = (i + 1).toString();
                                                    const isActive = weekDays.some(w => w.day === val);
                                                    return (
                                                        <button
                                                            key={`${d}-${i}`}
                                                            onClick={() => {
                                                                if (isActive) {
                                                                    setWeekDays(weekDays.filter(w => w.day !== val));
                                                                } else {
                                                                    setWeekDays([...weekDays, { day: val, start: '19:00', end: '20:40' }]);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "flex-1 h-12 rounded-xl font-black text-xs transition-all",
                                                                isActive ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20" : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            {d}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="space-y-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                {weekDays.length === 0 && <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-4">Selecione os dias das aulas acima</p>}
                                                {weekDays.slice().sort((a, b) => parseInt(a.day) - parseInt(b.day)).map(w => (
                                                    <div key={w.day} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-[#8C132C] text-white flex items-center justify-center text-[10px] font-black">
                                                                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][parseInt(w.day) % 7]}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="time"
                                                                    value={w.start}
                                                                    onChange={e => setWeekDays(weekDays.map(x => x.day === w.day ? { ...x, start: e.target.value } : x))}
                                                                    className="h-10 w-24 rounded-xl border-none bg-white font-bold text-xs"
                                                                />
                                                                <span className="text-slate-300 font-black text-[10px]">ATÉ</span>
                                                                <Input
                                                                    type="time"
                                                                    value={w.end}
                                                                    onChange={e => setWeekDays(weekDays.map(x => x.day === w.day ? { ...x, end: e.target.value } : x))}
                                                                    className="h-10 w-24 rounded-xl border-none bg-white font-bold text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setWeekDays(weekDays.filter(x => x.day !== w.day))} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center flex-1">
                                        <div className="text-5xl font-black text-[#8C132C] mb-2">{availableDays}</div>
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Datas Disponíveis</div>
                                        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed max-w-[200px]">
                                            Calculado automaticamente com base no intervalo de datas e dias da semana selecionados.
                                        </p>
                                    </div>
                                    <label className="mt-6 border-2 border-dashed border-slate-100 rounded-[32px] p-6 flex flex-col items-center justify-center text-center group hover:border-[#8C132C]/20 transition-all cursor-pointer block">
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setImportedCalendarioFile(e.target.files[0].name);
                                                toast.success("Calendário Institucional importado e analisado. Feriados e recessos sincronizados!");
                                            }
                                        }} />
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-3 group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-all">
                                            <Upload size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{importedCalendarioFile || "Calendário Institucional"}</span>
                                        <p className="text-[9px] text-slate-300 font-bold mt-1">PDF ou Excel (Feriados e Recessos)</p>
                                    </label>
                                </div>
                            </Card>

                            {/* ASSESSMENT & POINTS CONFIG */}
                            <Card className="p-10 rounded-[44px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black text-[#8C132C] flex items-center gap-3">
                                        <Sparkles size={24} /> Avaliações e Pontuação
                                    </h3>
                                    <Button
                                        onClick={suggestExamDates}
                                        variant="outline"
                                        className="border-[#8C132C]/20 text-[#8C132C] rounded-xl font-black text-[10px] uppercase h-10 hover:bg-[#8C132C]/5"
                                    >
                                        <Sparkles size={14} className="mr-2" /> Sugerir Datas via IA
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-12">
                                    <div className="space-y-6 col-span-1 border-r border-slate-50 pr-8">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Soma de Pontos</Label>
                                            <p className="text-[10px] text-slate-400 font-medium">Soma automática com base nas atividades lançadas. Provas substitutivas não somam nota.</p>
                                        </div>
                                        <div className="space-y-5">
                                            <div className={cn(
                                                "p-5 rounded-3xl text-center flex flex-col items-center justify-center transition-all h-32",
                                                totalPoints === 100
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                    : "bg-red-50 text-red-500 border border-red-100"
                                            )}>
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Soma Total</span>
                                                <span className="text-4xl font-black mt-2 mb-1">{totalPoints} / 100</span>
                                                {totalPoints !== 100 && (
                                                    <span className="text-[8px] font-bold mt-1 uppercase italic">Ajuste as avaliações para fechar 100pts</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-6">
                                        <div className="flex justify-between items-center px-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cronograma de Atividades Avaliativas</Label>
                                                <p className="text-[10px] text-slate-400 font-medium">Provas, Trabalhos, Seminários e PI.</p>
                                            </div>
                                            <Button size="sm" variant="ghost" className="bg-[#8C132C]/10 text-[#8C132C] hover:bg-[#8C132C] hover:text-white rounded-xl font-black text-[10px] uppercase h-9 px-4 transition-all" onClick={() => setAssessments([...assessments, { id: Date.now().toString(), name: 'Nova Atividade', date: null, points: 0, type: 'Professor' }])}>+ Adicionar Atividade</Button>
                                        </div>
                                        <div className="grid gap-3">
                                            {assessments.map(ass => (
                                                <motion.div layout key={ass.id} className="bg-slate-50/50 p-4 rounded-3xl flex items-center gap-4 group border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-4 border-l-[#8C132C]">
                                                    <div className="space-y-1 flex-1">
                                                        <Input value={ass.name} onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, name: e.target.value } : a))} className="bg-transparent border-none rounded-none focus:ring-0 font-black h-8 text-sm p-0 text-slate-700" />
                                                        <div className="flex gap-2 items-center">
                                                            <Select value={ass.type} onValueChange={v => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, type: v as any } : a))}>
                                                                <SelectTrigger className="h-6 text-[8px] font-black uppercase px-2 py-0 border-slate-200 text-slate-400 bg-transparent w-auto focus:ring-0">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Professor"><span className="text-[10px] uppercase font-bold text-slate-600">Professor</span></SelectItem>
                                                                    <SelectItem value="Institucional"><span className="text-[10px] uppercase font-bold text-slate-600">Institucional</span></SelectItem>
                                                                    <SelectItem value="Curso"><span className="text-[10px] uppercase font-bold text-slate-600">Curso</span></SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <div className="h-3 w-px bg-slate-200 mx-2" />
                                                            <label className="flex items-center gap-1 cursor-pointer">
                                                                <Checkbox
                                                                    checked={ass.isSubstitutive}
                                                                    onCheckedChange={(c) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, isSubstitutive: c === true } : a))}
                                                                    className="h-3 w-3 rounded-[3px] border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                                />
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Prova Substitutiva</span>
                                                            </label>
                                                            {ass.isSubstitutive && (
                                                                <>
                                                                    <div className="h-3 w-px bg-slate-200 mx-1" />
                                                                    <Select value={ass.substitutesId || "Todas"} onValueChange={(v) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, substitutesId: v } : a))}>
                                                                        <SelectTrigger className="h-6 text-[8px] font-black uppercase px-2 py-0 border-slate-200 text-amber-600 bg-amber-50 w-auto shadow-none">
                                                                            <SelectValue placeholder="..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="z-[110]">
                                                                            <SelectItem value="Todas"><span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Todas / Final</span></SelectItem>
                                                                            {assessments.filter(a => !a.isSubstitutive).map(a => (
                                                                                <SelectItem key={a.id} value={a.id}><span className="text-[10px] uppercase font-bold text-slate-600">{a.name || 'Sem nome'}</span></SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-44">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" className="w-full justify-start rounded-xl bg-white border border-slate-100 font-bold h-11 text-[10px] uppercase shadow-sm">
                                                                    <CalendarIcon size={14} className="mr-2 opacity-30" />
                                                                    {ass.date ? format(ass.date, "dd 'de' MMMM", { locale: ptBR }) : "Definir Data"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="end">
                                                                <Calendar mode="single" selected={ass.date || undefined} onSelect={(d) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, date: d || null } : a))} locale={ptBR} disabled={isDateDisabled} />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div className={cn("flex items-center gap-2 bg-white px-4 h-11 rounded-xl border border-slate-100 shadow-sm transition-all", ass.isSubstitutive && "opacity-50 grayscale bg-slate-50")}>
                                                        <Input type="number" disabled={ass.isSubstitutive} value={ass.points} onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, points: parseInt(e.target.value) } : a))} className="w-12 bg-transparent border-none rounded-none focus:ring-0 font-black h-8 text-sm text-center p-0 disabled:opacity-100" />
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">PTS</span>
                                                    </div>
                                                    <button onClick={() => setAssessments(assessments.filter(a => a.id !== ass.id))} className="w-11 h-11 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <div className="flex flex-col gap-6 items-center flex-1">
                                <div className="flex justify-between w-full">
                                    <div className="flex gap-4">
                                        <label className="cursor-pointer">
                                            <Input type="file" accept=".pdf,.doc,.docx" onChange={handleImportFromDocument} className="hidden" />
                                            <Button variant="outline" className="h-14 rounded-2xl border-[#8C132C]/20 text-[#8C132C] font-black uppercase text-[10px] tracking-widest px-8 hover:bg-[#8C132C]/5 flex items-center gap-2 pointer-events-none">
                                                {isAnalyzing ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" /> : <Sparkles size={18} />}
                                                {importedEnsinoFile || "Carregar Word/PDF (IA)"}
                                            </Button>
                                        </label>
                                    </div>
                                    <Button onClick={() => setStep(2)} className="bg-[#8C132C] h-14 rounded-2xl px-10 font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-[#8C132C]/20 shrink-0">
                                        Próximo Passo <ChevronRight size={18} className="ml-2" />
                                    </Button>
                                </div>

                                <div className="w-full h-px bg-slate-100 my-4" />

                                {/* ÁREA DE IMPORTAÇÃO REQUISITADA - FOTO 3 */}
                                <label className="group cursor-pointer w-full">
                                    <Input type="file" accept=".json" onChange={handleImportSyllabus} className="hidden" />
                                    <div className="flex items-center gap-6 p-10 border-2 border-dashed border-slate-200 rounded-[44px] hover:border-[#8C132C]/30 hover:bg-[#8C132C]/5 transition-all w-full bg-slate-50/50">
                                        <div className="w-16 h-16 rounded-[24px] bg-white flex items-center justify-center text-slate-300 group-hover:bg-[#8C132C] group-hover:text-white transition-all shadow-xl group-hover:shadow-[#8C132C]/20">
                                            <Upload size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-lg font-black text-slate-700">Importar Cronograma SINAES (.json)</div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                Carregue dossiês antigos para preencher conteúdos e bibliografias instantaneamente
                                            </div>
                                        </div>
                                        <div className="bg-white px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase border border-slate-100">
                                            Upload de Arquivo
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </motion.div>
                    )}

                    {
                        step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="grid grid-cols-3 gap-8">
                                    <Card className="col-span-1 p-8 rounded-[40px] border-none shadow-xl h-fit">
                                        <h3 className="text-lg font-black text-[#8C132C] mb-6 flex items-center gap-2">
                                            <Library size={20} /> Cadastrar Obra
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Título / Nome</Label>
                                                <Input value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} placeholder="Ex: Tratado de..." className="rounded-xl border-slate-100 bg-slate-50 font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Autor / Edição</Label>
                                                <Input value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} placeholder="Ex: Dutton, 2024" className="rounded-xl border-slate-100 bg-slate-50 font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400">Tipo SINAES</Label>
                                                <Select onValueChange={(val: any) => setNewBook({ ...newBook, type: val })} defaultValue="Básico">
                                                    <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                                        <SelectItem value="Básico">Básica (Mín. 3)</SelectItem>
                                                        <SelectItem value="Complementar">Complementar (Mín. 5)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button onClick={addBook} className="w-full bg-[#363636] h-12 rounded-xl font-black uppercase text-[10px] tracking-widest mt-4">
                                                Adicionar à Biblioteca
                                            </Button>
                                        </div>
                                    </Card>

                                    <div className="col-span-2 space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 px-4">Biblioteca do Semestre</Label>
                                        {books.map(book => (
                                            <motion.div layout key={book.id} className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-slate-50 group hover:border-[#8C132C]/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                        book.type === 'Básico' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                    )}>
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-800">{book.title}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.author} • {book.type}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeBook(book.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </motion.div>
                                        ))}
                                        {books.length === 0 && (
                                            <div className="h-40 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-300">
                                                <Bookmark size={32} className="mb-2 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Nenhuma obra cadastrada</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                                    <Button onClick={() => setStep(1)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400">
                                        <ChevronLeft size={18} className="mr-2" /> Voltar
                                    </Button>
                                    <Button onClick={() => setStep(3)} className="bg-[#8C132C] h-14 rounded-2xl px-10 font-black uppercase tracking-widest transition-all hover:scale-105">
                                        Próximo Passo <ChevronRight size={18} className="ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )
                    }

                    {
                        step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                {/* ALERT OVERFLOW */}
                                {isOverflow && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-amber-50 border border-amber-200 rounded-[32px] p-6 flex items-center gap-6 shadow-lg shadow-amber-500/5">
                                        <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-amber-800 font-black text-lg">Estouro de Conteúdo Detectado!</h4>
                                            <p className="text-amber-700/70 text-sm font-medium">
                                                Você planejou <strong>{requiredDays}</strong> tópicos/aulas, mas o seu calendário só possui <strong>{availableDays}</strong> datas disponíveis.
                                            </p>
                                            <p className="text-amber-800 text-[10px] font-black uppercase mt-2">Dica: Mescle tópicos arrastando um sobre o outro ou ajuste o calendário.</p>
                                        </div>
                                        <Button onClick={() => setStep(1)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase h-10 px-6">
                                            Ajustar Datas
                                        </Button>
                                    </motion.div>
                                )}

                                <div className="flex items-center justify-between mb-2 px-6">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano de Ensino (Sequência Didática)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 p-2 rounded-lg">
                                            <span className="text-slate-500 uppercase">Total:</span>
                                            <span className={cn(isOverflow ? "text-red-500" : "text-emerald-500")}>
                                                {requiredDays} / {availableDays}
                                            </span>
                                        </div>
                                        <Button onClick={generateAIContent} size="sm" variant="outline" className="border-[#8C132C]/20 text-[#8C132C] hover:bg-[#8C132C]/5 rounded-xl font-black text-[10px] uppercase h-10">
                                            <Sparkles size={14} className="mr-2" /> Sugerir com IA
                                        </Button>
                                        <Button onClick={addTopic} size="sm" className="bg-[#8C132C] text-white rounded-xl font-black text-[10px] uppercase h-10 shadow-lg shadow-[#8C132C]/10">
                                            <Plus size={14} className="mr-1" /> Novo Tópico
                                        </Button>
                                    </div>
                                </div>

                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="topics-list" isCombineEnabled>
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 pb-12">
                                                {topics.map((topic, index) => (
                                                    <Draggable key={topic.id} draggableId={topic.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={cn(
                                                                    "bg-white rounded-[32px] p-1 border-2 transition-all shadow-sm",
                                                                    snapshot.isDragging ? "border-[#8C132C] shadow-2xl scale-102 z-50 ring-4 ring-[#8C132C]/5" : "border-transparent hover:border-slate-100"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-4 p-4">
                                                                    <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-400 p-2">
                                                                        <GripVertical size={20} />
                                                                    </div>
                                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xs">
                                                                        {index + 1}
                                                                    </div>
                                                                    <Input
                                                                        value={topic.title}
                                                                        onChange={e => updateTopic(topic.id, { title: e.target.value })}
                                                                        placeholder="Título do Tópico ou Conteudo da Aula"
                                                                        className="flex-1 bg-transparent border-none font-bold text-slate-700 h-12 text-sm focus:ring-0 placeholder:text-slate-300 focus:bg-slate-50/50 rounded-xl px-4"
                                                                    />

                                                                    <div className="flex items-center gap-6">
                                                                        {/* PRACTICAL TOGGLE & CONFLICT ALERT */}
                                                                        <div className="flex flex-col items-center gap-1 group/conflict relative">
                                                                            <button
                                                                                onClick={() => updateTopic(topic.id, { isPractical: !topic.isPractical })}
                                                                                className={cn(
                                                                                    "px-4 h-9 rounded-xl font-black text-[9px] uppercase transition-all flex items-center gap-2",
                                                                                    topic.isPractical ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20" : "bg-slate-50 text-slate-400"
                                                                                )}
                                                                            >
                                                                                {topic.isPractical ? 'Prática' : 'Teórica'}
                                                                            </button>
                                                                            {topic.isPractical && !practiceLocation && (
                                                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce shadow-sm" title="Falta definir local de aula prática no Passo 1" />
                                                                            )}
                                                                        </div>

                                                                        {/* METHODOLOGY SELECTOR & COACH */}
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="relative group/method">
                                                                                <div className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 uppercase cursor-pointer hover:bg-slate-100 transition-all">
                                                                                    {topic.methodology || 'Metodologia'}
                                                                                </div>
                                                                                <Select onValueChange={(val) => updateTopic(topic.id, { methodology: val })}>
                                                                                    <SelectTrigger className="absolute inset-0 opacity-0 cursor-pointer">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {Object.keys(METHODOLOGY_GUIDE).map(m => (
                                                                                            <SelectItem key={m} value={m} className="font-bold">{m}</SelectItem>
                                                                                        ))}
                                                                                        <SelectItem value="Seminário" className="font-bold">Seminário</SelectItem>
                                                                                        <SelectItem value="Gamificação" className="font-bold">Gamificação</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            {/* Pedagogical Coach Popover */}
                                                                            {topic.methodology && METHODOLOGY_GUIDE[topic.methodology] && (
                                                                                <Popover>
                                                                                    <PopoverTrigger asChild>
                                                                                        <button className="w-7 h-7 rounded-lg bg-[#8C132C]/10 text-[#8C132C] flex items-center justify-center transition-all hover:bg-[#8C132C] hover:text-white">
                                                                                            <Sparkles size={12} />
                                                                                        </button>
                                                                                    </PopoverTrigger>
                                                                                    <PopoverContent className="w-80 p-6 rounded-[32px] border-none shadow-2xl bg-white space-y-4">
                                                                                        <div className="space-y-1">
                                                                                            <h4 className="text-sm font-black text-[#8C132C] flex items-center gap-2 uppercase tracking-tight">
                                                                                                <Sparkles size={14} /> Professor Coach: {topic.methodology}
                                                                                            </h4>
                                                                                            <p className="text-[11px] text-slate-500 leading-relaxed italic">{METHODOLOGY_GUIDE[topic.methodology].desc}</p>
                                                                                        </div>

                                                                                        <div className="space-y-2">
                                                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ideias de Atividades</span>
                                                                                            <div className="grid gap-2">
                                                                                                {METHODOLOGY_GUIDE[topic.methodology].activities.map((act, i) => (
                                                                                                    <div key={i} className="bg-slate-50 p-3 rounded-2xl text-[10px] font-bold text-slate-700 flex items-start gap-2 border border-slate-100">
                                                                                                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[8px] text-[#8C132C] shadow-sm flex-shrink-0">{i + 1}</div>
                                                                                                        {act}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="pt-2 border-t border-slate-50">
                                                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 block">Links Úteis</span>
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {METHODOLOGY_GUIDE[topic.methodology].links.map((link, i) => (
                                                                                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-[#8C132C]/5 text-[#8C132C] text-[9px] font-black uppercase hover:bg-[#8C132C] hover:text-white transition-all">
                                                                                                        {link.label}
                                                                                                    </a>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </PopoverContent>
                                                                                </Popover>
                                                                            )}
                                                                        </div>

                                                                        {/* RESOURCES SELECTOR */}
                                                                        <div className="relative group/resources">
                                                                            <div className="flex -space-x-2 cursor-pointer">
                                                                                {topic.resources.length > 0 ? (
                                                                                    <div className="h-8 px-3 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">
                                                                                        {topic.resources.length} Recursos
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-slate-200 hover:text-[#8C132C] p-2" title="Add Recursos Didáticos">
                                                                                        <LayoutDashboard size={18} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <Select
                                                                                onValueChange={(val) => {
                                                                                    const updated = topic.resources.includes(val)
                                                                                        ? topic.resources.filter(r => r !== val)
                                                                                        : [...topic.resources, val];
                                                                                    updateTopic(topic.id, { resources: updated });
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="absolute inset-0 opacity-0 bg-transparent border-none cursor-pointer">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {['Projetor', 'Esqueleto', 'Macas', 'Modelos 3D', 'Software', 'Artigos Impressos', 'Instrumentos Avaliação'].map(r => (
                                                                                        <SelectItem key={r} value={r} className="font-bold">
                                                                                            {topic.resources.includes(r) && "✓ "} {r}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>

                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <div className="flex -space-x-2 cursor-pointer items-center">
                                                                                    {topic.bibliographyIds.length > 0 ? (
                                                                                        topic.bibliographyIds.map(bid => {
                                                                                            const b = books.find(book => book.id === bid);
                                                                                            return (
                                                                                                <div key={bid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm hover:z-10 transition-all hover:scale-110" title={b?.title}>
                                                                                                    <BookOpen size={14} className="text-slate-400" />
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-[#8C132C] transition-all hover:bg-[#8C132C]/5" title="Vincular Referência">
                                                                                            <BookOpen size={16} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-80 p-6 rounded-[32px] border-none shadow-2xl bg-white space-y-4">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <h4 className="text-[10px] font-black uppercase text-slate-400">Referências da Aula</h4>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => handleAutoLinkBibliography(topic.id)}
                                                                                        className="h-7 rounded-lg text-[9px] font-black uppercase text-[#8C132C] hover:bg-[#8C132C]/10 gap-1.5"
                                                                                    >
                                                                                        <Sparkles size={10} /> Vincular IA
                                                                                    </Button>
                                                                                </div>
                                                                                <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                                                                                    {books.map(book => (
                                                                                        <button
                                                                                            key={book.id}
                                                                                            onClick={() => {
                                                                                                const updated = topic.bibliographyIds.includes(book.id)
                                                                                                    ? topic.bibliographyIds.filter(id => id !== book.id)
                                                                                                    : [...topic.bibliographyIds, book.id];
                                                                                                updateTopic(topic.id, { bibliographyIds: updated });
                                                                                            }}
                                                                                            className={cn(
                                                                                                "flex items-center gap-4 p-4 rounded-2xl text-left transition-all border group/item",
                                                                                                topic.bibliographyIds.includes(book.id)
                                                                                                    ? "bg-[#8C132C]/5 border-[#8C132C]/20"
                                                                                                    : "bg-white border-slate-50 hover:bg-slate-50"
                                                                                            )}
                                                                                        >
                                                                                            <div className={cn(
                                                                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                                                                topic.bibliographyIds.includes(book.id) ? "bg-[#8C132C] border-[#8C132C]" : "bg-white border-slate-200"
                                                                                            )}>
                                                                                                {topic.bibliographyIds.includes(book.id) && <CheckCircle2 size={12} className="text-white" />}
                                                                                            </div>
                                                                                            <div className="flex-1 overflow-hidden">
                                                                                                <div className="text-[11px] font-black text-slate-700 truncate">{book.title}</div>
                                                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{book.author}</div>
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                                    {books.length === 0 && (
                                                                                        <div className="py-10 text-center space-y-3">
                                                                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-200">
                                                                                                <Library size={24} />
                                                                                            </div>
                                                                                            <p className="text-[10px] font-bold text-slate-400">Nenhum livro cadastrado no Passo 2.</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>

                                                                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100/50">
                                                                            <button
                                                                                onClick={() => updateTopic(topic.id, { classesNeeded: Math.max(1, topic.classesNeeded - 1) })}
                                                                                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-[#8C132C] shadow-sm transition-all"
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <span className="w-8 text-center font-black text-xs text-[#8C132C]">{topic.classesNeeded}h</span>
                                                                            <button
                                                                                onClick={() => updateTopic(topic.id, { classesNeeded: topic.classesNeeded + 1 })}
                                                                                className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 hover:text-[#8C132C] shadow-sm transition-all"
                                                                            >
                                                                                +
                                                                            </button>
                                                                        </div>

                                                                        <button onClick={() => removeTopic(topic.id)} className="p-2 text-slate-200 hover:text-red-400 transition-colors">
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                                    <Button onClick={() => setStep(2)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400">
                                        <ChevronLeft size={18} className="mr-2" /> Voltar
                                    </Button>
                                    <Button disabled={isOverflow} onClick={() => setStep(4)} className="bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[28px] px-12 font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20">
                                        <Sparkles size={18} className="mr-2" /> Ativar Cronograma
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10 pb-40">
                            {/* HEADBOARD - VIEW MODE SELECTOR */}
                            <div className="bg-white p-2 rounded-[32px] shadow-xl shadow-slate-200/50 flex gap-2 w-fit mx-auto border border-slate-50">
                                <Button
                                    variant="ghost"
                                    onClick={() => setViewMode('professor')}
                                    className={cn(
                                        "rounded-[24px] px-8 h-12 font-black text-[10px] uppercase transition-all",
                                        viewMode === 'professor' ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20" : "text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    Modo Professor (Gestão)
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setViewMode('student')}
                                    className={cn(
                                        "rounded-[24px] px-8 h-12 font-black text-[10px] uppercase transition-all",
                                        viewMode === 'student' ? "bg-[#8C132C] text-white shadow-lg shadow-[#8C132C]/20" : "text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    Modo Aluno (Consulta)
                                </Button>
                            </div>

                            <div className="grid grid-cols-12 gap-8">
                                {/* LEFT: PROGRESS & INFO */}
                                <div className="col-span-4 space-y-6">
                                    <Card className="p-8 rounded-[44px] border-none shadow-2xl bg-[#363636] text-white overflow-hidden relative">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                                        <h3 className="text-sm font-black uppercase tracking-widest opacity-50 mb-6">Progresso do Semestre</h3>
                                        <div className="flex items-end gap-4 mb-2">
                                            <span className="text-6xl font-black">{Math.round((completedTopicIds.length / topics.length) * 100)}%</span>
                                            <span className="text-xs font-bold opacity-40 pb-3 uppercase">Concluído</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(completedTopicIds.length / topics.length) * 100}%` }}
                                                className="h-full bg-emerald-400 shadow-[0_0_20px_#10b981]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                                            <div>
                                                <div className="text-[9px] font-black uppercase opacity-40">Aulas Dadas</div>
                                                <div className="text-xl font-black">{completedTopicIds.length}</div>
                                            </div>
                                            <div>
                                                <div className="text-[9px] font-black uppercase opacity-40">Restantes</div>
                                                <div className="text-xl font-black">{topics.length - completedTopicIds.length}</div>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="p-8 rounded-[44px] border-none shadow-xl bg-white border border-slate-50 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#8C132C]/5 flex items-center justify-center text-[#8C132C]"><LinkIcon size={20} /></div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-700">Link de Acesso Acadêmico</h4>
                                                <p className="text-[10px] font-bold text-slate-400">Compartilhe com seus alunos</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                                            <code className="text-[10px] font-bold text-[#8C132C] truncate pr-4">axiom.ai/c/{publicSlug}</code>
                                            <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-white shadow-sm font-black text-[9px] uppercase px-3" onClick={() => {
                                                navigator.clipboard.writeText(`https://axiom.ai/c/${publicSlug}`);
                                                toast.success("Link copiado!");
                                            }}>Copiar</Button>
                                        </div>
                                    </Card>
                                </div>

                                {/* RIGHT: INTERACTIVE SCHEDULE LOG */}
                                <div className="col-span-8 space-y-4">
                                    <div className="flex justify-between items-center px-4">
                                        <h3 className="text-lg font-black text-slate-700">Diário de Classe Digital</h3>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5">Semestre Ativo</Badge>
                                    </div>

                                    <div className="space-y-3">
                                        {topics.map((topic, index) => {
                                            const isDone = completedTopicIds.includes(topic.id);
                                            return (
                                                <motion.div
                                                    layout
                                                    key={topic.id}
                                                    className={cn(
                                                        "bg-white p-5 rounded-[36px] border-2 transition-all flex items-center gap-5 group",
                                                        isDone ? "border-emerald-100 opacity-60 grayscale-[0.5]" : "border-slate-50 shadow-sm hover:border-[#8C132C]/20"
                                                    )}
                                                >
                                                    {viewMode === 'professor' && (
                                                        <button
                                                            onClick={() => toggleTopicCompletion(topic.id)}
                                                            className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2",
                                                                isDone ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200" : "bg-white border-slate-100 text-slate-200 group-hover:border-[#8C132C]/30"
                                                            )}
                                                        >
                                                            <Check size={24} strokeWidth={4} />
                                                        </button>
                                                    )}

                                                    {viewMode === 'student' && (
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2",
                                                            isDone ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-transparent text-slate-300"
                                                        )}>
                                                            {isDone ? <CheckCircle2 size={24} /> : <div className="text-xs font-black">{index + 1}</div>}
                                                        </div>
                                                    )}

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-0.5">
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aula {index + 1}</span>
                                                            {topic.isPractical && <Badge className="bg-blue-50 text-blue-500 text-[8px] font-black uppercase px-2 py-0 border-none">Prática</Badge>}
                                                        </div>
                                                        <h4 className={cn("text-base font-black transition-all", isDone ? "text-slate-400 line-through" : "text-slate-700")}>
                                                            {topic.title}
                                                        </h4>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                <Clock size={12} className="opacity-50" /> {topic.classesNeeded}h
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                <Sparkles size={12} className="opacity-50" /> {topic.methodology}
                                                            </div>
                                                            <div className="flex -space-x-2 ml-2">
                                                                {topic.bibliographyIds.map(bid => (
                                                                    <div key={bid} className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-400 font-bold" title="Livro">B</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isDone && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" className="w-10 h-10 rounded-xl p-0 hover:bg-[#8C132C]/5 text-slate-300 hover:text-[#8C132C]"><Info size={20} /></Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-64 p-5 rounded-[28px] border-none shadow-2xl space-y-3">
                                                                <h5 className="font-black text-xs text-[#8C132C] uppercase tracking-tight">Recursos da Aula</h5>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {topic.resources.map(r => <Badge key={r} variant="outline" className="text-[9px] font-bold border-slate-100">{r}</Badge>)}
                                                                </div>
                                                                <div className="pt-2">
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Localização</p>
                                                                    <p className="text-[11px] font-black text-slate-600">{topic.isPractical ? practiceLocation : theoryLocation}</p>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="fixed bottom-10 right-10 flex gap-4">
                                <Button
                                    onClick={() => setStep(3)}
                                    className="h-16 rounded-[32px] px-8 bg-white border-2 border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all"
                                >
                                    <ChevronLeft size={18} className="mr-2" /> Voltar para Edição
                                </Button>
                                <Button
                                    onClick={() => toast.success("Cronograma arquivado com sucesso!")}
                                    className="h-16 rounded-[32px] px-10 bg-[#363636] font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Finalizar Semestre
                                </Button>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FLOATING STATUS INFO */}
                {step === 3 && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                        <div className={cn(
                            "px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 backdrop-blur-xl border transition-all",
                            isOverflow ? "bg-red-500/90 border-red-400 text-white" : "bg-[#363636]/90 border-white/10 text-slate-100"
                        )}>
                            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Calendário Ativo</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-[11px] font-bold">Aulas: {requiredDays} / {availableDays}h</div>
                                {totalPoints !== 100 && (
                                    <div className="flex items-center gap-2 bg-red-400/20 px-3 py-1 rounded-full text-[9px] font-black uppercase text-red-200">
                                        <AlertTriangle size={12} /> Pontos: {totalPoints}/100
                                    </div>
                                )}
                                {isOverflow ? (
                                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                        <AlertTriangle size={12} /> Estouro: {requiredDays - availableDays}h
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase text-emerald-300">
                                        <CheckCircle2 size={12} /> Espaço OK
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* SYLLABUS PREVIEW MODAL */}
            <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                <DialogContent className="max-w-[1400px] sm:max-w-[90vw] rounded-[48px] p-0 border-none overflow-hidden max-h-[96vh] flex flex-col">
                    {/* Header do Modal */}
                    <div className="bg-[#F8F9FA] px-10 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div>
                            <DialogTitle className="text-2xl font-black text-[#363636]">Visualização Estratégica</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Configure o estilo visual antes de exportar</DialogDescription>
                        </div>
                        <div className="h-10 w-px bg-slate-100 mx-2 no-print" />

                        <div className="flex gap-2 no-print">
                            {[
                                { id: 'data', label: 'Data' },
                                { id: 'dia', label: 'Dia' },
                                { id: 'conteudo', label: 'Conteúdo' },
                                { id: 'references', label: 'Referências' },
                                { id: 'atividade', label: 'Atividade' },
                                { id: 'pontos', label: 'Pontos' }
                            ].map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => setVisibleColumns(prev => prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id])}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all",
                                        visibleColumns.includes(col.id) ? "bg-[#8C132C]/5 border-[#8C132C]/20 text-[#8C132C]" : "bg-white border-slate-50 text-slate-300"
                                    )}
                                >
                                    {col.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setOrientation('portrait')}
                                className={cn(
                                    "px-6 h-10 rounded-xl text-[10px] font-black uppercase transition-all",
                                    orientation === 'portrait' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Vertical
                            </button>
                            <button
                                onClick={() => setOrientation('landscape')}
                                className={cn(
                                    "px-6 h-10 rounded-xl text-[10px] font-black uppercase transition-all",
                                    orientation === 'landscape' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Horizontal
                            </button>
                        </div>

                        <div className="h-10 w-px bg-slate-200 mx-1 no-print" />

                        <Button variant="outline" onClick={handlePrint} className="h-12 rounded-xl border-slate-200 text-slate-500 font-black uppercase text-[10px] gap-2 no-print">
                            <Printer size={16} /> Imprimir / PDF
                        </Button>
                        <Button onClick={handleExportSyllabus} className="h-12 rounded-xl bg-[#8C132C] text-white font-black uppercase text-[10px] gap-2 shadow-lg shadow-[#8C132C]/10 no-print">
                            <Download size={16} /> Exportar JSON
                        </Button>
                    </div>

                    {/* Área de Preview com Templates - SIMULAÇÃO A4 */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-12 bg-slate-200/40 flex justify-center no-scrollbar scroll-smooth">
                        <div ref={printRef} className={cn(
                            "bg-white shadow-[0_30px_60px_rgba(0,0,0,0.1)] transition-all duration-500 relative print-area",
                            orientation === 'portrait' ? "w-[210mm] min-h-[297mm] p-16" : "w-[297mm] min-h-[210mm] p-12",
                            selectedTemplate === 1 && "rounded-sm border-t-[16px] border-[#8C132C]",
                            selectedTemplate === 2 && "rounded-none border-[1px] border-slate-200 font-serif",
                            selectedTemplate === 3 && "rounded-[40px] px-20 border-none shadow-none",
                            selectedTemplate === 4 && "bg-[#FDFDFD] border-l-[30px] border-[#363636]"
                        )}>
                            {/* Watermark Mockup */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none rotate-45 text-[150px] font-black whitespace-nowrap">
                                AXIOM PORTAL
                            </div>

                            {/* Template Header */}
                            <header className="mb-12 relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-4">
                                        <Badge className={cn(
                                            "bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5",
                                            selectedTemplate === 4 && "bg-[#363636] text-white"
                                        )}>
                                            Documento Oficial Acadêmico
                                        </Badge>
                                        <h1 className={cn(
                                            "text-4xl font-black text-slate-800 leading-tight max-w-xl",
                                            selectedTemplate === 2 && "font-serif text-5xl italic"
                                        )}>
                                            {courseName}
                                        </h1>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Plano de Ensino & Cronograma Semestral</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-[#8C132C] mb-1">CÓD: TRAU-2026-X</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Semestre 2026.1</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Localização (Teoria)</div>
                                        <div className="text-xs font-black text-slate-700">{theoryLocation}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Localização (Prática)</div>
                                        <div className="text-xs font-black text-slate-700">{practiceLocation}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Carga Horária</div>
                                        <div className="text-xs font-black text-slate-700">{requiredDays * 2} Horas Totais</div>
                                    </div>
                                </div>
                            </header>

                            {/* Cronograma Table - FORMATO TABELA REQUISITADO 2.0 */}
                            <section className="space-y-6">
                                <h3 className="text-xl font-black text-slate-800 border-b-4 border-[#8C132C] pb-4 flex items-center gap-3">
                                    <CalendarIcon className="text-[#8C132C]" size={24} /> Cronograma de Atividades do Semestre
                                </h3>

                                <div className="rounded-[32px] border border-slate-100 overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                {visibleColumns.includes('data') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-20">Data</th>}
                                                {visibleColumns.includes('dia') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-20">Dia</th>}
                                                {visibleColumns.includes('conteudo') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Conteúdo / Tópico</th>}
                                                {visibleColumns.includes('references') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-48">Referências</th>}
                                                {visibleColumns.includes('atividade') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-64">Atividade / Avaliação</th>}
                                                {visibleColumns.includes('pontos') && <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24 text-center">Pontos</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {generateFullSchedule().map((row, idx) => (
                                                <tr key={idx} className={cn(
                                                    "border-b border-slate-50 last:border-none hover:bg-slate-50/30 transition-colors",
                                                    row.type === 'holiday' && "bg-red-50/50",
                                                    row.isPractical && "bg-blue-50/5 border-l-4 border-blue-400/30"
                                                )}>
                                                    {visibleColumns.includes('data') && (
                                                        <td className="px-6 py-5">
                                                            <div className="text-[11px] font-black text-slate-700">{row.date}</div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('dia') && (
                                                        <td className="px-6 py-5">
                                                            <div className="text-[11px] font-bold text-slate-400 uppercase">{row.dia}</div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('conteudo') && (
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={cn(
                                                                    "text-[13px] font-black",
                                                                    row.type === 'holiday' ? "text-red-400 italic" : "text-slate-800",
                                                                    row.type === 'assessment' && "text-[#8C132C]"
                                                                )}>
                                                                    {row.content}
                                                                </span>
                                                                {row.isPractical && <Badge className="bg-blue-400 text-white border-none text-[8px] font-black px-1.5 py-0 shadow-sm shadow-blue-200">PRÁTICA</Badge>}
                                                            </div>
                                                            <div className="text-[9px] font-bold text-slate-300 uppercase shrink-0">
                                                                {row.time}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('references') && (
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col gap-1">
                                                                {row.bibliographyIds?.map(bid => {
                                                                    const book = books.find(b => b.id === bid);
                                                                    return book ? (
                                                                        <div key={bid} className="text-[9px] font-bold text-slate-500 flex items-start gap-1">
                                                                            <span className="text-[#8C132C]">•</span> {book.title} ({book.author})
                                                                        </div>
                                                                    ) : null;
                                                                })}
                                                                {!row.bibliographyIds?.length && row.type !== 'holiday' && (
                                                                    <span className="text-[9px] text-slate-200 font-bold italic">Nenhuma ref. vinculada</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('atividade') && (
                                                        <td className="px-6 py-5">
                                                            <div className={cn(
                                                                "text-[10px] font-bold",
                                                                row.type === 'assessment' ? "text-[#8C132C] font-black uppercase tracking-tighter" : "text-slate-500",
                                                                row.type === 'holiday' && "text-red-300"
                                                            )}>
                                                                {row.activity}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('pontos') && (
                                                        <td className="px-6 py-5 text-center">
                                                            {row.points ? (
                                                                <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg inline-block">
                                                                    {row.points.toFixed(1)}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[11px] font-bold text-slate-200">---</div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Detalhes de Avaliação e Regras */}
                            <section className="mt-12 grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                        <Award className="text-[#8C132C]" size={20} /> Composição de Notas
                                    </h3>
                                    <div className="p-8 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100">
                                        {assessments.filter((a) => !a.isSubstitutive).map((a) => (
                                            <div key={a.id} className="flex justify-between items-center pb-4 border-b border-slate-200/50">
                                                <span className="text-xs font-bold text-slate-500">{a.name}</span>
                                                <span className="text-sm font-black text-slate-800">{a.points} pts</span>
                                            </div>
                                        ))}
                                        <div className="mt-6 pt-6 border-t-2 border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-black text-[#8C132C] uppercase tracking-widest">Total da Disciplina</span>
                                            <span className="text-2xl font-black text-[#8C132C]">100 pts</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                        <ShieldCheck className="text-emerald-500" size={20} /> Validação Institucional
                                    </h3>
                                    <div className="p-8 bg-[#363636] text-white rounded-[32px] space-y-4 shadow-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><FileSignature size={20} className="text-emerald-400" /></div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase opacity-40">Status de Aprovação</div>
                                                <div className="text-sm font-bold">Aguardando Assinatura do NDE</div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                            Este cronograma foi gerado eletronicamente e segue as diretrizes do PPC (Projeto Pedagógico de Curso) vigente para o semestre letivo de 2026.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Footer do Template */}
                            <footer className="mt-20 flex justify-between items-end border-t border-slate-100 pt-10">
                                <div className="space-y-6">
                                    <div className="w-40 h-px bg-slate-200 mb-2" />
                                    <div className="text-[8px] font-black uppercase text-slate-400">Assinatura do Coordenador de Curso</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-[12px] text-slate-800">AXIOM PORTAL ACADÊMICO</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerado digitalmente em {new Date().toLocaleDateString()}</div>
                                </div>
                            </footer>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

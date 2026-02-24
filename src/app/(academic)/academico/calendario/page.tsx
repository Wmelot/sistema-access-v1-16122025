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
    FileText,
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
    SelectGroup,
    SelectItem,
    SelectLabel,
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
import { useReactToPrint } from 'react-to-print';

const PRINT_STYLES = (orientation: 'portrait' | 'landscape') => `
@media print {
  @page {
    size: A4 ${orientation};
    margin: 10mm;
  }
  .no-print {
    display: none !important;
  }
  tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .print-avoid-break {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
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
    date?: Date | null; // Manual override for specific dates
}

interface Assessment {
    id: string;
    name: string;
    date: Date | null;
    points: number;
    type: 'Individual' | 'Dupla' | 'Prática' | 'Teórica';
    isSubstitutive?: boolean;
    substitutesIds?: string[];
    classesNeeded: number; // Nova carga horária para provas
    content?: string;      // Conteúdo editável da prova
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
    const [timelineOrder, setTimelineOrder] = useState<{ id: string, type: 'topic' | 'assessment' }[]>([]);
    const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'professor' | 'student'>('professor');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(1);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [isSynced, setIsSynced] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['data', 'dia', 'conteudo', 'references', 'atividade', 'pontos']);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, type: string, file?: File }[]>([]);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
    const [showDraftsModal, setShowDraftsModal] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [drafts, setDrafts] = useState<{ id: string, name: string, date: string, data: any }[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    // Carrega rascunhos salvos no Supabase ao iniciar
    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const res = await fetch('/api/academic/drafts');
                const data = await res.json();
                if (data.drafts) {
                    setDrafts(data.drafts);
                }
            } catch (err) {
                console.error("Failed to load drafts", err);
            }
        };
        fetchDrafts();
    }, []);

    const saveDraft = async (name: string = "") => {
        const draftData = {
            courseName,
            publicSlug,
            theoryLocation,
            practiceLocation,
            startDate,
            endDate,
            weekDays,
            assessments,
            books,
            topics,
            holidays,
            locationCity,
            selectedLogo
        };

        const newDraft = {
            id: Date.now().toString(),
            name: name || courseName || "Cronograma sem nome",
            date: new Date().toISOString(),
            data: draftData
        };

        const updatedDrafts = [newDraft, ...drafts];
        setDrafts(updatedDrafts);

        toast.promise(fetch('/api/academic/drafts', {
            method: 'POST',
            body: JSON.stringify({ drafts: updatedDrafts }),
            headers: { 'Content-Type': 'application/json' }
        }), {
            loading: 'Salvando suas modificações...',
            success: 'Rascunho salvo com sucesso na sua nuvem!',
            error: 'Não foi possível persistir as alterações.'
        });
    };

    const deleteDraft = async (id: string) => {
        const updated = drafts.filter(d => d.id !== id);
        setDrafts(updated);

        toast.promise(fetch('/api/academic/drafts', {
            method: 'POST',
            body: JSON.stringify({ drafts: updated }),
            headers: { 'Content-Type': 'application/json' }
        }), {
            loading: 'Excluindo rascunho...',
            success: 'Rascunho removido permanentemente.',
            error: 'Ocorreu um erro ao excluir.'
        });
    };

    const parseSafeDate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(dateStr + 'T12:00:00');
    };

    const loadDraft = (draft: any) => {
        const data = draft.data;
        if (data.courseName) setCourseName(data.courseName);
        if (data.publicSlug) setPublicSlug(data.publicSlug);
        if (data.theoryLocation) setTheoryLocation(data.theoryLocation);
        if (data.practiceLocation) setPracticeLocation(data.practiceLocation);

        const sDate = parseSafeDate(data.startDate);
        if (sDate) setStartDate(sDate);

        const eDate = parseSafeDate(data.endDate);
        if (eDate) setEndDate(eDate);

        if (data.weekDays) setWeekDays(data.weekDays);
        if (data.assessments) {
            setAssessments(data.assessments.map((a: any) => ({
                ...a,
                date: a.date ? parseSafeDate(a.date) : null
            })));
        }
        if (data.books) setBooks(data.books);
        if (data.topics) setTopics(data.topics);
        if (data.holidays) setHolidays(data.holidays);
        if (data.locationCity) setLocationCity(data.locationCity);
        if (data.selectedLogo) setSelectedLogo(data.selectedLogo);
        setIsSynced(true);
        setShowDraftsModal(false);
        toast.success(`Rascunho "${draft.name}" carregado com sucesso!`);
    };

    // Step 1: Config
    const [courseName, setCourseName] = useState('Fisioterapia Traumato-Ortopédica');
    const [publicSlug, setPublicSlug] = useState('traumato-2026');
    const [theoryLocation, setTheoryLocation] = useState('Prédio 7 - Sala 202');
    const [practiceLocation, setPracticeLocation] = useState('Laboratório de Cinesio - Bloco B');
    const [startDate, setStartDate] = useState<Date>(new Date(2026, 1, 1));
    const [endDate, setEndDate] = useState<Date>(new Date(2026, 5, 30));
    const [locationCity, setLocationCity] = useState('Belo Horizonte, MG');
    const [weekDays, setWeekDays] = useState<{ day: string, start: string, end: string }[]>([
        { day: '2', start: '19:00', end: '20:40' },
        { day: '4', start: '19:00', end: '20:40' }
    ]);
    const [holidays, setHolidays] = useState<{ date: string, desc: string }[]>([
        { date: '2026-02-16', desc: 'Recesso de Carnaval' },
        { date: '2026-02-17', desc: 'Carnaval' },
        { date: '2026-02-18', desc: 'Quarta-feira de Cinzas' },
        { date: '2026-04-03', desc: 'Sexta-feira da Paixão' },
        { date: '2026-04-21', desc: 'Tiradentes' },
        { date: '2026-05-01', desc: 'Dia do Trabalho' },
        { date: '2026-06-04', desc: 'Corpus Christi' }
    ]);

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
        { id: 'a1', name: 'Atividades Avaliativas', date: null, points: 70, type: 'Teórica', classesNeeded: 2, content: '' },
        { id: 'a2', name: 'Avaliação Global', date: null, points: 30, type: 'Teórica', classesNeeded: 2, content: '' }
    ]);
    const totalPoints = assessments.reduce((acc, a) => acc + (a.isSubstitutive ? 0 : a.points), 0);

    const suggestExamDates = () => {
        if (!startDate || !endDate || weekDays.length === 0) {
            toast.error("Configure o período letivo e dias da semana primeiro!");
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const activeDays = weekDays.map(w => w.day);

        // Separa avaliações regulares, globais e substitutivas
        const regular = assessments.filter(a => !a.isSubstitutive && !a.name.toLowerCase().includes('global'));
        const global = assessments.find(a => a.name.toLowerCase().includes('global'));
        const sub = assessments.find(a => a.isSubstitutive);

        const newAssessments = [...assessments];

        // 1. Sugerir Global na penúltima semana letiva
        if (global) {
            let target = new Date(end);
            target.setDate(target.getDate() - 7); // 1 semana antes do fim
            newAssessments.find(a => a.id === global.id)!.date = findNearestClassDay(target, activeDays);
        }

        // 2. Sugerir Substitutiva na última semana letiva
        if (sub) {
            let target = new Date(end);
            target.setDate(target.getDate() - 2); // Bem no final
            newAssessments.find(a => a.id === sub.id)!.date = findNearestClassDay(target, activeDays);
        }

        // 3. Distribui as regulares no intervalo restante
        // Tentamos deixar pelo menos 15 dias de intervalo entre as provas se houver muitas
        const endOfRegulars = global
            ? new Date(new Date(global.date || end).getTime() - 7 * 24 * 60 * 60 * 1000)
            : new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);

        const regularInterval = (endOfRegulars.getTime() - start.getTime()) / (regular.length + 1);

        regular.forEach((a, i) => {
            const target = new Date(start.getTime() + regularInterval * (i + 1));
            newAssessments.find(ass => ass.id === a.id)!.date = findNearestClassDay(target, activeDays);
        });

        setAssessments(newAssessments);
        toast.success("Axiom AI: Datas sugeridas seguindo o padrão institucional (Finais nas últimas semanas).");
    };

    const findNearestClassDay = (target: Date, activeDays: string[]) => {
        for (let offset = 0; offset <= 10; offset++) {
            const forward = new Date(target);
            forward.setDate(target.getDate() + offset);
            const fDay = forward.getDay() === 0 ? '7' : forward.getDay().toString();
            if (activeDays.includes(fDay) && !holidays.some(h => h.date === forward.toISOString().split('T')[0])) return forward;

            const backward = new Date(target);
            backward.setDate(target.getDate() - offset);
            const bDay = backward.getDay() === 0 ? '7' : backward.getDay().toString();
            if (activeDays.includes(bDay) && !holidays.some(h => h.date === backward.toISOString().split('T')[0])) return backward;
        }
        return target;
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

    const isTopicDateDisabled = (date: Date) => {
        if (isDateDisabled(date)) return true;
        const dateStr = date.toISOString().split('T')[0];
        // Não permite chocar conteúdo didático solto em data de prova
        if (assessments.some(a => a.date && new Date(a.date).toISOString().split('T')[0] === dateStr)) return true;
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
    const [availableHours, setAvailableHours] = useState(0);
    const [totalNeededHours, setTotalNeededHours] = useState(0);
    const [showReallocateModal, setShowReallocateModal] = useState(false);
    const [proposedHours, setProposedHours] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        let current = new Date(start);

        const activeDays = weekDays.map(w => w.day);
        let totalAvailableHours = 0;

        while (current <= end) {
            const jsDay = current.getDay() === 0 ? '7' : current.getDay().toString();
            if (activeDays.includes(jsDay)) {
                const dateStr = current.toISOString().split('T')[0];
                const isHoliday = holidays.some(h => h.date === dateStr);
                if (!isHoliday) {
                    const config = weekDays.find(w => w.day === jsDay);
                    if (config) {
                        const [h1, m1] = config.start.split(':').map(Number);
                        const [h2, m2] = config.end.split(':').map(Number);
                        const duration = (h2 * 60 + m2 - (h1 * 60 + m1)) / 50; // Usando hora-aula de 50min padrão PUC
                        totalAvailableHours += duration;
                    }
                    count++;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        setAvailableDays(count);
        setAvailableHours(totalAvailableHours); // Novo estado

        const totalNeededHoursCalc = topics.reduce((acc, t) => acc + t.classesNeeded, 0);
        setTotalNeededHours(totalNeededHoursCalc);
    }, [startDate, endDate, weekDays, holidays, topics]);

    // Sincroniza timelineOrder com topics e assessments
    useEffect(() => {
        const currentIds = timelineOrder.map(i => i.id);
        const newItems = [...timelineOrder];
        let hasChanges = false;

        topics.forEach(t => {
            if (!currentIds.includes(t.id)) {
                newItems.push({ id: t.id, type: 'topic' });
                hasChanges = true;
            }
        });

        assessments.forEach(a => {
            if (!currentIds.includes(a.id)) {
                newItems.push({ id: a.id, type: 'assessment' });
                hasChanges = true;
            }
        });

        const allValidIds = [...topics.map(t => t.id), ...assessments.map(a => a.id)];
        const filteredItems = newItems.filter(item => allValidIds.includes(item.id));

        if (filteredItems.length !== timelineOrder.length || hasChanges) {
            setTimelineOrder(filteredItems);
        }
    }, [topics, assessments, timelineOrder.length]);

    const isOverflow = totalNeededHours > availableHours + 0.1;

    const fullSchedule = React.useMemo(() => {
        const schedule: any[] = [];
        let current = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date();

        if (!startDate || !endDate || isNaN(current.getTime()) || isNaN(end.getTime())) return [];

        let fluidItemsPool = timelineOrder
            .map(item => {
                if (item.type === 'topic') {
                    const topic = topics.find(t => t.id === item.id);
                    if (topic && !topic.date) {
                        return { ...item, remainingHours: Number(topic.classesNeeded) || 2, title: topic.title };
                    }
                } else {
                    const assessment = assessments.find(a => a.id === item.id);
                    if (assessment && !assessment.date) {
                        return { ...item, remainingHours: Number(assessment.classesNeeded) || 2, name: assessment.name };
                    }
                }
                return null;
            })
            .filter(Boolean) as any[];

        while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const jsDayNum = current.getDay();
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const diaSemana = dayNames[jsDayNum];
            const jsDay = jsDayNum === 0 ? '7' : jsDayNum.toString(); // Convert to '1'-'7' for weekDays array

            const dayConfig = weekDays.find(w => w.day === jsDay);
            const holiday = holidays.find(h => h.date === dateStr);

            const calculateDuration = (start: string, end: string) => {
                const [h1, m1] = start.split(':').map(Number);
                const [h2, m2] = end.split(':').map(Number);
                return (h2 * 60 + m2 - (h1 * 60 + m1)) / 50; // Usando hora-aula de 50min padrão PUC
            };

            const classDuration = dayConfig ? calculateDuration(dayConfig.start, dayConfig.end) : 0;

            if (holiday) {
                schedule.push({
                    date: format(current, 'dd/MM'),
                    dia: diaSemana,
                    type: 'holiday',
                    content: holiday.desc, // Changed from holiday.name to holiday.desc based on existing structure
                    activity: 'Recesso Escolar',
                    time: '-',
                    bibliographyIds: []
                });
            } else if (dayConfig) {
                // Prioridade 1: Avaliações Pinadas
                const pinnedAssessment = assessments.find(a => a.date && format(new Date(a.date), 'yyyy-MM-dd') === dateStr);
                // Prioridade 2: Tópicos Pinados
                const pinnedTopic = topics.find(t => t.date && format(new Date(t.date), 'yyyy-MM-dd') === dateStr);

                if (pinnedAssessment) {
                    const indexInTimeline = timelineOrder.findIndex(i => i.id === pinnedAssessment.id);
                    const autoContentArr = timelineOrder.slice(0, indexInTimeline)
                        .filter(i => i.type === 'topic')
                        .map(i => topics.find(t => t.id === i.id)?.title)
                        .filter(Boolean);
                    const autoContent = autoContentArr.length > 0 ? `Cobre: ${autoContentArr.join(', ')}` : '';

                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'assessment',
                        content: pinnedAssessment.name,
                        subContent: pinnedAssessment.content || autoContent,
                        activity: 'Avaliação ' + pinnedAssessment.type,
                        points: pinnedAssessment.points,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        bibliographyIds: []
                    });
                } else if (pinnedTopic) {
                    schedule.push({
                        date: format(current, 'dd/MM'),
                        dia: diaSemana,
                        type: 'topic',
                        content: pinnedTopic.title,
                        activity: pinnedTopic.methodology,
                        points: null,
                        time: `${dayConfig?.start} - ${dayConfig?.end}`,
                        isPractical: pinnedTopic.isPractical,
                        bibliographyIds: pinnedTopic.bibliographyIds
                    });
                } else {
                    // Alocação Fluída
                    let dayHoursRemaining = classDuration;
                    let nothingScheduled = true;

                    while (dayHoursRemaining > 0.1 && fluidItemsPool.length > 0) {
                        const currentItem = fluidItemsPool[0];

                        if (currentItem.type === 'assessment') {
                            const assessment = assessments.find(a => a.id === currentItem.id);
                            if (!assessment) { fluidItemsPool.shift(); continue; }

                            const hoursAllocated = Math.min(dayHoursRemaining, currentItem.remainingHours);
                            const isPartial = hoursAllocated < currentItem.remainingHours;

                            const indexInTimeline = timelineOrder.findIndex(i => i.id === currentItem.id);
                            const autoContentArr = timelineOrder.slice(0, indexInTimeline)
                                .filter(i => i.type === 'topic')
                                .map(i => topics.find(t => t.id === i.id)?.title)
                                .filter(Boolean);
                            const autoContent = autoContentArr.length > 0 ? `Cobre: ${autoContentArr.join(', ')}` : '';

                            schedule.push({
                                instanceId: `${currentItem.id}-${currentItem.occurrence || 0}-${dateStr}`,
                                id: currentItem.id,
                                date: format(current, 'dd/MM'),
                                dateFull: dateStr,
                                dia: diaSemana,
                                type: 'assessment',
                                content: assessment.name + (isPartial ? ' (Parte)' : ''),
                                subContent: assessment.content || autoContent,
                                activity: 'Avaliação ' + assessment.type,
                                points: assessment.points,
                                time: `${dayConfig?.start} - ${dayConfig?.end}`,
                                duration: hoursAllocated,
                                bibliographyIds: []
                            });
                            currentItem.remainingHours -= hoursAllocated;
                            currentItem.occurrence = (currentItem.occurrence || 0) + 1;
                            dayHoursRemaining -= hoursAllocated;
                            if (currentItem.remainingHours <= 0.1) fluidItemsPool.shift();
                            nothingScheduled = false;
                        } else if (currentItem.type === 'topic') {
                            // Tópico
                            const topic = topics.find(t => t.id === currentItem.id);
                            if (!topic) { fluidItemsPool.shift(); continue; }

                            const hoursAllocated = Math.min(dayHoursRemaining, currentItem.remainingHours);
                            const isPartial = hoursAllocated < (topics.find(t => t.id === currentItem.id)?.classesNeeded || 0);

                            schedule.push({
                                instanceId: `${currentItem.id}-${currentItem.occurrence || 0}-${dateStr}`,
                                id: currentItem.id,
                                date: format(current, 'dd/MM'),
                                dateFull: dateStr,
                                dia: diaSemana,
                                type: 'topic',
                                content: topic.title + (isPartial ? ' (Parte)' : ''),
                                activity: topic.methodology,
                                points: null,
                                time: `${dayConfig?.start} - ${dayConfig?.end}`,
                                duration: hoursAllocated,
                                isPractical: topic.isPractical,
                                bibliographyIds: topic.bibliographyIds
                            });

                            currentItem.remainingHours -= hoursAllocated;
                            currentItem.occurrence = (currentItem.occurrence || 0) + 1;
                            dayHoursRemaining -= hoursAllocated;
                            if (currentItem.remainingHours <= 0.1) fluidItemsPool.shift();
                            nothingScheduled = false;
                        }
                    }

                    if (nothingScheduled) {
                        schedule.push({
                            date: format(current, 'dd/MM'),
                            dia: diaSemana,
                            type: 'empty',
                            content: 'Data disponível / Planejamento',
                            time: `${dayConfig?.start} - ${dayConfig?.end}`
                        });
                    }
                }
            }
            current = new Date(current.getTime() + 86400000);
        }
        return schedule;
    }, [startDate, endDate, weekDays, topics, assessments, timelineOrder]);

    const generateFullSchedule = () => fullSchedule;

    // Handlers
    const addBook = () => {
        if (!newBook.title || !newBook.author) return;
        setBooks([...books, { ...newBook, id: Math.random().toString(36).substr(2, 9) }]);
        setNewBook({ title: '', author: '', type: 'Básico' });
    };

    const removeBook = (id: string) => {
        setBooks(books.filter(b => b.id !== id));
        setTopics(topics.map(t => ({
            ...t,
            bibliographyIds: t.bibliographyIds.filter(bid => bid !== id)
        })));
    };

    const addTopic = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        setTopics([...topics, {
            id: newId,
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
            { id: 'ai2', title: 'Anatomia Palpatória de MMSS', classesNeeded: 4, bibliographyIds: [], isPractical: true, resources: ['Modelos 3D'], methodology: 'Estudo de Caso' }
        ] : [
            { id: 'ai1', title: 'Fundamentos', classesNeeded: 2, bibliographyIds: [], isPractical: false, resources: ['Projetor'], methodology: 'Aula Dialogada' }
        ];
        setTopics([...topics, ...suggestedTopics]);
        toast.success("IA: Sugestões inseridas!");
    };

    const updateTopic = (id: string, updates: Partial<Topic>) => {
        setTopics(topics.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const removeTopic = (id: string) => {
        setTopics(topics.filter(t => t.id !== id));
        setTimelineOrder(timelineOrder.filter(item => item.id !== id));
    };

    const removeAssessment = (id: string) => {
        setAssessments(assessments.filter(a => a.id !== id));
        setTimelineOrder(timelineOrder.filter(item => item.id !== id));
    };

    const onDragEnd = (result: any) => {
        const { destination, source } = result;
        if (!destination) return;

        // Reordena o cronograma completo (excluindo feriados)
        const scheduleItems = fullSchedule.filter((s: any) => s.type !== 'holiday');
        const [reorderedItem] = scheduleItems.splice(source.index, 1);
        scheduleItems.splice(destination.index, 0, reorderedItem);

        // Gera a nova timelineOrder baseada na sequência física do cronograma
        // Isso transforma a timeline em uma lista de sessões/instâncias
        const newTimeline = scheduleItems.map((item: any) => ({
            id: item.id,
            type: item.type as 'topic' | 'assessment'
        }));

        setTimelineOrder(newTimeline);
    };

    const toggleTopicCompletion = (id: string) => {
        setCompletedTopicIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Cronograma-${publicSlug}`,
    });

    const handleExportSyllabus = () => {
        const data = { courseName, publicSlug, theoryLocation, practiceLocation, startDate, endDate, weekDays, assessments, books, topics };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `cronograma-${publicSlug}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast.success("Exportado!");
    };

    const handleImportSyllabus = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files; if (!files) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.courseName) setCourseName(data.courseName);
                if (data.assessments) setAssessments(data.assessments);
                if (data.topics) setTopics(data.topics);
                toast.success("Importado!");
            } catch (err) { toast.error("Erro!"); }
        };
        reader.readAsText(files[0]);
    };

    const handleAutoLinkBibliography = (topicId: string) => {
        const topic = topics.find(t => t.id === topicId); if (!topic) return;
        const matchedIds = books.filter(b => b.title.toLowerCase().includes(topic.title.toLowerCase().split(' ')[0])).map(b => b.id);
        if (matchedIds.length > 0) updateTopic(topicId, { bibliographyIds: matchedIds });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (file) {
            const reader = new FileReader(); reader.onload = (e) => setSelectedLogo(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImportFromDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, type: f.type || 'Documento', file: f }));
        setUploadedFiles([...uploadedFiles, ...newFiles]);
        setIsSynced(false); toast.success("Arquivo adicionado!");
    };

    const handleRunAIAnalysis = async () => {
        if (uploadedFiles.length === 0) return;
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            uploadedFiles.forEach(f => {
                if (f.file) formData.append("files", f.file);
            });
            formData.append("location", locationCity);

            const res = await fetch("/api/ai/extract-syllabus", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Falha na análise");
            const data = await res.json();

            if (data.courseName) setCourseName(data.courseName);

            const sDate = parseSafeDate(data.startDate);
            if (sDate) setStartDate(sDate);

            const eDate = parseSafeDate(data.endDate);
            if (eDate) setEndDate(eDate);

            if (data.books) setBooks(data.books);
            if (data.topics) setTopics(data.topics);
            if (data.assessments) {
                const processedAssessments = data.assessments.map((a: any) => ({
                    ...a,
                    id: a.id || `a-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    date: a.date ? parseSafeDate(a.date) : null,
                    classesNeeded: a.classesNeeded || 2,
                    content: a.content || ''
                }));
                setAssessments(processedAssessments);
                // Reconstrói a timelineOrder para incluir as novas avaliações
                const newTimeline = [
                    ...data.topics.map((t: any) => ({ id: t.id, type: 'topic' })),
                    ...processedAssessments.map((a: any) => ({ id: a.id, type: 'assessment' }))
                ];
                setTimelineOrder(newTimeline);
            }
            if (data.holidays) setHolidays(data.holidays);

            setIsSynced(true);

            if (data.unclearDates) {
                toast.warning("IA: As datas do semestre podem estar imprecisas por haver múltiplas opções no arquivo. Por favor, confira os campos de Início e Término.");
            } else {
                toast.success("IA: Cronograma e avaliações sincronizados com sucesso!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Erro ao analisar documentos.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-12 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm",
                        step === i ? "bg-[#8C132C] text-white" : step > i ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        {step > i ? <CheckCircle2 size={18} /> : i}
                    </div>
                    {i < 4 && <div className={cn("w-14 h-1 mx-2", step > i ? "bg-emerald-500" : "bg-slate-100")} />}
                </div>
            ))}
        </div>
    );

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
                        <Button onClick={() => setShowDraftsModal(true)} variant="ghost" className="rounded-2xl font-black text-xs uppercase tracking-widest h-12 text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2">
                            <BookOpen size={16} /> Meus Rascunhos ({drafts.length})
                        </Button>
                        <Button onClick={() => saveDraft()} variant="outline" className="rounded-2xl border-slate-100 font-black text-xs uppercase tracking-widest h-12 hover:border-[#8C132C]/20 hover:bg-[#8C132C]/5 transition-all">
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
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Laboratório / Local (Prática)</Label>
                                            <Input value={practiceLocation} onChange={e => setPracticeLocation(e.target.value)} placeholder="Ex: Lab de Cinesio" className="rounded-2xl bg-slate-50 border-none font-bold h-12" />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Unidade / Cidade da Instituição</Label>
                                            <Input value={locationCity} onChange={e => setLocationCity(e.target.value)} placeholder="Ex: Belo Horizonte, MG" className="rounded-2xl bg-slate-50 border-none font-bold h-12" />
                                            <p className="text-[9px] font-medium text-slate-400 px-2 leading-tight">Isto permite que a IA detecte os feriados da sua região automaticamente.</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 space-y-4">
                                        <h4 className="text-sm font-black text-slate-400 flex items-center gap-2">
                                            <CalendarIcon size={16} /> Período Letivo
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Início das Aulas</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn("w-full justify-start text-left font-bold rounded-2xl h-12 border-slate-100", !startDate && "text-muted-foreground")}>
                                                            {startDate ? format(startDate, "dd/MM/yyyy") : <span>Data inícial</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="start">
                                                        <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} locale={ptBR} />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Término das Aulas</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className={cn("w-full justify-start text-left font-bold rounded-2xl h-12 border-slate-100", !endDate && "text-muted-foreground")}>
                                                            {endDate ? format(endDate, "dd/MM/yyyy") : <span>Data final</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="start">
                                                        <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} locale={ptBR} />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 px-1">Logo da Instituição</Label>
                                                <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-[#8C132C]/30 bg-slate-50 transition-all">
                                                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                                    {selectedLogo ? (
                                                        <span className="text-[10px] font-bold text-slate-500 truncate px-4">Logotipo Selecionado</span>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                            <Upload size={14} /> Selecionar Logo
                                                        </div>
                                                    )}
                                                </label>
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
                                    <div className="bg-[#363636] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-6 opacity-10">
                                            <CalendarIcon size={80} />
                                        </div>
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-6 flex items-center gap-2">
                                            <ShieldCheck size={16} /> Calendário Institucional
                                        </h3>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-end pb-4 border-b border-white/10">
                                                <div>
                                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1">Início do Semestre</div>
                                                    <div className="text-sm font-black">{startDate ? format(startDate, "dd 'de' MMMM", { locale: ptBR }) : '---'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] font-black uppercase opacity-40 mb-1">Fim das Aulas</div>
                                                    <div className="text-sm font-black">{endDate ? format(endDate, "dd 'de' MMMM", { locale: ptBR }) : '---'}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-2">
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <div className="text-[18px] font-black text-emerald-400">{availableDays} <span className="text-[10px] opacity-50">dias</span></div>
                                                    <div className="text-[8px] font-black uppercase opacity-50">{availableHours.toFixed(0)} Horas-Aula Disponíveis</div>
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                    <div className="text-[18px] font-black text-amber-400">03</div>
                                                    <div className="text-[8px] font-black uppercase opacity-50">Feriados/Recessos</div>
                                                </div>
                                            </div>

                                            <div className="pt-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    <div className="text-[9px] font-bold opacity-60 uppercase tracking-tight">Janela Sugerida para Exame Final: <span className="text-white">22/06 a 28/06</span></div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                    <div className="text-[9px] font-bold opacity-60 uppercase tracking-tight">Prazo Limite Lançamento Notas: <span className="text-white">05/07</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-8">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center px-2">
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

                                        <div className={cn(
                                            "p-6 rounded-[32px] text-center flex flex-col items-center justify-center transition-all h-32 border-2",
                                            totalPoints === 100
                                                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-red-50 border-red-100 text-red-500"
                                        )}>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Soma Total</span>
                                            <span className="text-4xl font-black mt-2 mb-1">{totalPoints} / 100</span>
                                            {totalPoints !== 100 && (
                                                <span className="text-[8px] font-bold mt-1 uppercase italic">Ajuste as avaliações para fechar 100pts</span>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atividades Avaliativas</Label>
                                                    <p className="text-[9px] text-slate-400 font-medium">Provas, Trabalhos e Seminários.</p>
                                                </div>
                                                <Button size="sm" variant="ghost" className="bg-[#8C132C]/10 text-[#8C132C] hover:bg-[#8C132C] hover:text-white rounded-xl font-black text-[10px] uppercase h-9 px-4 transition-all" onClick={() => {
                                                    const newId = Date.now().toString();
                                                    const newAssessment: Assessment = {
                                                        id: newId,
                                                        name: 'Nova Atividade',
                                                        date: null,
                                                        points: 0,
                                                        type: 'Individual',
                                                        classesNeeded: 2,
                                                        content: ''
                                                    };
                                                    setAssessments([...assessments, newAssessment]);
                                                    setTimelineOrder([...timelineOrder, { id: newId, type: 'assessment' }]);
                                                }}>+ Adicionar</Button>
                                            </div>

                                            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                                {[...assessments].sort((a, b) => {
                                                    if (!a.date) return 1;
                                                    if (!b.date) return -1;
                                                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                                                }).map(ass => (
                                                    <motion.div layout key={ass.id} className="bg-slate-50/50 p-4 rounded-[24px] flex flex-col gap-3 group border border-slate-100/50 hover:bg-white hover:shadow-lg transition-all border-l-4 border-l-[#8C132C]">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <Input value={ass.name} onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, name: e.target.value } : a))} className="bg-transparent border-none font-black h-7 text-xs p-0 text-slate-700 focus:ring-0" />
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Select value={ass.type} onValueChange={(val: any) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, type: val } : a))}>
                                                                        <SelectTrigger className="h-4 border-none bg-transparent p-0 text-[7px] font-black uppercase text-slate-400 w-auto gap-1 shadow-none focus:ring-0">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                            <SelectItem value="Individual">Individual</SelectItem>
                                                                            <SelectItem value="Dupla">Dupla</SelectItem>
                                                                            <SelectItem value="Prática">Prática</SelectItem>
                                                                            <SelectItem value="Teórica">Teórica</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {ass.isSubstitutive && <Badge className="text-[7px] font-black bg-amber-500 text-white h-4 border-none">SUBST.</Badge>}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        value={ass.points}
                                                                        onChange={e => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, points: parseInt(e.target.value) || 0 } : a))}
                                                                        className="w-14 h-8 rounded-xl border-none bg-white text-[10px] font-black text-center p-0 shadow-sm"
                                                                    />
                                                                    <span className="absolute -right-1 -top-1 bg-[#8C132C] text-white text-[6px] font-black px-1 rounded-full">PTS</span>
                                                                </div>
                                                                <button onClick={() => removeAssessment(ass.id)} className="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-1">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                                                            <div className="flex items-center gap-2">
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button variant="ghost" className="h-6 p-0 text-[8px] font-black uppercase text-slate-400 gap-1.5 hover:bg-transparent">
                                                                            <CalendarIcon size={10} className="text-[#8C132C]" />
                                                                            {ass.date ? format(ass.date, "dd/MM") : "Definir Data"}
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="start">
                                                                        <Calendar
                                                                            mode="single"
                                                                            selected={ass.date || undefined}
                                                                            onSelect={(d) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, date: d || null } : a))}
                                                                            locale={ptBR}
                                                                            disabled={(date) => isDateDisabled(date)}
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={ass.isSubstitutive}
                                                                        onCheckedChange={(checked) => setAssessments(assessments.map(a => a.id === ass.id ? { ...a, isSubstitutive: !!checked } : a))}
                                                                        className="h-3 w-3 rounded-[4px] border-slate-200 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                                    />
                                                                    <span className="text-[8px] font-black uppercase text-slate-400 mt-0.5">Substitutiva</span>
                                                                </label>

                                                                {ass.isSubstitutive && (
                                                                    <Popover>
                                                                        <PopoverTrigger asChild>
                                                                            <Button variant="outline" size="sm" className="h-6 text-[8px] font-black uppercase px-2 border-slate-100 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg">
                                                                                {ass.substitutesIds?.length ? `${ass.substitutesIds.length} Vinc.` : 'Vincular'}
                                                                            </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-48 p-3 rounded-2xl border-none shadow-2xl">
                                                                            <div className="text-[9px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">Substitui:</div>
                                                                            <div className="space-y-1">
                                                                                {assessments.filter(a => a.id !== ass.id && !a.isSubstitutive).map(a => (
                                                                                    <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                                                                        <Checkbox
                                                                                            checked={ass.substitutesIds?.includes(a.id)}
                                                                                            onCheckedChange={(checked) => {
                                                                                                const currentIds = ass.substitutesIds || [];
                                                                                                const newIds = checked ? [...currentIds, a.id] : currentIds.filter(id => id !== a.id);
                                                                                                setAssessments(assessments.map(acc => acc.id === ass.id ? { ...acc, substitutesIds: newIds } : acc));
                                                                                            }}
                                                                                            className="h-3.5 w-3.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#8C132C]"
                                                                                        />
                                                                                        <span className="text-[9px] font-bold text-slate-600 truncate">{a.name}</span>
                                                                                    </label>
                                                                                ))}
                                                                                {assessments.filter(a => a.id !== ass.id && !a.isSubstitutive).length === 0 && (
                                                                                    <p className="text-[8px] text-slate-400 italic px-1">Nenhuma avaliação passível de substituição.</p>
                                                                                )}
                                                                            </div>
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-slate-50">
                                        <div className="bg-[#8C132C]/5 border-2 border-dashed border-[#8C132C]/20 rounded-3xl p-8 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[#8C132C] font-black uppercase text-[10px] tracking-widest">Documentos Ativos (Considerados pela IA)</Label>
                                                <div className="px-3 py-1 bg-[#8C132C] text-white text-[9px] font-black rounded-full animate-pulse">
                                                    {uploadedFiles.length} ATIVOS
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <label className="cursor-pointer">
                                                    <Input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleImportFromDocument} className="hidden" />
                                                    <div className="h-20 w-32 rounded-3xl bg-white border border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:text-[#8C132C] hover:border-[#8C132C]/30 transition-all shadow-sm">
                                                        <Plus size={24} />
                                                    </div>
                                                </label>
                                                {uploadedFiles.map((f, i) => (
                                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} key={i} className="h-20 px-6 rounded-3xl bg-white border border-[#8C132C]/10 flex items-center gap-4 shadow-sm group">
                                                        <div className="w-10 h-10 rounded-2xl bg-[#8C132C]/5 flex items-center justify-center text-[#8C132C]">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-700 truncate max-w-[120px]">{f.name}</span>
                                                            <span className={cn("text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1", isSynced ? "text-emerald-500" : "text-amber-500")}>
                                                                {isSynced ? <Check size={10} /> : <Clock size={10} />}
                                                                {isSynced ? "Sincronizado" : "Aguardando Leitura"}
                                                            </span>
                                                        </div>
                                                        <button onClick={() => setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== i))} className="ml-2 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {uploadedFiles.length > 0 && (
                                            <Button
                                                onClick={handleRunAIAnalysis}
                                                disabled={isAnalyzing}
                                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#8C132C] to-amber-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-[#8C132C]/20 animate-in fade-in slide-in-from-top-2"
                                            >
                                                {isAnalyzing ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent" />
                                                        <span>IA Analisando...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <Sparkles size={20} className="animate-pulse" />
                                                        <span>Sincronizar com IA</span>
                                                    </div>
                                                )}
                                            </Button>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button onClick={() => setStep(2)} className="bg-[#8C132C] h-14 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-[#8C132C]/20">
                                                Próximo Passo <ChevronRight size={18} className="ml-2" />
                                            </Button>
                                            <label className="group cursor-pointer">
                                                <Input type="file" multiple accept=".json" onChange={handleImportSyllabus} className="hidden" />
                                                <div className="h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#8C132C]/30 group-hover:bg-[#8C132C]/5 transition-all gap-2">
                                                    <Upload size={18} />
                                                    <span className="text-[9px] font-black uppercase">Importar JSON</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </Card>
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
                                    <Button onClick={() => setStep(1)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                                        <ChevronLeft size={18} className="mr-2" /> Voltar
                                    </Button>
                                    <Button onClick={() => setStep(3)} className="bg-[#8C132C] h-14 rounded-2xl px-10 font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-[#8C132C]/20">
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
                                                Sua carga horária planejada (<strong>{totalNeededHours}h</strong>) excede o tempo disponível no calendário (<strong>{availableHours.toFixed(1)}h</strong>).
                                            </p>
                                            <p className="text-amber-800 text-[10px] font-black uppercase mt-2 italic">A IA pode sugerir uma redução proporcional para caber no semestre.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={() => setShowReallocateModal(true)} variant="outline" className="border-amber-400 text-amber-900 rounded-xl font-bold text-xs uppercase h-10 px-6 hover:bg-amber-100">
                                                Redistribuir com IA
                                            </Button>
                                            <Button onClick={() => setStep(3)} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase h-10 px-6">
                                                Organizar Manualmente
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex items-center justify-between mb-2 px-6">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plano de Ensino (Cronograma de Aulas)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-xs font-bold bg-slate-100 p-2 rounded-lg">
                                            <span className="text-slate-500 uppercase text-[9px]">Carga:</span>
                                            <span className={cn("text-[10px]", isOverflow ? "text-red-500" : "text-emerald-500")}>
                                                {totalNeededHours}h / {availableHours.toFixed(1)}h
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

                                <div className="space-y-4">
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="timeline">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                    {fullSchedule.filter((s: any) => s.type !== 'holiday').map((item: any, index: number) => {
                                                        const isAssessment = item.type === 'assessment';
                                                        const topic = !isAssessment ? topics.find(t => t.id === item.id) : null;
                                                        const assessment = isAssessment ? assessments.find(a => a.id === item.id) : null;

                                                        return (
                                                            <Draggable key={item.instanceId} draggableId={item.instanceId} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={cn(
                                                                            "group relative transition-all duration-300",
                                                                            snapshot.isDragging ? "z-50 scale-102 rotate-1" : ""
                                                                        )}
                                                                    >
                                                                        <Card className={cn(
                                                                            "p-6 rounded-[32px] border-none shadow-sm flex items-center gap-6 transition-all hover:shadow-xl hover:translate-x-2 group-hover:bg-slate-50/50",
                                                                            isAssessment ? "bg-amber-50/30 border-l-8 border-amber-400" : "bg-white",
                                                                            snapshot.isDragging ? "shadow-2xl ring-2 ring-[#8C132C]/10 bg-white" : ""
                                                                        )}>
                                                                            {/* DRAG HANDLE */}
                                                                            <div {...provided.dragHandleProps} className="text-slate-200 hover:text-slate-400 transition-colors p-2 cursor-grab active:cursor-grabbing">
                                                                                <GripVertical size={20} />
                                                                            </div>

                                                                            {/* DATE BADGE */}
                                                                            <div className="flex flex-col items-center min-w-[60px]">
                                                                                <div className={cn(
                                                                                    "w-12 h-12 rounded-2xl flex flex-col items-center justify-center mb-1 transition-all",
                                                                                    isAssessment ? "bg-amber-100 text-amber-700" : "bg-[#8C132C]/5 text-[#8C132C]"
                                                                                )}>
                                                                                    <span className="text-[12px] font-black leading-none">{item.date.split('/')[0]}</span>
                                                                                    <span className="text-[8px] font-black uppercase opacity-60">
                                                                                        {item.date.split('/')[1] === '01' ? 'Jan' : item.date.split('/')[1] === '02' ? 'Fev' : item.date.split('/')[1] === '03' ? 'Mar' : item.date.split('/')[1] === '04' ? 'Abr' : item.date.split('/')[1] === '05' ? 'Mai' : item.date.split('/')[1] === '06' ? 'Jun' : item.date.split('/')[1] === '07' ? 'Jul' : item.date.split('/')[1] === '08' ? 'Ago' : item.date.split('/')[1] === '09' ? 'Set' : item.date.split('/')[1] === '10' ? 'Out' : item.date.split('/')[1] === '11' ? 'Nov' : 'Dez'}
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter">{item.dia}</span>
                                                                            </div>

                                                                            {/* CONTENT */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-3 mb-1">
                                                                                    {isAssessment && <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none text-[8px] font-black rounded-lg h-4 px-1.5">AVALIAÇÃO</Badge>}
                                                                                    <h4 className={cn("text-base font-black truncate tracking-tight", isAssessment ? "text-amber-800" : "text-slate-800")}>
                                                                                        {item.content}
                                                                                    </h4>
                                                                                </div>
                                                                                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Clock size={12} className="opacity-40" />
                                                                                        <span>{item.time}</span>
                                                                                    </div>
                                                                                    <Badge variant="outline" className="border-slate-100 text-slate-400 text-[8px] h-4 font-black uppercase rounded-md">
                                                                                        {item.activity}
                                                                                    </Badge>
                                                                                    {isAssessment && assessment && (
                                                                                        <span className="text-amber-600 font-black">{assessment.points} PTS</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* QUICK ACTIONS */}
                                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => isAssessment ? removeAssessment(item.id) : removeTopic(item.id)}
                                                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                                    title="Remover Tópico Inteiro"
                                                                                >
                                                                                    <Trash2 size={18} />
                                                                                </button>
                                                                            </div>
                                                                        </Card>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                                    <Button onClick={() => setStep(2)} variant="ghost" className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                                        <ChevronLeft size={18} className="mr-2" /> Voltar
                                    </Button>
                                    <Button disabled={isOverflow} onClick={() => setStep(4)} className="bg-emerald-600 hover:bg-emerald-700 h-16 rounded-[28px] px-12 font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20">
                                        <Sparkles size={18} className="mr-2" /> Ativar Cronograma
                                    </Button>
                                </div>
                            </motion.div>
                        )
                    }

                    {
                        step === 4 && (
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
                        )
                    }
                </AnimatePresence >

                {/* FLOATING STATUS INFO */}
                {
                    step === 3 && (
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
                                    <div className="text-[11px] font-bold">Aulas: {totalNeededHours} / {availableHours.toFixed(0)}h</div>
                                    {totalPoints !== 100 && (
                                        <div className="flex items-center gap-2 bg-red-400/20 px-3 py-1 rounded-full text-[9px] font-black uppercase text-red-200">
                                            <AlertTriangle size={12} /> Pontos: {totalPoints}/100
                                        </div>
                                    )}
                                    {isOverflow ? (
                                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">
                                            <AlertTriangle size={12} /> Estouro: {(totalNeededHours - availableHours).toFixed(1)}h
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase text-emerald-300">
                                            <CheckCircle2 size={12} /> Espaço OK
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

            </div >

            {/* SYLLABUS PREVIEW MODAL */}
            < Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal} >
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
                                <div className="flex justify-between items-start mb-10 gap-8">
                                    <div className="space-y-4 flex-1 min-w-0">
                                        <Badge className={cn(
                                            "bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5",
                                            selectedTemplate === 4 && "bg-[#363636] text-white"
                                        )}>
                                            Documento Oficial Acadêmico
                                        </Badge>
                                        <h1 className={cn(
                                            "font-black text-slate-800 leading-tight break-words line-clamp-2",
                                            courseName.length > 40 ? "text-2xl" : "text-4xl",
                                            selectedTemplate === 2 && "font-serif italic",
                                            selectedTemplate === 2 && courseName.length > 40 ? "text-4xl" : selectedTemplate === 2 ? "text-5xl" : ""
                                        )} style={{ textWrap: 'balance' }} title={courseName}>
                                            {courseName}
                                        </h1>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Plano de Ensino & Cronograma Semestral</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        {selectedLogo && (
                                            <img src={selectedLogo} alt="Logo da Instituição" className="h-16 object-contain mb-4" />
                                        )}
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
                                        <div className="text-xs font-black text-slate-700">{totalNeededHours} Horas Totais</div>
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
                                                        <td className="px-6 py-5 relative">
                                                            <div className="flex flex-col">
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
                                                                {row.subContent && (
                                                                    <div className="text-[10px] font-bold text-[#8C132C]/60 italic mb-1 uppercase tracking-tight">
                                                                        {row.subContent}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] font-bold text-slate-300 uppercase shrink-0">
                                                                {row.time}
                                                            </div>
                                                            {/* Only show estimated date warning if it's actually an unpinned topic */}
                                                            {row.type === 'topic' && (topics.find(t => t.title === row.content)?.date == null) && (
                                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <span className="bg-slate-100 text-slate-400 text-[8px] font-black uppercase px-2 py-1 rounded-md">
                                                                        Data Calculada Automaticamente
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                    {visibleColumns.includes('references') && (
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col gap-1">
                                                                {row.bibliographyIds?.map((bid: string) => {
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
                            <section className="mt-12 grid grid-cols-2 gap-10 print-avoid-break">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                        <Award className="text-[#8C132C]" size={20} /> Composição de Notas
                                    </h3>
                                    <div className="p-8 bg-slate-50 rounded-[32px] space-y-4 border border-slate-100">
                                        <div className="space-y-4 pt-4">
                                            {[...assessments].sort((a, b) => {
                                                if (!a.date) return 1;
                                                if (!b.date) return -1;
                                                return new Date(a.date).getTime() - new Date(b.date).getTime();
                                            }).map(ass => (
                                                <div key={ass.id} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
                                                    <span className="text-sm font-bold text-slate-600 flex items-center gap-3">
                                                        {ass.name}
                                                        {ass.date && <span className="bg-[#8C132C]/10 text-[#8C132C] text-[9px] px-2 py-1 rounded-md uppercase font-black tracking-widest">{format(new Date(ass.date), 'dd/MM')}</span>}
                                                    </span>
                                                    <span className="text-lg font-black text-[#363636]">{ass.points} pts</span>
                                                </div>
                                            ))}
                                        </div>    <div className="mt-6 pt-6 border-t-2 border-slate-200 flex justify-between items-center">
                                            <span className="text-xs font-black text-[#8C132C] uppercase tracking-widest">Total da Disciplina</span>
                                            <span className="text-2xl font-black text-[#8C132C]">{totalPoints} pts</span>
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
            </Dialog >

            {/* Conflict Resolution Modal */}
            < Dialog open={showConflictModal} onOpenChange={setShowConflictModal} >
                <DialogContent className="max-w-[600px] rounded-[48px] p-10 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-800">Divergência entre Documentos</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 mt-2">
                            A Axiom AI detectou informações conflitantes entre o <strong className="text-slate-600">Plano de Ensino</strong> e o <strong className="text-slate-600">Cronograma Auxiliar</strong>. Como deseja proceder?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mt-8">
                        <button
                            onClick={() => {
                                setShowConflictModal(false);
                                setUploadedFiles([]); // Limpa para evitar loop de conflito
                                toast.success("Utilizando dados do Plano de Ensino (Prioridade Acadêmica)");
                                setTimeout(() => handleRunAIAnalysis(), 500);
                            }}
                            className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-700">Priorizar Plano de Ensino</span>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Usa bibliografia e ementa oficial do PPC.</p>
                        </button>

                        <button
                            onClick={() => {
                                setShowConflictModal(false);
                                setUploadedFiles([]); // Limpa para evitar loop de conflito
                                toast.success("Utilizando dados do Cronograma Auxiliar");
                                setTimeout(() => handleRunAIAnalysis(), 500);
                            }}
                            className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-[#8C132C]/20 text-left transition-all group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-700">Priorizar Cronograma Auxiliar</span>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#8C132C]" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Usa datas e sequências customizadas do docente.</p>
                        </button>
                    </div>
                </DialogContent>
            </Dialog >

            <Dialog open={showDraftsModal} onOpenChange={setShowDraftsModal} >
                <DialogContent className="max-w-[800px] rounded-[48px] p-10 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-800">Meus Rascunhos</DialogTitle>
                        <DialogDescription className="font-bold uppercase text-[10px] tracking-widest text-slate-400">
                            Gerencie e carregue versões salvas do seu cronograma
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mt-8 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                        {drafts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
                                <BookOpen size={48} className="opacity-20" />
                                <span className="font-black uppercase text-xs tracking-widest">Nenhum rascunho salvo</span>
                            </div>
                        ) : (
                            drafts.map((draft) => (
                                <div key={draft.id} className="group bg-slate-50 p-6 rounded-[32px] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between gap-6">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-700 truncate">{draft.name}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {format(new Date(draft.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => loadDraft(draft)}
                                            className="bg-[#8C132C] rounded-2xl h-11 px-6 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105"
                                        >
                                            Carregar
                                        </Button>
                                        <button
                                            onClick={() => deleteDraft(draft.id)}
                                            className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog >
        </>
    );
}

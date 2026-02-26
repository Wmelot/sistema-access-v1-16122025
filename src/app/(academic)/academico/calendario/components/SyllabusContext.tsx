'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Book, Topic, Assessment } from './types';

interface SyllabusContextType {
    // Basic Info
    step: number;
    setStep: (s: number) => void;
    courseName: string;
    setCourseName: (s: string) => void;
    publicSlug: string;
    setPublicSlug: (s: string) => void;
    theoryLocation: string;
    setTheoryLocation: (s: string) => void;
    practiceLocation: string;
    setPracticeLocation: (s: string) => void;
    startDate: Date;
    setStartDate: (d: Date) => void;
    endDate: Date;
    setEndDate: (d: Date) => void;
    locationCity: string;
    setLocationCity: (s: string) => void;
    weekDays: { day: string, start: string, end: string, frequency: 'weekly' | 'biweekly' | 'monthly' }[];
    setWeekDays: (days: { day: string, start: string, end: string, frequency: 'weekly' | 'biweekly' | 'monthly' }[]) => void;
    holidays: { date: string, desc: string }[];
    setHolidays: (h: { date: string, desc: string }[]) => void;

    // Collections
    books: Book[];
    setBooks: (b: Book[]) => void;
    topics: Topic[];
    setTopics: (t: Topic[]) => void;
    assessments: Assessment[];
    setAssessments: (a: Assessment[]) => void;
    timelineOrder: { id: string, type: 'topic' | 'assessment' | 'empty', instanceId: string }[];
    setTimelineOrder: (o: { id: string, type: 'topic' | 'assessment' | 'empty', instanceId: string }[]) => void;
    completedTopicIds: string[];
    setCompletedTopicIds: (ids: string[]) => void;

    // UI States
    viewMode: 'professor' | 'student';
    setViewMode: (m: 'professor' | 'student') => void;
    showPreviewModal: boolean;
    setShowPreviewModal: (s: boolean) => void;
    selectedTemplate: number;
    setSelectedTemplate: (t: number) => void;
    orientation: 'portrait' | 'landscape';
    setOrientation: (o: 'portrait' | 'landscape') => void;
    printFontSize: 'small' | 'medium' | 'large';
    setPrintFontSize: (s: 'small' | 'medium' | 'large') => void;
    isSynced: boolean;
    setIsSynced: (s: boolean) => void;
    visibleColumns: string[];
    setVisibleColumns: (cols: string[]) => void;
    selectedLogo: string | null;
    setSelectedLogo: (l: string | null) => void;

    // Derived & Calculations
    availableDays: number;
    availableHours: number;
    totalNeededHours: number;
    totalPoints: number;
    fullSchedule: any[];
    isOverflow: boolean;

    // Actions
    saveDraft: (name?: string) => Promise<void>;
    deleteDraft: (id: string) => Promise<void>;
    loadDraft: (draft: any, targetStep?: number) => void;
    suggestExamDates: () => void;
    toggleTopicCompletion: (id: string) => void;
    onDragEnd: (result: any) => void;
    updateTopic: (id: string, updates: Partial<Topic>) => void;
    updateAssessment: (id: string, updates: Partial<Assessment>) => void;
    removeTopic: (id: string) => void;
    removeAssessment: (id: string) => void;
    addBook: (book: Omit<Book, 'id'>) => void;
    removeBook: (id: string) => void;

    // AI Related
    uploadedFiles: { name: string, type: string, file?: File }[];
    setUploadedFiles: (f: { name: string, type: string, file?: File }[]) => void;
    isAnalyzing: boolean;
    handleImportFromDocument: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRunAIAnalysis: () => Promise<void>;
    generateAIContent: () => Promise<void>;
    reallocateWithIA: (strategy?: 'linear' | 'prioritize') => Promise<void>;

    // Drafts State
    drafts: any[];
    showDraftsModal: boolean;
    setShowDraftsModal: (s: boolean) => void;
    showReallocateModal: boolean;
    setShowReallocateModal: (s: boolean) => void;
    addTopic: () => void;
    handleExportSyllabus: () => void;
    handleImportSyllabus: (e: React.ChangeEvent<HTMLInputElement>) => void;
    printRef: React.RefObject<HTMLDivElement>;
    handlePrint: () => void;
    showConflictModal: boolean;
    setShowConflictModal: (s: boolean) => void;
    materializeEmptySlot: (instanceId: string, title: string) => void;
    createNewSyllabus: () => void;
    pinnedDates: Record<string, string>;
    pinDate: (instanceId: string, date: string | null) => void;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

import { useReactToPrint } from 'react-to-print';

export function SyllabusProvider({ children }: { children: React.ReactNode }) {
    const [step, setStep] = useState(1);
    const [courseName, setCourseName] = useState('Fisioterapia Traumato-Ortopédica');
    const [publicSlug, setPublicSlug] = useState('traumato-2026');
    const [theoryLocation, setTheoryLocation] = useState('Prédio 7 - Sala 202');
    const [practiceLocation, setPracticeLocation] = useState('Laboratório de Cinesio - Bloco B');
    const [startDate, setStartDate] = useState<Date>(new Date(2026, 1, 1));
    const [endDate, setEndDate] = useState<Date>(new Date(2026, 5, 30));
    const [locationCity, setLocationCity] = useState('Belo Horizonte, MG');
    const [weekDays, setWeekDays] = useState<{ day: string, start: string, end: string, frequency: 'weekly' | 'biweekly' | 'monthly' }[]>([
        { day: '2', start: '19:00', end: '20:40', frequency: 'weekly' },
        { day: '4', start: '19:00', end: '20:40', frequency: 'weekly' }
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

    const [books, setBooks] = useState<Book[]>([
        { id: 'b1', title: 'Tratado de Fisioterapia Traumato-Ortopédica', author: 'Dutton', type: 'Básico' },
        { id: 'b2', title: 'Cinesiologia do Aparelho Musculoesquelético', author: 'Neumann', type: 'Básico' }
    ]);

    const [topics, setTopics] = useState<Topic[]>([
        { id: 't1', title: 'Introdução à Propedêutica Ortopédica', classesNeeded: 2, bibliographyIds: ['b1'], isPractical: false, resources: ['Projetor Multimedia', 'Artigos Científicos (PDF)'], methodology: 'Aula Dialogada' },
        { id: 't2', title: 'Avaliação Funcional da Coluna Vertebral', classesNeeded: 3, bibliographyIds: ['b1', 'b2'], isPractical: true, resources: ['Macas de Atendimento', 'Esqueleto Humano Articulado'], methodology: 'Estudo de Caso' }
    ]);

    const [assessments, setAssessments] = useState<Assessment[]>([
        { id: 'a1', name: 'Atividades Avaliativas', date: null, points: 70, type: 'Teórica', classesNeeded: 2, content: '' },
        { id: 'a2', name: 'Avaliação Global', date: null, points: 30, type: 'Teórica', classesNeeded: 2, content: '' }
    ]);

    const [timelineOrder, setTimelineOrder] = useState<{ id: string, type: 'topic' | 'assessment' | 'empty', instanceId: string }[]>([]);
    const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'professor' | 'student'>('professor');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(1);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [printFontSize, setPrintFontSize] = useState<'small' | 'medium' | 'large'>('large');
    const [isSynced, setIsSynced] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['data', 'dia', 'conteudo', 'references', 'atividade', 'pontos']);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<any[]>([]);
    const [showDraftsModal, setShowDraftsModal] = useState(false);

    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, type: string, file?: File }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pinnedDates, setPinnedDates] = useState<Record<string, string>>({});

    const pinDate = (instanceId: string, date: string | null) => {
        setPinnedDates(prev => {
            const next = { ...prev };
            if (date) next[instanceId] = date;
            else delete next[instanceId];
            return next;
        });
    };

    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

    // Fetch drafts on mount + Recover safety backup
    useEffect(() => {
        const fetchDrafts = async () => {
            try {
                const res = await fetch('/api/academic/drafts');
                const data = await res.json();
                if (data.drafts) setDrafts(data.drafts);
            } catch (err) {
                console.error("Erro ao carregar rascunhos:", err);
            }
        };
        fetchDrafts();

        // Safety Recovery
        const backup = localStorage.getItem('syllabus_backup');
        if (backup) {
            try {
                const { activeDraftId: backupId, ...data } = JSON.parse(backup);
                toast("Encontramos um progresso não salvo. Deseja recuperar?", {
                    action: {
                        label: "Recuperar",
                        onClick: () => {
                            loadDraft({ id: backupId, data });
                            toast.success("Progresso recuperado!");
                        }
                    },
                    duration: 10000
                });
            } catch (e) { }
        }
    }, []);

    // Automatic Backup every 2s of changes
    useEffect(() => {
        const data = { activeDraftId, courseName, publicSlug, theoryLocation, practiceLocation, startDate, endDate, weekDays, assessments, books, topics, holidays, locationCity, selectedLogo, completedTopicIds, timelineOrder, pinnedDates };
        const timeout = setTimeout(() => {
            localStorage.setItem('syllabus_backup', JSON.stringify(data));
        }, 2000);
        return () => clearTimeout(timeout);
    }, [activeDraftId, courseName, publicSlug, theoryLocation, practiceLocation, startDate, endDate, weekDays, assessments, books, topics, holidays, locationCity, selectedLogo, completedTopicIds, timelineOrder, pinnedDates]);

    // AI Helper
    const parseSafeDate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.includes('T')) return new Date(dateStr);
        return new Date(dateStr + 'T12:00:00');
    };

    // Slug generation
    useEffect(() => {
        if (courseName && !publicSlug.includes('-')) {
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

    // Derived values
    const [availableDays, setAvailableDays] = useState(0);
    const [availableHours, setAvailableHours] = useState(0);

    const classDuration = React.useMemo(() => {
        if (weekDays.length === 0) return 2;
        const d = weekDays[0];
        const [h1, m1] = d.start.split(':').map(Number);
        const [h2, m2] = d.end.split(':').map(Number);
        return (h2 * 60 + m2 - (h1 * 60 + m1)) / 50;
    }, [weekDays]);

    useEffect(() => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        let count = 0;
        let current = new Date(start);
        const activeDays = weekDays.map(w => w.day);
        let totalAvailableHours = 0;
        const occurrenceCounter: { [day: string]: number } = {};

        while (current <= end) {
            const jsDay = current.getDay() === 0 ? '7' : current.getDay().toString();
            if (activeDays.includes(jsDay)) {
                const dateStr = current.toISOString().split('T')[0];
                const isHoliday = holidays.some(h => h.date === dateStr);
                if (!isHoliday) {
                    const config = weekDays.find(w => w.day === jsDay);
                    if (config) {
                        occurrenceCounter[jsDay] = (occurrenceCounter[jsDay] || 0) + 1;
                        let isActive = true;
                        if (config.frequency === 'biweekly' && occurrenceCounter[jsDay] % 2 === 0) isActive = false;
                        if (config.frequency === 'monthly' && (occurrenceCounter[jsDay] - 1) % 4 !== 0) isActive = false;

                        if (isActive) {
                            const [h1, m1] = config.start.split(':').map(Number);
                            const [h2, m2] = config.end.split(':').map(Number);
                            const duration = (h2 * 60 + m2 - (h1 * 60 + m1)) / 50;
                            totalAvailableHours += duration;
                            count++;
                        }
                    }
                }
            }
            current.setDate(current.getDate() + 1);
        }
        setAvailableDays(count);
        setAvailableHours(totalAvailableHours);
    }, [startDate, endDate, weekDays, holidays]);

    useEffect(() => {
        setTimelineOrder(prev => {
            let newItems = [...prev];
            let hasChanges = false;
            const allValidIds = [...topics.map(t => t.id), ...assessments.map(a => a.id)];
            const counts: Record<string, number> = {};

            topics.forEach(t => counts[t.id] = Math.max(1, Math.ceil(t.classesNeeded / classDuration)));
            assessments.forEach(a => counts[a.id] = a.classesNeeded === 0 ? 1 : Math.max(1, Math.ceil(a.classesNeeded / classDuration)));

            // Remove deleted
            const filtered = newItems.filter(item => item.type === 'empty' || allValidIds.includes(item.id));
            if (filtered.length !== newItems.length) {
                newItems = filtered;
                hasChanges = true;
            }

            // Sync counts
            allValidIds.forEach(id => {
                const target = counts[id] || 0;
                const currentOccurrences = newItems.filter(i => i.id === id);

                if (currentOccurrences.length < target) {
                    const type: 'topic' | 'assessment' = topics.find(t => t.id === id) ? 'topic' : 'assessment';
                    const diff = target - currentOccurrences.length;

                    // Find last index to maintain contiguity
                    let lastIndex = -1;
                    for (let i = newItems.length - 1; i >= 0; i--) {
                        if (newItems[i].id === id) {
                            lastIndex = i;
                            break;
                        }
                    }

                    for (let i = 0; i < diff; i++) {
                        const newSegment = { id, type, instanceId: `${id}-seg-${Date.now()}-${i}` };
                        if (lastIndex !== -1) {
                            // Insert right after the last segment of the same topic
                            newItems.splice(lastIndex + 1, 0, newSegment);
                            lastIndex++; // Move pointer for next segment
                        } else {
                            // New item: insert before the first 'empty' slot if possible
                            const firstEmpty = newItems.findIndex(item => item.type === 'empty');
                            if (firstEmpty !== -1) {
                                newItems.splice(firstEmpty, 0, newSegment);
                            } else {
                                newItems.push(newSegment);
                            }
                        }
                    }
                    hasChanges = true;
                } else if (currentOccurrences.length > target) {
                    let over = currentOccurrences.length - target;
                    for (let i = newItems.length - 1; i >= 0 && over > 0; i--) {
                        if (newItems[i].id === id) { newItems.splice(i, 1); over--; }
                    }
                    hasChanges = true;
                }
            });

            // Adjust Empties to reach availableDays
            let currentTotal = newItems.length;
            if (currentTotal < availableDays) {
                const diff = availableDays - currentTotal;
                for (let i = 0; i < diff; i++) {
                    const eid = `empty-fill-${Date.now()}-${i}`;
                    newItems.push({ id: eid, type: 'empty', instanceId: eid });
                }
                hasChanges = true;
            } else if (currentTotal > availableDays && newItems.some(i => i.type === 'empty')) {
                let over = currentTotal - availableDays;
                for (let i = newItems.length - 1; i >= 0 && over > 0; i--) {
                    if (newItems[i].type === 'empty') { newItems.splice(i, 1); over--; }
                }
                hasChanges = true;
            }

            return hasChanges ? newItems : prev;
        });
    }, [topics, assessments, availableDays, classDuration]);

    const totalNeededHours = topics.reduce((acc, t) => acc + t.classesNeeded, 0) + assessments.reduce((acc, a) => acc + a.classesNeeded, 0);
    const totalPoints = assessments.reduce((acc, a) => acc + (a.isSubstitutive ? 0 : a.points), 0);
    const isOverflow = totalNeededHours > availableHours + 0.1;

    // Full Schedule Memoized
    const fullSchedule = React.useMemo(() => {
        if (!startDate || !endDate) return [];

        // 1. Get all potential class days
        const days: any[] = [];
        let curr = new Date(startDate);
        const occurrenceCounter: Record<string, number> = {};
        while (curr <= endDate) {
            const dStr = format(curr, 'yyyy-MM-dd');
            const jsDay = (curr.getDay() === 0 ? 7 : curr.getDay()).toString();
            const config = weekDays.find(w => w.day === jsDay);
            const holiday = holidays.find(h => h.date === dStr);
            if (config && !holiday) {
                occurrenceCounter[jsDay] = (occurrenceCounter[jsDay] || 0) + 1;
                let isActive = true;
                if (config.frequency === 'biweekly' && occurrenceCounter[jsDay] % 2 === 0) isActive = false;
                if (config.frequency === 'monthly' && (occurrenceCounter[jsDay] - 1) % 4 !== 0) isActive = false;
                if (isActive) {
                    days.push({
                        date: format(curr, 'dd/MM'),
                        dateStr: dStr,
                        dia: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][curr.getDay()],
                        config
                    });
                }
            }
            curr.setDate(curr.getDate() + 1);
        }

        // 2. Map items
        const schedule: any[] = [];
        const occupiedDates = new Set<string>();

        // Predetermine which dates are occupied by pinned items (duration > 0)
        timelineOrder.forEach(item => {
            if (pinnedDates[item.instanceId]) {
                const source = item.type === 'topic' ? topics.find(t => t.id === item.id) : assessments.find(a => a.id === item.id);
                if (source && source.classesNeeded > 0) {
                    occupiedDates.add(pinnedDates[item.instanceId]);
                }
            }
        });

        let dayIdx = 0;
        timelineOrder.forEach((item, idx) => {
            let dateInfo: any;
            const source = item.type === 'topic' ? topics.find(t => t.id === item.id) : assessments.find(a => a.id === item.id);
            const duration = source?.classesNeeded ?? 0;

            if (pinnedDates[item.instanceId]) {
                const d = new Date(pinnedDates[item.instanceId] + 'T12:00:00');
                const jsDay = (d.getDay() === 0 ? 7 : d.getDay()).toString();
                dateInfo = {
                    dateStr: pinnedDates[item.instanceId],
                    date: format(d, 'dd/MM'),
                    dia: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][d.getDay()],
                    config: weekDays.find(w => w.day === jsDay) || days.find(d => d.dateStr === pinnedDates[item.instanceId])?.config || weekDays[0]
                };
            } else {
                // Automatic flow: find next day that isn't fully occupied
                while (dayIdx < days.length && occupiedDates.has(days[dayIdx].dateStr)) {
                    dayIdx++;
                }
                if (dayIdx < days.length) {
                    dateInfo = days[dayIdx];
                    if (duration > 0) {
                        dayIdx++;
                    }
                } else {
                    dateInfo = { date: '---', dia: 'EXTRA', dateStr: '9999-99-99', config: null };
                }
            }

            if (source || item.type === 'empty') {
                const occ = timelineOrder.slice(0, idx + 1).filter(i => i.id === item.id).length;
                const total = timelineOrder.filter(i => i.id === item.id).length;

                schedule.push({
                    instanceId: item.instanceId,
                    id: item.id,
                    date: dateInfo.date,
                    dia: dateInfo.dia,
                    dateStr: dateInfo.dateStr,
                    type: item.type,
                    content: item.type === 'empty' ? 'Espaço Vago' : ((item.type === 'topic' ? (source as Topic).title : (source as Assessment).name) + (total > 1 ? ` (Parte ${occ})` : '')),
                    activity: item.type === 'topic' ? (source as Topic).methodology : (source ? 'Avaliação ' + (source as Assessment).type : '-'),
                    subContent: item.type === 'topic' ? ((source as Topic).isPractical ? 'Aula Prática' : 'Aula Teórica') : (source ? (source as Assessment).content : ''),
                    points: item.type === 'topic' ? null : (source ? (source as Assessment).points : null),
                    time: dateInfo.config ? `${dateInfo.config.start} - ${dateInfo.config.end}` : '-',
                    duration: duration,
                    isPractical: item.type === 'topic' ? (source as Topic).isPractical : false,
                    bibliographyIds: item.type === 'topic' ? (source as Topic).bibliographyIds : [],
                    isPinned: !!pinnedDates[item.instanceId]
                });
            }
        });

        // 3. Add Holidays
        holidays.forEach(h => {
            const d = new Date(h.date + 'T12:00:00');
            const startStr = format(startDate, 'yyyy-MM-dd');
            const endStr = format(endDate, 'yyyy-MM-dd');

            if (h.date >= startStr && h.date <= endStr) {
                const jsDay = (d.getDay() === 0 ? 7 : d.getDay()).toString();
                const isClassDay = weekDays.some(w => w.day === jsDay);

                if (isClassDay) {
                    schedule.push({
                        date: format(d, 'dd/MM'),
                        dateStr: h.date,
                        dia: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][d.getDay()],
                        type: 'holiday',
                        content: h.desc
                    });
                }
            }
        });

        // 4. Sort by Date
        return schedule.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    }, [startDate, endDate, weekDays, holidays, topics, assessments, timelineOrder, pinnedDates]);

    const saveDraft = async (name: string = "", silent: boolean = false) => {
        const finalName = (name || courseName || "Cronograma sem nome").trim();
        const draftData = { courseName: finalName, publicSlug, theoryLocation, practiceLocation, startDate, endDate, weekDays, assessments, books, topics, holidays, locationCity, selectedLogo, completedTopicIds, timelineOrder, pinnedDates };

        let updated;
        const exists = activeDraftId && drafts.find(d => d.id === activeDraftId);

        if (exists) {
            updated = drafts.map(d => d.id === activeDraftId ? { ...d, name: finalName, date: new Date().toISOString(), data: draftData } : d);
        } else {
            const newId = Date.now().toString();
            setActiveDraftId(newId);
            const newD = { id: newId, name: finalName, date: new Date().toISOString(), data: draftData };
            updated = [newD, ...drafts];
        }

        setDrafts(updated);

        const savePromise = fetch('/api/academic/drafts', {
            method: 'POST',
            body: JSON.stringify({ drafts: updated }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!silent) {
            toast.promise(savePromise, {
                loading: 'Salvando cronograma...',
                success: `Cronograma "${finalName}" salvo com sucesso!`,
                error: 'Erro ao persistir no servidor'
            });
        }
    };

    const deleteDraft = async (id: string) => {
        const updated = drafts.filter(d => d.id !== id);
        setDrafts(updated);
        fetch('/api/academic/drafts', { method: 'POST', body: JSON.stringify({ drafts: updated }), headers: { 'Content-Type': 'application/json' } });
        toast.success("Excluído");
    };

    const loadDraft = (draft: any, targetStep?: number) => {
        const d = draft.data;
        setActiveDraftId(draft.id || null);
        if (d.courseName) setCourseName(d.courseName);
        if (d.publicSlug) setPublicSlug(d.publicSlug);
        if (d.theoryLocation) setTheoryLocation(d.theoryLocation);
        if (d.practiceLocation) setPracticeLocation(d.practiceLocation);
        if (d.startDate) setStartDate(new Date(d.startDate));
        if (d.endDate) setEndDate(new Date(d.endDate));
        if (d.weekDays) setWeekDays(d.weekDays);
        if (d.assessments) setAssessments(d.assessments.map((a: any) => ({ ...a, date: a.date ? new Date(a.date) : null })));
        if (d.books) setBooks(d.books);
        if (d.topics) setTopics(d.topics);
        if (d.holidays) setHolidays(d.holidays);
        if (d.locationCity) setLocationCity(d.locationCity);
        if (d.selectedLogo) setSelectedLogo(d.selectedLogo);
        if (d.completedTopicIds) setCompletedTopicIds(d.completedTopicIds);
        if (d.timelineOrder) setTimelineOrder(d.timelineOrder);
        if (d.pinnedDates) setPinnedDates(d.pinnedDates);
        setIsSynced(true);
        setShowDraftsModal(false);
        if (targetStep) setStep(targetStep);
    };

    const suggestExamDates = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const active = weekDays.map(w => w.day);
        const findNear = (target: Date) => {
            for (let o = 0; o <= 10; o++) {
                const f = new Date(target); f.setDate(target.getDate() + o);
                if (active.includes(f.getDay() === 0 ? '7' : f.getDay().toString())) return f;
                const b = new Date(target); b.setDate(target.getDate() - o);
                if (active.includes(b.getDay() === 0 ? '7' : b.getDay().toString())) return b;
            }
            return target;
        };

        const newAss = assessments.map((a, i) => {
            let target = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i + 1) / (assessments.length + 1));
            return { ...a, date: findNear(target) };
        });
        setAssessments(newAss);
        toast.success("Datas sugeridas");
    };

    // Broadcast Channel for Real-time Sync across tabs
    useEffect(() => {
        const channel = new BroadcastChannel('syllabus_sync');
        channel.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'SYNC_COMPLETION') {
                setCompletedTopicIds(payload);
            }
        };
        return () => channel.close();
    }, []);

    // Auto-save Digital Diary changes
    useEffect(() => {
        if (activeDraftId && step === 4) {
            const timer = setTimeout(() => {
                saveDraft(courseName, true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [completedTopicIds]);

    const toggleTopicCompletion = (instanceId: string) => {
        setCompletedTopicIds(prev => {
            const next = prev.includes(instanceId) ? prev.filter(tid => tid !== instanceId) : [...prev, instanceId];
            const channel = new BroadcastChannel('syllabus_sync');
            channel.postMessage({ type: 'SYNC_COMPLETION', payload: next });
            channel.close();
            return next;
        });
    };

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        const items = Array.from(timelineOrder);
        const [removed] = items.splice(source.index, 1);
        items.splice(destination.index, 0, removed);
        setTimelineOrder(items);
        toast.success("Reorganizado");
    };

    const updateTopic = (id: string, updates: Partial<Topic>) => setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const updateAssessment = (id: string, updates: Partial<Assessment>) => setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    const removeTopic = (id: string) => setTopics(prev => prev.filter(t => t.id !== id));
    const removeAssessment = (id: string) => setAssessments(prev => prev.filter(a => a.id !== id));
    const addBook = (b: Omit<Book, 'id'>) => setBooks(prev => [...prev, { ...b, id: Date.now().toString() }]);
    const removeBook = (id: string) => setBooks(prev => prev.filter(b => b.id !== id));

    const handleImportFromDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, type: f.type || 'Documento', file: f }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
        setIsSynced(false);
        toast.success("Arquivo adicionado!");
    };

    const handleRunAIAnalysis = async () => {
        if (uploadedFiles.length === 0) return;
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            uploadedFiles.forEach(f => { if (f.file) formData.append("files", f.file); });
            formData.append("location", locationCity);
            const res = await fetch("/api/ai/extract-syllabus", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Falha na análise");
            const data = await res.json();
            if (data.courseName) setCourseName(data.courseName);
            const sDate = parseSafeDate(data.startDate); if (sDate) setStartDate(sDate);
            const eDate = parseSafeDate(data.endDate); if (eDate) setEndDate(eDate);
            if (data.books) setBooks(data.books);
            if (data.topics) setTopics(data.topics);
            if (data.assessments) {
                const processedAssessments = data.assessments.map((a: any) => ({ ...a, id: a.id || `a-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, date: a.date ? parseSafeDate(a.date) : null, classesNeeded: a.classesNeeded || 2, content: a.content || '' }));
                setAssessments(processedAssessments);
                const newTimeline = [
                    ...data.topics.map((t: any) => ({ id: t.id, type: 'topic' as const, instanceId: `ai-t-${t.id}-${Date.now()}` })),
                    ...processedAssessments.map((a: any) => ({ id: a.id, type: 'assessment' as const, instanceId: `ai-a-${a.id}-${Date.now()}` }))
                ];
                setTimelineOrder(newTimeline);
            }
            if (data.holidays) setHolidays(data.holidays);
            setIsSynced(true);
            toast.success("IA: Sincronizado com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao analisar documentos.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const [showReallocateModal, setShowReallocateModal] = useState(false);

    const addTopic = () => {
        const newTopic: Topic = {
            id: Date.now().toString(),
            title: 'Novo Tópico',
            classesNeeded: 2,
            bibliographyIds: [],
            isPractical: false,
            resources: [],
            methodology: 'Aula Dialogada'
        };
        setTopics([...topics, newTopic]);
        setTimelineOrder([...timelineOrder, { id: newTopic.id, type: 'topic', instanceId: `t-${newTopic.id}-${Date.now()}` }]);
    };

    const materializeEmptySlot = (instanceId: string, title: string) => {
        const newTopic: Topic = {
            id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 2)}`,
            title: title || 'Novo Tópico',
            classesNeeded: 2,
            bibliographyIds: [],
            isPractical: false,
            resources: [],
            methodology: 'Aula Dialogada'
        };
        setTopics(prev => [...prev, newTopic]);
        setTimelineOrder(prev => prev.map(item => item.instanceId === instanceId ? { ...item, id: newTopic.id, type: 'topic' } : item));
    };

    const generateAIContent = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/suggest-topics", {
                method: "POST",
                body: JSON.stringify({ courseName, topicsCount: 15 }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error("Erro IA");
            const data = await res.json();
            if (data.topics) {
                const newTopics = data.topics.map((t: any) => ({ ...t, id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` }));
                setTopics(newTopics);
                setTimelineOrder(newTopics.map((t: any) => ({ id: t.id, type: 'topic' as const, instanceId: `ai-sug-${t.id}-${Date.now()}` })));
                toast.success("IA: Tópicos sugeridos!");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const reallocateWithIA = async (strategy: 'linear' | 'prioritize' = 'linear') => {
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/reallocate", {
                method: "POST",
                body: JSON.stringify({ topics, availableHours, strategy }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error("Erro reallocation");
            const data = await res.json();
            if (data.topics) {
                const updatedTopics = topics.map(t => {
                    const aiUpdate = data.topics.find((at: any) => at.id === t.id);
                    return aiUpdate ? { ...t, classesNeeded: Number(aiUpdate.classesNeeded) } : t;
                });
                setTopics(updatedTopics);

                // Check if it still overflows after state update would have been processed
                // Since setTopics is async, we calculate the potential new total here
                const newTotal = updatedTopics.reduce((acc, t) => acc + t.classesNeeded, 0);
                if (newTotal > availableHours + 0.1) {
                    toast.warning("IA: Ajustado, mas alguns tópicos ainda excedem o tempo disponível.");
                } else {
                    toast.success("IA: Cronograma otimizado com sucesso!");
                }
            }
        } catch (err) {
            toast.error("Erro ao reordenar com IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const printRef = useRef<HTMLDivElement>(null!);

    const handlePrint = useReactToPrint({
        contentRef: printRef as any,
        documentTitle: `Cronograma-${publicSlug}`,
    });

    const handleExportSyllabus = () => {
        const data = {
            courseName, publicSlug, theoryLocation, practiceLocation,
            startDate, endDate, weekDays, assessments, books, topics,
            holidays, locationCity, timelineOrder, pinnedDates
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `cronograma-${publicSlug || 'export'}.json`;
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
                if (data.publicSlug) setPublicSlug(data.publicSlug);
                if (data.theoryLocation) setTheoryLocation(data.theoryLocation || '');
                if (data.practiceLocation) setPracticeLocation(data.practiceLocation || '');
                if (data.startDate) setStartDate(new Date(data.startDate));
                if (data.endDate) setEndDate(new Date(data.endDate));
                if (data.weekDays) setWeekDays(data.weekDays);
                if (data.locationCity) setLocationCity(data.locationCity || '');
                if (data.holidays) setHolidays(data.holidays);
                if (data.books) setBooks(data.books);
                if (data.topics) setTopics(data.topics);
                if (data.assessments) setAssessments(data.assessments.map((a: any) => ({ ...a, date: a.date ? new Date(a.date) : null })));
                if (data.timelineOrder) setTimelineOrder(data.timelineOrder);
                if (data.pinnedDates) setPinnedDates(data.pinnedDates);

                toast.success("Importado com sucesso!");
                setStep(4);
            } catch (err) { toast.error("Erro ao importar JSON!"); }
        };
        reader.readAsText(files[0]);
    };

    const createNewSyllabus = () => {
        setStep(1);
        setCourseName('Novo Cronograma');
        setPublicSlug(`novo-cronograma-${new Date().getFullYear()}`);
        setTheoryLocation('');
        setPracticeLocation('');
        setStartDate(new Date(2026, 1, 1));
        setEndDate(new Date(2026, 5, 30));
        setWeekDays([{ day: '2', start: '19:00', end: '20:40', frequency: 'weekly' }]);
        setHolidays([]);
        setBooks([]);
        setTopics([]);
        setAssessments([]);
        setTimelineOrder([]);
        setPinnedDates({});
        setCompletedTopicIds([]);
        setSelectedLogo(null);
        setIsSynced(false);
        toast.success("Novo cronograma iniciado!");
    };

    return (
        <SyllabusContext.Provider value={{
            step, setStep, courseName, setCourseName, publicSlug, setPublicSlug,
            theoryLocation, setTheoryLocation, practiceLocation, setPracticeLocation,
            startDate, setStartDate, endDate, setEndDate, locationCity, setLocationCity,
            weekDays, setWeekDays, holidays, setHolidays, books, setBooks,
            topics, setTopics, assessments, setAssessments, timelineOrder, setTimelineOrder,
            completedTopicIds, setCompletedTopicIds, viewMode, setViewMode,
            showPreviewModal, setShowPreviewModal, selectedTemplate, setSelectedTemplate,
            orientation, setOrientation, printFontSize, setPrintFontSize,
            isSynced, setIsSynced, visibleColumns, setVisibleColumns, selectedLogo, setSelectedLogo,
            availableDays, availableHours, totalNeededHours, totalPoints, fullSchedule, isOverflow,
            saveDraft, deleteDraft, loadDraft, suggestExamDates, toggleTopicCompletion,
            onDragEnd, updateTopic, updateAssessment, removeTopic, removeAssessment, addBook, removeBook,
            drafts, showDraftsModal, setShowDraftsModal,
            uploadedFiles, setUploadedFiles, isAnalyzing, handleImportFromDocument, handleRunAIAnalysis,
            generateAIContent, reallocateWithIA, showReallocateModal, setShowReallocateModal, addTopic,
            handleExportSyllabus, handleImportSyllabus, printRef, handlePrint,
            showConflictModal, setShowConflictModal, materializeEmptySlot, createNewSyllabus,
            pinnedDates, pinDate
        }}>
            {children}
        </SyllabusContext.Provider>
    );
}

export const useSyllabus = () => {
    const context = useContext(SyllabusContext);
    if (!context) throw new Error('useSyllabus must be used within a SyllabusProvider');
    return context;
};

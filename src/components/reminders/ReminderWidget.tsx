'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createReminder, getReminders, deleteReminder, updateReminderStatus, snoozeReminder } from '@/app/dashboard/[slug]/reminders/actions';
import { Bell, Calendar, Plus, Trash2, CheckCircle2, Clock, MoreHorizontal, Check, Trash, Eye, XCircle, FileText, Users, MessageSquare, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useSidebar } from '@/hooks/use-sidebar';

export function ReminderWidget({ className, iconClassName = "h-4 w-4" }: { className?: string, iconClassName?: string }) {
    const { slug } = useParams();
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const [reminders, setReminders] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('self');

    const [newReminder, setNewReminder] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchReminders = async () => {
        try {
            const data = await getReminders();
            setReminders((data || []).filter((r: any) => r.status !== 'resolved'));
        } catch (e) {
            console.error("Error fetching reminders:", e);
        }
    };

    useEffect(() => {
        fetchReminders();

        // Safe dynamic import for professionals
        import('@/app/dashboard/[slug]/professionals/actions')
            .then(mod => {
                if (mod && mod.getProfessionals) {
                    mod.getProfessionals().then((data: any[]) => setProfessionals(data || []));
                }
            })
            .catch(err => console.warn("Could not load professional actions dynamic import:", err));

        const interval = setInterval(fetchReminders, 60000);

        const handleUpdate = () => fetchReminders();
        const handleToggle = () => setIsOpen(prev => !prev);

        window.addEventListener('reminder-update', handleUpdate);
        window.addEventListener('toggle-reminders', handleToggle);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reminder-update', handleUpdate);
            window.removeEventListener('toggle-reminders', handleToggle);
        };
    }, []);

    const handleAdd = async () => {
        if (!newReminder.trim()) return;
        setIsLoading(true);
        try {
            const recipientId = selectedRecipient === 'self' ? undefined : selectedRecipient;
            await createReminder(newReminder, selectedDate, recipientId);
            setNewReminder('');
            setSelectedDate(undefined);
            setSelectedRecipient('self');

            if (selectedRecipient === 'self') {
                await fetchReminders();
                toast.success('Lembrete criado!');
            } else {
                toast.success('Lembrete enviado!');
            }
            window.dispatchEvent(new Event('reminder-update'));
        } catch (error) {
            toast.error('Erro ao criar lembrete.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (id: string, action: string, payload?: any) => {
        try {
            if (action === 'delete') {
                await deleteReminder(id);
                setReminders(prev => prev.filter(r => r.id !== id));
                toast.success('Lembrete excluído');
            } else if (action === 'resolve') {
                await updateReminderStatus(id, 'resolved');
                setReminders(prev => prev.filter(r => r.id !== id));
                toast.success('Lembrete resolvido');
            } else if (action === 'read') {
                await updateReminderStatus(id, 'read');
                setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'read', is_read: true } : r));
            } else if (action === 'pending') {
                await updateReminderStatus(id, 'pending');
                setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'pending', is_read: false } : r));
            } else if (action === 'snooze') {
                await snoozeReminder(id, payload);
                await fetchReminders();
                toast.success('Lembrete adiado');
            }
            window.dispatchEvent(new Event('reminder-update'));
        } catch (e) {
            toast.error('Erro na ação');
        }
    };

    const pendingCount = reminders.filter(r => r.status === 'pending' || !r.status).length;

    // Helper to get robust Navigation URL
    const getNavUrl = (content: string) => {
        const isQuestionnaire = content.toLowerCase().includes('questionário respondido');
        const navMatch = content.match(/NAV:([^|]+)/i);

        let targetPatientId = '';
        if (navMatch) {
            const parts = navMatch[1].trim().split(':');
            targetPatientId = parts[1] || parts[0];
        }

        if (targetPatientId && targetPatientId.length > 20) {
            return `/dashboard/${slug}/patients/${targetPatientId}?tab=questionnaires`;
        } else if (isQuestionnaire) {
            return `/dashboard/${slug}/patients?tab=questionnaires`;
        }
        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className={cn("px-3 py-1", className)}>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full bg-white text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all relative flex items-center shadow-sm group h-auto",
                            isCollapsed ? "px-0 justify-center h-10 w-10 rounded-xl" : "justify-start gap-3 h-11 px-4 rounded-2xl text-left"
                        )}
                        title={isCollapsed ? "Lembretes" : undefined}
                    >
                        <div className={cn(
                            "flex items-center justify-center rounded-lg h-6 w-6 shrink-0 bg-slate-100 text-slate-500 shadow-inner group-hover:bg-red-50 group-hover:text-red-600",
                            isCollapsed ? "bg-white border-slate-200 text-slate-400 rounded-xl h-8 w-8" : ""
                        )}>
                            <Bell className={cn(isCollapsed ? "h-5 w-5" : "h-3.5 w-3.5")} strokeWidth={isCollapsed ? 2 : 3} />
                            {pendingCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-red-500 border border-white" />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between">
                                <span className="text-[13px] tracking-tight">Lembretes</span>
                                {pendingCount > 0 && (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">{pendingCount}</span>
                                )}
                            </div>
                        )}
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Lembretes
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 h-full">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Gerencie seus lembretes e tarefas pessoais ou da equipe.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
                        <Input
                            placeholder="Criar novo lembrete..."
                            value={newReminder}
                            onChange={(e) => setNewReminder(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />

                        <div className="flex gap-2">
                            <div className="flex-1 min-w-0">
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={selectedRecipient}
                                    onChange={(e) => setSelectedRecipient(e.target.value)}
                                >
                                    <option value="self">Para: Mim</option>
                                    {(professionals || []).map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className={cn("shrink-0", selectedDate && "text-primary border-primary")}>
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button onClick={handleAdd} disabled={isLoading}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 max-h-[450px] scrollbar-thin scrollbar-thumb-gray-200">
                        {reminders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-center">
                                <Bell className="h-8 w-8 mb-2 opacity-20" />
                                <p>Nenhum lembrete pendente.</p>
                            </div>
                        ) : (
                            reminders.map((reminder) => (
                                <div
                                    key={reminder.id}
                                    className={cn(
                                        "group flex items-start justify-between gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                                        reminder.status === 'read' ? "bg-muted/30 opacity-70" : "bg-card hover:bg-slate-50 hover:border-primary/30 shadow-sm border-slate-100"
                                    )}
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                "p-2.5 rounded-xl shrink-0 shadow-sm",
                                                reminder.content.toLowerCase().includes('questionário')
                                                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                                    : reminder.content.toLowerCase().includes('lista de espera')
                                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                        : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                {reminder.content.toLowerCase().includes('questionário')
                                                    ? <FileText className="h-5 w-5" />
                                                    : reminder.content.toLowerCase().includes('lista de espera')
                                                        ? <Users className="h-5 w-5" />
                                                        : <Bell className="h-5 w-5" />
                                                }
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        "text-[15px] font-bold leading-snug text-slate-900 tracking-tight break-words",
                                                        reminder.status === 'read' && "line-through text-muted-foreground opacity-60"
                                                    )}
                                                >
                                                    {reminder.content.split('|')[0].replace('📋', '').replace(/Lista de espera:?/i, 'Lista de Espera:').trim()}
                                                </p>

                                                {(() => {
                                                    const details = reminder.content.split('|')
                                                        .filter((s: string) => !s.includes('NAV:') && !s.includes('Turno:') && !s.includes('Dias:'))
                                                        .slice(1);

                                                    if (details.length === 0) return null;

                                                    return (
                                                        <div className="flex flex-wrap gap-2">
                                                            {details.map((detail: string, i: number) => {
                                                                const trimmed = detail.trim();
                                                                if (!trimmed) return null;
                                                                const isPatient = trimmed.toLowerCase().startsWith('paciente:');
                                                                return (
                                                                    <span
                                                                        key={i}
                                                                        className={cn(
                                                                            "text-[11px] font-medium px-2 py-0.5 rounded-md break-words",
                                                                            isPatient
                                                                                ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/50"
                                                                                : "bg-slate-50 text-slate-500 border border-slate-100"
                                                                        )}
                                                                    >
                                                                        {trimmed}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {(() => {
                                            const content = reminder.content;

                                            // 1. Waitlist Reminder Formatting
                                            if (content.toLowerCase().includes('lista de espera')) {
                                                try {
                                                    const parts = content.split('|').map((s: string) => s.trim())
                                                    if (parts.length < 3) return null;

                                                    const rawName = parts[0].replace(/lista de espera:?/i, '').trim()
                                                    const rawPhone = parts[1]
                                                    const rawDate = parts[2]

                                                    // Parse Extra Details (Turno/Dias)
                                                    const rawTurno = parts.find((p: string) => p.startsWith('Turno:'))?.replace('Turno:', '').trim();
                                                    const rawDias = parts.find((p: string) => p.startsWith('Dias:'))?.replace('Dias:', '').trim();

                                                    const dateParts = rawDate.split('/');
                                                    const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : format(new Date(), 'yyyy-MM-dd')
                                                    const cleanPhone = rawPhone.replace(/\D/g, '')
                                                    const waPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone

                                                    return (
                                                        <div className="space-y-3 mt-1">
                                                            {(rawTurno || rawDias) && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {rawTurno && (
                                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 shadow-sm uppercase">
                                                                            <Clock className="w-3 h-3" />
                                                                            TURNO: {rawTurno}
                                                                        </span>
                                                                    )}
                                                                    {rawDias && (
                                                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 shadow-sm uppercase">
                                                                            <Calendar className="w-3 h-3" />
                                                                            DIAS: {rawDias}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className="flex gap-2">
                                                                <a
                                                                    href={`https://wa.me/${waPhone}?text=Olá ${rawName}, falo da Access Fisioterapia. Vi seu interesse na lista de espera para ${rawDate}.`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 flex items-center justify-center gap-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors font-bold"
                                                                >
                                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                                    WhatsApp
                                                                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                                                                </a>
                                                                <a
                                                                    href={`/dashboard/${slug}/schedule?date=${isoDate}&openDialog=true&patient_name=${encodeURIComponent(rawName)}&phone=${encodeURIComponent(rawPhone)}`}
                                                                    className="flex-1 flex items-center justify-center gap-2 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-lg transition-colors font-bold"
                                                                    onClick={() => setIsOpen(false)}
                                                                >
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    Agendar
                                                                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )
                                                } catch (e) { return null; }
                                            }

                                            // 2. Questionnaire Reminder Formatting
                                            const nUrl = getNavUrl(content);
                                            if (!nUrl) return null;

                                            return (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-3 font-bold text-indigo-700 border-indigo-300 hover:bg-indigo-50 transition-colors h-9 shadow-sm"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await handleAction(reminder.id, 'read');
                                                        window.location.href = nUrl;
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-2" />
                                                    VER RESPOSTAS (FICHA)
                                                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                                                </Button>
                                            );
                                        })()}

                                        <div className="flex items-center gap-3 pt-1">
                                            {reminder.creator_id && reminder.creator_id !== reminder.user_id && (
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    Equipe
                                                </span>
                                            )}

                                            {reminder.due_date && (
                                                <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium",
                                                    new Date(reminder.due_date) < new Date() && reminder.status !== 'read' ? "text-red-500" : "text-slate-400"
                                                )}>
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(reminder.due_date), "dd/MM HH:mm", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            onClick={() => handleAction(reminder.id, 'resolve')}
                                            title="Concluir"
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-100 transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                {(() => {
                                                    const d_nUrl = getNavUrl(reminder.content);
                                                    if (!d_nUrl) return null;

                                                    return (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={async () => {
                                                                    await handleAction(reminder.id, 'read');
                                                                    window.location.href = d_nUrl;
                                                                }}
                                                                className="font-bold text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Ver Respostas
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    );
                                                })()}

                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <Clock className="mr-2 h-4 w-4" /> Adiar
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleAction(reminder.id, 'snooze', 60)}>
                                                            1 hora
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(reminder.id, 'snooze', 1440)}>
                                                            Amanhã
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => handleAction(reminder.id, 'delete')} className="text-destructive focus:text-destructive focus:bg-destructive/5">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


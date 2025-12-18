'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createReminder, getReminders, deleteReminder, updateReminderStatus, snoozeReminder } from '@/app/dashboard/reminders/actions';
import { Bell, Calendar, Plus, Trash2, CheckCircle2, Clock, MoreHorizontal, Check, Trash, Eye, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export function ReminderWidget({ className }: { className?: string }) {
    const { isCollapsed, setIsCollapsed } = useSidebar();
    const [reminders, setReminders] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('self');
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [newReminder, setNewReminder] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Collapsible state for the widget body

    const fetchReminders = async () => {
        const data = await getReminders();
        setReminders(data.filter((r: any) => r.status !== 'resolved'));
    };

    useEffect(() => {
        fetchReminders();

        import('@/app/dashboard/professionals/actions').then(mod => {
            mod.getProfessionals().then(data => setProfessionals(data || []));
        });

        const interval = setInterval(fetchReminders, 60000);

        const handleUpdate = () => fetchReminders();
        window.addEventListener('reminder-update', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reminder-update', handleUpdate);
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


    // Calculate pending count for badge
    const pendingCount = reminders.filter(r => r.status === 'pending' || !r.status).length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className={cn("px-2 lg:px-4", className)}> {/* Padding wrapper to match NavItem position in sidebar grid */}
                    <button
                        className={cn(
                            "flex items-center gap-3 rounded-lg py-2 text-gray-500 transition-all hover:text-primary w-full",
                            isCollapsed ? "justify-center px-0" : "px-3"
                        )}
                        title={isCollapsed ? "Lembretes" : undefined}
                    >
                        <div className="relative">
                            <Bell className="h-4 w-4" />
                            {pendingCount > 0 && (
                                <span className={cn(
                                    "absolute flex h-2 w-2 rounded-full bg-red-500",
                                    isCollapsed ? "-top-0.5 -right-0.5" : "-top-0.5 -right-0.5"
                                )} />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between">
                                <span>Lembretes</span>
                                {pendingCount > 0 && (
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 rounded-full">{pendingCount}</span>
                                )}
                            </div>
                        )}
                    </button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <div className="flex flex-col gap-4 h-full">
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Lembretes
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gerencie seus lembretes e tarefas pessoais ou da equipe.
                        </p>
                    </div>

                    {/* Input Area - Moved to Top for Quick Access */}
                    <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border">
                        <Input
                            placeholder="Criar novo lembrete..."
                            value={newReminder}
                            onChange={(e) => setNewReminder(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />

                        <div className="flex gap-2">
                            {/* Recipient Select */}
                            <div className="flex-1 min-w-0">
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={selectedRecipient}
                                    onChange={(e) => setSelectedRecipient(e.target.value)}
                                >
                                    <option value="self">Para: Mim</option>
                                    {professionals.map(p => (
                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Picker */}
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

                    {/* Reminders List */}
                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
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
                                        "group flex items-start justify-between gap-3 p-3 rounded-lg border transition-all",
                                        reminder.status === 'read' ? "bg-muted/30 opacity-70" : "bg-card hover:bg-muted/10 shadow-sm"
                                    )}
                                >
                                    <div className="flex-1 space-y-1">
                                        <p
                                            className={cn(
                                                "text-sm font-medium leading-none",
                                                reminder.status === 'read' && "line-through text-muted-foreground"
                                            )}
                                        >
                                            {reminder.content}
                                        </p>

                                        <div className="flex items-center gap-2 pt-1">
                                            {/* Labels row */}
                                            {reminder.creator_id && reminder.creator_id !== reminder.user_id && (
                                                <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    De: Colega
                                                </span>
                                            )}

                                            {reminder.due_date && (
                                                <span className={cn("inline-flex items-center gap-1 text-xs",
                                                    new Date(reminder.due_date) < new Date() && reminder.status !== 'read' ? "text-red-500 font-medium" : "text-muted-foreground"
                                                )}>
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(reminder.due_date), "dd/MM HH:mm", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                            onClick={() => handleAction(reminder.id, 'resolve')}
                                            title="Concluir"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleAction(reminder.id, 'delete')} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
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

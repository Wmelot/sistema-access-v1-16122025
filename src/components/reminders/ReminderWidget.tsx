'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createReminder, getReminders, deleteReminder } from '@/app/dashboard/reminders/actions';
import { Bell, Calendar, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { updateReminderStatus, snoozeReminder } from '@/app/dashboard/reminders/actions';
import { MoreHorizontal, Check, Trash, Eye, XCircle } from 'lucide-react';
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

export function ReminderWidget() {
    const [reminders, setReminders] = useState<any[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('self');
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    const [newReminder, setNewReminder] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Collapsible state

    const fetchReminders = async () => {
        const data = await getReminders();
        // Filter out resolved reminders from the main list, or show them at bottom?
        // Usually resolved items should disappear.
        setReminders(data.filter(r => r.status !== 'resolved'));
    };

    useEffect(() => {
        fetchReminders();

        // Fetch professionals
        import('@/app/dashboard/professionals/actions').then(mod => {
            mod.getProfessionals().then(data => setProfessionals(data || []));
        });

        // Get current user ID (for default logic if needed, though we use 'self' sentinel)
        // Actually best to keep 'self' as a special value in UI state

        // Poll for updates every minute
        const interval = setInterval(fetchReminders, 60000);
        return () => clearInterval(interval);
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
                await fetchReminders(); // Refresh time
                toast.success('Lembrete adiado');
            }
        } catch (e) {
            toast.error('Erro na ação');
        }
    };

    return (
        <div className="mt-auto px-4 py-2">
            <div className="bg-muted/40 rounded-lg border shadow-sm">
                <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Bell className="h-4 w-4" />
                        <span>Lembretes</span>
                        {reminders.filter(r => r.status === 'pending' || !r.status).length > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                                {reminders.filter(r => r.status === 'pending' || !r.status).length}
                            </span>
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* List */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {reminders.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">Nenhum lembrete.</p>
                            ) : (
                                reminders.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className={cn(
                                            "group flex items-start justify-between gap-2 p-2 rounded-md border text-xs relative transition-all",
                                            reminder.status === 'read' ? "bg-muted/30 text-muted-foreground" : "bg-background shadow-sm"
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5 w-full pr-6">
                                            <div className="flex justify-between items-start">
                                                <span className={cn("font-medium mr-2", reminder.status === 'read' && "line-through opacity-70")}>
                                                    {reminder.content}
                                                </span>
                                                {reminder.creator_id && reminder.creator_id !== reminder.user_id && (
                                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded whitespace-nowrap">
                                                        De: Colega
                                                    </span>
                                                )}
                                            </div>
                                            {reminder.due_date && (
                                                <span className={cn("flex items-center gap-1 text-[10px]",
                                                    new Date(reminder.due_date) < new Date() && reminder.status !== 'read' ? "text-red-500" : "text-muted-foreground"
                                                )}>
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(reminder.due_date), "dd/MM HH:mm", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                                                    <MoreHorizontal className="h-3 w-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => handleAction(reminder.id, 'resolve')}>
                                                    <Check className="mr-2 h-3.5 w-3.5" /> Resolver
                                                </DropdownMenuItem>
                                                {reminder.status === 'read' ? (
                                                    <DropdownMenuItem onClick={() => handleAction(reminder.id, 'pending')}>
                                                        <XCircle className="mr-2 h-3.5 w-3.5" /> Não lido
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleAction(reminder.id, 'read')}>
                                                        <Eye className="mr-2 h-3.5 w-3.5" /> Marcar como lido
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <Clock className="mr-2 h-3.5 w-3.5" /> Adiar
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuSubContent>
                                                        <DropdownMenuItem onClick={() => handleAction(reminder.id, 'snooze', 10)}>
                                                            10 minutos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(reminder.id, 'snooze', 60)}>
                                                            1 hora
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(reminder.id, 'snooze', 1440)}>
                                                            Amanhã
                                                        </DropdownMenuItem>
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuSub>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleAction(reminder.id, 'delete')} className="text-red-500">
                                                    <Trash className="mr-2 h-3.5 w-3.5" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="flex flex-col gap-2 pt-2 border-t">
                            <Input
                                placeholder="Novo lembrete..."
                                value={newReminder}
                                onChange={(e) => setNewReminder(e.target.value)}
                                className="h-8 text-xs"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />

                            <div className="flex gap-2">
                                {/* Recipient Select */}
                                <div className="flex-1 min-w-0">
                                    <select
                                        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                        <Button variant="outline" size="icon" className={cn("h-8 w-8 shrink-0", selectedDate && "text-primary border-primary")}>
                                            <Calendar className="h-3 w-3" />
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

                                <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd} disabled={isLoading}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

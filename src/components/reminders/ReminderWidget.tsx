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

export function ReminderWidget({ className, iconClassName = "h-4 w-4" }: { className?: string, iconClassName?: string }) {
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
                            <Bell className={cn(iconClassName)} />
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
                                            {reminder.content.split('|')[0]}
                                        </p>

                                        {/* Waitlist Specific Actions */}
                                        {/* Relaxed check: Look for "lista de espera" anywhere, case insensitive */}
                                        {reminder.content.toLowerCase().includes('lista de espera') && (
                                            <div className="flex flex-col gap-2 mt-3">
                                                {(() => {
                                                    try {
                                                        const parts = reminder.content.split('|').map((s: string) => s.trim())
                                                        // Format expected: "Lista de Espera: Name | Phone | Date" or similar

                                                        // Fallback for debugging: if format isn't pipe separated as expected
                                                        if (parts.length < 3) {
                                                            return <p className="text-xs text-amber-600 bg-amber-50 p-1 rounded">
                                                                Formato irreconhecido: {reminder.content}
                                                            </p>
                                                        }

                                                        // Safe extraction
                                                        const rawName = parts[0].replace(/lista de espera:?/i, '').trim()
                                                        const rawPhone = parts[1]
                                                        const rawDate = parts[2]


                                                        // Format Date for URL (dd/MM/yyyy -> yyyy-MM-dd)
                                                        const dateParts = rawDate.split('/')
                                                        if (dateParts.length !== 3) return null
                                                        const [day, month, year] = dateParts.map((p: string) => p.trim())
                                                        const isoDate = `${year}-${month}-${day}` // Safe trim

                                                        // Format Phone for WhatsApp
                                                        const cleanPhone = rawPhone.replace(/\D/g, '')
                                                        const waPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone

                                                        return (
                                                            <>
                                                                <a
                                                                    href={`https://wa.me/${waPhone}?text=Olá ${rawName}, falo da Access Fisioterapia. Vi seu interesse na lista de espera para ${rawDate}.`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-center gap-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-md transition-colors w-full font-medium"
                                                                >
                                                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                                    Conversar no WhatsApp
                                                                </a>
                                                                <a
                                                                    href={`/dashboard/schedule?date=${isoDate}&openDialog=true&patient_name=${encodeURIComponent(rawName)}&phone=${encodeURIComponent(rawPhone)}`}
                                                                    className="flex items-center justify-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-md transition-colors w-full font-medium"
                                                                >
                                                                    <Calendar className="w-4 h-4" />
                                                                    Agendar neste dia
                                                                </a>
                                                            </>
                                                        )
                                                    } catch (e) {
                                                        console.error("Waitlist parsing error", e)
                                                        return <p className="text-xs text-red-500">Erro ao processar dados da lista.</p>
                                                    }
                                                })()}
                                            </div>
                                        )}
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

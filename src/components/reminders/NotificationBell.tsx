'use client';

import { useState, useEffect } from 'react';
import { getReminders, deleteReminder } from '@/app/dashboard/reminders/actions';
import { Bell, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationBell() {
    const [reminders, setReminders] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReminders = async () => {
        const data = await getReminders();
        setReminders(data);
    };

    useEffect(() => {
        fetchReminders();
        const interval = setInterval(fetchReminders, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsDone = async (id: string) => {
        try {
            await deleteReminder(id);
            setReminders(reminders.filter(r => r.id !== id));
            toast.success('Concluído');
        } catch (error) {
            toast.error('Erro ao concluir');
        }
    };

    const unreadCount = reminders.length;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificações</h4>
                    <span className="text-xs text-muted-foreground">{unreadCount} pendentes</span>
                </div>
                <ScrollArea className="h-[300px]">
                    {reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        <div className="grid gap-1 p-2">
                            {reminders.map((reminder) => (
                                <div key={reminder.id} className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{reminder.content}</p>
                                        {reminder.due_date && (
                                            <p className={cn("text-xs", new Date(reminder.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground")}>
                                                {format(new Date(reminder.due_date), "PPP 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0 hover:bg-primary hover:text-primary-foreground group"
                                        onClick={() => markAsDone(reminder.id)}
                                        title="Marcar como feito"
                                    >
                                        <Check className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

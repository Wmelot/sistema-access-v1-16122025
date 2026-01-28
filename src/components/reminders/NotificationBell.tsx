import { useState, useEffect } from 'react';
import { getReminders, deleteReminder, updateReminderStatus } from '@/app/dashboard/[slug]/reminders/actions';
import { Bell, Loader2, Check, Trash, Calendar } from 'lucide-react';
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

    const fetchReminders = async () => {
        const data = await getReminders();
        setReminders(data.filter(r => r.status !== 'resolved'));
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isMounted = true;

        const poll = async () => {
            try {
                await fetchReminders();
                // Success: Poll again in 60s
                if (isMounted) timeoutId = setTimeout(poll, 60000);
            } catch (err) {
                // Error: Backoff, wait 5 minutes
                console.error("Reminder poll failed, backing off:", err);
                if (isMounted) timeoutId = setTimeout(poll, 300000);
            }
        };

        poll(); // Initial call

        // Listen for updates from Widget
        const handleUpdate = () => {
            // Clear existing timeout to fetch immediately and restart cycle
            clearTimeout(timeoutId);
            poll();
        };
        window.addEventListener('reminder-update', handleUpdate);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('reminder-update', handleUpdate);
            isMounted = false;
        };
    }, []);

    const handleAction = async (id: string, action: string) => {
        try {
            if (action === 'delete') {
                await deleteReminder(id);
                setReminders(prev => prev.filter(r => r.id !== id));
                toast.success('Lembrete excluído');
            } else if (action === 'resolve') {
                await updateReminderStatus(id, 'resolved');
                setReminders(prev => prev.filter(r => r.id !== id));
                toast.success('Lembrete resolvido');
            }
            // Notify other components
            window.dispatchEvent(new Event('reminder-update'));
        } catch (error) {
            toast.error('Erro na ação');
        }
    };

    const unreadCount = reminders.length;

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => window.dispatchEvent(new Event('toggle-reminders'))}
            title={`${unreadCount} notificações pendentes`}
        >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
                    {unreadCount}
                </span>
            )}
        </Button>
    );
}

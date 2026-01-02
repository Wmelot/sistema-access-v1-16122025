import { useState, useEffect } from 'react';
import { getReminders, deleteReminder, updateReminderStatus } from '@/app/dashboard/reminders/actions';
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
        fetchReminders();
        const interval = setInterval(fetchReminders, 60000);

        // Listen for updates from Widget
        const handleUpdate = () => fetchReminders();
        window.addEventListener('reminder-update', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('reminder-update', handleUpdate);
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
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <p
                                            className="text-sm font-medium leading-tight line-clamp-3 break-all"
                                            title={reminder.content}
                                        >
                                            {reminder.content.split('|')[0]}
                                        </p>

                                        {/* Waitlist Specific Actions */}
                                        {reminder.content.toLowerCase().includes('lista de espera') && (
                                            <div className="flex flex-col gap-1.5 mt-2">
                                                {(() => {
                                                    try {
                                                        const parts = reminder.content.split('|').map((s: string) => s.trim())
                                                        // Fallback for debugging
                                                        if (parts.length < 3) return null

                                                        // Safe extraction
                                                        const rawName = parts[0].replace(/lista de espera:?/i, '').trim()
                                                        const rawPhone = parts[1]
                                                        const rawDate = parts[2]

                                                        const dateParts = rawDate.split('/')
                                                        if (dateParts.length !== 3) return null
                                                        const [day, month, year] = dateParts.map((p: string) => p.trim())
                                                        const isoDate = `${year}-${month}-${day}`

                                                        const cleanPhone = rawPhone.replace(/\D/g, '')
                                                        const waPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone

                                                        return (
                                                            <>
                                                                <a
                                                                    href={`https://wa.me/${waPhone}?text=Olá ${rawName}, falo da Access Fisioterapia. Vi seu interesse na lista de espera para ${rawDate}.`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-center gap-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2 py-1.5 rounded-md transition-colors w-full font-medium"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                                    WhatsApp
                                                                </a>
                                                                <a
                                                                    href={`/dashboard/schedule?date=${isoDate}&openDialog=true&patient_name=${encodeURIComponent(rawName)}&phone=${encodeURIComponent(rawPhone)}`}
                                                                    className="flex items-center justify-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1.5 rounded-md transition-colors w-full font-medium"
                                                                    onClick={() => setIsOpen(false)}
                                                                >
                                                                    <Calendar className="w-3 h-3" />
                                                                    Agendar
                                                                </a>
                                                            </>
                                                        )
                                                    } catch (e) {
                                                        return null
                                                    }
                                                })()}
                                            </div>
                                        )}

                                        {reminder.due_date && (
                                            <p className={cn("text-xs pt-1", new Date(reminder.due_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground")}>
                                                {format(new Date(reminder.due_date), "dd/MM HH:mm", { locale: ptBR })}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 items-center shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-green-100 hover:text-green-600"
                                            onClick={() => handleAction(reminder.id, 'resolve')}
                                            title="Resolver"
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                                            onClick={() => handleAction(reminder.id, 'delete')}
                                            title="Excluir"
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

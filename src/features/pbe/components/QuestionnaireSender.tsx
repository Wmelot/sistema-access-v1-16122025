"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Loader2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { getTemplates } from "@/app/dashboard/settings/communication/actions";
import { sendQuestionnaire } from "../actions/send-questionnaire";

interface QuestionnaireSenderProps {
    patientId: string;
    questionnaireName: string;
}

export function QuestionnaireSender({ patientId, questionnaireName }: QuestionnaireSenderProps) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    // Default message reset when opening or changing questionnaire
    useEffect(() => {
        if (open && questionnaireName) {
            setMessage(`Olá, por favor responda o questionário: *${questionnaireName}*`);
        }
    }, [open, questionnaireName]);

    // Fetch templates on mount
    useEffect(() => {
        getTemplates().then((data) => {
            if (data) setTemplates(data);
        });
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        const tmpl = templates.find((t) => t.id === templateId);
        if (tmpl) {
            // Replace basic placeholders if present in template
            let content = tmpl.content;
            // Simple replacement logic for preview - backend handles actual replacement usually, 
            // but for editing we want to see the text.
            // We'll leave placeholders like {{paciente}} for the user to see or edit, 
            // OR we can try to pre-fill if we had patient name prop.
            // For now, let's just set the content.
            setMessage(content);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return toast.error("A mensagem não pode estar vazia.");

        setSending(true);
        try {
            const res = await sendQuestionnaire(patientId, questionnaireName, message);
            if (!res.success) throw new Error(res.error);

            toast.success("Questionário enviado com sucesso!");
            setOpen(false);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white h-9" disabled={!questionnaireName}>
                    <Send className="w-4 h-4 mr-2" />
                    {questionnaireName ? "Preparar Envio" : "Selecione um Modelo"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Enviar Questionário
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Modelo de Mensagem (Opcional)</label>
                        <Select onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Escolher um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.length > 0 ? (
                                    templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-slate-500 text-center">Nenhum modelo disponível</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Mensagem a Enviar (WhatsApp)</label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[120px] bg-slate-50 text-sm"
                            placeholder="Digite sua mensagem aqui..."
                        />
                        <p className="text-[10px] text-slate-400">
                            *O texto será enviado exatamente como está acima.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={sending || !message.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                        {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Confirmar Envio
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

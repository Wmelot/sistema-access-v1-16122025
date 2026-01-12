"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, MessageCircle, Clock, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Interface para as notificações que virão do Z-API
interface WhatsappNotification {
    id: string;
    patientName: string;
    message: string;
    time: string;
    status: 'confirmado' | 'pendente';
}

export function WhatsAppMonitor() {
    // Simulando o estado das últimas confirmações (Integrará com seu banco/Z-API depois)
    const [notifications, setNotifications] = useState<WhatsappNotification[]>([
        { id: '1', patientName: 'Acileia Said', message: 'Confirmado 👍', time: '14:49', status: 'confirmado' },
        { id: '2', patientName: 'João Silva', message: 'Ok, estarei aí', time: '15:10', status: 'confirmado' }
    ]);

    return (
        <div className="px-4 py-2 mt-2">
            <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 shadow-2xl backdrop-blur-sm">
                {/* CABEÇALHO DO WIDGET */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <Smartphone className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">WhatsApp Live</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4 bg-blue-500/5 text-blue-400 border-blue-500/20 font-bold">Z-API</Badge>
                </div>

                {/* LISTA DE ATIVIDADES */}
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {notifications.map((notif) => (
                        <div key={notif.id} className="group relative flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-green-500/30 transition-all duration-300">
                            <div className="mt-1">
                                {notif.status === 'confirmado' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shadow-green-900" />
                                ) : (
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <p className="text-[11px] font-bold text-slate-100 truncate">{notif.patientName}</p>
                                    <span className="text-[9px] text-slate-600 font-medium">{notif.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic truncate mt-0.5 group-hover:text-slate-400 transition-colors">
                                    "{notif.message}"
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RESUMO TÉCNICO (Referência Biomecânica) */}
                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-600 uppercase font-bold">Hoje</span>
                        <span className="text-xs font-black text-slate-300">12 Agendados</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] text-green-600 uppercase font-bold">Confirmados</span>
                        <span className="text-xs font-black text-green-500">08</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
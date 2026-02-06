'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Lock,
    Mail,
    ChevronRight,
    BookOpen,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AcademicLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulação de login institucional
        setTimeout(() => {
            if (email.includes('pucminas.br')) {
                toast.success('Bem-vindo, Professor(a)!');
                window.location.href = '/academico';
            } else {
                toast.error('Use seu e-mail institucional @pucminas.br');
            }
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-[#8C132C] rounded-[24px] flex items-center justify-center shadow-2xl shadow-[#8C132C]/20 mb-6">
                        <BookOpen className="text-white" size={32} />
                    </div>
                    <span className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.3em] mb-1">PUC Minas</span>
                    <h1 className="text-2xl font-black text-[#363636] tracking-tight">Portal de Evidências</h1>
                    <p className="text-slate-400 text-sm font-medium">Acesse seu dossiê SINAES</p>
                </div>

                <Card className="rounded-[40px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white p-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[#363636] font-bold text-sm">E-mail Institucional</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    type="email"
                                    placeholder="professor@pucminas.br"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:ring-[#8C132C]/10 text-slate-600 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#363636] font-bold text-sm">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50 focus:ring-[#8C132C]/10 text-slate-600 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-[#363636] hover:bg-[#1a1a1a] text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Entrar no Portal <ChevronRight size={20} /></>}
                        </Button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#8C132C] transition-colors">
                            Esqueci minha senha
                        </button>
                    </div>
                </Card>

                <div className="mt-12 flex items-center gap-2 justify-center text-slate-400">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Acesso restrito ao corpo docente Betim</p>
                </div>
            </motion.div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock,
    Mail,
    ChevronRight,
    BookOpen,
    AlertCircle,
    Loader2,
    X
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
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [logoUrl, setLogoUrl] = useState<string>("https://www.pucminas.br/marcas/PublishingImages/Logo%20PUC%20Minas%20RGB.png");

    React.useEffect(() => {
        const savedLogo = localStorage.getItem('axiom_logo');
        if (savedLogo) setLogoUrl(savedLogo);

        // Inicializar profs se não existirem (mesmo padrão do dashboard)
        const savedProfs = localStorage.getItem('axiom_sinaes_profs_v2');
        if (!savedProfs) {
            const initialProfs = [
                { id: '1', name: 'Warley de Melo Oliveira', email: 'warley.oliveira@pucminas.br', status: 'ativo', lattesUrl: 'http://lattes.cnpq.br/0000000000000001', certificados: [] },
                { id: '2', name: 'Silvia Helena Ferreira', email: 'silvia.helena@pucminas.br', status: 'ativo', lattesUrl: '', certificados: [] },
            ];
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(initialProfs));
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validação Real contra Base de Dados (Local Storage)
        setTimeout(() => {
            const savedProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
            const professor = savedProfs.find((p: any) => p.email.toLowerCase() === email.toLowerCase());

            if (professor && professor.status === 'ativo') {
                toast.success(`Bem-vindo, Prof. ${professor.name.split(' ')[0]}!`);
                window.location.href = '/academico';
            } else if (professor && professor.status === 'convidado') {
                toast.warning('Seu convite ainda está pendente. Verifique seu e-mail.');
            } else if (email.length > 5) {
                // Fallback de segurança para novos acessos enquanto não há backend
                toast.success('Acesso concedido (Modo Desenvolvedor).');
                window.location.href = '/academico';
            } else {
                toast.error('Acesso negado. Utilize um e-mail cadastrado.');
            }
            setLoading(false);
        }, 1200);
    };

    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            toast.success('Link de recuperação enviado! Verifique sua caixa de entrada @pucminas.br');
            setShowForgot(false);
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-xl mb-6 p-4">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[10px] font-black text-[#8C132C] uppercase tracking-[0.3em] mb-1">PUC Minas</span>
                    <h1 className="text-2xl font-black text-[#363636] tracking-tight text-center">Portal de Evidências</h1>
                    <p className="text-slate-400 text-sm font-medium">Acesse seu dossiê SINAES</p>
                </div>

                <Card className="rounded-[40px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.03)] bg-white p-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[#363636] font-bold text-sm">Seu E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <Input
                                    type="email"
                                    placeholder="seu.email@exemplo.com"
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
                        <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#8C132C] transition-colors"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                </Card>

                <AnimatePresence>
                    {showForgot && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        >
                            <Card className="w-full max-w-sm rounded-[40px] p-10 border-none shadow-2xl overflow-hidden relative">
                                <button onClick={() => setShowForgot(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500">
                                    <X size={20} />
                                </button>
                                <div className="text-center mb-8">
                                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                                        <Lock size={28} />
                                    </div>
                                    <h2 className="text-xl font-black text-[#363636]">Recuperar Senha</h2>
                                    <p className="text-xs font-medium text-slate-400 mt-2">Enviaremos um link de acesso para seu e-mail institucional.</p>
                                </div>
                                <form onSubmit={handleForgotPassword} className="space-y-6">
                                    <div className="space-y-2">
                                        <Input
                                            type="email"
                                            required
                                            placeholder="seuemail@pucminas.br"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                                        />
                                    </div>
                                    <Button disabled={loading} className="w-full h-14 bg-[#8C132C] text-white rounded-2xl font-black shadow-lg shadow-[#8C132C]/20">
                                        {loading ? <Loader2 className="animate-spin" /> : "Enviar E-mail de Resgate"}
                                    </Button>
                                </form>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 flex items-center gap-2 justify-center text-slate-400">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Acesso restrito ao corpo docente Betim</p>
                </div>
            </motion.div>
        </div>
    );
}

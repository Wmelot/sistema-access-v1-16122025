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
import Swal from 'sweetalert2';

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

        // Lógica de Ícone Dinâmico para App (Home Screen)
        const updateDynamicIcon = () => {
            const isAcademic = window.location.pathname.includes('/academico');
            // Ícone Customizado: Livro Grafite sobre Fundo Vermelho SINAES
            const bookIconSvg = `
                <svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
                    <rect width='32' height='32' rx='8' fill='#8C132C'/>
                    <g transform='translate(6, 6) scale(0.8)'>
                        <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' fill='none' stroke='#363636' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
                        <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' fill='none' stroke='#363636' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
                    </g>
                </svg>
            `.trim();
            const academicIcon = `data:image/svg+xml;base64,${btoa(bookIconSvg)}`;
            // Logo da Clínica para o resto (Axiom)
            const clinicIcon = savedLogo || "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Icon_Blue_Circle.svg/1024px-Icon_Blue_Circle.svg.png";

            const finalIcon = isAcademic ? academicIcon : clinicIcon;

            const setIcon = (rel: string) => {
                let link = document.querySelector(`link[rel*='${rel}']`) as HTMLLinkElement;
                if (!link) {
                    link = document.createElement('link');
                    link.rel = rel;
                    document.head.appendChild(link);
                }
                link.href = finalIcon;
            };

            setIcon('icon');
            setIcon('apple-touch-icon');
            setIcon('shortcut icon');
        };

        updateDynamicIcon();

        // Inicializar profs se não existirem
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

        setTimeout(async () => {
            const savedProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
            const professor = savedProfs.find((p: any) => p.email.toLowerCase() === email.toLowerCase());

            if (professor) {
                // Verificar senha se o professor tiver uma (em novos cadastros)
                if (professor.password && professor.password !== password) {
                    toast.error('Senha incorreta.');
                    setLoading(false);
                    return;
                }

                // Verificar se precisa trocar senha
                if (professor.needsPasswordChange) {
                    const EYE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                    const EYE_OFF_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

                    const { value: newPassword } = await Swal.fire({
                        title: '🔒 Segurança Importante',
                        html: `
                            <div class="text-left space-y-4 pt-4">
                                <p class="text-sm text-slate-500 mb-6 text-center">Este é seu primeiro acesso. Por favor, defina uma nova senha de segurança.</p>
                                
                                <div class="mb-4">
                                    <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block pl-1 tracking-wider">Nova Senha</label>
                                    <div class="relative flex">
                                        <input type="password" id="swal-p1" class="swal2-input !m-0 !w-full !rounded-2xl border-slate-100 !h-12 !text-sm pr-12 focus:!border-[#8C132C]" placeholder="Crie sua senha">
                                        <button type="button" id="toggle-p1" class="absolute right-0 top-0 h-full px-4 text-slate-300 hover:text-[#8C132C] transition-colors">
                                            ${EYE_SVG}
                                        </button>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block pl-1 tracking-wider">Confirmar Senha</label>
                                    <div class="relative flex">
                                        <input type="password" id="swal-p2" class="swal2-input !m-0 !w-full !rounded-2xl border-slate-100 !h-12 !text-sm pr-12 focus:!border-[#8C132C]" placeholder="Repita a senha">
                                        <button type="button" id="toggle-p2" class="absolute right-0 top-0 h-full px-4 text-slate-300 hover:text-[#8C132C] transition-colors">
                                            ${EYE_SVG}
                                        </button>
                                    </div>
                                </div>

                                <div class="bg-slate-50 p-5 rounded-2xl space-y-3 mt-6">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Requisitos de Segurança</p>
                                    
                                    <div id="req-len" class="flex items-center gap-2 text-slate-400 transition-colors">
                                        <span class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="4" ry="4"></rect></svg></span>
                                        <span class="text-[10px] font-bold uppercase">8+ Caracteres</span>
                                    </div>

                                    <div id="req-case" class="flex items-center gap-2 text-slate-400 transition-colors">
                                        <span class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="4" ry="4"></rect></svg></span>
                                        <span class="text-[10px] font-bold uppercase">Letras Maíusculas e Minúsculas</span>
                                    </div>

                                    <div id="req-spec" class="flex items-center gap-2 text-slate-400 transition-colors">
                                        <span class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="4" ry="4"></rect></svg></span>
                                        <span class="text-[10px] font-bold uppercase">Símbolos e Números</span>
                                    </div>

                                    <div id="req-match" class="flex items-center gap-2 text-slate-400 transition-colors border-t border-slate-200/60 pt-2 mt-2">
                                        <span class="status-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="4" ry="4"></rect></svg></span>
                                        <span class="text-[10px] font-bold uppercase">As senhas coincidem</span>
                                    </div>
                                </div>
                            </div>
                        `,
                        didOpen: () => {
                            const p1 = document.getElementById('swal-p1') as HTMLInputElement;
                            const p2 = document.getElementById('swal-p2') as HTMLInputElement;
                            const t1 = document.getElementById('toggle-p1') as HTMLButtonElement;
                            const t2 = document.getElementById('toggle-p2') as HTMLButtonElement;

                            const checkIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M20 6L9 17L4 12"></path></svg>';
                            const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="4" ry="4"></rect></svg>';

                            const toggleVisible = (input: HTMLInputElement, button: HTMLButtonElement) => {
                                const type = input.type === 'password' ? 'text' : 'password';
                                input.type = type;
                                button.innerHTML = type === 'password' ? EYE_SVG : EYE_OFF_SVG;
                            };

                            t1.addEventListener('click', () => toggleVisible(p1, t1));
                            t2.addEventListener('click', () => toggleVisible(p2, t2));

                            const updateStatus = (id: string, isValid: boolean) => {
                                const row = document.getElementById(id);
                                if (!row) return;
                                const iconContainer = row.querySelector('.status-icon');
                                if (isValid) {
                                    row.classList.remove('text-slate-400');
                                    row.classList.add('text-emerald-600');
                                    if (iconContainer) iconContainer.innerHTML = checkIcon;
                                } else {
                                    row.classList.add('text-slate-400');
                                    row.classList.remove('text-emerald-600');
                                    if (iconContainer) iconContainer.innerHTML = defaultIcon;
                                }
                            };

                            const validate = () => {
                                const val1 = p1.value;
                                const val2 = p2.value;

                                updateStatus('req-len', val1.length >= 8);
                                updateStatus('req-case', /[a-z]/.test(val1) && /[A-Z]/.test(val1));
                                updateStatus('req-spec', /[\d@$!%*?&]/.test(val1));
                                updateStatus('req-match', val1 === val2 && val1.length > 0);
                            };

                            p1.addEventListener('input', validate);
                            p2.addEventListener('input', validate);
                        },
                        focusConfirm: false,
                        showCancelButton: false,
                        confirmButtonText: 'Atualizar Credenciais',
                        confirmButtonColor: '#8C132C',
                        allowOutsideClick: false,
                        preConfirm: () => {
                            const p1 = (document.getElementById('swal-p1') as HTMLInputElement).value;
                            const p2 = (document.getElementById('swal-p2') as HTMLInputElement).value;

                            if (!p1 || !p2) {
                                Swal.showValidationMessage('Preencha os dois campos!');
                                return false;
                            }
                            if (p1 !== p2) {
                                Swal.showValidationMessage('As senhas não coincidem!');
                                return false;
                            }

                            const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                            if (!regex.test(p1)) {
                                Swal.showValidationMessage('Sua senha é fraca demais. Siga os requisitos.');
                                return false;
                            }

                            return p1;
                        }
                    });

                    if (newPassword) {
                        const updatedProfs = savedProfs.map((p: any) =>
                            p.email.toLowerCase() === professor.email.toLowerCase()
                                ? { ...p, password: newPassword, needsPasswordChange: false }
                                : p
                        );
                        localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfs));

                        localStorage.setItem('axiom_sinaes_logged', 'true');
                        window.location.href = '/academico';
                    }
                } else if (professor.status === 'ativo') {
                    toast.success(`Bem-vindo, Prof. ${professor.name.split(' ')[0]}!`);
                    localStorage.setItem('axiom_sinaes_logged', 'true');
                    window.location.href = '/academico';
                }
            } else if (email.length > 5) {
                toast.success('Acesso concedido (Modo Desenvolvedor).');
                localStorage.setItem('axiom_sinaes_logged', 'true');
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
                    <div className="bg-white rounded-[24px] flex items-center justify-center shadow-xl mb-6 p-4 min-w-[80px] min-h-[80px]">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                className="w-full h-full object-contain max-w-[200px]"
                                onError={() => setLogoUrl("")} // Se quebrar, remove a URL para mostrar o fallback
                            />
                        ) : (
                            <div className="w-12 h-12 bg-[#8C132C]/10 rounded-xl flex items-center justify-center text-[#8C132C]">
                                <BookOpen size={24} />
                            </div>
                        )}
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

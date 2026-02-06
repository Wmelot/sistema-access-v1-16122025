'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    BarChart3,
    Award,
    BookOpen,
    Users,
    Check,
    Info,
    Trash2,
    X,
    Settings,
    ShieldCheck,
    UserPlus,
    Image as ImageIcon,
    Camera,
    Filter,
    Eye,
    ArrowUpRight,
    ChevronRight,
    Save,
    Mail,
    Lock,
    Download,
    FileText,
    Printer
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

// Mock Data
const dataAtividades = [
    { name: 'Ensino', valor: 45, color: '#8C132C' },
    { name: 'Pesquisa', valor: 25, color: '#363636' },
    { name: 'Extensão', valor: 30, color: '#D4AF37' },
];

export default function DashboardAcademico() {
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'gallery'>('stats');
    const [showAddUser, setShowAddUser] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<any>(null);
    const [viewingEvidence, setViewingEvidence] = useState<any>(null);
    const [showCertificateWizard, setShowCertificateWizard] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string>("https://www.pucminas.br/marcas/PublishingImages/Logo%20PUC%20Minas%20RGB.png");
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const evidenceImageInputRef = React.useRef<HTMLInputElement>(null);

    // Persistence State
    const [professors, setProfessors] = useState<any[]>([]);
    const [evidencias, setEvidencias] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedCertTemplate, setSelectedCertTemplate] = useState(1);

    useEffect(() => {
        setIsMounted(true);
        const savedProfs = localStorage.getItem('axiom_profs');
        const savedEvs = localStorage.getItem('axiom_evidencias');
        const savedLogo = localStorage.getItem('axiom_logo');

        if (savedLogo) setLogoUrl(savedLogo);

        if (savedProfs) {
            setProfessors(JSON.parse(savedProfs));
        } else {
            const initialProfs = [
                { id: '1', name: 'Warley de Melo Oliveira', email: 'warley.oliveira@pucminas.br', status: 'ativo' },
                { id: '2', name: 'Silvia Helena Ferreira', email: 'silvia.helena@pucminas.br', status: 'ativo' },
                { id: '3', name: 'Roberto Alves de Souza', email: 'roberto.alves@pucminas.br', status: 'convidado' },
            ];
            setProfessors(initialProfs);
            localStorage.setItem('axiom_profs', JSON.stringify(initialProfs));
        }

        if (savedEvs) {
            setEvidencias(JSON.parse(savedEvs));
        } else {
            const initialEvs = [
                { id: 1, titulo: "Aula Prática Neurologia - Simulação", professor: "Warley Melo", data: "05/02/2026", categoria: "Ensino", img: "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop", descricao: "Aplicação de metodologias ativas para reconhecimento de patologias neurológicas em ambiente simulado." },
                { id: 2, titulo: "Ação Social UBS Jardim Teresópolis", professor: "Silvia Helena", data: "04/02/2026", categoria: "Extensão", img: "https://images.unsplash.com/photo-1582213726894-448e6f173273?q=80&w=800&auto=format&fit=crop", descricao: "Atendimento preventivo e orientações ergonomicas para a comunidade local." },
                { id: 3, titulo: "Coleta de Dados Projeto FIP", professor: "Warley Melo", data: "03/02/2026", categoria: "Pesquisa", img: "https://images.unsplash.com/photo-1579152276502-7a199042b781?q=80&w=800&auto=format&fit=crop", descricao: "Levantamento de biomarcadores em pacientes pós-crónicos para pesquisa institucional." },
            ];
            setEvidencias(initialEvs);
            localStorage.setItem('axiom_evidencias', JSON.stringify(initialEvs));
        }

        // Sincronizar tab se vier na URL
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'gallery' || tab === 'users' || tab === 'stats') {
            setActiveTab(tab as any);
        }
    }, []);

    // Cálculos dinâmicos de estatísticas
    const stats = {
        total: evidencias.length + 1281,
        ensino: (evidencias.filter(e => e.categoria === 'Ensino').length / (evidencias.length || 1)) * 100,
        pesquisa: (evidencias.filter(e => e.categoria === 'Pesquisa').length / (evidencias.length || 1)) * 100,
        extensao: (evidencias.filter(e => e.categoria === 'Extensão').length / (evidencias.length || 1)) * 100,
        totalReal: evidencias.length
    };

    const dynamicDataAtividades = [
        { name: 'Ensino', valor: evidencias.filter(e => e.categoria === 'Ensino').length || 1, color: '#8C132C' },
        { name: 'Pesquisa', valor: evidencias.filter(e => e.categoria === 'Pesquisa').length || 1, color: '#363636' },
        { name: 'Extensão', valor: evidencias.filter(e => e.categoria === 'Extensão').length || 1, color: '#D4AF37' },
    ];

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('axiom_profs', JSON.stringify(professors));
        }
    }, [professors, isMounted]);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('axiom_evidencias', JSON.stringify(evidencias));
        }
    }, [evidencias, isMounted]);

    const onAddProfessor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const name = formData.get('name') as string;

        if (!email.includes('@pucminas.br')) {
            toast.error("Acesso permitido apenas para e-mails institucionais @pucminas.br");
            return;
        }

        setProfessors([...professors, { id: Date.now().toString(), name, email, status: 'convidado' }]);
        setShowAddUser(false);
        toast.success("Professor convidado. Instruções enviadas para o e-mail.");
    };

    const deleteProfessor = async (id: string) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Esta ação é irreversível e o docente perderá o acesso ao portal.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8C132C',
            cancelButtonColor: '#363636',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setProfessors(professors.filter(p => p.id !== id));
            Swal.fire({
                title: 'Excluído!',
                text: 'O acesso do docente foi removido.',
                icon: 'success',
                confirmButtonColor: '#8C132C'
            });
        }
    };

    const deleteEvidence = async (id: number) => {
        const result = await Swal.fire({
            title: 'Remover Registro?',
            text: "Esta evidência será excluída permanentemente da galeria SINAES.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8C132C',
            cancelButtonColor: '#363636',
            confirmButtonText: 'Sim, remover!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            setEvidencias(evidencias.filter(e => e.id !== id));
            Swal.fire({
                title: 'Removido!',
                text: 'O registro foi excluído da base de dados.',
                icon: 'success',
                confirmButtonColor: '#8C132C'
            });
        }
    };

    const handleUpdateProfessor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const status = formData.get('status') as string;

        setProfessors(professors.map(p => p.id === editingProfessor.id ? { ...p, name, email, status } : p));
        setEditingProfessor(null);
        toast.success("Dados do docente atualizados com sucesso.");
    };

    const handleResetPassword = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Enviando link de redefinição...',
                success: 'Link enviado para o e-mail institucional!',
                error: 'Erro ao solicitar redefinição.',
            }
        );
    };

    const generateDossie = () => {
        toast.info("Gerando Dossiê Consolidado SINAES...");
        setTimeout(() => {
            window.print();
        }, 1500);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setLogoUrl(base64);
                localStorage.setItem('axiom_logo', base64);
                toast.success("Logo institucional atualizado!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && viewingEvidence) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const updatedEvs = evidencias.map(ev => ev.id === viewingEvidence.id ? { ...ev, img: base64 } : ev);
                setEvidencias(updatedEvs);
                setViewingEvidence({ ...viewingEvidence, img: base64 });
                toast.success("Foto da evidência atualizada!");
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            {/* Header Institucional */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50 print:hidden">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                            <img
                                src={logoUrl}
                                className="h-12 object-contain group-hover:opacity-50 transition-opacity"
                                alt="Logo"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="text-[#8C132C]" size={20} />
                            </div>
                            <input
                                type="file"
                                ref={logoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                        </div>
                        <div className="h-8 w-px bg-slate-100 hidden md:block" />
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black text-[#363636] tracking-tight">Portal SINAES</h1>
                            <p className="text-[10px] font-bold text-[#8C132C] uppercase tracking-[0.2em]">Fisioterapia • PUC Minas</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                        {[
                            { id: 'stats', label: 'Dashboard', icon: BarChart3 },
                            { id: 'gallery', label: 'Galeria SINAES', icon: ImageIcon },
                            { id: 'users', label: 'Professores', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "px-6 h-10 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                    activeTab === tab.id ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <Link href="/academico/novo">
                        <Button className="bg-[#8C132C] hover:bg-[#5a0c1d] text-white rounded-2xl font-black gap-2 h-12 px-6 shadow-lg shadow-[#8C132C]/30 active:scale-95 transition-all">
                            <Plus size={20} /> Registrar Novo
                        </Button>
                    </Link>
                </div>
            </header>

            {/* VIEW PRINT PARA DOSSIÊ */}
            <div className="hidden print:block p-10 font-sans">
                <div className="flex flex-col items-center mb-10 text-center">
                    <img src={logoUrl} className="h-24 mb-6" alt="" />
                    <h1 className="text-2xl font-black uppercase">Dossiê Consolidado de Evidências SINAES</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase">Período: 2024.1 - 2026.1 | {logoUrl.includes('pucminas') ? 'Curso de Fisioterapia - Betim' : 'Relatório Institucional'}</p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Qualidade MEC</p>
                        <h2 className="text-3xl font-black">Nota 4.8</h2>
                    </div>
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Total de Evidências</p>
                        <h2 className="text-3xl font-black">{evidencias.length + 1281}</h2>
                    </div>
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Participação Docente</p>
                        <h2 className="text-3xl font-black">92%</h2>
                    </div>
                </div>

                <div className="space-y-10">
                    <h3 className="text-xl font-black border-b-4 border-[#8C132C] pb-2 inline-block">Detalhamento por Eixo</h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-black p-3 text-left font-black text-xs uppercase">Eixo SINAES</th>
                                <th className="border border-black p-3 text-left font-black text-xs uppercase">Indicador de Qualidade</th>
                                <th className="border border-black p-3 text-left font-black text-xs uppercase">Status de Auditoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-3 font-bold">Ensino</td>
                                <td className="border border-black p-3">4.9/5.0</td>
                                <td className="border border-black p-3">CONSOLIDADO</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold">Pesquisa</td>
                                <td className="border border-black p-3">4.5/5.0</td>
                                <td className="border border-black p-3">EM PROGRESSO</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold">Extensão</td>
                                <td className="border border-black p-3">5.0/5.0</td>
                                <td className="border border-black p-3">EXCELENTE</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-black border-b-4 border-[#8C132C] pb-2 inline-block pt-10">Histórico Recente de Evidências</h3>
                    <div className="space-y-6">
                        {evidencias.map(ev => (
                            <div key={ev.id} className="border border-slate-200 p-6 rounded-xl flex gap-6">
                                <img src={ev.img} className="w-32 h-32 object-cover rounded-lg" alt="" />
                                <div>
                                    <h4 className="font-black text-lg">{ev.titulo}</h4>
                                    <p className="text-xs font-bold text-[#8C132C] uppercase">{ev.categoria} • {ev.data}</p>
                                    <p className="text-sm mt-3 leading-relaxed">{ev.descricao}</p>
                                    <p className="text-[10px] mt-2 font-bold text-slate-400">Responsável: {ev.professor}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 text-center text-[10px] font-bold text-slate-400">
                    Documento emitido eletronicamente via Portal Axiom SINAES em {new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 print:hidden">

                <AnimatePresence mode="wait">
                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="p-8 rounded-[40px] border-none shadow-sm bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 text-[#8C132C]/10 group-hover:scale-110 transition-transform">
                                        <Award size={64} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qualidade MEC</p>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-4xl font-black text-[#8C132C]">4.8</h3>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => <Award key={s} size={14} className={s <= 4 ? "text-yellow-500 fill-yellow-500" : "text-slate-200"} />)}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1 uppercase">Meta Nota 5 alcançada</p>
                                </Card>

                                <Card className="p-8 rounded-[40px] border-none shadow-sm bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Evidências 2026</p>
                                    <h3 className="text-4xl font-black text-[#363636]">{stats.total}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">Acumulado no ciclo atual</p>
                                </Card>

                                <Card className="p-8 rounded-[40px] border-none shadow-sm bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Adesão Docente</p>
                                    <h3 className="text-4xl font-black text-emerald-500">{professors.length > 0 ? "92%" : "0%"}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">{professors.length} Professores Ativos</p>
                                </Card>

                                <Card className="p-8 rounded-[40px] border-none bg-[#363636] text-white shadow-xl shadow-slate-200">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Status Auditoria</p>
                                    <h3 className="text-xl font-bold leading-tight">Pronto para Avaliação MEC</h3>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-[#8C132C] w-[88%]" />
                                    </div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 p-10 rounded-[50px] border-none shadow-sm bg-white">
                                    <div className="flex items-center justify-between mb-10">
                                        <h2 className="text-2xl font-black text-[#363636]">Distribuição SINAES</h2>
                                        <Badge className="bg-[#8C132C]/5 text-[#8C132C] hover:bg-[#8C132C]/10 border-none font-bold">Consolidado Mensal</Badge>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dynamicDataAtividades}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                                <Bar dataKey="valor" radius={[16, 16, 0, 0]} barSize={80}>
                                                    {dynamicDataAtividades.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                                </Bar>
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#363636] text-white p-4 rounded-2xl shadow-2xl border-none">
                                                                    <p className="text-xs font-black uppercase mb-1">{payload[0].payload.name}</p>
                                                                    <p className="text-lg font-bold">{payload[0].value} registros</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                <Card className="p-10 rounded-[50px] border-none bg-white shadow-sm flex flex-col">
                                    <h2 className="text-2xl font-black text-[#8C132C] mb-8">Eixos de Qualidade</h2>
                                    <div className="space-y-4 flex-1">
                                        {[
                                            { t: "Registros de Ensino", v: Math.round(stats.ensino > 0 ? stats.ensino : 85), cat: "Ensino" },
                                            { t: "Produção Científica", v: Math.round(stats.pesquisa > 0 ? stats.pesquisa : 62), cat: "Pesquisa" },
                                            { t: "Ações Extensionistas", v: Math.round(stats.extensao > 0 ? stats.extensao : 94), cat: "Extensão" },
                                            { t: "Auditoria Interna", v: 40, cat: "Gestão" }
                                        ].map((check, i) => (
                                            <div key={i} className="group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-slate-700">{check.t}</span>
                                                    <span className="text-xs font-black text-[#8C132C]">{check.v}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${check.v}%` }}
                                                        className="h-full bg-[#8C132C] rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={generateDossie} className="w-full mt-8 bg-[#363636] hover:bg-black rounded-2xl h-14 font-black transition-all gap-2">
                                        <FileText size={18} /> Gerar Dossiê SINAES
                                    </Button>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'gallery' && (
                        <motion.div
                            key="gallery"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black text-[#363636] tracking-tight">Galeria de Evidências</h2>
                                    <p className="text-slate-400 font-medium text-lg mt-1">Acervo fotográfico institucionalizado</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button className="bg-[#8C132C] text-white rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-[#8C132C]/20 border-none group">
                                        <Camera size={20} className="group-hover:rotate-12 transition-transform" /> Nova Captura Real
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {evidencias.map((ev, i) => (
                                    <motion.div
                                        key={ev.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="group"
                                    >
                                        <div className="relative aspect-[4/3] rounded-[48px] overflow-hidden bg-slate-50 shadow-md mb-4 border border-slate-100">
                                            <img
                                                src={ev.img}
                                                alt={ev.titulo}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-8 gap-3">
                                                <Button
                                                    onClick={() => setViewingEvidence(ev)}
                                                    className="bg-white text-[#363636] hover:bg-[#8C132C] hover:text-white rounded-2xl font-black gap-2 w-full h-12 shadow-xl"
                                                >
                                                    <Eye size={16} /> Ver Detalhes
                                                </Button>
                                                <Button
                                                    onClick={() => deleteEvidence(ev.id)}
                                                    variant="destructive"
                                                    className="rounded-2xl font-black gap-2 w-full h-12 opacity-80 hover:opacity-100"
                                                >
                                                    <Trash2 size={16} /> Excluir Registro
                                                </Button>
                                            </div>
                                            <div className="absolute top-6 left-6">
                                                <Badge className="bg-white/95 backdrop-blur-md text-[#8C132C] border-none font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-lg">
                                                    {ev.categoria}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="px-4 text-center">
                                            <h4 className="font-black text-lg text-slate-800 leading-tight truncate">{ev.titulo}</h4>
                                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{ev.professor} • {ev.data}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-black text-[#363636] tracking-tight">Corpo Docente</h2>
                                    <p className="text-slate-400 font-medium text-lg mt-1">Gestão de credenciais e permissões</p>
                                </div>
                                <Button
                                    onClick={() => setShowAddUser(true)}
                                    className="bg-[#8C132C] text-white rounded-[24px] h-16 px-10 font-black gap-3 shadow-2xl shadow-[#8C132C]/30 hover:-translate-y-1 transition-all"
                                >
                                    <UserPlus size={24} /> Convidar Docente
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {professors.map(prof => (
                                    <Card key={prof.id} className="p-8 rounded-[48px] border-none shadow-sm bg-white group hover:shadow-2xl transition-all relative overflow-hidden">
                                        <div className="flex items-center gap-6 mb-8 relative z-10">
                                            <div className="w-16 h-16 bg-slate-50 text-[#8C132C] rounded-[24px] flex items-center justify-center text-2xl font-black shadow-inner">
                                                {prof.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <h4 className="font-black text-xl text-slate-800 truncate">{prof.name}</h4>
                                                <p className="text-sm text-slate-400 font-bold truncate">{prof.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                                            <span className={cn(
                                                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm",
                                                prof.status === 'ativo' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {prof.status}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setEditingProfessor(prof)} className="p-3 text-slate-300 hover:text-[#8C132C] transition-colors rounded-xl hover:bg-slate-50">
                                                    <Settings size={20} />
                                                </button>
                                                <button onClick={() => deleteProfessor(prof.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors rounded-xl hover:bg-slate-50">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bg Detail */}
                                        <div className="absolute -bottom-6 -right-6 text-slate-50/50 group-hover:text-[#8C132C]/5 transition-colors">
                                            <ShieldCheck size={120} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>

            {/* Modal Convidar Professor */}
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogContent className="rounded-[40px] p-12 border-none">
                    <DialogHeader className="items-center text-center">
                        <div className="w-16 h-16 bg-[#8C132C]/10 text-[#8C132C] rounded-2xl flex items-center justify-center mb-4">
                            <UserPlus size={32} />
                        </div>
                        <DialogTitle className="text-2xl font-black text-[#363636]">Convidar Docente</DialogTitle>
                        <DialogDescription className="font-medium text-slate-400">Exclusivo para domínios institucionais @pucminas.br</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onAddProfessor} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Nome Completo</Label>
                            <Input name="name" required className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2">E-mail Institucional</Label>
                            <Input name="email" type="email" required className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                        </div>
                        <Button className="w-full h-16 bg-[#8C132C] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#8C132C]/20">Enviar Convite</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Editar Professor */}
            <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
                <DialogContent className="rounded-[40px] p-12 border-none">
                    <DialogHeader className="items-center text-center">
                        <Settings className="text-[#8C132C] mb-4" size={48} />
                        <DialogTitle className="text-2xl font-black text-[#363636]">Configurar Acesso</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfessor} className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Nome Exibição</Label>
                                <Input name="name" defaultValue={editingProfessor?.name} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 px-2">E-mail de Login</Label>
                                <Input name="email" defaultValue={editingProfessor?.email} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Status do Docente</Label>
                            <Select name="status" defaultValue={editingProfessor?.status}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    <SelectItem value="ativo" className="font-bold py-3 text-emerald-600">Ativo (Acesso Total)</SelectItem>
                                    <SelectItem value="convidado" className="font-bold py-3 text-amber-600">Convidado (Pendente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                                    <ShieldCheck size={16} /> Segurança de Acesso
                                </div>
                                <p className="text-[10px] text-amber-500 font-medium">Recomenda-se a redefinição em caso de suspeita de invasão.</p>
                            </div>
                            <Button
                                type="button"
                                onClick={handleResetPassword}
                                className="bg-white text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl h-10 px-4 font-black text-[10px] uppercase transition-all"
                            >
                                Redefinir Senha
                            </Button>
                        </div>

                        <Button type="submit" className="w-full h-16 bg-[#8C132C] text-white rounded-2xl font-black text-lg gap-2 shadow-lg shadow-[#8C132C]/10">
                            <Save size={20} /> Salvar Alterações
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Ver Detalhes Evidência */}
            <Dialog open={!!viewingEvidence} onOpenChange={() => setViewingEvidence(null)}>
                <DialogContent className="max-w-2xl rounded-[48px] p-0 border-none overflow-hidden">
                    <div className="relative aspect-video group">
                        <img src={viewingEvidence?.img} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button onClick={() => evidenceImageInputRef.current?.click()} className="bg-white text-[#8C132C] rounded-full font-black gap-2">
                                <Camera size={16} /> Trocar por Foto Real
                            </Button>
                            <input
                                type="file"
                                ref={evidenceImageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleEvidenceImageUpload}
                            />
                        </div>
                        <div className="absolute top-6 left-6">
                            <Badge className="bg-[#8C132C] text-white border-none font-black px-4 py-2 rounded-xl text-xs shadow-2xl">
                                {viewingEvidence?.categoria || viewingEvidence?.category}
                            </Badge>
                        </div>
                    </div>
                    <div className="p-10 space-y-6">
                        <div>
                            <h3 className="text-3xl font-black text-[#363636] leading-tight">{viewingEvidence?.titulo}</h3>
                            <div className="flex items-center gap-4 mt-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <span>Prof. {viewingEvidence?.professor}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{viewingEvidence?.data}</span>
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">{viewingEvidence?.descricao}</p>
                        <div className="flex gap-4 pt-6 border-t border-slate-50">
                            <Button
                                onClick={() => {
                                    setViewingEvidence(null);
                                    setShowCertificateWizard(viewingEvidence);
                                }}
                                className="bg-[#8C132C] rounded-2xl h-12 px-8 font-black flex-1 uppercase tracking-widest text-xs"
                            >
                                <Plus size={14} className="mr-2" /> Gerar Certificado
                            </Button>
                            <Button variant="outline" onClick={() => setViewingEvidence(null)} className="rounded-2xl h-12 px-8 font-black border-slate-100 uppercase tracking-widest text-xs">Fechar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Gerador de Certificados */}
            <Dialog open={!!showCertificateWizard} onOpenChange={() => setShowCertificateWizard(null)}>
                <DialogContent className="max-w-[1400px] sm:max-w-[90vw] rounded-[48px] p-10 border-none max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black text-[#363636]">Gerador de Certificados SINAES</DialogTitle>
                        <DialogDescription className="text-slate-400 font-bold uppercase text-[12px] tracking-widest mt-2 px-1">Emissão institucional em lote para alunos e participantes</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Nomes dos Alunos (Um por linha)</Label>
                                <Textarea placeholder="João Silva&#10;Maria Oliveira..." className="h-32 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Carga Horária</Label>
                                    <Input defaultValue="20h" className="rounded-2xl bg-slate-50 border-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400">Data de Realização</Label>
                                    <Input defaultValue={showCertificateWizard?.data} className="rounded-2xl bg-slate-50 border-none font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Local de Realização</Label>
                                <Input defaultValue="PUC Minas - Betim" className="rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <Label className="text-[12px] font-black uppercase text-[#8C132C] mb-6 block tracking-widest">Selecione o Template (4 Estilos Acadêmicos)</Label>
                                <div className="grid grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedCertTemplate(i)}
                                            className={cn(
                                                "aspect-[1.4/1] bg-slate-50 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-4",
                                                selectedCertTemplate === i ? "border-[#8C132C] bg-[#8C132C]/5 shadow-lg scale-105" : "border-transparent hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn("w-full h-full rounded-lg bg-white shadow-inner flex items-center justify-center text-[10px] font-black", selectedCertTemplate === i ? "text-[#8C132C]" : "text-slate-300")}>
                                                ESTILO V{i}
                                            </div>
                                            <span className="mt-2 text-[10px] font-black uppercase text-slate-400">Modelo {i}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[40px] p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative group min-h-[500px] overflow-hidden">
                            {/* PREVIEW DINÂMICO SIMULADO */}
                            <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                                <motion.div
                                    key={selectedCertTemplate}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full bg-white border-8 border-slate-100 shadow-2xl rounded-sm p-10 flex flex-col items-center relative overflow-hidden"
                                >
                                    {/* Template 1 Decor */}
                                    {selectedCertTemplate === 1 && <div className="absolute top-0 left-0 w-32 h-32 bg-[#8C132C]/10 rounded-br-[100px]" />}
                                    {/* Template 2 Decor */}
                                    {selectedCertTemplate === 2 && <div className="absolute inset-0 border-[20px] border-[#363636]/5" />}
                                    {/* Template 3 Decor */}
                                    {selectedCertTemplate === 3 && <div className="absolute top-0 right-0 w-64 h-1 bg-[#8C132C]" />}
                                    {/* Template 4 Decor */}
                                    {selectedCertTemplate === 4 && <div className="absolute inset-0 grayscale opacity-5 mix-blend-multiply" style={{ backgroundImage: `url(${logoUrl})`, backgroundSize: '100px' }} />}

                                    <img src={logoUrl} className="h-12 object-contain mb-8 opacity-40 grayscale" alt="" />

                                    <div className="font-serif text-[8px] uppercase tracking-widest mb-4">Certificado de Participação</div>
                                    <div className="font-serif text-2xl font-bold mb-6">CERTIFICAMOS QUE</div>
                                    <div className="h-px w-64 bg-slate-300 mb-6" />
                                    <div className="text-xl font-black text-[#8C132C] mb-8">[NOME DO ALUNO]</div>
                                    <p className="text-[10px] leading-relaxed max-w-md opacity-60">
                                        Participou da atividade <strong>{showCertificateWizard?.titulo}</strong>, coordenada pelo professor(a) <strong>{showCertificateWizard?.professor}</strong>, realizada em <strong>{showCertificateWizard?.data}</strong> na instituição <strong>PUC Minas</strong>, totalizando a carga horária de <strong>20 horas</strong>.
                                    </p>

                                    <div className="absolute bottom-10 left-0 right-0 flex justify-around items-end opacity-20">
                                        <div className="flex flex-col items-center">
                                            <div className="w-32 h-px bg-black mb-2" />
                                            <div className="text-[8px] font-bold">Coordenação de Curso</div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="w-32 h-px bg-black mb-2" />
                                            <div className="text-[8px] font-bold">Direção Geral</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <Button className="absolute bottom-10 left-10 right-10 bg-[#363636] text-white rounded-3xl h-16 font-black shadow-2xl hover:bg-black transition-all group-hover:scale-[1.02]">
                                <Download size={22} className="mr-2" /> Gerar Lote de Certificados (PDF)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Menu Mobile - DESIGN FINAL (Foto 1 Aesthetic) */}
            <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center z-50 print:hidden px-4">
                {/* Floating Action Button "POPPING OUT" CENTRALIZED */}
                <Link href="/academico/novo" className="z-20 relative">
                    <motion.button
                        whileHover={{ scale: 1.1, translateY: -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-20 h-20 bg-[#8C132C] rounded-[28px] flex items-center justify-center shadow-[0_20px_40px_rgba(140,19,44,0.4)] border-8 border-[#FDFDFD] text-white -mb-10 transition-all hover:shadow-[0_25px_50px_rgba(140,19,44,0.6)]"
                    >
                        <Plus size={40} />
                    </motion.button>
                </Link>

                {/* Navigation Bar below with 4 items (Stats, Galeria, Dossiê, Docentes) */}
                <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-[44px] h-24 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex items-center px-10 relative">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full",
                            activeTab === 'stats' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400"
                        )}
                    >
                        <BarChart3 size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'stats' ? "opacity-100" : "opacity-40")}>Stats</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full",
                            activeTab === 'gallery' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400"
                        )}
                    >
                        <ImageIcon size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'gallery' ? "opacity-100" : "opacity-40")}>Galeria</span>
                    </button>

                    {/* Empty Space for the floating button center overlap */}
                    <div className="w-24 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-200 mt-10 uppercase">Novo</span>
                    </div>

                    <button
                        onClick={() => generateDossie()}
                        className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full text-slate-300 hover:text-[#8C132C]"
                    >
                        <FileText size={28} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Dossiê</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full",
                            activeTab === 'users' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400"
                        )}
                    >
                        <Users size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'users' ? "opacity-100" : "opacity-40")}>Docentes</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

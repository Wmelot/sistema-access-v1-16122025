'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Library,
    Image as ImageIcon,
    Camera,
    Filter,
    Eye,
    ArrowUpRight,
    ChevronRight,
    Save,
    LayoutGrid,
    List,
    Mail,
    Lock,
    Download,
    FileText,
    Printer,
    Link as LinkIcon,
    Upload,
    FileCheck,
    FileSignature
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
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
    const extraFilesRef = useRef<HTMLInputElement>(null);
    const evidenceImageInputRef = useRef<HTMLInputElement>(null);
    const [showDossieModal, setShowDossieModal] = useState(false);
    const [dossieFilter, setDossieFilter] = useState<'Geral' | 'Ensino' | 'Pesquisa' | 'Extensão'>('Geral');
    const [dossieYear, setDossieYear] = useState<'Todos' | '2023' | '2024' | '2025' | '2026'>('Todos');
    const certificateInputRef = useRef<HTMLInputElement>(null);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState({ date: '', professor: '', category: 'Todos' });
    const [viewingAcervo, setViewingAcervo] = useState<any>(null);
    const [acervoMode, setAcervoMode] = useState<'grid' | 'list'>('grid');

    // Persistence State
    const [professors, setProfessors] = useState<any[]>([]);
    const [evidencias, setEvidencias] = useState<any[]>([]);
    const [selectedCertTemplate, setSelectedCertTemplate] = useState(1);
    const [isMounted, setIsMounted] = useState(false);

    // Onboarding & Profile State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>({
        name: 'Warley de Melo Oliveira',
        email: 'warley.oliveira@pucminas.br',
        role: 'admin',
        permissions: {
            canInvite: true,
            canDelete: true,
            canViewDashboard: true
        }
    });

    useEffect(() => {
        setIsMounted(true);
        const savedProfs = localStorage.getItem('axiom_profs');
        const savedEvs = localStorage.getItem('axiom_evidencias');
        const savedLogo = localStorage.getItem('axiom_logo');
        const onboardingDone = localStorage.getItem('axiom_onboarding_done');
        const isLoggedIn = localStorage.getItem('axiom_sinaes_logged');

        if (!isLoggedIn) {
            window.location.href = '/academico/login';
            return;
        }

        if (savedLogo) setLogoUrl(savedLogo);
        if (!onboardingDone) {
            setTimeout(() => setShowOnboarding(true), 1000);
        }

        // Lógica de Ícone Dinâmico para App (Home Screen)
        const updateDynamicIcon = () => {
            const isAcademic = window.location.pathname.includes('/academico');
            const savedLogo = localStorage.getItem('axiom_logo');

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

        // Recuperar ou inicializar professores (V2 para evitar reset indesejado)
        const v2Profs = localStorage.getItem('axiom_sinaes_profs_v2');
        let currentProfs = [];
        if (v2Profs) {
            currentProfs = JSON.parse(v2Profs);
            // GARANTIA DE INTEGRIDADE: Admin master deve estar na lista
            if (!currentProfs.find((p: any) => p.id === '1' || p.email === 'warley.oliveira@pucminas.br')) {
                currentProfs.unshift({
                    id: '1',
                    name: 'Warley de Melo Oliveira',
                    email: 'warley.oliveira@pucminas.br',
                    status: 'ativo',
                    role: 'admin',
                    permissions: { canInvite: true, canDelete: true, canViewDashboard: true },
                    lattesUrl: 'http://lattes.cnpq.br/0000000000000001',
                    certificados: []
                });
                localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(currentProfs));
            }
            setProfessors(currentProfs);
        } else {
            const initialProfs = [
                {
                    id: '1',
                    name: 'Warley de Melo Oliveira',
                    email: 'warley.oliveira@pucminas.br',
                    status: 'ativo',
                    lattesUrl: 'http://lattes.cnpq.br/0000000000000001',
                    certificados: [],
                    role: 'admin',
                    permissions: { canInvite: true, canDelete: true, canViewDashboard: true }
                },
                {
                    id: '2',
                    name: 'Silvia Helena Ferreira',
                    email: 'silvia.helena@pucminas.br',
                    status: 'ativo',
                    lattesUrl: '',
                    certificados: [],
                    role: 'professor',
                    permissions: { canInvite: false, canDelete: false, canViewDashboard: false }
                },
                {
                    id: '3',
                    name: 'Tatiana Barral',
                    email: 'tatiana.barral@yahoo.com.br',
                    status: 'ativo',
                    lattesUrl: '',
                    certificados: [],
                    role: 'professor',
                    permissions: { canInvite: false, canDelete: false, canViewDashboard: false }
                }
            ];
            setProfessors(initialProfs);
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(initialProfs));
        }

        if (savedEvs) {
            setEvidencias(JSON.parse(savedEvs));
        } else {
            const initialEvs = [
                { id: 1, titulo: "Aula Prática Neurologia - Simulação", professor: "Warley de Melo Oliveira", data: "05/02/2026", categoria: "Ensino", img: "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop", descricao: "Aplicação de metodologias ativas para reconhecimento de patologias neurológicas em ambiente simulado." },
                { id: 2, titulo: "Ação Social UBS Jardim Teresópolis", professor: "Silvia Helena Ferreira", data: "04/02/2026", categoria: "Extensão", img: "https://images.unsplash.com/photo-1582213726894-448e6f173273?q=80&w=800&auto=format&fit=crop", descricao: "Atendimento preventivo e orientações ergonomicas para a comunidade local." },
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

    // Cálculos Reais baseados em Dimensões do MEC/SINAES
    const stats = (() => {
        const countEnsino = evidencias.filter(e => e.categoria === 'Ensino' || e.eixos?.includes('ENSINO')).length;
        const countPesquisa = evidencias.filter(e => e.categoria === 'Pesquisa' || e.eixos?.includes('PESQUISA')).length;
        const countExtensao = evidencias.filter(e => e.categoria === 'Extensão' || e.eixos?.includes('EXTENSAO')).length;

        // Critérios MEC: Diversidade de Eixos (Pedagógico), Adesão (Corpo Docente), Volume (Infra)
        const d1Pedagogico = Math.min(5.0, (countEnsino * 0.5) + (countPesquisa * 0.3) + (countExtensao * 0.3));
        const d2Docente = Math.min(5.0, (professors.length / 5) * 5); // Exemplo: 5 profs = Nota 5
        const d3Infra = Math.min(5.0, (evidencias.length / 10) * 5);

        // Cálculo de Adesão Docente: % de professores com pelo menos 1 evidência
        const profsComAtividade = new Set(evidencias.map(e => e.professor)).size;
        const adesaoReal = Math.round((profsComAtividade / (professors.length || 1)) * 100);
        const mediaSINAES = ((d1Pedagogico * 0.4) + (d2Docente * 0.4) + (d3Infra * 0.2)).toFixed(1);

        return {
            total: evidencias.length,
            progressoMEC: mediaSINAES,
            ensino: (countEnsino / (evidencias.length || 1)) * 100,
            pesquisa: (countPesquisa / (evidencias.length || 1)) * 100,
            extensao: (countExtensao / (evidencias.length || 1)) * 100,
            adesao: adesaoReal,
            d1: d1Pedagogico.toFixed(1),
            d2: d2Docente.toFixed(1),
            d3: d3Infra.toFixed(1)
        };
    })();

    const dynamicDataAtividades = [
        { name: 'Ensino', valor: evidencias.filter(e => e.categoria === 'Ensino').length || 1, color: '#8C132C' },
        { name: 'Pesquisa', valor: evidencias.filter(e => e.categoria === 'Pesquisa').length || 1, color: '#363636' },
        { name: 'Extensão', valor: evidencias.filter(e => e.categoria === 'Extensão').length || 1, color: '#D4AF37' },
    ];

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(professors));
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

        // Permite qualquer e-mail agora conforme pedido pelo usuário
        setProfessors([...professors, {
            id: Date.now().toString(),
            name,
            email,
            status: 'ativo',
            lattesUrl: '',
            certificados: [],
            password: '12345678',
            needsPasswordChange: true,
            role: 'professor',
            permissions: { canInvite: false, canDelete: false, canViewDashboard: false }
        }]);
        setShowAddUser(false);
        toast.success("Professor convidado. Instruções enviadas para o e-mail.");
    };

    const deleteProfessor = async (id: string) => {
        if (id === '1') {
            toast.error("O administrador master não pode ser removido.");
            return;
        }

        if (currentUser.role !== 'admin' && !currentUser.permissions?.canDelete) {
            toast.error("Você não tem permissão para excluir docentes.");
            return;
        }

        const result = await Swal.fire({
            title: 'Excluir Docente?',
            text: "Digite sua senha de acesso para confirmar a exclusão deste cadastro:",
            input: 'password',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8C132C',
            cancelButtonColor: '#363636',
            confirmButtonText: 'Confirmar Exclusão',
            cancelButtonText: 'Cancelar',
            preConfirm: (password) => {
                if (password === 'admin123') return true;
                Swal.showValidationMessage('Senha incorreta!');
                return false;
            }
        });

        if (result.isConfirmed) {
            const updatedProfs = professors.filter(p => p.id !== id);
            setProfessors(updatedProfs);
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfs));
            toast.success("Docente removido com sucesso.");
        }
    };

    const deleteEvidence = async (id: number) => {
        if (currentUser.role !== 'admin' && !currentUser.permissions?.canDelete) {
            toast.error("Você não tem permissão para excluir registros.");
            return;
        }

        const result = await Swal.fire({
            title: 'Remover Registro?',
            text: "Esta evidência será excluída permanentemente. Digite sua senha para confirmar:",
            input: 'password',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8C132C',
            cancelButtonColor: '#363636',
            confirmButtonText: 'Excluir permanentemente',
            cancelButtonText: 'Cancelar',
            preConfirm: (password) => {
                if (password === 'admin123') return true;
                Swal.showValidationMessage('Senha incorreta!');
                return false;
            }
        });

        if (result.isConfirmed) {
            const updatedEvs = evidencias.filter(e => e.id !== id);
            setEvidencias(updatedEvs);
            localStorage.setItem('axiom_evidencias', JSON.stringify(updatedEvs));
            toast.success("Registro removido.");
        }
    };

    const handleUpdateProfessor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const lattesUrl = formData.get('lattesUrl') as string;
        const role = formData.get('role') as string;

        const canInvite = formData.get('canInvite') === 'on';
        const canDelete = formData.get('canDelete') === 'on';
        const canViewDashboard = formData.get('canViewDashboard') === 'on';

        const updatedProfs = professors.map(p => p.id === editingProfessor.id ? {
            ...p,
            name,
            email,
            lattesUrl,
            role,
            permissions: {
                canInvite,
                canDelete,
                canViewDashboard
            }
        } : p);

        setProfessors(updatedProfs);
        localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfs));
        setEditingProfessor(null);
        toast.success("Dados e permissões atualizados com sucesso.");
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
        if (currentUser.role !== 'admin' && !currentUser.permissions?.canViewDashboard) {
            toast.error("Apenas administradores podem gerar dossiês consolidados.");
            return;
        }
        setShowDossieModal(false);
        toast.info(`Gerando Dossiê ${dossieFilter} SINAES...`);
        setTimeout(() => {
            window.print();
        }, 1000);
    };

    const handlePrintAcervo = () => {
        const printContent = document.getElementById('acervo-print-area');
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printContents = printContent.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        // Reiniciar o estado do React após o hack de impressão forçada (melhor seria usar ref e component de impressão separado)
        window.location.reload();
    };

    // IMAGE COMPRESSION UTILITY to avoid localstorage quota issues
    const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const compressed = await compressImage(base64, 400); // Small for logo
                setLogoUrl(compressed);
                localStorage.setItem('axiom_logo', compressed);
                toast.success("Logo institucional atualizado!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && viewingEvidence) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64, 1024); // Sufficient for evidence
                    const updatedEvs = evidencias.map(ev => ev.id === viewingEvidence.id ? { ...ev, img: compressed } : ev);
                    setEvidencias(updatedEvs);
                    setViewingEvidence({ ...viewingEvidence, img: compressed });
                    toast.success("Foto da evidência atualizada (comprimida)!");
                } catch (err) {
                    console.error("Erro ao comprimir imagem:", err);
                    toast.error("Erro ao processar imagem.");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && editingProfessor) {
            const newCerts = Array.from(files).map(file => ({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                date: new Date().toLocaleDateString()
            }));

            const updatedProfessor = {
                ...editingProfessor,
                certificados: [...(editingProfessor.certificados || []), ...newCerts]
            };

            setEditingProfessor(updatedProfessor);
            setProfessors(professors.map(p => p.id === updatedProfessor.id ? updatedProfessor : p));
            toast.success(`${files.length} documento(s) anexado(s) com sucesso.`);
        }
    };

    const handleLogout = () => {
        toast.loading("Saindo do portal...");
        setTimeout(() => {
            window.location.href = "/academico/login";
        }, 1200);
    };

    const finishOnboarding = (dontShowAgain = false) => {
        if (dontShowAgain) {
            localStorage.setItem('axiom_onboarding_done', 'true');
        }
        setShowOnboarding(false);
    };

    const ONBOARDING_STEPS = [
        {
            title: "Bem-vindo ao Portal SINAES",
            desc: "Este é o seu novo cockpit para gestão de evidências acadêmicas. Vamos te mostrar o básico.",
            icon: BookOpen,
            pos: "center"
        },
        {
            title: "Indicadores em Tempo Real",
            desc: "Aqui você acompanha o equilíbrio entre Ensino, Pesquisa e Extensão em tempo real.",
            icon: BarChart3,
            target: "stats-tab"
        },
        {
            title: "Sua Galeria Histórica",
            desc: "Todo o seu acervo de fotos e documentos fica organizado aqui para auditorias do MEC.",
            icon: ImageIcon,
            target: "gallery-tab"
        },
        {
            title: "Registro Relâmpago",
            desc: "Clique aqui para registrar uma nova atividade. Você pode usar a câmera do celular direto no campus.",
            icon: Plus,
            target: "new-btn"
        },
        {
            title: "Dossiê em 1 Clique",
            desc: "Geramos o PDF consolidado para você imprimir e levar na reunião de colegiado.",
            icon: FileText,
            target: "dossie-btn"
        }
    ];

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
                            { id: 'stats', label: 'Tela Inicial', icon: BarChart3 },
                            { id: 'gallery', label: 'Galeria SINAES', icon: ImageIcon },
                            { id: 'users', label: 'Docentes', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                id={`${tab.id}-tab`}
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

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setShowSearchModal(true)}
                            className="w-12 h-12 rounded-2xl text-slate-400 hover:text-[#8C132C] hover:bg-[#8C132C]/5 transition-all"
                            title="Busca Global SINAES"
                        >
                            <Search size={22} />
                        </Button>

                        <Link href="/academico/novo">
                            <Button id="new-btn" className="bg-[#8C132C] hover:bg-[#5a0c1d] text-white rounded-2xl font-black gap-2 h-12 px-6 shadow-lg shadow-[#8C132C]/30 active:scale-95 transition-all hidden md:flex">
                                <Plus size={20} /> Registrar Novo
                            </Button>
                        </Link>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-12 h-12 rounded-[18px] bg-[#363636] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all border-4 border-white"
                            >
                                {currentUser.name.charAt(0)}
                            </button>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setShowProfileMenu(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-4 w-64 bg-white rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 p-2 z-[70] overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-50 mb-2">
                                                <p className="text-[10px] font-black text-[#8C132C] uppercase tracking-widest mb-1">Docente Autenticado</p>
                                                <p className="font-bold text-slate-800 text-sm truncate">{currentUser.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{currentUser.email}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <button onClick={() => { setShowProfileMenu(false); handleResetPassword(); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider group">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-colors">
                                                        <Lock size={14} />
                                                    </div>
                                                    Gerenciar Senha
                                                </button>

                                                <button onClick={() => { setShowProfileMenu(false); setShowHelp(true); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider group">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-colors">
                                                        <Info size={14} />
                                                    </div>
                                                    Ajuda & Tutorial
                                                </button>

                                                <div className="h-px bg-slate-50 mx-2 my-2" />

                                                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50 transition-colors text-red-500 font-bold text-xs uppercase tracking-wider group">
                                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                        <ArrowUpRight className="rotate-45" size={14} />
                                                    </div>
                                                    Sair do Portal
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            {/* VIEW PRINT PARA DOSSIÊ */}
            <div className="hidden print:block p-10 font-sans">
                <div className="flex flex-col items-center mb-10 text-center">
                    <img src={logoUrl} className="h-24 mb-6" alt="" />
                    <h1 className="text-2xl font-black uppercase">Dossiê Consolidado de Evidências SINAES</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase">
                        Período: {dossieYear === 'Todos' ? 'Histórico Completo' : `Ano Base ${dossieYear}`} |
                        Área: {dossieFilter.toUpperCase()} |
                        {logoUrl.includes('pucminas') ? 'Curso de Fisioterapia - Betim' : 'Relatório Institucional'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Nota Geral SINAES</p>
                        <h2 className="text-3xl font-black">Nota {stats.progressoMEC}</h2>
                    </div>
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Evidências Listadas</p>
                        <h2 className="text-3xl font-black">
                            {evidencias.filter(ev => {
                                const matchArea = dossieFilter === 'Geral' || ev.categoria === dossieFilter || ev.eixos?.includes(dossieFilter.toUpperCase());
                                const matchYear = dossieYear === 'Todos' || ev.data.includes(dossieYear);
                                return matchArea && matchYear;
                            }).length}
                        </h2>
                    </div>
                    <div className="p-6 border-2 border-black rounded-lg">
                        <p className="text-[10px] font-black uppercase">Filtro Aplicado</p>
                        <h2 className="text-3xl font-black">{dossieFilter.toUpperCase()}</h2>
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
                                <td className="border border-black p-3 font-bold text-xs uppercase text-slate-500">Dimensão 1: Projeto Pedagógico</td>
                                <td className="border border-black p-3 font-black">{stats.d1}/5.0</td>
                                <td className="border border-black p-3 font-bold text-[10px]">CONSOLIDADO</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold text-xs uppercase text-slate-500">Dimensão 2: Corpo Docente</td>
                                <td className="border border-black p-3 font-black">{stats.d2}/5.0</td>
                                <td className="border border-black p-3 font-bold text-[10px]">VERIFICADO</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold text-xs uppercase text-slate-500">Dimensão 3: Infraestrutura</td>
                                <td className="border border-black p-3 font-black">{stats.d3}/5.0</td>
                                <td className="border border-black p-3 font-bold text-[10px]">EM AUDITORIA</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="text-xl font-black border-b-4 border-[#8C132C] pb-2 inline-block pt-10">Histórico de Evidências ({dossieFilter})</h3>
                    <div className="space-y-6">
                        {evidencias
                            .filter(ev => {
                                const matchArea = dossieFilter === 'Geral' || ev.categoria === dossieFilter || ev.eixos?.includes(dossieFilter.toUpperCase());
                                const matchYear = dossieYear === 'Todos' || ev.data.includes(dossieYear);
                                return matchArea && matchYear;
                            })
                            .map(ev => (
                                <div key={ev.id} className="border border-slate-200 p-6 rounded-xl flex gap-6">
                                    <img src={ev.img} className="w-32 h-32 object-cover rounded-lg" alt="" />
                                    <div>
                                        <h4 className="font-black text-lg">{ev.titulo}</h4>
                                        <p className="text-xs font-bold text-[#8C132C] uppercase">{ev.categoria} • {ev.data}</p>
                                        <p className="text-sm mt-3 leading-relaxed font-medium">{ev.descricao}</p>
                                        {ev.legenda && (
                                            <p className="text-[11px] text-slate-400 font-medium mt-2 p-3 bg-slate-50 rounded-xl italic">"{ev.legenda}"</p>
                                        )}
                                        {ev.eixos && ev.eixos.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {ev.eixos.map((e: string) => <span key={e} className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase">Integrado: {e}</span>)}
                                            </div>
                                        )}
                                        <p className="text-[10px] mt-4 font-bold text-slate-400 italic">Responsável: {ev.professor}</p>
                                    </div>
                                </div>
                            ))}
                        {evidencias.filter(ev => {
                            const matchArea = dossieFilter === 'Geral' || ev.categoria === dossieFilter || ev.eixos?.includes(dossieFilter.toUpperCase());
                            const matchYear = dossieYear === 'Todos' || ev.data.includes(dossieYear);
                            return matchArea && matchYear;
                        }).length === 0 && (
                                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold">
                                    Nenhum registro encontrado para este filtro (Área: {dossieFilter} | Ano: {dossieYear}).
                                </div>
                            )}
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Qualidade MEC (Dinâmica)</p>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-4xl font-black text-[#8C132C]">{stats.progressoMEC}</h3>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => <Award key={s} size={14} className={s <= Math.floor(Number(stats.progressoMEC)) ? "text-yellow-500 fill-yellow-500" : "text-slate-200"} />)}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1 uppercase">
                                        {Number(stats.progressoMEC) >= 4.5 ? 'Meta Nota 5 alcançada' : 'Evoluindo para Nota 5'}
                                    </p>
                                </Card>

                                <Card className="p-8 rounded-[40px] border-none shadow-sm bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Evidências 2026</p>
                                    <h3 className="text-4xl font-black text-[#363636]">{stats.total}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">Acumulado no ciclo atual</p>
                                </Card>

                                <Card className="p-8 rounded-[40px] border-none shadow-sm bg-white">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Adesão Docente</p>
                                    <h3 className="text-4xl font-black text-emerald-500">{stats.adesao}%</h3>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tight">{professors.length} Professores Cadastrados</p>
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
                                            <PieChart>
                                                <Pie
                                                    data={dynamicDataAtividades}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={8}
                                                    dataKey="valor"
                                                    stroke="none"
                                                    cornerRadius={12}
                                                >
                                                    {dynamicDataAtividades.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            style={{
                                                                filter: `drop-shadow(0px 10px 20px ${entry.color}40)`,
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-[#363636] text-white p-4 rounded-3xl shadow-2xl border-none">
                                                                    <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-white/50">{payload[0].name}</p>
                                                                    <p className="text-xl font-bold">{payload[0].value} Registros</p>
                                                                    <p className="text-[10px] font-bold text-[#D4AF37] uppercase">Consolidado SINAES</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Overlay de Total no Meio do Donut */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                            <span className="text-4xl font-black text-[#363636]">{stats.total}</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-10 rounded-[50px] border-none bg-white shadow-sm flex flex-col">
                                    <h2 className="text-2xl font-black text-[#8C132C] mb-8">Eixos de Qualidade</h2>
                                    <TooltipProvider>
                                        <div className="space-y-4 flex-1">
                                            {[
                                                { t: "Registros de Ensino", v: Math.round(stats.ensino > 0 ? stats.ensino : 0), desc: "Cadastre planos de aula, metodologias ativas e fotos de laboratório." },
                                                { t: "Produção Científica", v: Math.round(stats.pesquisa > 0 ? stats.pesquisa : 0), desc: "Inclua projetos FIP, resumos em congressos e publicações de alunos." },
                                                { t: "Ações Extensionistas", v: Math.round(stats.extensao > 0 ? stats.extensao : 0), desc: "Fotos de ações sociais, parcerias com UBS e atendimentos à comunidade." },
                                                { t: "Auditoria Interna", v: 40, desc: "Envie certificados das atividades mencionadas no dossiê para validação." }
                                            ].map((check, i) => (
                                                <Tooltip key={i}>
                                                    <TooltipTrigger asChild>
                                                        <div className="group cursor-help">
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
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-[#363636] text-white rounded-xl p-3 max-w-[200px] border-none">
                                                        <p className="text-[10px] font-bold leading-relaxed">{check.desc}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </TooltipProvider>
                                    <Button onClick={() => setShowDossieModal(true)} className="w-full mt-8 bg-[#363636] hover:bg-black rounded-2xl h-14 font-black transition-all gap-2">
                                        <FileText size={18} /> Exportar Dossiê SINAES
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
                                        <div className="px-5 text-center pb-2">
                                            <h4 className="font-black text-lg text-slate-800 leading-tight truncate">{ev.titulo}</h4>
                                            {ev.legenda && (
                                                <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1 italic">"{ev.legenda}"</p>
                                            )}
                                            <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest">{ev.professor} • {ev.data}</p>
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
                                            <button
                                                onClick={() => setViewingAcervo(prof)}
                                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-50 hover:bg-[#8C132C]/5 text-slate-400 hover:text-[#8C132C] transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Library size={16} /> Ver Acervo
                                            </button>
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
                        <DialogDescription className="font-medium text-slate-400">Pode ser utilizado e-mail pessoal ou institucional</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={onAddProfessor} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2">Nome Completo</Label>
                            <Input name="name" required className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2">E-mail de Cadastro</Label>
                            <Input name="email" type="email" required className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold" />
                        </div>
                        <Button className="w-full h-16 bg-[#8C132C] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#8C132C]/20">Enviar Convite</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL CONFIGURAÇÃO DOCENTE */}
            <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
                <DialogContent className="max-w-2xl rounded-[40px] p-10 border-none shadow-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-3xl">
                    <DialogHeader>
                        <div className="w-16 h-16 bg-slate-50 text-[#8C132C] rounded-[24px] flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                            <Settings size={32} />
                        </div>
                        <DialogTitle className="text-3xl font-black text-center text-[#363636] tracking-tight">Perfil Docente SINAES</DialogTitle>
                        <DialogDescription className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                            Vínculos Institucionais • Lattes • Auditoria de Atividade
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateProfessor} className="mt-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-wider">Nome Completo</Label>
                                <Input name="name" defaultValue={editingProfessor?.name} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600 focus:ring-2 ring-[#8C132C]/10" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-wider">E-mail Pessoal/Profissional</Label>
                                <Input name="email" defaultValue={editingProfessor?.email} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-[#8C132C] ml-2 italic tracking-wider">URL Currículo Lattes</Label>
                            <div className="relative group">
                                <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8C132C] group-focus-within:rotate-12 transition-transform" size={16} />
                                <Input name="lattesUrl" placeholder="http://lattes.cnpq.br/..." defaultValue={editingProfessor?.lattesUrl} className="h-14 rounded-2xl bg-slate-50 border-none pl-14 font-bold text-blue-600 underline" />
                            </div>
                            <p className="text-[8px] font-bold text-slate-300 uppercase ml-2">O MEC exige a atualização semestral do Lattes</p>
                        </div>

                        {/* SISTEMA DE PERMISSÕES SINAES */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <Label className="text-[12px] font-black uppercase text-[#8C132C] mb-2 block tracking-widest flex items-center gap-2">
                                <ShieldCheck size={18} /> Controle de Acesso e Permissões
                            </Label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-wider">Nível de Acesso</Label>
                                    <Select name="role" defaultValue={editingProfessor?.role || 'professor'}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
                                            <SelectItem value="admin" className="font-bold rounded-xl h-12">Administrador Master</SelectItem>
                                            <SelectItem value="professor" className="font-bold rounded-xl h-12">Professor / Docente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-wider">Status Institucional</Label>
                                    <Select name="status" defaultValue={editingProfessor?.status}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
                                            <SelectItem value="ativo" className="font-bold rounded-xl h-12">Ativo</SelectItem>
                                            <SelectItem value="convidado" className="font-bold rounded-xl h-12 text-amber-500">Convidado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700 leading-none">Convidar</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Docentes</span>
                                    </div>
                                    <input type="checkbox" name="canInvite" defaultChecked={editingProfessor?.permissions?.canInvite} className="w-5 h-5 accent-[#8C132C]" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-red-600 leading-none">Apagar</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Registros</span>
                                    </div>
                                    <input type="checkbox" name="canDelete" defaultChecked={editingProfessor?.permissions?.canDelete} className="w-5 h-5 accent-[#8C132C]" />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700 leading-none">Dashboard</span>
                                        <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Métricas</span>
                                    </div>
                                    <input type="checkbox" name="canViewDashboard" defaultChecked={editingProfessor?.permissions?.canViewDashboard} className="w-5 h-5 accent-[#8C132C]" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 mt-8 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <Label className="text-[10px] font-black uppercase text-[#8C132C] tracking-[0.1em]">Evidências de Auditoria (Upload PDF)</Label>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-tight italic">Comprovantes de títulos, planos de ensino e projetos</p>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-3 shadow-sm">Auditado</Badge>
                            </div>

                            <div className="space-y-3">
                                {editingProfessor?.certificados?.length > 0 ? (
                                    editingProfessor.certificados.map((cert: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#8C132C] shadow-inner">
                                                    <FileSignature size={22} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-700">{cert.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cert.size || 'PDF'} • Validação SINAES</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-[#8C132C] bg-slate-50 rounded-xl w-10 h-10">
                                                <Download size={18} />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        onClick={() => certificateInputRef.current?.click()}
                                        className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 group hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                        <Upload className="mx-auto text-slate-200 mb-4 group-hover:scale-110 group-hover:text-[#8C132C] transition-all" size={40} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deposite aqui os comprovantes</p>
                                        <p className="text-[9px] text-slate-300 font-bold mt-2">Formatos aceitos: PDF e Documentos Escaneados</p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={certificateInputRef}
                                        className="hidden"
                                        multiple
                                        onChange={handleCertificateUpload}
                                        accept=".pdf,image/*"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => certificateInputRef.current?.click()}
                                        className="flex-1 bg-[#8C132C]/5 text-[#8C132C] border-2 border-dashed border-[#8C132C]/20 rounded-2xl h-14 font-black text-[10px] uppercase hover:bg-[#8C132C]/10 transition-all gap-2 tracking-widest"
                                    >
                                        <Upload size={14} /> Selecionar Arquivos
                                    </Button>
                                    <Button type="button" variant="outline" className="bg-slate-50 border-none rounded-2xl h-14 w-14 flex items-center justify-center text-slate-400 hover:text-[#8C132C]">
                                        <Camera size={20} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex gap-4">
                            <Button type="submit" className="flex-1 h-16 bg-[#363636] hover:bg-black text-white rounded-[24px] font-black text-lg gap-3 shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]">
                                <Save size={22} /> Salvar Perfil Completo
                            </Button>
                        </div>
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

            {/* Modal de Exportação de Dossiê */}
            <Dialog open={showDossieModal} onOpenChange={setShowDossieModal}>
                <DialogContent className="max-w-md rounded-[40px] p-10 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-[#8C132C]">Gerador de Dossiê</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selecione a área para exportação consolidada</DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Área do Relatório</Label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {['Geral', 'Ensino', 'Pesquisa', 'Extensão'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setDossieFilter(filter as any)}
                                    className={cn(
                                        "h-12 rounded-xl border-2 flex items-center justify-center px-4 transition-all text-[10px] font-black uppercase tracking-widest",
                                        dossieFilter === filter
                                            ? "border-[#8C132C] bg-[#8C132C]/5 text-[#8C132C]"
                                            : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ano de Referência</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Todos', '2023', '2024', '2025', '2026'].map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setDossieYear(year as any)}
                                    className={cn(
                                        "h-12 rounded-xl border-2 flex items-center justify-center px-4 transition-all text-[10px] font-black uppercase tracking-widest",
                                        dossieYear === year
                                            ? "border-[#8C132C] bg-[#8C132C]/5 text-[#8C132C]"
                                            : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4 items-start mb-6">
                        <Info size={20} className="text-amber-600 shrink-0" />
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            O dossiê incluirá todas as evidências auditadas da categoria selecionada, formatadas para apresentação oficial.
                        </p>
                    </div>

                    <Button
                        onClick={generateDossie}
                        className="w-full h-16 bg-[#8C132C] text-white rounded-2xl font-black text-lg gap-2 shadow-lg shadow-[#8C132C]/20"
                    >
                        <Printer size={20} /> Imprimir Relatório
                    </Button>
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

            {/* ACERVO INDIVIDUAL DO DOCENTE */}
            <Dialog open={!!viewingAcervo} onOpenChange={() => setViewingAcervo(null)}>
                <DialogContent className="max-w-[95vw] md:max-w-[1200px] rounded-[32px] md:rounded-[48px] p-0 border-none overflow-hidden max-h-[92vh] flex flex-col bg-white">
                    <div className="bg-[#8C132C] p-6 md:p-10 text-white relative shrink-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-4">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 rounded-[20px] md:rounded-[28px] flex items-center justify-center text-xl md:text-3xl font-black">
                                    {viewingAcervo?.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-3xl font-black tracking-tight">{viewingAcervo?.name}</h2>
                                    <p className="text-white/60 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-1">Acervo Histórico de Evidências SINAES</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 no-print">
                                <div className="bg-white/10 p-1.5 rounded-2xl hidden md:flex gap-1">
                                    <button
                                        onClick={() => setAcervoMode('grid')}
                                        className={cn(
                                            "p-3 rounded-xl transition-all",
                                            acervoMode === 'grid' ? "bg-white text-[#8C132C] shadow-lg" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <LayoutGrid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setAcervoMode('list')}
                                        className={cn(
                                            "p-3 rounded-xl transition-all",
                                            acervoMode === 'list' ? "bg-white text-[#8C132C] shadow-lg" : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <List size={20} />
                                    </button>
                                </div>
                                <Button
                                    onClick={handlePrintAcervo}
                                    className="h-12 md:h-14 bg-white text-[#8C132C] hover:bg-white/90 rounded-[15px] md:rounded-[20px] font-black gap-2 px-4 md:px-8 shadow-2xl text-xs md:text-base"
                                >
                                    <Printer size={20} /> <span className="hidden md:inline">Imprimir Listagem</span><span className="md:hidden">Imprimir</span>
                                </Button>
                            </div>
                        </div>
                        <Library className="absolute right-10 top-10 opacity-10 hidden md:block" size={140} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar no-print" id="acervo-print-area">
                        {evidencias.filter(ev => ev.professor === viewingAcervo?.name).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <ImageIcon size={40} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-400">Nenhum documento postado</h3>
                                    <p className="text-slate-300 font-medium max-w-xs">Este docente ainda não registrou evidências no portal.</p>
                                </div>
                            </div>
                        ) : (acervoMode === 'grid' && typeof window !== 'undefined' && window.innerWidth > 768) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {evidencias
                                    .filter(ev => ev.professor === viewingAcervo?.name)
                                    .map(ev => (
                                        <Card key={ev.id} className="rounded-[32px] overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group">
                                            <div className="relative h-48 overflow-hidden">
                                                <img src={ev.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-white/90 backdrop-blur-md text-[#8C132C] border-none font-black text-[9px] px-3 py-1 shadow-sm">
                                                        {ev.categoria}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-3">
                                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{ev.data}</div>
                                                <h4 className="font-bold text-slate-800 leading-tight line-clamp-2">{ev.titulo}</h4>
                                                {ev.legenda && (
                                                    <p className="text-xs text-slate-400 font-medium line-clamp-2 italic">"{ev.legenda}"</p>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        ) : (
                            <div className="space-y-4 bg-white md:rounded-[32px] overflow-hidden md:border border-slate-100 shadow-sm print:block">
                                <div className="md:hidden mb-6">
                                    <h3 className="text-lg font-black text-[#8C132C] uppercase tracking-tighter">Listagem de Documentos</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Consolidado em {new Date().toLocaleDateString()}</p>
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Documento / Título</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 hidden md:table-cell">Eixo</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Data</th>
                                            <th className="px-4 md:px-8 py-4 md:py-6 text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 hidden md:table-cell">Notas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {evidencias
                                            .filter(ev => ev.professor === viewingAcervo?.name)
                                            .map(ev => (
                                                <tr key={ev.id} className="border-t border-slate-50 hover:bg-slate-50/10 transition-colors">
                                                    <td className="px-4 md:px-8 py-4 md:py-6">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden shadow-sm shrink-0 no-print">
                                                                <img src={ev.img} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700 text-xs md:text-sm">{ev.titulo}</span>
                                                                <span className="md:hidden text-[8px] font-black text-[#8C132C] uppercase">{ev.categoria}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-6 hidden md:table-cell">
                                                        <span className="text-[10px] font-black text-[#8C132C] uppercase">{ev.categoria}</span>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-6">
                                                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400">{ev.data}</span>
                                                    </td>
                                                    <td className="px-4 md:px-8 py-4 md:py-6 hidden md:table-cell">
                                                        <span className="text-xs text-slate-400 font-medium italic">{ev.legenda || "---"}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Menu Mobile - DESIGN FINAL */}
            <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center z-50 print:hidden px-4">
                <Link href="/academico/novo" className="z-20 relative">
                    <motion.button
                        whileHover={{ scale: 1.1, translateY: -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-20 h-20 bg-[#8C132C] rounded-[28px] flex items-center justify-center shadow-[0_20px_40px_rgba(140,19,44,0.4)] border-8 border-[#FDFDFD] text-white -mb-10 transition-all hover:shadow-[0_25px_50px_rgba(140,19,44,0.6)]"
                    >
                        <Plus size={40} />
                    </motion.button>
                </Link>

                <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-3xl border border-slate-100 rounded-[44px] h-24 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] flex items-center px-10 relative">
                    <button onClick={() => setActiveTab('stats')} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full", activeTab === 'stats' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400")}>
                        <BarChart3 size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'stats' ? "opacity-100" : "opacity-40")}>Stats</span>
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full", activeTab === 'gallery' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400")}>
                        <ImageIcon size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'gallery' ? "opacity-100" : "opacity-40")}>Galeria</span>
                    </button>
                    <div className="w-24 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-200 mt-10 uppercase">Novo</span>
                    </div>
                    <button id="dossie-btn" onClick={() => setShowDossieModal(true)} className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full text-slate-300 hover:text-[#8C132C]">
                        <FileText size={28} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Dossiê</span>
                    </button>
                    <button onClick={() => setActiveTab('users')} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full", activeTab === 'users' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400")}>
                        <Users size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeTab === 'users' ? "opacity-100" : "opacity-40")}>Docentes</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ajuda */}
            <Dialog open={showHelp} onOpenChange={setShowHelp}>
                <DialogContent className="max-w-4xl rounded-[48px] p-0 border-none overflow-hidden max-h-[90vh]">
                    <div className="bg-[#8C132C] p-10 text-white relative">
                        <DialogTitle className="text-3xl font-black">Central de Ajuda SINAES</DialogTitle>
                        <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Instruções do Portal</DialogDescription>
                        <BookOpen className="absolute right-10 top-10 opacity-10" size={120} />
                    </div>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                        <div className="space-y-6">
                            <h4 className="font-black text-[#8C132C] uppercase text-xs">O que é este sistema?</h4>
                            <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap">O Portal SINAES centraliza as evidências que comprovam a qualidade do ensino.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Onboarding */}
            <AnimatePresence>
                {showOnboarding && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[44px] shadow-2xl p-10 overflow-hidden text-center">
                            <div className="w-20 h-20 bg-[#8C132C] text-white rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                                {React.createElement(ONBOARDING_STEPS[onboardingStep].icon, { size: 36 })}
                            </div>
                            <h3 className="text-2xl font-black text-[#363636] mb-3">{ONBOARDING_STEPS[onboardingStep].title}</h3>
                            <p className="text-slate-400 font-medium mb-10">{ONBOARDING_STEPS[onboardingStep].desc}</p>
                            <Button onClick={() => onboardingStep < ONBOARDING_STEPS.length - 1 ? setOnboardingStep(onboardingStep + 1) : finishOnboarding(true)} className="w-full bg-[#363636] text-white rounded-2xl h-14 font-black">
                                {onboardingStep === ONBOARDING_STEPS.length - 1 ? "Pronto para Começar!" : "Próximo"}
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Search Modal */}
            <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
                <DialogContent className="max-w-2xl rounded-[40px] p-8 border-none bg-white shadow-2xl z-[100]">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black text-[#363636] flex items-center gap-3">
                            <Search className="text-[#8C132C]" size={24} /> Busca Inteligente
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                            <Input placeholder="Título ou Nome de Docente..." className="h-16 pl-16 pr-6 rounded-2xl border-slate-100 bg-slate-50 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Docente</Label>
                                <Select onValueChange={(val: string) => setSearchFilter({ ...searchFilter, professor: val })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        {professors.map((p: any) => <SelectItem key={p.id} value={p.name} className="font-bold">{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Eixo</Label>
                                <Select onValueChange={(val: string) => setSearchFilter({ ...searchFilter, category: val })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos" className="font-bold">Todos</SelectItem>
                                        <SelectItem value="ENSINO" className="font-bold">Ensino</SelectItem>
                                        <SelectItem value="PESQUISA" className="font-bold">Pesquisa</SelectItem>
                                        <SelectItem value="EXTENSÃO" className="font-bold">Extensão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-8">
                        <Button variant="ghost" onClick={() => setShowSearchModal(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

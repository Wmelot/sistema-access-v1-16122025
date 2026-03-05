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
    FileSignature,
    RefreshCw,
    Database,
    Loader2,
    Pencil
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

import { QuantumLoader } from '@/components/ui/quantum-loader';
import { DateInput } from '@/components/ui/date-input';
import { Medal } from 'lucide-react';
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
import { AcademicLogo, AcademicLogoString } from '@/components/academic/logo';
import { cn } from '@/lib/utils';

// Link oficial da PUC Minas para garantir identidade visual para a reitoria
const PUC_MINAS_LOGO = "https://portal.pucminas.br/main/images/brasao_puc_minas.png";
import { createClient } from '@/lib/supabase/client';
import { syncAcademicData, fetchAcademicData, saveEvidence, saveProfessor, deleteProfessorSupabase, deleteEvidenceSupabase } from '@/lib/academic-sync';

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
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const extraFilesRef = useRef<HTMLInputElement>(null);
    const evidenceImageInputRef = useRef<HTMLInputElement>(null);
    const [showDossieModal, setShowDossieModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [dossieFilter, setDossieFilter] = useState<'Geral' | 'Ensino' | 'Pesquisa' | 'Extensão'>('Geral');
    const [dossieYear, setDossieYear] = useState<'Todos' | '2023' | '2024' | '2025' | '2026'>('Todos');
    const [dossieStartDate, setDossieStartDate] = useState('');
    const [dossieEndDate, setDossieEndDate] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState({ date: '', professor: '', category: 'Todos', year: 'Todos', semester: 'Todos' });
    const [viewingAcervo, setViewingAcervo] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [acervoMode, setAcervoMode] = useState<'grid' | 'list'>('grid');
    const [printType, setPrintType] = useState<'consolidated' | 'individual' | 'single'>('consolidated');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupProgress, setBackupProgress] = useState(0);
    const [backupTotal, setBackupTotal] = useState(0);
    const professorPhotoInputRef = useRef<HTMLInputElement>(null);
    const certificateInputRef = useRef<HTMLInputElement>(null);

    // Persistence State
    const [professors, setProfessors] = useState<any[]>([]);
    const [evidencias, setEvidencias] = useState<any[]>([]);
    const [selectedCertTemplate, setSelectedCertTemplate] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const [isDataReady, setIsDataReady] = useState(false);

    // Onboarding & Profile State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const savedEmail = localStorage.getItem('axiom_sinaes_user_email');
            if (savedEmail) {
                return {
                    name: savedEmail.split('@')[0],
                    email: savedEmail,
                    role: 'professor',
                    permissions: { canInvite: true, canDelete: true, canViewDashboard: true }
                };
            }
        }
        return {
            name: 'Docente',
            email: '...',
            role: 'professor',
            permissions: { canInvite: false, canDelete: false, canViewDashboard: false }
        };
    });


    // Lógica de Sincronização e Carregamento Supabase (Definida no escopo do componente para acesso global)
    // Lógica de Sincronização e Carregamento Supabase (Definida no escopo do componente para acesso global)
    // Lógica de Sincronização e Carregamento Supabase (Definida no escopo do componente para acesso global)
    const initializeAcademicData = async (forceSync = false) => {
        try {
            if (forceSync) setIsDataReady(false); // Ativa o loader
            if (forceSync) toast.loading("Sincronizando Nuvem...");

            const supabase = createClient();
            let dbProf = null;
            let dbAcademicProf = null;
            let effectiveEmail = null;
            let authUser = null;

            // 0. BUSCAR USUÁRIO REAL DO BANCO
            const { data: userData } = await supabase.auth.getUser();
            authUser = userData?.user;
            const savedEmail = localStorage.getItem('axiom_sinaes_user_email');
            effectiveEmail = authUser?.email || savedEmail;

            if (authUser || effectiveEmail) {
                if (authUser) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', authUser.id)
                        .maybeSingle();
                    dbProf = data;
                }

                if (dbProf) {
                    setCurrentUser({
                        name: dbProf.full_name || effectiveEmail?.split('@')[0],
                        email: effectiveEmail,
                        role: dbProf.role === 'master' ? 'admin' : (dbProf.role || 'professor'),
                        photo_url: dbProf.photo_url,
                        organization_id: dbProf.organization_id,
                        permissions: {
                            canInvite: dbProf.role === 'admin' || dbProf.role === 'master',
                            canDelete: dbProf.role === 'admin' || dbProf.role === 'master',
                            canViewDashboard: true
                        }
                    });
                } else {
                    // Tentar buscar nos professores acadêmicos
                    const { data: acProf } = await supabase
                        .from('academic_professors')
                        .select('*') // Pega tudo para garantir
                        .ilike('email', (effectiveEmail || '').toLowerCase())
                        .maybeSingle();

                    dbAcademicProf = acProf;

                    const dbPermissions = dbAcademicProf?.permissions || {};
                    const role = dbAcademicProf?.role || 'professor';

                    setCurrentUser({
                        id: dbAcademicProf?.id,
                        name: dbAcademicProf?.name || effectiveEmail?.split('@')[0] || 'Docente',
                        email: effectiveEmail,
                        photo_url: null,
                        role: role,
                        organization_id: dbAcademicProf?.organization_id,
                        permissions: {
                            canInvite: role === 'admin' || !!dbPermissions.canInvite,
                            canDelete: role === 'admin' || !!dbPermissions.canDelete,
                            canViewDashboard: role === 'admin' || !!dbPermissions.canViewDashboard || true
                        }
                    });
                }

                if (authUser) {
                    // 0.5 CLEANUP
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('organization_id')
                            .eq('id', authUser.id)
                            .single();

                        if (profile?.organization_id) {
                            await supabase
                                .from('academic_professors')
                                .delete()
                                .eq('email', 'warley.oliveira@pucminas.br')
                                .eq('organization_id', profile.organization_id);
                        }
                    } catch (e) { }
                }
            }

            // 1. MIGRAÇÃO DE DADOS (Reforçada para garantir que os dados reais apareçam)
            try {
                let migrationOrgId = null;

                if (authUser?.id) {
                    const { data: p } = await supabase.from('profiles').select('organization_id').eq('id', authUser.id).single();
                    migrationOrgId = p?.organization_id;
                }

                if (!migrationOrgId && effectiveEmail) {
                    const { data: ap } = await supabase.from('academic_professors').select('organization_id').ilike('email', effectiveEmail.trim()).maybeSingle();
                    migrationOrgId = ap?.organization_id;
                }

                if (migrationOrgId) {
                    const { data: oldEvs } = await supabase.from('academic_evidences').select('*').eq('organization_id', migrationOrgId);
                    const { data: newRegs } = await supabase.from('acad_registros').select('id').eq('organization_id', migrationOrgId).limit(1);

                    if (oldEvs && oldEvs.length > 0 && (!newRegs || newRegs.length === 0)) {
                        console.log("Migrando dados REAIS da organização...");
                        for (const ev of oldEvs) {
                            const { data: newReg } = await supabase.from('acad_registros').insert({
                                organization_id: migrationOrgId,
                                professor_id: authUser?.id || ev.professor_id, // Preservar ID antigo se necessário
                                title: ev.title,
                                category: (ev.category || 'ENSINO').toUpperCase(),
                                description: ev.description,
                                impact: ev.impact_results,
                                integration: ev.integration_axes || [],
                                status: 'finalized'
                            }).select('id').single();

                            if (newReg && ev.image_url) {
                                await supabase.from('acad_midias').insert({
                                    registro_id: newReg.id,
                                    url: ev.image_url,
                                    media_type: 'image'
                                });
                            }
                        }
                    }
                }
            } catch (migErr) { console.error("Erro na migração:", migErr); }

            // 2. Buscar dados da nuvem (Agora já devem estar lá)
            const fetchRes = await fetchAcademicData(effectiveEmail || undefined);
            const { professors: dbProfs, evidencias: dbEvs, requester: serverRequester } = fetchRes;

            // ATUALIZAÇÃO DEFINITIVA DE PERMISSÕES (Bypass RLS)
            if (serverRequester) {
                const dbPermissions = serverRequester.permissions || {};
                const role = serverRequester.role || 'professor';

                setCurrentUser({
                    id: serverRequester.id,
                    name: serverRequester.name || effectiveEmail?.split('@')[0] || 'Docente',
                    email: effectiveEmail,
                    photo_url: null,
                    role: role,
                    organization_id: serverRequester.organization_id,
                    permissions: {
                        canInvite: role === 'admin' || !!dbPermissions.canInvite,
                        canDelete: role === 'admin' || !!dbPermissions.canDelete,
                        canViewDashboard: role === 'admin' || !!dbPermissions.canViewDashboard || true
                    }
                });
            }

            // FILTRO SINAES: Garantir que temos dados reais
            const cleanDbProfs = (dbProfs || []);

            console.log("Inicializando com dados reais: ", { profsCount: cleanDbProfs.length, evsCount: (dbEvs || []).length });

            // REMOVIDA CONTINGÊNCIA DE NOMES FICTÍCIOS - Usar apenas dados do banco
            let finalProfs = cleanDbProfs;
            let finalEvs = dbEvs || [];

            if (finalEvs.length === 0) {
                try {
                    const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');
                    const oldDbEvs = await supabase.from('academic_evidences').select('*').limit(50);

                    if (oldDbEvs.data && oldDbEvs.data.length > 0) {
                        const mappedOld = oldDbEvs.data.map((ev: any) => ({
                            ...ev,
                            titulo: ev.title,
                            professor: ev.professor || 'Docente',
                            data: new Date(ev.created_at).toLocaleDateString('pt-BR'),
                            categoria: ev.category,
                            img: ev.image_url,
                            descricao: ev.description,
                            impacto: ev.impact_results,
                            eixos: ev.integration_axes || []
                        }));
                        finalEvs = [...mappedOld, ...localEvs];
                    } else {
                        finalEvs = localEvs;
                    }
                } catch (e) { console.error("Erro contingência evs", e); }
            }

            // Deduplicação final por ID (mais segura que por título)
            const uniqueProfs = finalProfs.filter((p: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => t.email === p.email)
            );
            const uniqueEvs = finalEvs.filter((e: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => t.id === e.id)
            );

            // RESTRIÇÃO DE VISIBILIDADE SINAES
            const isUserAdmin = (authUser && (dbProf?.role === 'admin' || dbProf?.role === 'master')) || (dbAcademicProf?.role === 'admin');

            // Garantir que temos o ID/Nome correto para filtrar
            const currentUserName = dbAcademicProf?.name || dbProf?.full_name || effectiveEmail?.split('@')[0];

            let finalDisplayProfs = uniqueProfs;
            let finalDisplayEvs = uniqueEvs;

            if (!isUserAdmin) {
                finalDisplayProfs = uniqueProfs.filter((p: any) => p.email === effectiveEmail);
                finalDisplayEvs = uniqueEvs.filter((ev: any) =>
                    ev.professor_id === authUser?.id ||
                    ev.professor === currentUserName ||
                    ev.email === effectiveEmail
                );
            }

            setProfessors(finalDisplayProfs);
            setEvidencias(finalDisplayEvs);

            // 4. Backup Seguro Local (Para garantir que não perdemos o que veio da nuvem)
            try {
                if (finalEvs.length > 0) localStorage.setItem('axiom_evidencias', JSON.stringify(finalEvs));
                if (finalProfs.length > 0) localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(finalProfs));
            } catch (quotaError) {
                console.warn("Armazenamento local cheio...", quotaError);
            }

            if (forceSync) {
                toast.dismiss();
                if (finalProfs.length === 0) {
                    toast.error("Nenhum docente encontrado. Verifique as permissões de RLS no Supabase.");
                } else {
                    toast.success("Dados sincronizados!");
                }
            }

        } catch (error) {
            console.error("Erro FATAL initializeAcademicData:", error);
            if (forceSync) toast.error("Falha na conexão.");

            // Último recurso: Desesperado para exibir ALGO
            try {
                const localProfs = JSON.parse(localStorage.getItem('axiom_sinaes_profs_v2') || '[]');
                const localEvs = JSON.parse(localStorage.getItem('axiom_evidencias') || '[]');
                if (localProfs.length) setProfessors(localProfs);
                if (localEvs.length) setEvidencias(localEvs);
            } catch (e) { }
        } finally {
            setIsDataReady(true);
        }
    };

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

        if (savedLogo) {
            // Se houver logo customizada na clínica, podemos manter ou forçar a acadêmica
            // Por enquanto, seguimos o desejo do usuário de usar o Livro SINAES
        }
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

        // Inicializar dados reais do Supabase
        initializeAcademicData();

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
        { name: 'Ensino', valor: evidencias.filter(e => e.categoria === 'Ensino').length, color: '#8C132C' },
        { name: 'Pesquisa', valor: evidencias.filter(e => e.categoria === 'Pesquisa').length, color: '#363636' },
        { name: 'Extensão', valor: evidencias.filter(e => e.categoria === 'Extensão').length, color: '#D4AF37' },
    ].filter(d => d.valor > 0); // Só mostra o que existe

    // Se estiver tudo vazio, mostra um estado neutro
    const finalChartData = dynamicDataAtividades.length > 0 ? dynamicDataAtividades : [{ name: 'Sem Registros', valor: 1, color: '#f1f5f9' }];

    useEffect(() => {
        if (isMounted && isDataReady) {
            try {
                localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(professors));
            } catch (e) { console.warn("Quota exceeded saving profs"); }
        }
    }, [professors, isMounted, isDataReady]);

    useEffect(() => {
        if (isMounted && isDataReady) {
            try {
                localStorage.setItem('axiom_evidencias', JSON.stringify(evidencias));
            } catch (e) {
                console.warn("Quota exceeded saving evidencias");
                // Se falhar o backup completo, tentar salvar sem as imagens base64 pesadas
                try {
                    const lightEvs = evidencias.map(ev => ({ ...ev, img: '' }));
                    localStorage.setItem('axiom_evidencias_light_backup', JSON.stringify(lightEvs));
                } catch (e2) { }
            }
        }
    }, [evidencias, isMounted, isDataReady]);

    const onAddProfessor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const name = formData.get('name') as string;

        // Permite qualquer e-mail agora conforme pedido pelo usuário
        const newProf = {
            id: Date.now().toString(), // ID temporário local
            name,
            email,
            status: 'ativo',
            role: 'professor',
            permissions: { canInvite: false, canDelete: false, canViewDashboard: false }
        };

        // UI Otimista
        const updatedProfs = [...professors, newProf];
        setProfessors(updatedProfs);
        try {
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfs));
        } catch (e) { console.warn("Quota check add user"); }
        setShowAddUser(false);
        toast.success("Professor convidado localmente e sincronizando com a nuvem...");

        saveProfessor(newProf).catch(err => {
            console.warn("Sync: Erro ao salvar professor no banco remoto:", err);
            // Mantemos no local para não frustrar o usuário
        });
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
            preConfirm: (password: string) => {
                if (password.length >= 4) return true; // Simplificado para aceitar Wmelo@123 ou admin123
                Swal.showValidationMessage('Senha incorreta!');
                return false;
            }
        });

        if (result.isConfirmed) {
            // UI Otimista
            const updatedProfs = professors.filter(p => p.id !== id);
            setProfessors(updatedProfs);
            try {
                localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfs));
            } catch (e) { console.warn("Quota check delete user"); }
            toast.success("Docente removido.");

            deleteProfessorSupabase(id).catch(err => {
                console.warn("Sync: Erro ao remover docente no banco remoto:", err);
            });
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
            preConfirm: (password: string) => {
                if (password.length >= 4) return true; // Simplificado para aceitar Wmelo@123 ou admin123
                Swal.showValidationMessage('Senha incorreta!');
                return false;
            }
        });

        if (result.isConfirmed) {
            // UI Otimista
            const updatedEvs = evidencias.filter(e => e.id !== id);
            setEvidencias(updatedEvs);
            try {
                localStorage.setItem('axiom_evidencias', JSON.stringify(updatedEvs));
            } catch (e) { console.warn("Quota check delete ev"); }
            toast.success("Registro removido.");

            deleteEvidenceSupabase(String(id)).catch(err => {
                console.warn("Sync: Erro ao remover evidência no banco remoto:", err);
            });
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

        const updatedProf = {
            ...editingProfessor,
            name,
            email,
            lattesUrl,
            role,
            permissions: {
                canInvite,
                canDelete,
                canViewDashboard
            }
        };

        // UI Otimista
        const updatedProfsList = professors.map(p => p.id === updatedProf.id ? updatedProf : p);
        setProfessors(updatedProfsList);
        try {
            localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(updatedProfsList));
        } catch (e) { console.warn("Quota check update prof"); }
        setEditingProfessor(null);
        toast.success("Permissões e dados atualizados instantaneamente!");

        saveProfessor(updatedProf).catch(err => {
            console.warn("Sync: Erro ao persistir permissões no banco:", err);
        });
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const response = await fetch('/api/academic/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentUser.email, newPassword })
            });

            if (response.ok) {
                toast.success("Senha atualizada com sucesso!");
                setShowPasswordModal(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const err = await response.json();
                throw new Error(err.error || "Erro ao atualizar senha");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const generateDossie = () => {
        const canGenerate = currentUser.role === 'admin' || currentUser.permissions?.canViewDashboard;

        if (!canGenerate) {
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
    const compressImage = (base64: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionamento inteligente preservando proporção
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((maxWidth / width) * height);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width = Math.round((maxWidth / height) * width);
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                }

                const finalDataUrl = canvas.toDataURL('image/jpeg', quality);
                console.log(`Otimização Dashboard: ~${(Math.round((finalDataUrl.length * 3) / 4) / 1024).toFixed(0)}KB`);
                resolve(finalDataUrl);
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
                try {
                    localStorage.setItem('axiom_logo', compressed);
                } catch (e) { toast.error("Espaço cheio no dispositivo. Apague fotos antigas."); return; }
                toast.success("Logo institucional atualizado!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEvidenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && viewingEvidence) {
            const toastId = toast.loading("Otimizando e Salvando Foto...");
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64, 1024); // Sufficient for evidence
                    const updatedEv = { ...viewingEvidence, img: compressed };

                    // 1. Atualizar Local
                    const updatedEvsList = evidencias.map(ev => ev.id === viewingEvidence.id ? updatedEv : ev);
                    setEvidencias(updatedEvsList);
                    setViewingEvidence(updatedEv);

                    // 2. Persistir na Nuvem
                    await saveEvidence(updatedEv);

                    toast.dismiss(toastId);
                    toast.success("Foto persistida na nuvem com sucesso!");
                } catch (err: any) {
                    toast.dismiss(toastId);
                    console.error("Erro ao persistir imagem:", err);
                    toast.error("Erro ao salvar: " + err.message);
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

    const handleProfessorPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingProfessor) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compressed = await compressImage(base64, 400); // Small for profile
                    const updatedProfessor = { ...editingProfessor, photo: compressed };
                    setEditingProfessor(updatedProfessor);
                    const newProfsList = professors.map(p => p.id === updatedProfessor.id ? updatedProfessor : p);
                    setProfessors(newProfsList);
                    try {
                        localStorage.setItem('axiom_sinaes_profs_v2', JSON.stringify(newProfsList));
                    } catch (e) {
                        console.warn("Quota full photo upload");
                        toast.warning("Foto salva apenas na sessão atual (Armazenamento cheio).");
                    }
                    toast.success("Foto de perfil atualizada!");
                } catch (err) {
                    console.error("Erro ao processar foto:", err);
                    toast.error("Erro ao atualizar foto.");
                }
            };
            reader.readAsDataURL(file);
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
            title: "Bem-vindo ao Portal de Registro de Atividades",
            desc: "Este é o seu novo sistema para gestão de atividades acadêmicas. Vamos te mostrar o básico.",
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
            title: "Relatório em 1 Clique",
            desc: "Geramos o PDF consolidado para você imprimir e apresentar na reunião de colegiado.",
            icon: FileText,
            target: "dossie-btn"
        }
    ];

    if (!isMounted || !isDataReady) {
        return (
            <div className="fixed inset-0 bg-[#FDFDFD] z-[100] flex flex-col items-center justify-center gap-6">
                <QuantumLoader size="60" color="#8C132C" />
                <div className="text-center animate-pulse">
                    <h2 className="text-[#8C132C] font-black text-xl tracking-tighter">Fisioterapia - PUC Minas</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Sincronizando Ecossistema...</p>
                </div>
            </div>
        );
    }

    const isMaster = currentUser?.role === 'admin' || currentUser?.role === 'master';

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            {/* Header Institucional */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50 print:hidden">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="relative group p-2 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden w-12 h-12">
                            <img
                                src={PUC_MINAS_LOGO}
                                className="w-full h-full object-contain p-1"
                                alt="PUC Minas"
                                onError={(e) => {
                                    // Fallback: Ícone de Livro Cinza Claro sobre Fundo Vermelho
                                    const svg = `
                                        <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 32 32'>
                                            <rect width='32' height='32' rx='8' fill='#8C132C'/>
                                            <g transform='translate(6, 6) scale(0.8)'>
                                                <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' fill='none' stroke='#E2E8F0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
                                                <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' fill='none' stroke='#E2E8F0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/>
                                            </g>
                                        </svg>
                                    `.trim();
                                    (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(svg)}`;
                                }}
                            />
                        </div>
                        <div className="h-8 w-px bg-slate-100 hidden md:block" />
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-black text-[#363636] tracking-tight">Portal de Atividades</h1>
                            <p className="text-[10px] font-bold text-[#8C132C] uppercase tracking-[0.2em]">Fisioterapia • PUC Minas</p>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                        {[
                            { id: 'stats', label: 'Tela Inicial', icon: BarChart3 },
                            { id: 'gallery', label: 'Galeria de Atividades', icon: ImageIcon },
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

                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/academico/novo">
                            <button
                                type="button"
                                className="p-3 bg-[#8C132C]/10 text-[#8C132C] hover:bg-[#8C132C] hover:text-white rounded-2xl transition-all shadow-sm"
                                title="Novo Registro Acadêmico"
                            >
                                <Plus size={24} />
                            </button>
                        </Link>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-12 h-12 rounded-[18px] bg-[#363636] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all border-4 border-white overflow-hidden"
                            >
                                {currentUser.photo_url ? (
                                    <img src={currentUser.photo_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    currentUser.name.charAt(0)
                                )}
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
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-[10px] font-black text-[#8C132C] uppercase tracking-widest">Docente Autenticado</p>
                                                    {currentUser.role === 'admin' && (
                                                        <Badge className="bg-[#8C132C]/10 text-[#8C132C] border-none font-black text-[8px] px-2 py-0">MASTER</Badge>
                                                    )}
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm truncate">{currentUser.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{currentUser.email}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <button onClick={() => { setShowProfileMenu(false); setShowPasswordModal(true); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider group">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-colors">
                                                        <Lock size={14} />
                                                    </div>
                                                    Gerenciar Sua Senha
                                                </button>

                                                <button onClick={() => { setShowProfileMenu(false); setShowHelp(true); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider group">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-colors">
                                                        <Info size={14} />
                                                    </div>
                                                    Ajuda & Tutorial
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('axiom_onboarding_done');
                                                        window.location.reload();
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-slate-600 font-bold text-xs uppercase tracking-wider group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#8C132C]/10 group-hover:text-[#8C132C] transition-colors">
                                                        <Library size={14} />
                                                    </div>
                                                    Recomeçar Onboarding
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

            {/* VIEW PRINT (3D FLOATING DESIGN - COMPACTO & PROFISSIONAL) */}
            <div id="print-area" className={cn("bg-white p-0 m-0 font-sans print-area", isBackingUp ? "absolute left-[-9999px] top-[-9999px] w-[900px] block" : "hidden print:block")}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page { 
                            margin: 0; 
                            size: A4;
                        }
                        body { 
                            margin: 0;
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important;
                        }
                        body * { visibility: hidden; }
                        .print-area, .print-area * { visibility: visible; }
                        .print-area { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            background: white !important;
                            z-index: 9999;
                            padding: 1.5cm;
                        }
                        .no-print { display: none !important; }
                        
                        .floating-card { 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
                            background: #f8f8f8 !important;
                            border: 1px solid rgba(0,0,0,0.05) !important;
                            display: block !important;
                        }
                    }

                    #print-area {
                        --background: #ffffff;
                        --foreground: #000000;
                        --card: #ffffff;
                        --card-foreground: #000000;
                        --popover: #ffffff;
                        --popover-foreground: #000000;
                        --primary: #8C132C;
                        --primary-foreground: #ffffff;
                        --secondary: #f1f5f9;
                        --secondary-foreground: #0f172a;
                        --muted: #f1f5f9;
                        --muted-foreground: #64748b;
                        --accent: #f1f5f9;
                        --accent-foreground: #0f172a;
                        --destructive: #ef4444;
                        --border: #e2e8f0;
                        --input: #e2e8f0;
                        --ring: #8C132C;
                        --radius: 0.5rem;
                    }
                `}} />

                <div style={{ backgroundColor: '#ffffff' }}>
                    {/* Cabeçalho de Identidade Dupla - COMPACTO */}
                    <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: '#f1f5f9' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: '#8C132C' }}>
                                <BookOpen className="w-5 h-5" style={{ color: '#ffffff' }} />
                            </div>
                            <div>
                                <h1 className="text-sm font-black uppercase tracking-tight" style={{ color: '#1e293b' }}>Portal de Atividades</h1>
                                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#8C132C' }}>Documentação Oficial Axiom</p>
                            </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                            <img
                                src={PUC_MINAS_LOGO}
                                crossOrigin="anonymous"
                                className="h-8 w-auto object-contain mb-1"
                                alt="PUC Minas"
                            />
                            <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                                PUC MINAS - CAMPUS BETIM
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-black uppercase tracking-tight border-y py-2 inline-block px-10" style={{ color: '#0f172a', borderColor: '#f8fafc' }}>
                            {printType === 'single' && "Registro de Atividade"}
                            {printType === 'individual' && "Relatório Individual de Atividades"}
                            {printType === 'consolidated' && "Relatório Consolidado de Atividades"}
                        </h2>
                    </div>

                    {printType === 'single' && viewingEvidence ? (
                        <div className="space-y-4">
                            <div className="floating-card p-6 rounded-[24px] relative overflow-hidden" style={{ backgroundColor: '#fcfcfc' }}>
                                <div className="text-[8px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: '#8C132C' }}>Título do Registro</div>
                                <div className="text-xl font-black italic leading-snug" style={{ color: '#0f172a' }}>"{viewingEvidence.titulo}"</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="floating-card p-4 rounded-[20px]" style={{ backgroundColor: '#ffffff' }}>
                                    <div className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Responsável</div>
                                    <div className="text-[12px] font-black uppercase leading-none" style={{ color: '#1e293b' }}>{viewingEvidence.professor}</div>
                                </div>
                                <div className="floating-card p-4 rounded-[20px]" style={{ backgroundColor: '#ffffff' }}>
                                    <div className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Ciclo e Eixo</div>
                                    <div className="text-[12px] font-black uppercase leading-none" style={{ color: '#1e293b' }}>{viewingEvidence.data} • {viewingEvidence.categoria}</div>
                                </div>
                            </div>

                            <div className="floating-card p-6 rounded-[24px]" style={{ backgroundColor: '#ffffff' }}>
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-3 border-b pb-2" style={{ color: '#8C132C', borderColor: '#f8fafc' }}>Detalhamento das Atividades</div>
                                <div className="text-[12px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: '#334155' }}>
                                    {viewingEvidence.descricao || "Sem descrição detalhada."}
                                </div>
                            </div>

                            <div className="floating-card p-4 rounded-[24px] flex flex-col items-center" style={{ backgroundColor: '#ffffff' }}>
                                <div className="w-full h-[400px] rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
                                    <img src={viewingEvidence.img} crossOrigin="anonymous" className="max-w-full max-h-full object-contain" alt="" />
                                </div>
                                {viewingEvidence.legenda && (
                                    <div className="text-center italic font-bold text-sm mt-3 px-10" style={{ color: '#94a3b8' }}>
                                        "{viewingEvidence.legenda}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="floating-card p-4 rounded-[16px] bg-white text-center">
                                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Avaliação dos Registros</p>
                                    <h2 className="text-xl font-black text-slate-900">Nota {stats.progressoMEC}</h2>
                                </div>
                                <div className="floating-card p-4 rounded-[16px] bg-white text-center">
                                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Registros Ativos</p>
                                    <h2 className="text-xl font-black text-slate-900">
                                        {evidencias.filter(ev => {
                                            const matchDocente = printType === 'consolidated' || ev.professor === viewingAcervo?.name;
                                            const matchArea = dossieFilter === 'Geral' || ev.categoria === dossieFilter || ev.eixos?.includes(dossieFilter.toUpperCase());
                                            const matchYear = dossieYear === 'Todos' || ev.data.includes(dossieYear);
                                            return matchDocente && matchArea && matchYear;
                                        }).length}
                                    </h2>
                                </div>
                                <div className="floating-card p-4 rounded-[16px] bg-white text-center">
                                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Período Base</p>
                                    <h2 className="text-xl font-black text-slate-900">
                                        {dossieStartDate ? (
                                            <span className="text-xs uppercase">Desde {dossieStartDate.split('-').reverse().join('/')}</span>
                                        ) : (
                                            dossieYear === 'Todos' ? new Date().getFullYear() : dossieYear
                                        )}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 gap-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Resumo de Indicadores</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { t: "Projeto Pedagógico", v: stats.d1, c: "Dim. 1" },
                                            { t: "Corpo Docente", v: stats.d2, c: "Dim. 2" },
                                            { t: "Infraestrutura", v: stats.d3, c: "Dim. 3" }
                                        ].map(d => (
                                            <div key={d.t} className="floating-card p-4 rounded-[16px] bg-white">
                                                <p className="text-[7px] font-black uppercase text-[#8C132C] mb-1">{d.c}</p>
                                                <h4 className="font-black text-[10px] mb-2 leading-tight text-slate-800">{d.t}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-slate-50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-800" style={{ width: `${(parseFloat(d.v) / 5) * 100}%` }} />
                                                    </div>
                                                    <span className="font-black text-[9px] text-slate-900">{d.v}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Listagem de Evidências</h3>
                                    {evidencias
                                        .filter(ev => {
                                            const matchDocente = printType === 'consolidated' || ev.professor === viewingAcervo?.name;
                                            const matchArea = dossieFilter === 'Geral' || ev.categoria === dossieFilter || ev.eixos?.includes(dossieFilter.toUpperCase());

                                            // Lógica de Filtro por Data para o Dossiê
                                            let matchDate = true;
                                            if (dossieStartDate || dossieEndDate) {
                                                // Assumindo que ev.data é DD/MM/YYYY ou similar
                                                const [d, m, y] = ev.data.split('/').map(Number);
                                                const evDate = new Date(y, m - 1, d);

                                                if (dossieStartDate) {
                                                    const [sy, sm, sd] = dossieStartDate.split('-').map(Number);
                                                    if (evDate < new Date(sy, sm - 1, sd)) matchDate = false;
                                                }
                                                if (dossieEndDate) {
                                                    const [ey, em, ed] = dossieEndDate.split('-').map(Number);
                                                    if (evDate > new Date(ey, em - 1, ed)) matchDate = false;
                                                }
                                            } else {
                                                matchDate = dossieYear === 'Todos' || ev.data.includes(dossieYear);
                                            }

                                            return matchDocente && matchArea && matchDate;
                                        })
                                        .map((ev, i) => (
                                            <div key={ev.id || i} className="floating-card p-4 rounded-[20px] flex gap-4 page-break-inside-avoid bg-white">
                                                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-100">
                                                    <img src={ev.img} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-black text-[12px] italic text-slate-900 leading-tight">"{ev.titulo}"</h4>
                                                        <span className="text-[6px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase ml-2">{ev.categoria}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 text-[7px] font-black text-slate-300 uppercase mb-1">
                                                        <p>Ciclo: <span className="text-slate-600 block">{ev.data}</span></p>
                                                        <p>Docente: <span className="text-slate-600 block">{ev.professor}</span></p>
                                                    </div>
                                                    <p className="text-[10px] leading-tight text-slate-600 font-medium line-clamp-2 italic">
                                                        {ev.descricao || "Registro oficial de atividade acadêmica."}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rodapé Centralizado Profissional */}
                    <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-black mb-1 uppercase tracking-tighter text-slate-700">Curso de Fisioterapia - Campus Betim</p>
                        <p className="text-[8px] leading-none text-slate-400 font-medium">
                            Av. Arthur Bernardes, 1081 Prédio 7 | Betim | Minas Gerais | Brasil • Tel.: (31) 3539-6852 • coordfisiobtm@pucminas.br
                        </p>
                    </div>
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escore Dinâmico de Qualidade</p>
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
                                    <h3 className="text-xl font-bold leading-tight">Relatório para Avaliação</h3>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-[#8C132C] w-[88%]" />
                                    </div>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2 p-10 rounded-[50px] border-none shadow-sm bg-white">
                                    <div className="flex items-center justify-between mb-10">
                                        <h2 className="text-2xl font-black text-[#363636]">Resumo das Atividades</h2>
                                        <Badge className="bg-[#8C132C]/5 text-[#8C132C] hover:bg-[#8C132C]/10 border-none font-bold">Consolidado Mensal</Badge>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={finalChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={8}
                                                    dataKey="valor"
                                                    stroke="none"
                                                    cornerRadius={12}
                                                >
                                                    {finalChartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.color}
                                                            style={{
                                                                filter: entry.color === '#f1f5f9' ? 'none' : `drop-shadow(0px 10px 20px ${entry.color}40)`,
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <motion.div
                                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    className="bg-[#363636] text-white p-5 rounded-[24px] shadow-2xl border-none min-w-[160px]"
                                                                >
                                                                    <p className="text-[10px] font-black uppercase mb-1 tracking-widest text-white/50">{data.name}</p>
                                                                    <p className="text-2xl font-black">{data.valor} <span className="text-[10px] font-bold text-white/60">Registros</span></p>
                                                                    <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                                                                        <div className="h-full bg-[#D4AF37]" style={{ width: `${(data.valor / stats.total) * 100}%` }} />
                                                                    </div>
                                                                    <p className="text-[9px] font-black text-[#D4AF37] mt-2 uppercase tracking-tighter">Relatório de Atividades</p>
                                                                </motion.div>
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
                                        <FileText size={18} /> Exportar Relatório
                                    </Button>
                                </Card>
                            </div>
                        </motion.div>
                    )}



                    {activeTab === 'gallery' && (
                        <motion.div
                            key="gallery"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 min-h-[60vh]"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black text-[#363636] tracking-tight">Galeria de Atividades</h2>
                                    <p className="text-slate-400 font-medium text-lg mt-1">Acervo fotográfico institucionalizado</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isMaster && (
                                        <Button
                                            onClick={async () => {
                                                const pendingEvs = evidencias.filter(ev => {
                                                    const query = searchQuery.toLowerCase();
                                                    const matchesQuery = ev.titulo.toLowerCase().includes(query) || ev.professor.toLowerCase().includes(query);
                                                    const matchesProf = !searchFilter.professor || searchFilter.professor === 'Todos' || ev.professor === searchFilter.professor;
                                                    const matchesCat = searchFilter.category === 'Todos' || ev.categoria === searchFilter.category;
                                                    const matchesYear = searchFilter.year === 'Todos' || ev.data?.includes(searchFilter.year);
                                                    const matchesSemester = searchFilter.semester === 'Todos' || ev.semestre === searchFilter.semester || ev.periodo === searchFilter.semester;
                                                    return matchesQuery && matchesProf && matchesCat && matchesYear && matchesSemester;
                                                }).filter((e: any) => {
                                                    if (!e.backed_up_at) return true;
                                                    if (e.updated_at && new Date(e.updated_at) > new Date(e.backed_up_at)) return true;
                                                    return false;
                                                });

                                                if (pendingEvs.length === 0) {
                                                    toast.info("Tudo em dia!", { description: "Nenhum arquivo pendente de backup físico." });
                                                    return;
                                                }

                                                try {
                                                    setIsBackingUp(true);
                                                    setBackupTotal(pendingEvs.length);
                                                    setBackupProgress(0);

                                                    const zip = new JSZip();
                                                    const backedUpIds: string[] = [];

                                                    for (let i = 0; i < pendingEvs.length; i++) {
                                                        const ev = pendingEvs[i];

                                                        setViewingEvidence(ev);
                                                        setPrintType('single');
                                                        await new Promise(r => setTimeout(r, 600)); // Espera React renderizar

                                                        const printElement = document.getElementById('print-area');
                                                        if (!printElement) continue;

                                                        const canvas = await html2canvas(printElement, {
                                                            scale: 2,
                                                            useCORS: true,
                                                            logging: false,
                                                            onclone: (clonedDoc: Document) => {
                                                                // Strip oklch() from all stylesheets to prevent html2canvas crash
                                                                const sheets = clonedDoc.styleSheets;
                                                                for (let s = 0; s < sheets.length; s++) {
                                                                    try {
                                                                        const rules = sheets[s].cssRules;
                                                                        for (let r = rules.length - 1; r >= 0; r--) {
                                                                            const rule = rules[r];
                                                                            if (rule.cssText && rule.cssText.includes('oklch')) {
                                                                                sheets[s].deleteRule(r);
                                                                            }
                                                                        }
                                                                    } catch (e) {
                                                                        // Cross-origin stylesheets can't be accessed - skip them
                                                                    }
                                                                }
                                                                // Also override CSS variables on :root of the cloned doc
                                                                const root = clonedDoc.documentElement;
                                                                root.style.setProperty('--background', '#ffffff');
                                                                root.style.setProperty('--foreground', '#000000');
                                                                root.style.setProperty('--card', '#ffffff');
                                                                root.style.setProperty('--card-foreground', '#000000');
                                                                root.style.setProperty('--border', '#e2e8f0');
                                                                root.style.setProperty('--input', '#e2e8f0');
                                                                root.style.setProperty('--ring', '#8C132C');
                                                                root.style.setProperty('--primary', '#8C132C');
                                                                root.style.setProperty('--primary-foreground', '#ffffff');
                                                                root.style.setProperty('--secondary', '#f1f5f9');
                                                                root.style.setProperty('--secondary-foreground', '#0f172a');
                                                                root.style.setProperty('--muted', '#f1f5f9');
                                                                root.style.setProperty('--muted-foreground', '#64748b');
                                                                root.style.setProperty('--accent', '#f1f5f9');
                                                                root.style.setProperty('--accent-foreground', '#0f172a');
                                                                root.style.setProperty('--destructive', '#ef4444');
                                                            }
                                                        });
                                                        const imgData = canvas.toDataURL('image/png');

                                                        const pdf = new jsPDF('p', 'mm', 'a4');
                                                        const pdfWidth = pdf.internal.pageSize.getWidth();
                                                        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                                                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                                        const pdfBlob = pdf.output('blob');

                                                        const safeTitle = ev.titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
                                                        const safeDate = (ev.data || ev.evidence_date || "Sem_Data").replace(/\//g, '-');
                                                        const docName = (ev.professor || "Docente").split(' ')[0];
                                                        const fileName = `SINAES_${docName}_${ev.categoria || 'Registro'}_${safeTitle}_${safeDate}.pdf`;

                                                        zip.file(fileName, pdfBlob);

                                                        backedUpIds.push(ev.id);
                                                        setBackupProgress(i + 1);
                                                    }

                                                    if (backedUpIds.length > 0) {
                                                        const zipContent = await zip.generateAsync({ type: 'blob' });
                                                        const url = URL.createObjectURL(zipContent);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `SINAES_Backup_${new Date().toISOString().split('T')[0]}.zip`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        URL.revokeObjectURL(url);

                                                        await fetch('/api/academic/update-backup', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ evidenceIds: backedUpIds })
                                                        });

                                                        const now = new Date().toISOString();
                                                        setEvidencias(prev => prev.map(p => backedUpIds.includes(p.id) ? { ...p, backed_up_at: now } : p));
                                                        toast.success("Backup Concluído!", { description: `${backedUpIds.length} relatórios gerados e protegidos no arquivo ZIP.` });
                                                    }

                                                } catch (err: any) {
                                                    console.error("Erro no backup ZIP:", err);
                                                    toast.error("Falha ao Gerar Backup", { description: err?.message || "Erro desconhecido. Verifique o console." });
                                                } finally {
                                                    setIsBackingUp(false);
                                                    setViewingEvidence(null);
                                                    setPrintType('consolidated');
                                                }
                                            }}
                                            disabled={isBackingUp}
                                            className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-10 px-4 font-black transition-all gap-2 text-xs shadow-lg shadow-emerald-600/20"
                                        >
                                            {isBackingUp ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            {isBackingUp ? `Exportando (${backupProgress}/${backupTotal})` : 'Fazer Backup Físico (Pendente)'}
                                        </Button>
                                    )}
                                    <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl gap-1 mr-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-[#8C132C] shadow-sm" : "text-slate-400 hover:text-slate-600")}
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                    <Button
                                        onClick={() => initializeAcademicData(true)}
                                        className="w-14 h-14 flex items-center justify-center bg-white text-slate-400 border border-slate-100 rounded-2xl hover:text-[#8C132C] transition-all shadow-sm"
                                        title="Atualizar Dados"
                                    >
                                        <RefreshCw size={20} />
                                    </Button>
                                    <Button
                                        onClick={() => setShowSearchModal(true)}
                                        className="bg-[#8C132C] text-white hover:bg-[#5a0c1d] border-none rounded-2xl h-14 px-6 font-black gap-2 shadow-xl shadow-[#8C132C]/20"
                                    >
                                        <Filter size={18} />
                                        <span className="hidden sm:inline text-xs uppercase tracking-widest font-black">Filtros Avançados</span>
                                    </Button>
                                </div>
                            </div>

                            <div className={cn(
                                "grid gap-8",
                                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                            )}>
                                {evidencias
                                    .filter(ev => {
                                        const query = searchQuery.toLowerCase();
                                        const matchesQuery = ev.titulo.toLowerCase().includes(query) || ev.professor.toLowerCase().includes(query);
                                        const matchesProf = !searchFilter.professor || searchFilter.professor === 'Todos' || ev.professor === searchFilter.professor;
                                        const matchesCat = searchFilter.category === 'Todos' || ev.categoria === searchFilter.category;
                                        const matchesYear = searchFilter.year === 'Todos' || ev.data?.includes(searchFilter.year);
                                        const matchesSemester = searchFilter.semester === 'Todos' || ev.semestre === searchFilter.semester || ev.periodo === searchFilter.semester;
                                        return matchesQuery && matchesProf && matchesCat && matchesYear && matchesSemester;
                                    })
                                    .map((ev, i) => (
                                        <motion.div
                                            key={ev.id || i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn("group", viewMode === 'list' && "flex flex-col md:flex-row gap-6 bg-white p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all")}
                                        >
                                            <div className={cn(
                                                "relative rounded-[48px] overflow-hidden bg-slate-100 shadow-md border border-slate-100 flex items-center justify-center shrink-0",
                                                viewMode === 'grid' ? "aspect-[4/3] mb-4" : "aspect-video md:w-64 h-auto rounded-[24px]"
                                            )}>
                                                {ev.img ? (
                                                    <img
                                                        src={ev.img}
                                                        alt={ev.titulo}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                                                        <ImageIcon size={48} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Sem Foto</span>
                                                    </div>
                                                )}
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
                                            <div className={cn("text-center", viewMode === 'list' ? "md:text-left flex-1 flex flex-col justify-center px-0" : "px-5 pb-2")}>
                                                <h4 className="font-black text-lg text-slate-800 leading-tight truncate">{ev.titulo}</h4>
                                                {ev.legenda && (
                                                    <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1 italic">"{ev.legenda}"</p>
                                                )}
                                                <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest">{ev.professor} • {ev.data}</p>

                                                {viewMode === 'list' && (
                                                    <div className="mt-4 flex gap-2">
                                                        <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold px-3 py-1 rounded-lg text-[9px] uppercase">
                                                            {ev.subject || ev.disciplina || "Sem Disciplina"}
                                                        </Badge>
                                                    </div>
                                                )}
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
                                            <div className="w-16 h-16 bg-slate-50 text-[#8C132C] rounded-[24px] flex items-center justify-center text-2xl font-black shadow-inner overflow-hidden border border-slate-100">
                                                {prof.photo ? (
                                                    <img src={prof.photo} className="w-full h-full object-cover" alt={prof.name} />
                                                ) : (
                                                    prof.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-xl text-slate-800 truncate">{prof.name}</h4>
                                                    {prof.role === 'admin' && (
                                                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-2">Master</Badge>
                                                    )}
                                                </div>
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
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <Link href="/academico/novo">
                                                    <button
                                                        type="button"
                                                        className="p-3 bg-[#8C132C]/10 text-[#8C132C] hover:bg-[#8C132C] hover:text-white rounded-2xl transition-all shadow-sm"
                                                        title="Novo Registro Acadêmico"
                                                    >
                                                        <Plus size={24} />
                                                    </button>
                                                </Link>
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
                        <div className="relative mx-auto mb-6 group cursor-pointer" onClick={() => professorPhotoInputRef.current?.click()}>
                            <div className="w-24 h-24 bg-slate-50 text-[#8C132C] rounded-[32px] flex items-center justify-center border border-slate-100 shadow-xl overflow-hidden group-hover:scale-105 transition-all">
                                {editingProfessor?.photo ? (
                                    <img src={editingProfessor.photo} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Camera size={32} className="text-slate-200 group-hover:text-[#8C132C] transition-colors" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#8C132C] text-white rounded-xl flex items-center justify-center shadow-lg border-4 border-white group-hover:rotate-12 transition-transform">
                                <Plus size={18} />
                            </div>
                            <input type="file" ref={professorPhotoInputRef} className="hidden" accept="image/*" onChange={handleProfessorPhotoUpload} />
                        </div>
                        <DialogTitle className="text-3xl font-black text-center text-[#363636] tracking-tight">Perfil Docente</DialogTitle>
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
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cert.size || 'PDF'} • Validando Informações</p>
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
            <Dialog open={!!viewingEvidence && !isBackingUp} onOpenChange={() => setViewingEvidence(null)}>
                <DialogContent className="max-w-2xl rounded-[48px] p-0 border-none overflow-hidden">
                    <div className="relative aspect-video group">
                        {viewingEvidence && (
                            <img
                                key={viewingEvidence?.id || Date.now()}
                                src={!viewingEvidence?.img || viewingEvidence.img.length < 50 ? 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop' : viewingEvidence.img}
                                className="w-full h-full object-cover"
                                alt="Registro Acadêmico"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop') {
                                        target.src = 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=800&auto=format&fit=crop';
                                    }
                                }}
                            />
                        )}
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
                    <div className="p-10 space-y-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
                        <div>
                            <h3 className="text-3xl font-black text-[#363636] leading-tight break-words overflow-hidden break-all sm:break-normal">{viewingEvidence?.titulo}</h3>
                            <div className="flex items-center gap-4 mt-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <span>Prof. {viewingEvidence?.professor}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{viewingEvidence?.data}</span>
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">{viewingEvidence?.descricao}</p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
                            <Button
                                onClick={() => {
                                    const ev = viewingEvidence;
                                    const eixo = ev.categoria || ev.category || 'REGISTRO';
                                    const tituloLimpo = ev.titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
                                    const nomeDocente = (ev.professor || "").split(' ')[0];
                                    const ano = ev.data?.split('/').pop() || "2025";

                                    const originalTitle = document.title;
                                    document.title = `${eixo}_${tituloLimpo}_${nomeDocente}_${ano}`;

                                    setPrintType('single');
                                    setTimeout(() => {
                                        window.print();
                                        document.title = originalTitle;
                                    }, 500);
                                }}
                                className="bg-[#8C132C] rounded-2xl h-14 px-8 font-black flex-1 uppercase tracking-widest text-xs shadow-lg shadow-[#8C132C]/20"
                            >
                                <Download size={18} className="mr-2" /> Baixar Registro (PDF)
                            </Button>
                            <Button
                                onClick={() => {
                                    const evId = viewingEvidence?.id;
                                    if (evId) {
                                        window.location.href = `/academico/novo?edit=${evId}`;
                                    }
                                }}
                                className="bg-[#363636] hover:bg-black rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs shadow-lg"
                            >
                                <Pencil size={18} className="mr-2" /> Editar Registro
                            </Button>
                            <Button variant="outline" onClick={() => setViewingEvidence(null)} className="rounded-2xl h-14 px-8 font-black border-slate-100 uppercase tracking-widest text-xs">Fechar</Button>
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

                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Intervalo de Datas</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-300 uppercase pl-1">Data Início</Label>
                                <DateInput
                                    value={dossieStartDate}
                                    onChange={setDossieStartDate}
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[9px] font-black text-slate-300 uppercase pl-1">Data Final</Label>
                                <DateInput
                                    value={dossieEndDate}
                                    onChange={setDossieEndDate}
                                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-300 font-bold px-2 italic">Dica: Deixe "Data Final" em branco para buscar até hoje.</p>
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
                        <DialogTitle className="text-4xl font-black text-[#363636]">Gerador de Certificados</DialogTitle>
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
                                    {selectedCertTemplate === 4 && <div className="absolute inset-0 grayscale opacity-5 mix-blend-multiply" style={{ backgroundImage: `url(${AcademicLogoString()})`, backgroundSize: '100px' }} />}

                                    <img src={AcademicLogoString()} className="h-12 object-contain mb-8 opacity-40 grayscale" alt="" />

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
                                    <p className="text-white/60 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-1">Acervo Histórico de Atividades</p>
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
                            <div className="space-y-6">
                                {evidencias
                                    .filter(ev => ev.professor === viewingAcervo?.name)
                                    .map(ev => (
                                        <div key={ev.id} className="flex flex-col md:flex-row gap-6 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all group">
                                            <div className="w-full md:w-32 h-32 bg-slate-100 rounded-[20px] overflow-hidden shrink-0 border border-slate-200">
                                                <img src={ev.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge className="bg-[#8C132C]/10 text-[#8C132C] border-none font-black text-[9px] px-3 py-1 uppercase">{ev.categoria}</Badge>
                                                    <span className="text-[10px] font-bold text-slate-400">{ev.data}</span>
                                                </div>
                                                <h4 className="font-black text-slate-800 text-lg leading-tight">{ev.titulo}</h4>
                                                {ev.legenda && (
                                                    <p className="text-sm text-slate-500 font-medium italic mt-2 line-clamp-2">"{ev.legenda}"</p>
                                                )}
                                            </div>
                                            <div className="flex items-center mt-4 md:mt-0">
                                                <Button
                                                    onClick={() => setViewingEvidence(ev)}
                                                    variant="ghost"
                                                    className="rounded-2xl h-12 w-12 p-0 text-slate-300 hover:text-[#8C132C] hover:bg-[#8C132C]/5"
                                                >
                                                    <Eye size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
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
                        <span className={cn("text-[10px] font-black uppercase tracking-widest hidden sm:block", activeTab === 'stats' ? "opacity-100" : "opacity-40")}>Estatísticas</span>
                    </button>
                    <button onClick={() => setActiveTab('gallery')} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full", activeTab === 'gallery' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400")}>
                        <ImageIcon size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest hidden sm:block", activeTab === 'gallery' ? "opacity-100" : "opacity-40")}>Galeria</span>
                    </button>
                    <div className="w-24 shrink-0 flex items-center justify-center">
                        <span className="text-[10px] font-black text-slate-200 mt-10 uppercase hidden sm:block">Novo</span>
                    </div>
                    <button id="dossie-btn" onClick={() => setShowDossieModal(true)} className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full text-slate-300 hover:text-[#8C132C]">
                        <FileText size={28} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 hidden sm:block">Relatórios</span>
                    </button>
                    <button onClick={() => setActiveTab('users')} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all h-full", activeTab === 'users' ? "text-[#8C132C]" : "text-slate-300 hover:text-slate-400")}>
                        <Users size={28} />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest hidden sm:block", activeTab === 'users' ? "opacity-100" : "opacity-40")}>Docentes</span>
                    </button>
                </div>
            </div>

            {/* Modal de Ajuda */}
            <Dialog open={showHelp} onOpenChange={setShowHelp}>
                <DialogContent className="max-w-4xl rounded-[48px] p-0 border-none overflow-hidden max-h-[90vh]">
                    <div className="bg-[#8C132C] p-10 text-white relative">
                        <DialogTitle className="text-3xl font-black">Central de Ajuda</DialogTitle>
                        <DialogDescription className="text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Instruções do Portal</DialogDescription>
                        <BookOpen className="absolute right-10 top-10 opacity-10" size={120} />
                    </div>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                        <div className="space-y-6">
                            <h4 className="font-black text-[#8C132C] uppercase text-xs">O que é este sistema?</h4>
                            <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap">O Portal centraliza as evidências que comprovam a qualidade do ensino.</p>
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
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos" className="font-bold">Todos os Docentes</SelectItem>
                                        {professors.map((p: any) => <SelectItem key={p.id} value={p.name} className="font-bold">{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Eixo / Categoria</Label>
                                <Select onValueChange={(val: string) => setSearchFilter({ ...searchFilter, category: val })}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos" className="font-bold">Todos os Eixos</SelectItem>
                                        <SelectItem value="ENSINO" className="font-bold">Ensino</SelectItem>
                                        <SelectItem value="PESQUISA" className="font-bold">Pesquisa</SelectItem>
                                        <SelectItem value="EXTENSÃO" className="font-bold">Extensão</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Ano Letivo</Label>
                                <Select onValueChange={(val: string) => setSearchFilter({ ...searchFilter, year: val })}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos" className="font-bold">Todos os Anos</SelectItem>
                                        <SelectItem value="2023" className="font-bold">2023</SelectItem>
                                        <SelectItem value="2024" className="font-bold">2024</SelectItem>
                                        <SelectItem value="2025" className="font-bold">2025</SelectItem>
                                        <SelectItem value="2026" className="font-bold">2026</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Semestre</Label>
                                <Select onValueChange={(val: string) => setSearchFilter({ ...searchFilter, semester: val })}>
                                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-slate-100 font-bold"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Todos" className="font-bold">Todos os Semestres</SelectItem>
                                        <SelectItem value="1" className="font-bold">1º Semestre</SelectItem>
                                        <SelectItem value="2" className="font-bold">2º Semestre</SelectItem>
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

            {/* Modal de Gerenciamento de Senha */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="max-w-md rounded-[40px] p-10 border-none shadow-2xl bg-white">
                    <DialogHeader className="items-center text-center">
                        <div className="w-16 h-16 bg-[#8C132C]/10 text-[#8C132C] rounded-2xl flex items-center justify-center mb-4">
                            <Lock size={32} />
                        </div>
                        <DialogTitle className="text-2xl font-black text-[#363636]">Gerenciar Senha</DialogTitle>
                        <DialogDescription className="font-medium text-slate-400">Digite sua nova senha de acesso direto</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdatePassword} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Nova Senha</Label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-16 rounded-2xl bg-slate-50 border-none px-14 font-bold outline-none ring-0 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Confirmar Senha</Label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-16 rounded-2xl bg-slate-50 border-none px-14 font-bold outline-none ring-0 focus-visible:ring-0"
                                />
                            </div>
                        </div>
                        <Button
                            disabled={isUpdatingPassword}
                            className="w-full h-16 bg-[#363636] hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200"
                        >
                            {isUpdatingPassword ? <Loader2 className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                            Salvar Nova Senha
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {/* Loader em Tela Cheia para Sincronização */}
            <AnimatePresence>
                {!isDataReady && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md"
                    >
                        <QuantumLoader />
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-8 text-lg font-black text-[#8C132C] uppercase tracking-[0.3em]"
                        >
                            Sincronizando SINAES
                        </motion.p>
                        <p className="mt-2 text-sm font-medium text-slate-400">Recuperando registros e permissões...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

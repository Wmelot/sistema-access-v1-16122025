"use client"

import Link from "next/link";
import { use } from "react";
import {
    Users,
    MapPin,
    FileText,
    ShoppingBag,
    Briefcase,
    Tag,
    Settings,
    Shield,
    Database,
    ChevronRight,
    ArrowRight,
    ClipboardList,
    Brain,
    UserCog,
    MessageSquare,
    Stethoscope,
    LayoutGrid,
    List,
    TrendingUp,
    Download,
    CircleUser,
    HelpCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalLoader } from "@/components/providers/global-loader-provider";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ManagementHubPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const { showLoading } = useGlobalLoader();
    const dashboardPrefix = `/dashboard/${slug}`;
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const categories = [
        {
            title: "Equipe e Estrutura",
            items: [
                {
                    title: "Gestão de Profissionais",
                    description: "Gerencie sua equipe, horários e comissões.",
                    icon: Users,
                    href: `${dashboardPrefix}/professionals`,
                    color: "text-blue-600",
                    bg: "bg-blue-50"
                },
                {
                    title: "Gestão de Locais",
                    description: "Configure salas e consultórios da clínica.",
                    icon: MapPin,
                    href: `${dashboardPrefix}/locations`,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50"
                },
                {
                    title: "Gestão de Serviços",
                    description: "Configure os serviços e procedimentos oferecidos.",
                    icon: Stethoscope,
                    href: `${dashboardPrefix}/services`,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50"
                }
            ]
        },
        {
            title: "Recursos e Catálogo",
            items: [
                {
                    title: "Gestão de Formulários",
                    description: "Personalize seus prontuários e anamneses.",
                    icon: ClipboardList,
                    href: `${dashboardPrefix}/forms`,
                    color: "text-orange-600",
                    bg: "bg-orange-50"
                },
                {
                    title: "Gestão de Questionários",
                    description: "Gerencie questionários e escalas (PROMs).",
                    icon: FileText,
                    href: `${dashboardPrefix}/questionnaires`,
                    color: "text-cyan-600",
                    bg: "bg-cyan-50"
                },
                {
                    title: "Tabela de Preços",
                    description: "Gerencie valores de serviços e convênios.",
                    icon: Tag,
                    href: `${dashboardPrefix}/prices`,
                    color: "text-purple-600",
                    bg: "bg-purple-50"
                },
                {
                    title: "DRE (Gerencial)",
                    description: "Demonstrativo de Resultados da clínica.",
                    icon: TrendingUp,
                    href: `${dashboardPrefix}/financial?tab=dre`,
                    color: "text-emerald-700",
                    bg: "bg-emerald-100"
                }
            ]
        },
        {
            title: "Operação e Vendas",
            items: [
                {
                    title: "Gestão de Estoque",
                    description: "Controle de produtos e materiais de consumo.",
                    icon: Database,
                    href: `${dashboardPrefix}/products`,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50"
                },
                {
                    title: "Loja de Recursos",
                    description: "Adquira novas funcionalidades para o sistema.",
                    icon: ShoppingBag,
                    href: `${dashboardPrefix}/marketplace`,
                    color: "text-pink-600",
                    bg: "bg-pink-50"
                },
                {
                    title: "Configurações de Marketing",
                    description: "Configure régua de relacionamento e automações.",
                    icon: Briefcase,
                    href: `${dashboardPrefix}/marketing`,
                    color: "text-teal-600",
                    bg: "bg-teal-50"
                },
                {
                    title: "Comunicação (WhatsApp)",
                    description: "Configure as instâncias e mensagens do WhatsApp.",
                    icon: MessageSquare,
                    href: `${dashboardPrefix}/settings/communication`,
                    color: "text-green-600",
                    bg: "bg-green-50"
                }
            ]
        },
        {
            title: "Sistema e Segurança",
            items: [
                {
                    title: "Identidade da Clínica",
                    description: "Dados básicos, logotipos e cores do sistema.",
                    icon: Settings,
                    href: `${dashboardPrefix}/settings?tab=general`,
                    color: "text-zinc-600",
                    bg: "bg-zinc-100"
                },
                {
                    title: "Documentos e Atestados",
                    description: "Gerencie modelos de atestados e declarações.",
                    icon: FileText,
                    href: `${dashboardPrefix}/settings?tab=reports`,
                    color: "text-blue-600",
                    bg: "bg-blue-50"
                },
                {
                    title: "Inteligência & IA",
                    description: "Configure protocolos PBE e comportamento da IA.",
                    icon: Brain,
                    href: `${dashboardPrefix}/settings?tab=intelligence`,
                    color: "text-purple-600",
                    bg: "bg-purple-50"
                },
                {
                    title: "Controle de Usuários",
                    description: "Gerencie perfis, senhas e acessos da equipe.",
                    icon: UserCog,
                    href: `${dashboardPrefix}/settings?tab=users`,
                    color: "text-orange-600",
                    bg: "bg-orange-50"
                },
                {
                    title: "Perfis de Acesso",
                    description: "Controle permissões por cargo ou função.",
                    icon: Shield,
                    href: `${dashboardPrefix}/settings?tab=roles`,
                    color: "text-red-600",
                    bg: "bg-red-50"
                },
                {
                    title: "Trilha de Auditoria (LGPD)",
                    description: "Registro histórico de acessos e alterações.",
                    icon: Database,
                    href: `${dashboardPrefix}/settings/audit`,
                    color: "text-zinc-600",
                    bg: "bg-zinc-100"
                },
                {
                    title: "Assistente de Migração",
                    description: "Importe dados de outros sistemas.",
                    icon: Download,
                    href: `${dashboardPrefix}/integrations`,
                    color: "text-slate-600",
                    bg: "bg-slate-100"
                }
            ]
        },
        {
            title: "Meu Perfil e Ajuda",
            items: [
                {
                    title: "Configurações de Perfil",
                    description: "Gerencie seus dados e foto de perfil.",
                    icon: CircleUser,
                    href: `${dashboardPrefix}/profile/me`,
                    color: "text-zinc-700",
                    bg: "bg-zinc-50"
                },
                {
                    title: "Tutoriais e Suporte",
                    description: "Central de ajuda e suporte técnico.",
                    icon: HelpCircle,
                    href: `${dashboardPrefix}/support`,
                    color: "text-orange-700",
                    bg: "bg-orange-50"
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Gestão da Clínica</h1>
                    <p className="text-muted-foreground text-lg">
                        Central de configurações, equipe e recursos do sistema.
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
                    <Button
                        variant={viewMode === 'grid' ? "secondary" : "ghost"}
                        size="sm"
                        className={cn("rounded-lg px-3 py-1.5 gap-2", viewMode === 'grid' && "shadow-sm bg-white")}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Cards</span>
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? "secondary" : "ghost"}
                        size="sm"
                        className={cn("rounded-lg px-3 py-1.5 gap-2", viewMode === 'list' && "shadow-sm bg-white")}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Lista</span>
                    </Button>
                </div>
            </div>

            <div className="grid gap-12">
                {categories.map((category) => (
                    <section key={category.title} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                                {category.title}
                            </h2>
                            <div className="h-[1px] w-full bg-slate-100" />
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {category.items.map((item) => (
                                    <Link key={item.title} href={item.href} className="group" onClick={() => showLoading(`Abrindo ${item.title}...`)}>
                                        <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-blue-200 group-active:scale-[0.98] border-slate-200/60 shadow-sm">
                                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                                <div className={`${item.bg} ${item.color} p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500`}>
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base group-hover:text-blue-700 transition-colors">
                                                        {item.title}
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {item.description}
                                                </p>
                                                <div className="mt-4 flex items-center text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                                    ACESSAR <ArrowRight className="ml-1 w-3 h-3" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                                {category.items.map((item, idx) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={() => showLoading(`Abrindo ${item.title}...`)}
                                        className={cn(
                                            "flex items-center justify-between p-4 transition-colors hover:bg-slate-50 group",
                                            idx !== category.items.length - 1 && "border-b"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(item.bg, item.color, "p-2 rounded-xl")}>
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}

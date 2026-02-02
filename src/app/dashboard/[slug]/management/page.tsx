import Link from "next/link";
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
    UserCog
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ManagementHubPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const dashboardPrefix = `/dashboard/${slug}`;

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
                    title: "Tabela de Preços",
                    description: "Gerencie valores de serviços e convênios.",
                    icon: Tag,
                    href: `${dashboardPrefix}/prices`,
                    color: "text-purple-600",
                    bg: "bg-purple-50"
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
                    title: "Gestão de Estoque",
                    description: "Controle de produtos e materiais de consumo.",
                    icon: Database,
                    href: `${dashboardPrefix}/products`,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50"
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
                    title: "Configurações de Marketing",
                    description: "Configure régua de relacionamento e automações.",
                    icon: Briefcase,
                    href: `${dashboardPrefix}/marketing`,
                    color: "text-teal-600",
                    bg: "bg-teal-50"
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestão da Clínica</h1>
                <p className="text-muted-foreground text-lg">
                    Central de configurações, equipe e recursos do sistema.
                </p>
            </div>

            <div className="grid gap-10">
                {categories.map((category) => (
                    <section key={category.title} className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">
                            {category.title}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.items.map((item) => (
                                <Link key={item.title} href={item.href} className="group">
                                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-blue-200 group-active:scale-[0.98]">
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
                    </section>
                ))}
            </div>
        </div>
    );
}

"use client"

import { useState, useMemo } from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Pencil, Activity, HeartHandshake, Eye, LayoutGrid, List as ListIcon, ChevronRight, FolderSearch } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { FormCardActions } from '../../forms/components/form-card-actions';

interface QuestionnaireBrowserProps {
    questionnaires: any[];
    followups: any[];
    user: any;
    slug: string;
}

const CATEGORIES = [
    {
        name: "Coluna Vertebral",
        icon: "🦴",
        keywords: ["coluna", "lombar", "cervical", "vertebral", "back", "neck", "spine", "roland", "oswestry", "ndi", "quebec", "start"]
    },
    {
        name: "Membro Superior",
        icon: "💪",
        keywords: ["ombro", "cotovelo", "punho", "mão", "braço", "shoulder", "arm", "hand", "wrist", "elbow", "dash", "spadi", "prwe"]
    },
    {
        name: "Membro Inferior",
        icon: "🦶",
        keywords: ["quadril", "joelho", "tornozelo", "pé", "perna", "hip", "knee", "ankle", "foot", "leg", "lefs", "koos", "hoos", "ikdc", "lysholm", "faam", "faos", "aofas", "visa", "harris", "kujala", "fadi"]
    },
    {
        name: "Saúde da Mulher & Pélvica",
        icon: "🌸",
        keywords: ["mulher", "pélvica", "urinária", "sexual", "gestante", "women", "pelvic", "incontinence", "iciq", "udi", "fsfi"]
    },
    {
        name: "Dor & Funcionalidade Global",
        icon: "🧠",
        keywords: ["dor", "pain", "funcional", "qualidade", "vida", "sf-36", "mcgill", "tampa", "cinesiofobia", "kinesiophobia", "fibromialgia"]
    },
    {
        name: "Pé Insensível (Neuropático)",
        icon: "🩺",
        keywords: ["diabetes", "diabético", "neuropatia", "insensível", "sensibilidade", "mnsi", "michigan", "perda de sensibilidade", "monofilamento", "perfil clínico", "controle do diabetes", "pé"]
    }
];

export function QuestionnaireBrowser({ questionnaires, followups, user, slug }: QuestionnaireBrowserProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Categorization Logic
    const groupedTemplates = useMemo(() => {
        const groups: Record<string, any[]> = {};

        // Initialize groups
        CATEGORIES.forEach(c => groups[c.name] = []);
        groups["Outros"] = [];

        questionnaires.forEach(t => {
            const text = (t.title + " " + (t.description || "")).toLowerCase();
            let matched = false;

            for (const cat of CATEGORIES) {
                if (cat.keywords.some(k => text.includes(k))) {
                    groups[cat.name].push(t);
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                groups["Outros"].push(t);
            }
        });

        return groups;
    }, [questionnaires]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Tabs defaultValue="standard" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <TabsList className="grid w-[400px] grid-cols-2">
                            <TabsTrigger value="standard">Padronizados ({questionnaires.length})</TabsTrigger>
                            <TabsTrigger value="followup">Acompanhamento ({followups.length})</TabsTrigger>
                        </TabsList>

                        <div className="flex bg-muted p-1 rounded-lg border">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-7 w-7 p-0"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-7 w-7 p-0"
                            >
                                <ListIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* TAB 1: PADRONIZADOS (AGRUPADOS) */}
                    <TabsContent value="standard" className="mt-0 space-y-4">
                        {Object.entries(groupedTemplates).map(([category, items]) => {
                            if (items.length === 0) return null;
                            const catInfo = CATEGORIES.find(c => c.name === category);

                            return (
                                <Accordion key={category} type="single" collapsible defaultValue={category === "Membro Inferior" ? category : undefined} className="bg-white rounded-lg border shadow-sm">
                                    <AccordionItem value={category} className="border-none">
                                        <AccordionTrigger className="px-6 hover:no-underline py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <FolderSearch className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
                                                    <p className="text-xs text-slate-500 font-normal">{items.length} questionários disponíveis</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6 pt-2">
                                            <ViewContainer viewMode={viewMode} items={items} user={user} icon={ClipboardList} color="blue" slug={slug} />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )
                        })}

                        {/* Caso não tenha nada em nenhum grupo (fallback) */}
                        {questionnaires.length === 0 && <EmptyState />}
                    </TabsContent>

                    {/* TAB 2: FOLLOW-UP (LISTA SIMPLES) */}
                    <TabsContent value="followup" className="mt-0">
                        <ViewContainer viewMode={viewMode} items={followups} user={user} icon={HeartHandshake} color="purple" slug={slug} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ViewContainer({ viewMode, items, user, icon, color, slug }: any) {
    if (items.length === 0) return <div className="text-sm text-muted-foreground italic">Nenhum item nesta categoria.</div>;

    if (viewMode === 'list') {
        return (
            <div className="space-y-2">
                {items.map((template: any) => (
                    <TemplateListItem key={template.id} template={template} user={user} icon={icon} color={color} slug={slug} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((template: any) => (
                <TemplateCard key={template.id} template={template} user={user} icon={icon} color={color} slug={slug} />
            ))}
        </div>
    );
}

function TemplateCard({ template, user, icon: Icon, color, slug }: any) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between relative shadow-sm h-full">
            <div>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-bold line-clamp-2 leading-tight min-h-[40px]" title={template.title}>
                        {template.title}
                    </CardTitle>
                    <div className="absolute top-2 right-2">
                        <FormCardActions
                            templateId={template.id}
                            isActive={!!template.is_active}
                            allowedRoles={template.allowed_roles || []}
                            professionals={[]}
                            userId={template.user_id}
                            currentUserId={user?.id}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide ${colorClasses[color as keyof typeof colorClasses]}`}>
                            <Icon className="w-3 h-3 mr-1.5" />
                            {template.type === 'followup' ? 'Acompanhamento' : 'Instrumento Padronizado'}
                        </span>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs h-8">
                        {template.description || "Sem descrição."}
                    </CardDescription>
                </CardContent>
            </div>
            <div className="p-6 pt-0 mt-auto">
                <Link href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`} className="w-full">
                    <Button variant={template.is_locked ? "secondary" : "outline"} className="w-full text-xs h-8">
                        {template.is_locked ? (
                            <>
                                <Eye className="mr-2 h-3 w-3" />
                                Visualizar
                            </>
                        ) : (
                            <>
                                <Pencil className="mr-2 h-3 w-3" />
                                Editar Modelo
                            </>
                        )}
                    </Button>
                </Link>
            </div>
        </Card>
    )
}

function TemplateListItem({ template, user, icon: Icon, color, slug }: any) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <div className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-slate-900">{template.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{template.description || "Sem descrição."}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link href={template.is_locked ? `/dashboard/${slug}/questionnaires/preview/${template.id}` : `/dashboard/${slug}/forms/builder/${template.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                        {template.is_locked ? (
                            <>
                                <Eye className="mr-2 h-3 w-3" />
                                Visualizar
                            </>
                        ) : (
                            <>
                                <Pencil className="mr-2 h-3 w-3" />
                                Editar
                            </>
                        )}
                    </Button>
                </Link>
                <FormCardActions
                    templateId={template.id}
                    isActive={!!template.is_active}
                    allowedRoles={template.allowed_roles || []}
                    professionals={[]}
                    userId={template.user_id}
                    currentUserId={user?.id}
                />
            </div>
        </div>
    )
}

function EmptyState({ message = "Nenhum modelo encontrado." }: { message?: string }) {
    return (
        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">{message}</p>
            <p className="text-xs mt-1">Clique em "Novo Modelo" para criar.</p>
        </div>
    )
}

"use client"

import { useState } from "react"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Pencil, Activity, HeartHandshake, Eye, LayoutGrid, List as ListIcon } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormCardActions } from '../../forms/components/form-card-actions';

interface QuestionnaireBrowserProps {
    questionnaires: any[];
    followups: any[];
    user: any;
}

export function QuestionnaireBrowser({ questionnaires, followups, user }: QuestionnaireBrowserProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

                    {/* TAB 1: PADRONIZADOS */}
                    <TabsContent value="standard" className="mt-0">
                        <ViewContainer viewMode={viewMode} items={questionnaires} user={user} icon={ClipboardList} color="blue" />
                    </TabsContent>

                    {/* TAB 2: FOLLOW-UP */}
                    <TabsContent value="followup" className="mt-0">
                        <ViewContainer viewMode={viewMode} items={followups} user={user} icon={HeartHandshake} color="purple" />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ViewContainer({ viewMode, items, user, icon, color }: any) {
    if (items.length === 0) return <EmptyState />;

    if (viewMode === 'list') {
        return (
            <div className="space-y-2">
                {items.map((template: any) => (
                    <TemplateListItem key={template.id} template={template} user={user} icon={icon} color={color} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((template: any) => (
                <TemplateCard key={template.id} template={template} user={user} icon={icon} color={color} />
            ))}
        </div>
    );
}

function TemplateCard({ template, user, icon: Icon, color }: any) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <Card className="hover:border-primary/50 transition-colors flex flex-col justify-between relative">
            <div>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium line-clamp-1" title={template.title}>
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
                    <div className="mb-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold max-w-fit ${colorClasses[color as keyof typeof colorClasses]}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {template.type === 'followup' ? 'Acompanhamento' : 'Questionário'}
                        </span>
                    </div>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                        {template.description || "Sem descrição."}
                    </CardDescription>
                </CardContent>
            </div>
            <div className="p-6 pt-0">
                <Link href={`/dashboard/forms/builder/${template.id}${template.is_locked ? '?mode=view' : ''}`} className="w-full">
                    <Button variant={template.is_locked ? "secondary" : "outline"} className="w-full">
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

function TemplateListItem({ template, user, icon: Icon, color }: any) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200"
    };

    return (
        <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm">{template.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{template.description || "Sem descrição."}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Link href={`/dashboard/forms/builder/${template.id}${template.is_locked ? '?mode=view' : ''}`}>
                    <Button variant="ghost" size="sm" className="h-8">
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
        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>{message}</p>
            <p className="text-sm">Clique em "Novo Modelo" para criar.</p>
        </div>
    )
}

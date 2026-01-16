
import { getFormTemplates, createFormTemplate } from '../forms/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ClipboardList, Pencil, Activity, HeartHandshake, Eye } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { FormCardActions } from '../forms/components/form-card-actions';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function QuestionnairesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch all templates
    const allTemplates = await getFormTemplates();

    // Filter by type
    // Filter by type - ONLY LOCKED (STANDARD)
    const questionnaires = allTemplates.filter((t: any) => t.is_locked && (t.type === 'questionnaire' || t.type === 'assessment' || !t.type));
    const followups = allTemplates.filter((t: any) => t.is_locked && t.type === 'followup');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Questionários</h1>
                    <p className="text-muted-foreground">
                        Visualize os modelos de questionários padronizados e escalas globais.
                    </p>
                </div>
                {/* Creation button moved to Custom Forms page */}
            </div>

            <Tabs defaultValue="standard" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="standard">Padronizados ({questionnaires.length})</TabsTrigger>
                    <TabsTrigger value="followup">Acompanhamento ({followups.length})</TabsTrigger>
                </TabsList>

                {/* TAB 1: PADRONIZADOS */}
                <TabsContent value="standard" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {questionnaires.map((template: any) => (
                            <TemplateCard key={template.id} template={template} user={user} icon={ClipboardList} color="blue" />
                        ))}
                        {questionnaires.length === 0 && <EmptyState />}
                    </div>
                </TabsContent>

                {/* TAB 2: FOLLOW-UP */}
                <TabsContent value="followup" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {followups.map((template: any) => (
                            <TemplateCard key={template.id} template={template} user={user} icon={HeartHandshake} color="purple" />
                        ))}
                        {followups.length === 0 && <EmptyState message="Nenhum formulário de acompanhamento." />}
                    </div>
                </TabsContent>
            </Tabs>
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

function EmptyState({ message = "Nenhum modelo encontrado." }: { message?: string }) {
    return (
        <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>{message}</p>
            <p className="text-sm">Clique em "Novo Modelo" para criar.</p>
        </div>
    )
}

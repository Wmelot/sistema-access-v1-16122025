import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppConnect } from "./components/whatsapp-connect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatesList } from "./components/templates-list"
import { HistoryList } from "./components/history-list"
import { getTemplates, getMessageLogs } from "./actions"
import { TemplateDialog } from "./components/add-template-dialog"
import { CommunicationNavigation } from "./navigation"
import { CampaignsManager } from "./components/campaigns-manager"
import { ManagementHeader } from "@/components/dashboard/management-header"

export default async function CommunicationPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ tab?: string }>
}) {
    const { slug } = await params
    const { tab: activeTab = 'templates' } = await searchParams
    const templates = await getTemplates(slug)
    const logs = await getMessageLogs(slug)

    return (
        <div className="space-y-6">
            <ManagementHeader
                slug={slug}
                title="Comunicação e Automação"
                description="Gerencie modelos de mensagem e configure automações do WhatsApp."
            />

            <Tabs value={activeTab} className="space-y-4">
                <CommunicationNavigation defaultTab={activeTab} />

                <TabsContent value="templates" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Seus Modelos</h2>
                            <p className="text-sm text-muted-foreground">Gerencie sua biblioteca de mensagens</p>
                        </div>
                        <TemplateDialog slug={slug} />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Modelos de Mensagem</CardTitle>
                                    <CardDescription>Crie mensagens para envio automático (WhatsApp/Email)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TemplatesList templates={templates as any[]} slug={slug} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Campanhas de Reengajamento</h2>
                            <p className="text-sm text-muted-foreground">Filtre pacientes e envie mensagens em massa para aumentar suas vendas</p>
                        </div>
                    </div>
                    <CampaignsManager slug={slug} />
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Disparos</CardTitle>
                            <CardDescription>
                                Visualize o log de todas as mensagens automáticas e manuais enviadas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HistoryList logs={logs as any[]} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="whatsapp_config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conexão WhatsApp</CardTitle>
                            <CardDescription>
                                Configure sua instância Z-API para envio de mensagens automáticas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WhatsAppConnect slug={slug} />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}

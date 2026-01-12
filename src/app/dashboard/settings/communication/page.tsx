import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppConnect } from "./components/whatsapp-connect"

// ... inside the file ...

<TabsContent value="settings">
    <Card>
        <CardHeader>
            <CardTitle>Conexão WhatsApp</CardTitle>
            <CardDescription>
                Configure sua instância para envio automático (Evolution API Local ou Z-API Nuvem).
            </CardDescription>
        </CardHeader>
        <CardContent>
            <WhatsAppConnect />
        </CardContent>
    </Card>
</TabsContent>
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatesList } from "./components/templates-list"
import { HistoryList } from "./components/history-list"
import { getTemplates, getMessageLogs } from "./actions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TemplateDialog } from "./components/add-template-dialog"

export default async function CommunicationPage() {
    const templates = await getTemplates()
    const logs = await getMessageLogs()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Comunicação e Automação</h1>
                <p className="text-muted-foreground">
                    Gerencie modelos de mensagem e configure automações do WhatsApp.
                </p>
            </div>

            <Tabs defaultValue="templates" className="space-y-4">
                <div className="flex items-center">
                    <TabsList>
                        <TabsTrigger value="templates">Modelos de Mensagem</TabsTrigger>
                        <TabsTrigger value="history">Histórico de Disparos</TabsTrigger>
                        <TabsTrigger value="whatsapp_config">Configuração WhatsApp</TabsTrigger>
                    </TabsList>
                    <div className="ml-auto">
                        {/* Button is inside TemplateDialog now */}
                        <TemplateDialog />
                    </div>
                </div>

                <TabsContent value="templates" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Modelos de Mensagem</CardTitle>
                                    <CardDescription>Crie mensagens para envio automático (WhatsApp/Email)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TemplatesList templates={templates as any[]} />
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Histórico de Envios</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <HistoryList logs={logs as any[]} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
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
                                Configure sua instância para envio automático (Evolution API Local ou Z-API Nuvem).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WhatsAppConnect />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

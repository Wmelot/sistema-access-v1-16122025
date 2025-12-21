import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WhatsAppConnect } from "./components/whatsapp-connect"

// ... inside the file ...

<TabsContent value="settings">
    <Card>
        <CardHeader>
            <CardTitle>Conexão WhatsApp (Evolution API)</CardTitle>
            <CardDescription>
                Configure sua instância para envio automático. A API deve estar rodando localmente.
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Modelos Personalizados</CardTitle>
                            <CardDescription>
                                Crie templates para agilizar seu atendimento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TemplatesList templates={templates} />
                        </CardContent>
                    </Card>
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
                            <HistoryList logs={logs} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="whatsapp_config">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conexão WhatsApp (Evolution API)</CardTitle>
                            <CardDescription>
                                Configure sua instância para envio automático.
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

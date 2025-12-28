import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, RefreshCw, Send } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCampaignDetails } from "../actions"

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const campaign = await getCampaignDetails(id)

    if (!campaign) return notFound()

    const { stats } = campaign
    const total = campaign.total_messages || 1
    const progress = Math.round(((stats.sent + stats.failed) / total) * 100)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/marketing">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Badge variant={campaign.status === 'sending' ? 'secondary' : 'outline'}>
                            {campaign.status === 'sending' ? 'Enviando...' : campaign.status}
                        </Badge>
                        <span>•</span>
                        <span>Criado em {new Date(campaign.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href={`/dashboard/marketing/${id}`}>
                            <RefreshCw className="h-4 w-4" />
                            Atualizar
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="col-span-4 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Progresso do Envio</CardTitle>
                        <CardDescription>
                            Acompanhe o disparo das mensagens em tempo real.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Concluído: {progress}%</span>
                                <span>{stats.sent + stats.failed} de {total}</span>
                            </div>
                            <Progress value={progress} className="h-4" />
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
                                <div className="text-xs text-muted-foreground uppercase">Fila (Pendentes)</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                                <div className="text-xs text-green-700 uppercase">Enviados</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                                <div className="text-xs text-red-700 uppercase">Falhas</div>
                            </div>
                        </div>

                        <div className="border rounded-md p-4 bg-slate-50">
                            <h4 className="font-semibold text-sm mb-2">Mensagem Original:</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {campaign.template_content}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Helpful Tips or Quick Actions */}
                <Card className="col-span-4 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">Status do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            O sistema processa cerca de <strong>6 mensagens por minuto</strong> para garantir segurança.
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Não feche o servidor, mas você pode sair desta página. O processo roda em segundo plano.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

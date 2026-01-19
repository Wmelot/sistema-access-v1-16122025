"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Eye, FileJson } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { updateReportTemplate } from '@/app/dashboard/settings/reports/actions'

export function SmartReportBuilder() {
    const searchParams = useSearchParams()
    const templateId = searchParams.get('id')

    // Mock initial data based on ID - In real app, fetch from DB
    const [name, setName] = useState(templateId === 'REPORT_PALMILHA_V2' ? 'Laudo Biomecânico & Prescrição de Órtese' : 'Novo Blueprint')
    const [description, setDescription] = useState(templateId === 'REPORT_PALMILHA_V2' ? 'Modelo padrão para avaliação de pisada e prescrição de palmilhas 3D.' : '')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        try {
            // Simulate API call or Server Action
            await new Promise(resolve => setTimeout(resolve, 800))
            toast.success("Informações atualizadas com sucesso!")
        } catch (error) {
            toast.error("Erro ao salvar informações")
        } finally {
            setLoading(false)
        }
    }

    if (!templateId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <FileJson className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">Nenhum Blueprint Selecionado</h2>
                <p className="text-muted-foreground mb-6">Selecione um blueprint na lista de configurações para ver os detalhes.</p>
                <Button asChild>
                    <Link href="/dashboard/settings?tab=reports">Voltar para Configurações</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/settings?tab=reports">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Detalhes do Blueprint</h1>
                    <p className="text-muted-foreground">ID do Sistema: <code className="text-xs bg-muted px-1 py-0.5 rounded">{templateId}</code></p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => toast.info("Visualização de exemplo em desenvolvimento")}>
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar Exemplo
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Gerais</CardTitle>
                        <CardDescription>Edite o nome e descrição que aparecem na lista de seleção.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Modelo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="desc">Descrição Interna</Label>
                            <Textarea
                                id="desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estrutura Técnica</CardTitle>
                        <CardDescription>Este blueprint é gerenciado pelo sistema e não pode ter sua estrutura alterada.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-md bg-muted p-4 text-sm font-mono overflow-auto max-h-[200px]">
                            <p className="text-green-600">// Estrutura Bloqueada (System Managed)</p>
                            <p className="text-blue-600">version: "2.0.0"</p>
                            <p className="text-blue-600">engine: "react-pdf-renderer"</p>
                            <p className="text-blue-600">features: [</p>
                            <p className="pl-4 text-orange-600">"radar_chart",</p>
                            <p className="pl-4 text-orange-600">"dynamic_text",</p>
                            <p className="pl-4 text-orange-600">"image_processing"</p>
                            <p className="text-blue-600">]</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Para solicitar alterações na estrutura deste laudo, entre em contato com o suporte ou solicite uma personalização via IA (em breve).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

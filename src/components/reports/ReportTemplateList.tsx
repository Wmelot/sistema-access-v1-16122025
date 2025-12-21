'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"

interface ReportTemplateListProps {
    templates: any[]
}

export function ReportTemplateList({ templates }: ReportTemplateListProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Modelos de Relatório</h3>
                    <p className="text-sm text-muted-foreground">
                        Crie e gerencie modelos de documentos (Atestados, Encaminhamentos, Fichas).
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/settings/reports/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Modelo
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.length === 0 ? (
                    <Card className="border-dashed col-span-full">
                        <CardHeader>
                            <CardTitle className="text-center">Nenhum modelo criado</CardTitle>
                            <CardDescription className="text-center">Clique em "Novo Modelo" para começar.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    templates.map((template: any) => (
                        <Card key={template.id} className="hover:bg-muted/50 transition-colors">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    {template.title}
                                </CardTitle>
                                <CardDescription className="text-xs uppercase font-medium">
                                    {template.type === 'standard' && 'Relatório Dinâmico'}
                                    {template.type === 'certificate' && 'Atestado / Declaração'}
                                    {template.type === 'gym_auth' && 'Autorização Academia'}
                                    {template.type === 'counter' && 'Contador de Sessões'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/settings/reports/${template.id}`}>
                                            Editar
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

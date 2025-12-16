"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { togglePriceTableActive, deletePriceTable } from "../actions"
import { DeleteWithPassword } from "@/components/ui/delete-with-password"
import { Badge } from "@/components/ui/badge"

interface PriceTableCardProps {
    table: any
}

export function PriceTableCard({ table }: PriceTableCardProps) {
    const handleToggle = async (checked: boolean) => {
        // Optimistic / Fast feedback
        try {
            const result = await togglePriceTableActive(table.id, checked)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(checked ? "Tabela ativada" : "Tabela desativada")
            }
        } catch (error) {
            toast.error("Erro ao atualizar status")
        }
    }

    return (
        <Card className="group relative hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="truncate pr-2 text-base">
                        {table.name}
                    </CardTitle>
                    <Switch
                        checked={table.active !== false} // Default to true if null/undefined
                        onCheckedChange={handleToggle}
                        title={table.active !== false ? "Desativar tabela" : "Ativar tabela"}
                    />
                </div>
                <CardDescription className="flex items-center justify-between pt-1">
                    <span>
                        {new Date(table.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {table.active === false ? (
                        <Badge variant="outline" className="text-muted-foreground text-xs py-0 h-5">Inativa</Badge>
                    ) : (
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 text-xs py-0 h-5 border-green-200">Ativa</Badge>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2 pt-2">
                <Link href={`/dashboard/prices/${table.id}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2 group-hover:bg-primary/5 group-hover:text-primary h-9 text-xs uppercase font-semibold">
                        Editar Preços
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
                <DeleteWithPassword
                    id={table.id}
                    onDelete={deletePriceTable}
                    description={`Tem certeza que deseja apagar a tabela "${table.name}"? Isso removerá todos os preços vinculados.`}
                />
            </CardContent>
        </Card>
    )
}

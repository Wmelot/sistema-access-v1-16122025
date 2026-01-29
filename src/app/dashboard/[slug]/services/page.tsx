import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Clock } from "lucide-react"
import { ServicesDialog } from "@/components/settings/ServicesDialog"
import { DeleteServiceButton } from "./delete-service-button"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"

export default async function ServicesPage() {
    const supabase = await createClient()
    const { data: services } = await supabase.from('services').select('*').order('name')

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Serviços e Procedimentos</h1>
                <ServicesDialog />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Catálogo de Serviços</CardTitle>
                    <CardDescription>
                        Padronize os nomes, preços e duração dos atendimentos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Desktop View - Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Duração</TableHead>
                                    <TableHead>Preço Padrão</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services?.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-slate-200"
                                                    style={{ backgroundColor: (service as any).color || '#64748b' }}
                                                />
                                                {service.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {service.duration} min
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={service.active ? "default" : "secondary"}>
                                                {service.active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-2">
                                            <ServicesDialog service={service} />
                                            <DeleteServiceButton serviceId={service.id} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {services?.map((service) => (
                            <div key={service.id} className="p-4 rounded-xl border bg-slate-50/50 space-y-3 relative group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full border border-slate-200"
                                            style={{ backgroundColor: (service as any).color || '#64748b' }}
                                        />
                                        <span className="font-bold text-slate-800">{service.name}</span>
                                    </div>
                                    <Badge variant={service.active ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-tight">
                                        {service.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="font-medium">{service.duration} min</span>
                                        </div>
                                        <span className="text-slate-900 font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <ServicesDialog service={service} />
                                        <DeleteServiceButton serviceId={service.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

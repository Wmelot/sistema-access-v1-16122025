'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Stethoscope, Mail, Phone, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { useViewMode } from "@/hooks/use-view-mode"
import { cn } from "@/lib/utils"

import { Info } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ProfessionalsListProps {
    professionals: any[]
    slug: string
}

export function ProfessionalsList({ professionals, slug }: ProfessionalsListProps) {
    const { viewMode, setViewMode, isLoaded } = useViewMode('professionals-view-mode', 'grid')
    const [infoPro, setInfoPro] = useState<any>(null)

    if (!isLoaded) {
        return <div className="animate-pulse">Carregando...</div>
    }

    const dashboardPrefix = `/dashboard/${slug}`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestão de Equipe</h2>
                    <p className="text-muted-foreground">Gerencie a equipe, horários e níveis de acesso.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    <Link href={`${dashboardPrefix}/professionals/new`}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Membro
                        </Button>
                    </Link>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {professionals.map((pro: any) => (
                        <Card key={pro.id} className="overflow-hidden group relative">
                            <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 pb-4">
                                <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                    <AvatarImage src={pro.photo_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                        {pro.full_name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <CardTitle className="text-lg line-clamp-1" title={pro.full_name}>
                                        {pro.full_name || 'Profissional Sem Nome'}
                                    </CardTitle>
                                    <Badge variant="outline" className="w-fit font-normal text-[10px] uppercase tracking-wider">
                                        {pro.role?.name || (pro.role === 'admin' ? 'Master / Admin' : 'Profissional')}
                                    </Badge>
                                </div>
                            </CardHeader>

                            {/* Info Button - Absolute Positioned */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/50 hover:bg-white text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setInfoPro(pro)}
                            >
                                <Info className="h-4 w-4" />
                            </Button>

                            <CardContent className="p-4 grid gap-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{pro.council_type} {pro.council_number}</span>
                                </div>
                                {pro.color && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pro.color }} />
                                        <span className="text-muted-foreground">Cor na Agenda</span>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-end">
                                <Link href={`${dashboardPrefix}/professionals/${pro.id}`}>
                                    <Button variant="ghost" size="sm">Editar</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {professionals.map((pro: any) => (
                        <Card key={pro.id} className="overflow-hidden group relative">
                            <div className="flex items-center gap-4 p-4">
                                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                    <AvatarImage src={pro.photo_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                        {pro.full_name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 grid gap-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg">{pro.full_name || 'Profissional Sem Nome'}</h3>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full text-muted-foreground"
                                                onClick={() => setInfoPro(pro)}
                                            >
                                                <Info className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <Badge variant="outline" className="font-normal text-muted-foreground">
                                            {pro.role?.name || (pro.role === 'admin' ? 'Master / Admin' : 'Profissional')}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>{pro.council_type} {pro.council_number}</span>
                                        </div>
                                        {pro.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                <span>{pro.email}</span>
                                            </div>
                                        )}
                                        {pro.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                <span>{pro.phone}</span>
                                            </div>
                                        )}
                                        {pro.color && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pro.color }} />
                                                <span>Cor na Agenda</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Link href={`${dashboardPrefix}/professionals/${pro.id}`}>
                                    <Button variant="outline" size="sm">Editar</Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {professionals.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Nenhum profissional cadastrado</h3>
                    <p className="max-w-xs mx-auto mb-4">Adicione membros à sua equipe para gerenciar agendas.</p>
                    <Link href={`${dashboardPrefix}/professionals/new`}>
                        <Button variant="outline">Cadastrar Agora</Button>
                    </Link>
                </div>
            )}

            {/* Professional Info Modal */}
            <Dialog open={!!infoPro} onOpenChange={(open) => !open && setInfoPro(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl border-2">
                    <DialogHeader>
                        <div className="flex flex-col items-center text-center mb-4">
                            <Avatar className="h-32 w-32 mb-4 border-4 shadow-md ring-2 ring-primary/20">
                                <AvatarImage src={infoPro?.photo_url || ''} />
                                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                    {infoPro?.full_name?.charAt(0) || 'P'}
                                </AvatarFallback>
                            </Avatar>
                            <DialogTitle className="text-3xl font-bold text-slate-800">
                                {infoPro?.full_name}
                            </DialogTitle>
                            <div className="text-primary font-bold uppercase tracking-widest text-xs mt-1">
                                {infoPro?.specialty || "Especialista"}
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="space-y-6 py-2">
                        <div className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[250px] overflow-y-auto">
                            {infoPro?.bio || "Profissional dedicado ao cuidado integral do paciente, com vasta experiência em fisioterapia e reabilitação."}
                        </div>

                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Profissional Verificado pela Clínica
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}


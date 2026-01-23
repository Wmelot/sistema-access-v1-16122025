'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Stethoscope, Mail, Phone } from "lucide-react"
import Link from "next/link"
import { ViewModeToggle } from "@/components/ui/view-mode-toggle"
import { useViewMode } from "@/hooks/use-view-mode"
import { cn } from "@/lib/utils"

interface ProfessionalsListProps {
    professionals: any[]
    slug: string // [NEW] Added for proper linking
}

export function ProfessionalsList({ professionals, slug }: ProfessionalsListProps) {
    const { viewMode, setViewMode, isLoaded } = useViewMode('professionals-view-mode', 'grid')

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
                        <Card key={pro.id} className="overflow-hidden">
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
                                    <CardDescription className="line-clamp-1">
                                        {pro.specialty || 'Sem especialidade'}
                                    </CardDescription>
                                </div>
                            </CardHeader>
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
                            <CardFooter className="p-4 pt-0 flex justify-between">
                                <Badge variant="outline" className="font-normal text-muted-foreground">
                                    {pro.role?.name || (pro.role === 'admin' ? 'Master / Admin' : 'Profissional')}
                                </Badge>
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
                        <Card key={pro.id} className="overflow-hidden">
                            <div className="flex items-center gap-4 p-4">
                                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                                    <AvatarImage src={pro.photo_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                        {pro.full_name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 grid gap-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">{pro.full_name || 'Profissional Sem Nome'}</h3>
                                        <Badge variant="outline" className="font-normal text-muted-foreground">
                                            {pro.role?.name || (pro.role === 'admin' ? 'Master / Admin' : 'Profissional')}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4" />
                                            <span>{pro.specialty || 'Sem especialidade'}</span>
                                        </div>
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
        </div>
    )
}

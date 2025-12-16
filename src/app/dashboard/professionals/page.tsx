import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Stethoscope } from "lucide-react"
import Link from "next/link"
import { getProfessionals } from "./actions"

export default async function ProfessionalsPage() {
    const professionals = await getProfessionals()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Profissionais</h2>
                    <p className="text-muted-foreground">Gerencie a equipe, horários e permissões.</p>
                </div>
                <Link href="/dashboard/professionals/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Cadastrar Profissional
                    </Button>
                </Link>
            </div>

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
                                {pro.role === 'admin' ? 'Master / Admin' : 'Profissional'}
                            </Badge>
                            <Link href={`/dashboard/professionals/${pro.id}`}>
                                <Button variant="ghost" size="sm">Editar</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}

                {professionals.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg text-muted-foreground">
                        <Stethoscope className="h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum profissional cadastrado</h3>
                        <p className="max-w-xs mx-auto mb-4">Adicione membros à sua equipe para gerenciar agendas.</p>
                        <Link href="/dashboard/professionals/new">
                            <Button variant="outline">Cadastrar Agora</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Book, MessageCircle, FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda & Suporte</h1>
                <p className="text-muted-foreground">Encontre respostas, tutoriais e entre em contato conosco.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Book className="h-5 w-5 text-primary" />
                            Manuais e Tutoriais
                        </CardTitle>
                        <CardDescription>Guias passo-a-passo do sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            Acesse nossa documentação completa para aprender a utilizar todas as funcionalidades do sistema Access Fisio.
                        </div>
                        <Button variant="outline" className="w-full" disabled>
                            Em Breve (Autoalimentado)
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="h-5 w-5 text-primary" />
                            Perguntas Frequentes
                        </CardTitle>
                        <CardDescription>Respostas rápidas para dúvidas comuns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            Confira nossa seção de FAQ para resolver problemas simples imediatamente.
                        </div>
                        <Button variant="outline" className="w-full" disabled>
                            Em Breve
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            Contato Direto
                        </CardTitle>
                        <CardDescription>Fale com nossa equipe de suporte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            Para problemas técnicos ou dúvidas específicas, envie um email para nossa equipe.
                        </div>
                        <div className="flex flex-col gap-2">
                            <a href="mailto:accessfisio@gmail.com" className="w-full">
                                <Button className="w-full gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    accessfisio@gmail.com
                                </Button>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Precisa de atendimento urgente?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Nossa equipe monitora o email de suporte em horário comercial (09:00 - 18:00).
                    Para emergências fora deste horário, entre em contato com seu gestor administrativo.
                </p>
            </div>
        </div>
    )
}

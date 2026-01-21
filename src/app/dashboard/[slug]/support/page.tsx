import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Mail, Book, MessageCircle, FileQuestion, Calendar, Users, DollarSign, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda & Manual</h1>
                <p className="text-muted-foreground">Documentação completa e autoalimentada do sistema Access Fisio.</p>
            </div>

            <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="manual">📖 Manual do Sistema</TabsTrigger>
                    <TabsTrigger value="faq">❓ Perguntas Frequentes</TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                    <div className="grid gap-6">
                        {/* AGENDA */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" /> Agenda e Atendimentos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>Como criar um agendamento?</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>1. Acesse o menu <strong>Agenda</strong>.</p>
                                            <p>2. Clique em qualquer horário vazio na grade ou no botão <strong>"Novo Agendamento"</strong>.</p>
                                            <p>3. Selecione o <strong>Profissional</strong>, <strong>Local</strong> (Sala), <strong>Data</strong> e <strong>Horário</strong>.</p>
                                            <p>4. Busque o <strong>Paciente</strong> (ou cadastre um novo na hora).</p>
                                            <p>5. Escolha o <strong>Serviço</strong> e defina o Status Inicial.</p>
                                            <p>6. Clique em <strong>Salvar</strong>.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-2">
                                        <AccordionTrigger>O que significam as cores (Status)?</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            <ul className="list-disc pl-4 space-y-1">
                                                <li>🟡 <strong>Agendado</strong>: Confirmado mas ainda não chegou.</li>
                                                <li>🟢 <strong>Realizado</strong>: Paciente veio e atendimento ocorreu.</li>
                                                <li>🔴 <strong>Faltou</strong>: Paciente não compareceu.</li>
                                                <li>⚪ <strong>Cancelado</strong>: Horário liberado.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="item-3">
                                        <AccordionTrigger>Como bloquear horários (Férias/Ausências)?</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Clique no botão <strong>"Bloquear Horário"</strong> na agenda, defina o intervalo de datas/horas e adicione uma observação. Isso impede novos agendamentos no período.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* PACIENTES */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-green-500" /> Gestão de Pacientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="p-1">
                                        <AccordionTrigger>Cadastro e Prontuário</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>No menu <strong>Pacientes</strong>, você gerencia todo o ciclo de vida do cliente.</p>
                                            <p>Ao acessar um perfil, utilize as abas:</p>
                                            <ul className="list-disc pl-4">
                                                <li><strong>Dados</strong>: Informações cadastrais.</li>
                                                <li><strong>Histórico</strong>: Lista de agendamentos.</li>
                                                <li><strong>Prontuário</strong>: Evoluções clínicas (confidencial).</li>
                                                <li><strong>Anexos</strong>: Upload de arquivos/exames.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* FINANCEIRO */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-yellow-500" /> Financeiro</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="f-1">
                                        <AccordionTrigger>Como fazer a Conciliação Bancária (OFX)?</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground space-y-2">
                                            <p>1. Exporte o arquivo <strong>OFX</strong> do seu banco.</p>
                                            <p>2. Vá em <strong>Financeiro {'>'} Conciliação</strong> e arraste o arquivo.</p>
                                            <p>3. O sistema tentará casar automaticamente os valores com os agendamentos (Sugestão verde).</p>
                                            <p>4. Para despesas, o sistema mostrará em vermelho para você categorizar e criar.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="f-2">
                                        <AccordionTrigger>Relatório DRE</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            Acesse <strong>Financeiro {'>'} DRE</strong> para ver o resultado operacional (Lucro/Prejuízo) do período, com visão Gerencial ou Fiscal.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* CONFIGURAÇÕES */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-gray-500" /> Configurações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible>
                                    <AccordionItem value="c-1">
                                        <AccordionTrigger>Usuários e Permissões</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            <p>Crie novos usuários em <strong>Configurações {'>'} Usuários</strong>.</p>
                                            <p className="mt-2"><strong>Perfis:</strong></p>
                                            <ul className="list-disc pl-4">
                                                <li><strong>Master</strong>: Acesso total.</li>
                                                <li><strong>Gestor</strong>: Acesso administrativo.</li>
                                                <li><strong>Recepção</strong>: Acesso operacional (Agenda/Pacientes).</li>
                                                <li><strong>Profissional</strong>: Acesso restrito à própria agenda.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="faq">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perguntas Frequentes</CardTitle>
                            <CardDescription>Respostas rápidas para as dúvidas mais comuns.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="faq-1">
                                    <AccordionTrigger>Esqueci minha senha, como recupero?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Na tela de login, clique no link <strong>"Esqueci minha senha"</strong>. Você receberá um e-mail com instruções para redefinir. Verifique também sua caixa de Spam.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-2">
                                    <AccordionTrigger>Por que não vejo o menu Financeiro?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        O acesso ao menu Financeiro é restrito aos perfis <strong>Master</strong>, <strong>Gestor</strong> e <strong>Financeiro</strong>. Se você é um Profissional ou Recepção, esse menu não aparecerá para você.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-3">
                                    <AccordionTrigger>O sistema envia mensagem no WhatsApp?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Atualmente, a integração é manual (clique no botão WhatsApp no perfil do paciente). Estamos trabalhando em automações futuras para confirmação de consulta.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="faq-4">
                                    <AccordionTrigger>Como lanço uma despesa manual?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Vá em <strong>Financeiro {'>'} Transações</strong> e clique em <strong>"Nova Despesa"</strong> (ou Nova Transação com valor negativo). Preencha categoria e descrição.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Suporte Técnico</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Problemas técnicos ou erros no sistema? Entre em contato.
                                </p>
                                <a href="mailto:accessfisio@gmail.com">
                                    <Button variant="outline" className="w-full gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        accessfisio@gmail.com
                                    </Button>
                                </a>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Book className="h-5 w-5" /> Base de Conhecimento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Este manual é atualizado constantemente conforme novas funcionalidades são lançadas.
                                </p>
                                <Button className="w-full" disabled variant="secondary"> Versão 1.0.0 (Beta)</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

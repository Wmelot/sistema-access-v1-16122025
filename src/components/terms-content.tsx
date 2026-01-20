
export function TermsContent() {
    return (
        <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-6 text-slate-300">
                {/* Conteúdo dos termos */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-3">1. ACEITAÇÃO DOS TERMOS</h2>
                    <p>
                        Ao criar uma conta e utilizar o <strong>AXIOM Sistema</strong> ("Plataforma", "Serviço", "nós", "nosso"),
                        você ("Usuário", "Cliente", "você") concorda em cumprir e estar vinculado a estes Termos e Condições de Uso ("Termos").
                        Se você não concordar com qualquer parte destes Termos, não deverá utilizar nossos serviços.
                    </p>
                </section>

                <section className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4">
                    <h2 className="text-xl font-bold text-amber-400 mb-3">
                        ⚠️ 5. ARMAZENAMENTO E RETENÇÃO DE DADOS - LEIA COM ATENÇÃO
                    </h2>
                    <div className="space-y-3">
                        <p className="text-amber-200">
                            <strong className="text-amber-300">TODOS OS DADOS INSERIDOS DURANTE O PERÍODO TRIAL SERÃO ARMAZENADOS EM UM BANCO DE DADOS TEMPORÁRIO
                                E SERÃO AUTOMATICAMENTE EXCLUÍDOS APÓS 60 DIAS DO TÉRMINO DO PERÍODO TRIAL, CASO VOCÊ NÃO MIGRE PARA UM PLANO PAGO.</strong>
                        </p>

                        <div>
                            <h3 className="font-semibold text-white mb-2">Período de Retenção:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li><strong>Plano Trial:</strong> Dados mantidos por <strong>60 dias</strong> após o fim do trial</li>
                                <li><strong>Plano Pago Ativo:</strong> Dados mantidos indefinidamente enquanto a assinatura estiver ativa</li>
                                <li><strong>Plano Pago Cancelado:</strong> Dados mantidos por <strong>90 dias</strong> após o cancelamento</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-white mb-2">Avisos de Exclusão:</h3>
                            <p className="text-sm">
                                Você receberá avisos por email nos seguintes momentos:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                                <li>7, 3 e 1 dia antes do fim do período trial</li>
                                <li>7, 3 e 1 dia antes da exclusão definitiva dos dados</li>
                            </ul>
                        </div>

                        <div className="bg-red-950/30 border border-red-900/50 rounded p-3">
                            <h3 className="font-semibold text-red-400 mb-2">Exclusão Definitiva:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                                <li><strong>NÃO SERÁ POSSÍVEL RECUPERAR OS DADOS APÓS A EXCLUSÃO</strong></li>
                                <li>A exclusão inclui: pacientes, prontuários, agendamentos, avaliações, documentos, etc.</li>
                                <li>Você é responsável por fazer backup de seus dados</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">7. PRIVACIDADE E SEGURANÇA</h2>
                    <p>
                        Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Criptografia de dados em trânsito (SSL/TLS)</li>
                        <li>Criptografia de dados em repouso</li>
                        <li>Controle de acesso baseado em funções (RBAC)</li>
                        <li>Isolamento de dados por organização (RLS)</li>
                        <li>Backups regulares</li>
                        <li>Conformidade com LGPD (Lei nº 13.709/2018)</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">9. ISOLAMENTO DE DADOS</h2>
                    <p>
                        A Plataforma opera em modelo multi-tenant, onde cada Organização tem seus dados completamente isolados:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Seus dados <strong>NÃO</strong> são visíveis para outras Organizações</li>
                        <li>Seus dados <strong>NÃO</strong> são compartilhados com outras Organizações</li>
                        <li>Implementamos Row Level Security (RLS) para garantir isolamento</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">10. HIERARQUIA DE PERMISSÕES</h2>
                    <div className="space-y-2">
                        <div>
                            <h3 className="font-semibold text-emerald-400">Master (AXIOM):</h3>
                            <p className="text-sm">Proprietário da Plataforma com acesso administrativo ao sistema</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-400">Administrador da Organização:</h3>
                            <p className="text-sm">Proprietário/responsável pela Organização com controle total sobre seus dados</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-purple-400">Usuários da Organização:</h3>
                            <p className="text-sm">Profissionais e colaboradores com permissões definidas pelo Administrador</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">11. LIMITAÇÕES DE RESPONSABILIDADE</h2>
                    <p className="font-semibold text-amber-400">
                        NÃO SOMOS RESPONSÁVEIS por perda de dados resultante de:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Falha em fazer backup</li>
                        <li>Não migração para plano pago antes do fim do trial</li>
                        <li>Não exportação de dados antes da exclusão</li>
                        <li>Ações do próprio Usuário</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-white mb-3">14. LEI APLICÁVEL E FORO</h2>
                    <p>
                        Estes Termos são regidos pelas leis da República Federativa do Brasil.
                        Fica eleito o foro da Comarca de Belo Horizonte, Estado de Minas Gerais.
                    </p>
                </section>

                <section className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4">
                    <h2 className="text-xl font-bold text-emerald-400 mb-3">17. CONSENTIMENTO E DECLARAÇÃO</h2>
                    <p className="mb-3">
                        <strong>AO MARCAR A CAIXA "LI E ACEITO OS TERMOS E CONDIÇÕES" E CRIAR UMA CONTA, VOCÊ DECLARA QUE:</strong>
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>Leu, compreendeu e concorda com todos os termos acima</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>Tem capacidade legal para celebrar este contrato</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>Compreende que dados em plano trial serão excluídos após 60 dias</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>É responsável por fazer backup e exportar seus dados</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>Concorda com o processamento de dados conforme descrito</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>Está em conformidade com LGPD e regulamentações de saúde</span>
                        </li>
                    </ul>
                </section>

                <div className="text-center pt-6 border-t border-slate-700">
                    <p className="text-sm text-slate-500">
                        © 2026 AXIOM Sistema. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                        Versão 1.0 - Data de Vigência: 20 de janeiro de 2026
                    </p>
                </div>
            </div>
        </div>
    )
}

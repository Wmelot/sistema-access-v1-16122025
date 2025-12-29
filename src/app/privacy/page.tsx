import React from 'react'

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-700">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Política de Privacidade</h1>

            <p className="mb-4 text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Introdução</h2>
                <p className="mb-2">
                    A sua privacidade é importante para nós. Esta política de privacidade explica como a Access Fisioterapia ("Nós", "Controlador") coleta, usa e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Dados que Coletamos</h2>
                <p className="mb-2">Coletamos os seguintes tipos de dados para prestação dos nossos serviços de fisioterapia e gestão clínica:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><strong>Dados Pessoais:</strong> Nome, CPF, Telefone, E-mail, Endereço.</li>
                    <li><strong>Dados Sensíveis (Saúde):</strong> Histórico clínico, diagnósticos, evoluções de tratamento, imagens de exames.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">3. Finalidade do Tratamento</h2>
                <p className="mb-2">Usamos seus dados para:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Agendamento e confirmação de consultas.</li>
                    <li>Realização de prontuário eletrônico e acompanhamento clínico.</li>
                    <li>Faturamento e emissão de notas fiscais.</li>
                    <li>Cumprimento de obrigações legais (ex: guarda de prontuário por 20 anos).</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">4. Seus Direitos (Titular)</h2>
                <p className="mb-2">Você tem direito a:</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Confirmar a existência de tratamento de dados.</li>
                    <li>Acessar seus dados.</li>
                    <li>Corrigir dados incompletos ou desatualizados.</li>
                    <li>Revogar o consentimento a qualquer momento.</li>
                </ul>
                <p className="mt-2">Para exercer seus direitos, entre em contato via e-mail ou na recepção.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">5. Segurança</h2>
                <p className="mb-2">
                    Adotamos medidas técnicas robustas (Criptografia, Controle de Acesso Estrito) para proteger seus dados contra acesso não autorizado.
                </p>
            </section>

            <section className="mt-12 pt-8 border-t border-gray-200 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4 text-gray-900">6. Encarregado de Proteção de Dados (DPO)</h2>
                <p className="mb-4 text-gray-700">
                    A Access Fisioterapia preza pela transparência. Caso tenha dúvidas sobre esta política ou queira exercer seus direitos (como exportação ou atualização de dados), entre em contato com nosso Encarregado:
                </p>
                <div className="flex items-center gap-3 text-blue-700 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    <a href="mailto:dpo@access.com.br" className="hover:underline">dpo@access.com.br</a>
                </div>
            </section>
        </div>
    )
}

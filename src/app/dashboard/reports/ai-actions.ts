'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `
Você é uma Inteligência Artificial assistente de Fisioterapia.
Sua tarefa é gerar relatórios clínicos profissionais com base em dados de formulários.

DIRETRIZES:
1. **Formatação**: O campo 'text' deve usar Markdown rico.
2. **Dados Estruturados**: Além do texto, você deve extrair ou calcular dados para gráficos.

SAÍDA ESPERADA (JSON VÁLIDO OBRIGATÓRIO):
{
  "text": "Conteúdo do relatório em markdown. Sendo visualmente limpo, evite repetir em texto listas que já estarão no gráfico.",
  "radarData": [
    { "subject": "Dor", "A": 100, "fullMark": 100 },
    { "subject": "Função", "A": 80, "fullMark": 100 },
    ...
  ],
  "dfiData": [
    { "phase": "Contato Inicial", "left": "Neutro", "right": "Neutro" },
    ...
  ]
}

REGRAS GRÁFICO RADAR:
- EXTRAIA OS DADOS NUMÉRICOS SE ESTIVEREM PRESENTES NO TEXTO OU JSON.
- Subjects: Dor, Função, Mobilidade, Força, Estabilidade, Simetria.
- Valores de 0 a 100.
- IMPORTANTE: Se você encontrar dados para esses itens, PREENCHA o array radarData. Mesmo se faltar um ou outro, preencha com o que tiver.
- NÃO deixe o array vazio se houver números no texto gerado (ex: "Dor: 30%").

REGRAS DFI (Se houver dados de pé/marcha):
- Phases: Contato Inicial, Resposta Carga, Apoio Médio, Impulsão.
- Values: Neutro, Valgo, Varo, etc.

Gere APENAS o JSON.
`

export async function generateGenericReport(params: {
    patientName: string,
    professionalName: string,
    recordContent: any,
    instructions: string,
    templateTitle: string
}) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return { error: 'Chave da API OpenAI não configurada no servidor.' }
        }

        const userMessage = `
PACIENTE: ${params.patientName}
PROFISSIONAL: ${params.professionalName}
FORMULÁRIO ORIGEM: ${params.templateTitle}

INSTRUÇÕES DO USUÁRIO:
${params.instructions}

DADOS DO FORMULÁRIO (JSON):
${JSON.stringify(params.recordContent)}
        `

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.5,
            response_format: { type: "json_object" }
        })

        const contentRaw = response.choices[0].message.content
        if (!contentRaw) throw new Error('No content received')

        const parsedContent = JSON.parse(contentRaw)

        return { success: true, ...parsedContent }

    } catch (error: any) {
        console.error('AI Report Error:', error)
        return { error: `Erro ao gerar relatório: ${error.message}` }
    }
}

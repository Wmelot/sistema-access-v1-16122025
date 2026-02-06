
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY not configured' },
                { status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

        const formData = await request.formData()
        const file = formData.get('file') as File
        const isAcademic = formData.get('isAcademic') === 'true';

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            )
        }

        const arrayBuffer = await file.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')

        let promptText = "";

        if (isAcademic) {
            promptText = `
Você é um AVALIADOR SÊNIOR DO MEC (SINAES) com mais de 30 anos de experiência acadêmica no ensino superior e 10 anos de experiência em avaliações de curso nota 5.
Sua tarefa é ouvir o áudio do professor e TRANSFORMAR IMEDIATAMENTE em um relato técnico de alta densidade acadêmica.

REGRAS DE OURO (SEM EXCEÇÕES):
1. NÃO escreva "Transcrição", "Resumo" ou qualquer rótulo. Retorne APENAS o texto formal pronto para o relatório.
2. Use tom de terceira pessoa impessoal (ex: "Implementou-se", "Fomentou-se", "Observou-se").
3. NUNCA diga "O áudio diz" ou "O professor falou". 
4. O texto deve ser sucinto, elegante e satisfazer plenamente os indicadores de qualidade do MEC.
5. Utilize termos como: "Indissociabilidade ensino-pesquisa-extensão", "Metodologias Ativas de Aprendizagem", "Engajamento Propositivo", "Consolidação de Saberes", "Integração Ensino-Serviço".

CONTEÚDO DO ÁUDIO: Transcreva e formalize o que foi dito para encantar um avaliador do MEC.
`;
        } else {
            promptText = `O seu papel é transcrever e resumir o áudio de atendimento profissional.
Regras:
- NUNCA use asteriscos ou formatação markdown.
- Mantenha o texto limpo e direto.
- Se o áudio for muito curto, apenas transcreva literalmente.`;
        }

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type || 'audio/mp3',
                    data: base64Audio
                }
            },
            {
                text: promptText
            }
        ])

        const response = await result.response
        const rawText = response.text().trim();

        // Limpeza final para garantir que não apareçam rótulos
        const cleanText = rawText
            .replace(/^(Transcrição|Resumo|Relato|Formalização):\s*/gi, '')
            .replace(/^"(.*)"$/g, '$1');

        return NextResponse.json({ text: cleanText })

    } catch (error: any) {
        console.error('Gemini Transcribe Error:', error)
        return NextResponse.json(
            { error: error.message || 'Error processing audio' },
            { status: 500 }
        )
    }
}

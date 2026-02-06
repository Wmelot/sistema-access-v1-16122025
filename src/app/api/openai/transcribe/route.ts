
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
Você é um assistente acadêmico. Transcreva o áudio do professor e formalize a linguagem para um relatório técnico.
REGRAS:
1. Seja fiel ao que foi dito no áudio. NÃO adicione informações, conceitos ou buzzwords que o professor não mencionou.
2. Formate o texto em linguagem impessoal e profissional (voz passiva).
3. NÃO use rótulos como "Transcrição:". Retorne apenas o texto limpo.
4. Se o áudio for confuso, foque em transcrever o que for compreensível de forma organizada.
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

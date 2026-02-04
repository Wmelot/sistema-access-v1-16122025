
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60 // 1 minute max for Vercel Hobby, adjust if Pro

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

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            )
        }

        const arrayBuffer = await file.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type || 'audio/mp3',
                    data: base64Audio
                }
            },
            {
                text: `O seu papel é transcrever e resumir o atendimento profissional.
Regras CRITICAMENTE OBRIGATÓRIAS:
- NUNCA use o caractere de asterisco (*) ou cerquilha (#) ou colchetes ou pipe.
- NÃO use NENHUMA formatação Markdown (negrito, itálico, etc).
- Se houver tópicos, use apenas um hifem (-) no início da linha.
- Mantenha o texto limpo, profissional e direto.
- Se o áudio for muito curto (menos de 3 segundos), diga apenas o que foi ouvido, sem criar relatórios.
- Se for um atendimento longo, organize em parágrafos simples.
- Use termos técnicos de fisioterapia.`
            }
        ])

        const response = await result.response
        const text = response.text()

        return NextResponse.json({ text })

    } catch (error: any) {
        console.error('Gemini Transcribe Error:', error)
        return NextResponse.json(
            { error: error.message || 'Error processing audio' },
            { status: 500 }
        )
    }
}


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
                text: `Você é um assistente especialista em Fisioterapia Traumato-ortopédica. Analise o áudio fornecido, que pode ser uma conversa entre terapeuta e paciente ou um ditado do terapeuta.

Se for conversa: Diferencie as perguntas do profissional e respostas do paciente.

Ignore conversas informais irrelevantes.

Gere um relatório clínico técnico estruturado (Anamnese ou Evolução) resumindo os pontos chave.

Use terminologia técnica adequada (ex: troque termos leigos por termos anatômicos/patológicos corretos).

Corrija erros gramaticais.

Retorne o resultado em formato Markdown limpo.`
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

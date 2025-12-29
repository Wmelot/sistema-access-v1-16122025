
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60 // 1 minute max for Vercel Hobby, adjust if Pro

export async function POST(request: Request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            )
        }

        // Whisper requires a File object with name and type
        // The formData 'file' from client is standard File but verify compatibility
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'pt', // Force Portuguese for better accuracy in this context
            response_format: 'json',
        })

        return NextResponse.json({ text: transcription.text })

    } catch (error: any) {
        console.error('OpenAI Transcribe Error:', error)
        return NextResponse.json(
            { error: error.message || 'Error processing audio' },
            { status: 500 }
        )
    }
}

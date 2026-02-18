import { NextResponse } from 'next/server';
import { analyzeConsultation } from '@/lib/ai/gemini';

export const maxDuration = 60; // Increase timeout for AI processing

export async function POST(req: Request) {
    try {
        const { transcription } = await req.json();

        if (!transcription) {
            return NextResponse.json({ error: "Transcrição não fornecida" }, { status: 400 });
        }

        const data = await analyzeConsultation(transcription);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Route AI Consultation Analysis Error:", error);
        return NextResponse.json({ error: error.message || "Erro interno na análise" }, { status: 500 });
    }
}

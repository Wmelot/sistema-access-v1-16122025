import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; // Increase timeout for AI processing

export async function POST(req: Request) {
    try {
        const { action, text, data, systemPrompt } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let finalPrompt = systemPrompt || "Você é um especialista.";

        if (text) {
            finalPrompt += `\n\nTexto de entrada do usuário:\n${text}`;
        }

        if (data) {
            finalPrompt += `\n\nDados do formulário do paciente:\n${JSON.stringify(data, null, 2)}`;
        }

        const result = await model.generateContent(finalPrompt);
        const responseText = result.response.text().trim();

        return NextResponse.json({ success: true, result: responseText });
    } catch (error: any) {
        console.error("AI Copilot Error:", error);
        return NextResponse.json({ error: error.message || "Erro interno na análise da IA" }, { status: 500 });
    }
}

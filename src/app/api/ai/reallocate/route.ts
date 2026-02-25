import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    if (!apiKey) return NextResponse.json({ error: "API Key not configured" }, { status: 500 });

    try {
        const { topics, availableHours, strategy } = await req.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        VOCÊ É UM GESTOR ACADÊMICO. 
        Tenho uma lista de tópicos que somam mais horas do que o disponível (${availableHours}h).
        Sua missão é ajustar a carga horária (classesNeeded) de cada tópico para que a SOMA TOTAL SEJA EXATAMENTE OU MENOR QUE ${availableHours}h.

        ESTRATÉGIA: ${strategy === 'linear' ? 'Redução proporcional linear de todos os itens.' : 'Priorizar temas centrais, agrupando ou reduzindo drasticamente temas secundários.'}

        LISTA DE TÓPICOS ATUAIS:
        ${JSON.stringify(topics.map((t: any) => ({ id: t.id, title: t.title, currentHours: t.classesNeeded })))}

        RETORNE O JSON DOS TÓPICOS COM AS NOVAS CARGAS HORÁRIAS:
        {
          "topics": [
            { "id": "...", "classesNeeded": 2 }
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) return NextResponse.json({ error: "Erro ao reajustar" }, { status: 500 });
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

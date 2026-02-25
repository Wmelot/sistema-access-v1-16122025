import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { courseName, topicsCount = 15 } = await req.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        ATUE COMO UM ESPECIALISTA EM DESIGN INSTRUCCIONAL UNIVERSITÁRIO.
        Gere uma lista de ${topicsCount} tópicos/unidades de ensino para a disciplina: "${courseName}".
        
        REGRAS:
        1. Os tópicos devem seguir uma progressão lógica (do básico ao avançado).
        2. Cada tópico deve ter um título claro e profissional.
        3. Atribua uma carga horária sugerida (classesNeeded) entre 2 e 4 horas para cada um.
        4. Identifique se é um tópico prático ou teórico.
        
        RETORNE APENAS UM JSON NO SEGUINTE FORMATO:
        {
          "topics": [
            {
              "title": "Introdução à...",
              "classesNeeded": 2,
              "isPractical": false,
              "methodology": "Aula Dialogada",
              "resources": ["Projetor"]
            }
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return NextResponse.json({ error: "Falha ao gerar tópicos" }, { status: 500 });
        }

        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

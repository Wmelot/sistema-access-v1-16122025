import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada.");
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    });
};

export async function POST(req: NextRequest) {
    try {
        const { picot } = await req.json();

        const prompt = `
            ATUE COMO UM ESPECIALISTA EM PBE E BIBLIOTECÁRIO ACADÊMICO.
            Sua tarefa é transformar um contexto clínico PICOT em estratégias de busca otimizadas.

            CONTEXTO PICOT FORNECIDO:
            - P (Paciente): ${picot.p || 'Não informado'}
            - I (Intervenção): ${picot.i || 'Não informado'}
            - C (Controle): ${picot.c || 'Não informado'}
            - O (Outcome): ${picot.o || 'Não informado'}
            - T (Tempo): ${picot.t || 'Não informado'}

            INSTRUÇÕES CRÍTICAS:
            1. Traduza os termos para o Inglês Técnico (MeSH/DeCS).
            2. Gere strings de busca com operadores booleanos (AND, OR, NOT).
            3. Você DEVE retornar exatamente a estrutura JSON abaixo, sem textos adicionais.

            ESTRUTURA JSON OBRIGATÓRIA:
            {
              "translated_terms": { "p": "...", "i": "...", "c": "...", "o": "..." },
              "mesh_terms": ["termo1", "termo2"],
              "search_strategies": {
                "pubmed": "string completa de busca para pubmed",
                "pedro": "string simplificada para pedro",
                "cochrane": "string para cochrane"
              }
            }
        `;

        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Extração robusta de JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("A IA não retornou um formato de dados válido.");
        }

        const data = JSON.parse(jsonMatch[0]);

        // Validação mínima da estrutura
        if (!data.search_strategies || !data.search_strategies.pubmed) {
            throw new Error("A IA gerou uma estratégia incompleta.");
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Search Strategy API Error:', error);
        return NextResponse.json({
            error: 'Erro na geração da busca',
            details: error.message
        }, { status: 500 });
    }
}

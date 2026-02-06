import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const { text, field, category } = payload;

        if (!text || text.length < 5) {
            return NextResponse.json({ error: 'Texto muito curto para análise.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Configuração de IA ausente no servidor.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.1, // Reduzido para maior consistência técnica
                topP: 0.8,
                maxOutputTokens: 1000,
            }
        });

        const prompt = `
Você é um ASSISTENTE TÉCNICO DE REDAÇÃO ACADÊMICA especializado no SINAES/MEC.
Sua tarefa é REFINAR e FORMALIZAR o texto de um docente, mantendo a FIDELIDADE TOTAL aos fatos narrados.

INSTRUÇÕES CRÍTICAS:
1. NUNCA invente dados, nomes, datas ou resultados que não estejam no texto original.
2. Se o texto original for curto, mantenha-o objetivo, apenas formalizando a linguagem.
3. Use terminologia técnica do MEC (ex: "Articulação curricular", "Metodologia ativa", "Desenvolvimento de competências") APENAS se fizer sentido com o que foi relatado.
4. Transforme rascunhos em linguagem impessoal (voz passiva).
5. Retorne APENAS o texto refinado, sem comentários ou aspas.

CONTEXTO:
- Categoria: ${category || 'Geral'}
- Campo: ${field || 'Descrição'}

TEXTO DO DOCENTE:
"${text}"

Retorne o texto com redação profissional, acadêmica e fiel.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let improvedText = response.text().trim();

        // Limpeza de segurança
        improvedText = improvedText
            .replace(/^(Refinamento|Texto Sugerido|Sugestão|Relat[oó]):\s*/gi, '')
            .replace(/^"(.*)"$/g, '$1');

        if (!improvedText) {
            throw new Error("IA retornou texto vazio.");
        }

        return NextResponse.json({ improvedText });

    } catch (error: any) {
        console.error('Academic AI Improvement Error:', error);
        return NextResponse.json({
            error: 'Falha ao processar melhoria com IA.'
        }, { status: 500 });
    }
}

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
Você é um AVALIADOR SÊNIOR E PRECEPTOR DO MEC/SINAES com 30 anos de experiência em gestão de ensino superior e nota máxima em avaliações de curso.
Sua missão é REESCREVER o texto de um docente para que ele tenha o brilho e a precisão técnica necessária para uma NOTA 5.

REGRAS CRÍTICAS:
1. NÃO use introduções, explicações ou aspas. Retorne APENAS o texto refinado.
2. NUNCA use as palavras "Transcrição", "Resumo", "Melhoria" ou "Sugestão".
3. Use a voz passiva e impessoal (ex: "Articulou-se", "Efetivou-se", "Evidenciou-se").
4. O texto deve soar como se tivesse sido escrito por um avaliador experiente que conhece todos os indicadores do SINAES.
5. Incorpore conceitos como: "Indissociabilidade do tripé acadêmico", "Transversalidade de conteúdos", "Abordagem por competências", "Acuidade diagnóstica", "Protagonismo e Autonomia Discente".

CONTEXTO:
- Categoria: ${category || 'Geral'}
- Campo: ${field || 'Descrição'}

TEXTO PARA REFINAMENTO:
"${text}"

Retorne o texto densificado, formal e pronto para satisfazer plenamente o MEC.
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

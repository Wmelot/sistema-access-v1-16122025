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
Você é um CONSULTOR DE ESCRITA TÉCNICA especializado em documentação acadêmica para o MEC/SINAES.
Sua tarefa é REFINAR e FORMALIZAR o texto do docente, agindo como um revisor discreto e sofisticado.

INSTRUÇÕES CRÍTICAS:
1. FIDELIDADE AOS FATOS: Jamais invente métricas, nomes ou dados. Use estritamente o que o docente forneceu.
2. POSTURA NÃO-INVASIVA: Se o texto original já estiver claro, formal e bem estruturado, realize AJUSTES MÍNIMOS ou retorne o original.
3. FOCO EM RASCUNHOS: Intervenha de forma mais estruturante apenas se o texto for manifestamente um rascunho (abreviado, informal ou sem nexo gramatical).
4. TERMINOLOGIA MEC: Utilize termos como "interdisciplinaridade", "atividades integrativas", "evidência de aprendizagem" apenas se o contexto permitir.
5. VOZ IMPESSOAL: Prefira o uso da voz passiva e termos acadêmicos (ex: "observou-se", "concluiu-se").

CONDIÇÃO DE RETORNO:
Retorne APENAS o texto revisado. Sem introduções, justificativas ou aspas.

CONTEXTO:
- Categoria SINAES: ${category || 'Geral'}
- Campo do Formulário: ${field || 'Descrição'}

TEXTO ORIGINAL DO DOCENTE:
"${text}"
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

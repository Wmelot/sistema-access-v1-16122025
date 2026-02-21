
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

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

        console.log('[API] Processing POST /api/openai/transcribe');
        const body = await request.json();
        const base64Audio = body.base64Audio;
        const isAcademic = body.isAcademic === true;

        if (!base64Audio) {
            console.log('[API] No audio provided');
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
        }

        console.log(`[API] Base64 received (length: ${base64Audio.length})`);

        let promptText = "";

        if (isAcademic) {
            promptText = `
Você é um assistente acadêmico. Transcreva o áudio do professor e formalize a linguagem para um relatório técnico.
REGRAS:
1. Seja fiel ao que foi dito no áudio. NÃO adicione informações, conceitos ou buzzwords que o professor não mencionou.
2. Formate o texto em linguagem impessoal e profissional (voz passiva).
3. NÃO use rótulos como "Transcrição:". Retorne apenas o texto limpo.
4. Se o áudio for confuso, foque em transcrever o que for compreensível de forma organizada.
`;
        } else {
            promptText = `Você é um Fisioterapeuta sênior com mais de 25 anos de experiência clínica, especialista no reconhecimento de termos técnicos de todas as áreas da fisioterapia. Você conhece profundamente, de capa a capa, manuais de avaliação musculoesquelética de David J. Magee, Mark Dutton, e as referências essenciais de avaliação clínica. Você possui conhecimento extenso em anatomia, biomecânica e, principalmente, em Prática Baseada em Evidências (PBE).

        Sua tarefa: Ouvir, compreender e transcrever o relato, organizando as informações.
        REGRAS DETALHADAS:
        1. FILTRE CHIT-CHAT: Ignore assuntos irrelevantes, conversas paralelas, risadas e saudações comuns. Transcreva SOMENTE as declarações de valor clínico.
        2. ORGANIZE CONTEXTUALMENTE: Extraia e já identifique a qual parte da avaliação cada fala pertence (ex: Queixa Principal (QP), História da Moléstia Atual (HMA), História Pregressa (HP), Exame Físico, Conduta).
        3. VOCABULÁRIO TÉCNICO: Corrija a gramática e converta termos leigos para técnicos quando apropriado, mantendo a verdade da queixa do paciente.
        4. FORMATAÇÃO: NUNCA use marcadores em markdown (asteriscos, negritos). Mantenha o texto limpo, use hifens e texto corrido.
        5. IMPESSOAL: Redija sem assinaturas ou introduções da IA.`;
        }

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'audio/webm',
                    data: base64Audio
                }
            },
            {
                text: promptText
            }
        ])

        const response = await result.response
        const rawText = response.text().trim();

        // Limpeza final para garantir que não apareçam rótulos
        const cleanText = rawText
            .replace(/^(Transcrição|Resumo|Relato|Formalização):\s*/gi, '')
            .replace(/^"(.*)"$/g, '$1');

        return NextResponse.json({ text: cleanText })

    } catch (error: any) {
        console.error('Gemini Transcribe Error:', error)
        return NextResponse.json(
            { error: error.message || 'Error processing audio' },
            { status: 500 }
        )
    }
}

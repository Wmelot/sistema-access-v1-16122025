import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import { SPIN_KNOWLEDGE_BASE } from '@/features/evidence-auditor/constants/spin-criteria';

// Configuração do Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const picot = formData.get('picot') as string; // Opcional: Contexto PICOT

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // 1. Extração de Texto do PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdf(buffer);
        const articleText = pdfData.text; // Texto bruto do artigo

        // Limitador de segurança (embora Gemini 1.5 aguente muito, cortamos livros gigantes)
        const truncatedText = articleText.slice(0, 100000);

        // 2. Montagem do Prompt de Auditoria
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
ATUE COMO UM AUDITOR SÊNIOR DE PRÁTICA BASEADA EM EVIDÊNCIA (PBE).
SUA MISSÃO: Auditar o artigo científico abaixo em busca de "SPIN" (Viés de Apresentação), seguindo estritamente as diretrizes da nossa Base de Conhecimento.

--- INÍCIO DA LEI (BASE DE CONHECIMENTO) ---
${SPIN_KNOWLEDGE_BASE}
--- FIM DA LEI ---

CONTEXTO DO USUÁRIO (PICOT): ${picot || 'Não informado'}

TEXTO DO ARTIGO PARA ANÁLISE:
${truncatedText}

---
INSTRUÇÕES DE RESPOSTA:
Analise o Resumo vs. Resultados, Título vs. P-Valor, e Conclusão vs. Desfecho Primário.
Retorne APENAS um objeto JSON válido (sem markdown) com esta estrutura exata:
{
  "verdict_score": number, // 1 (Crítico/Alto Risco) a 5 (Excelente/Sem Spin)
  "spin_detected": boolean,
  "spin_type": string | null, // Ex: "Troca de Desfecho", "Título Enganoso" ou null
  "explanation": string, // Explique tecnicamente onde está o erro (ex: "Autor cita p=0.06 como 'tendência'...")
  "clinical_translation": {
    "outcome": string, // O desfecho principal avaliado
    "result_diff": string, // Ex: "Diferença de 1.2 pontos na EVA"
    "statistical_significance": string // "Não Significativo (p=0.12)" ou "Significativo (p<0.05)"
  },
  "recommendation": string // Veredito curto para o clínico (ex: "Não altere sua conduta baseado neste estudo.")
}
`;

        // 3. Chamada à IA
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Limpeza do JSON (caso a IA mande \`\`\`json ... \`\`\`)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResponse = JSON.parse(text);

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error('Erro na Auditoria:', error);
        return NextResponse.json(
            { error: 'Falha ao processar o artigo. O arquivo pode estar corrompido ou protegido.' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SPIN_KNOWLEDGE_BASE } from '@/features/evidence-auditor/constants/spin-criteria';

export const runtime = 'nodejs'; // FORCE Node.js to support pdf-parse (fs/buffer)
export const dynamic = 'force-dynamic';

// Configuração do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use eval('require') to bypass ESM/CJS bundling issues with pdf-parse in Next.js
const pdf = typeof window === 'undefined' ? eval('require')('pdf-parse') : null;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const picot = formData.get('picot') as string;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let pdfData;
        try {
            // Since we added pdf-parse to serverExternalPackages, direct use should work
            pdfData = await pdf(buffer);
            console.log('PDF parsed successfully, length:', pdfData.text?.length);
        } catch (parseErr: any) {
            console.error('Core PDF Parse Error:', parseErr);
            throw new Error(`O processador de PDF falhou ao ler o arquivo: ${parseErr.message || 'Erro interno no motor de PDF'}`);
        }

        const articleText = pdfData.text; // Texto bruto do artigo

        // Limitador de segurança (embora Gemini 1.5 aguente muito, cortamos livros gigantes)
        const truncatedText = articleText.slice(0, 100000);

        // 2. Montagem do Prompt de Auditoria
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
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

        console.log('Gemini Raw Response:', text);

        // Limpeza do JSON (mais robusta)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Falha ao extrair JSON da resposta:', text);
            throw new Error('A IA não retornou um formato JSON válido.');
        }

        const cleanedText = jsonMatch[0];
        try {
            const jsonResponse = JSON.parse(cleanedText);
            return NextResponse.json(jsonResponse);
        } catch (parseError: any) {
            console.error('Erro ao fazer o parse do JSON limpo:', cleanedText);
            console.error('Parse Error Details:', parseError);
            throw new Error(`Erro de processamento de dados da IA: ${parseError.message}`);
        }
    } catch (error: any) {
        console.error('Erro na Auditoria (Full Error):', error);

        // Se for um erro do parser de PDF, vamos detalhar
        const isPdfError = error.stack?.includes('pdf-parse') || error.message?.includes('PDF');

        return NextResponse.json(
            {
                error: `Falha ao processar o artigo: ${error.message || 'Erro desconhecido'}`,
                details: isPdfError ? 'Ocorreu um erro ao extrair o texto do PDF. Tente outro arquivo.' : undefined
            },
            { status: 500 }
        );
    }
}

// 1. Imports
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SPIN_KNOWLEDGE_BASE } from '@/features/evidence-auditor/constants/spin-criteria';

export const runtime = 'nodejs'; // FORCE Node.js to support pdf-parse (fs/buffer)
export const dynamic = 'force-dynamic';

// Configuração do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

        // Carregamento resiliente do pdf-parse
        let pdf;
        try {
            // @ts-ignore
            const lib = eval('require')('pdf-parse');
            pdf = typeof lib === 'function' ? lib : (lib?.default || lib);

            if (typeof pdf !== 'function' && lib && typeof lib === 'object') {
                const keys = Object.keys(lib);
                for (const key of keys) {
                    if (typeof lib[key] === 'function') {
                        pdf = lib[key];
                        break;
                    }
                }
            }
        } catch (importErr: any) {
            console.error('Core PDF Load Error:', importErr);
            throw new Error('Falha ao carregar o motor de PDF.');
        }

        if (typeof pdf !== 'function') {
            throw new Error('O motor de PDF não retornou uma função válida.');
        }

        let pdfData;
        try {
            // pdf-parse expect a buffer
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
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.1, // Baixa temperatura para manter o rigor técnico
                responseMimeType: "application/json"
            }
        });
        const prompt = `
ATUE COMO UM AUDITOR SÊNIOR DE PRÁTICA BASEADA EM EVIDÊNCIA (PBE) E METODOLOGIA CIENTÍFICA.
SUA MISSÃO: Auditar o artigo científico abaixo em busca de "SPIN" (Viés de Apresentação e Relato), seguindo estritamente as diretrizes da nossa Base de Conhecimento.

--- INÍCIO DA LEI (BASE DE CONHECIMENTO) ---
${SPIN_KNOWLEDGE_BASE}
--- FIM DA LEI ---

CONTEXTO DO USUÁRIO (PICOT): ${picot || 'Não informado'}

TEXTO DO ARTIGO PARA ANÁLISE:
${truncatedText}

---
INSTRUÇÕES DE RESPOSTA (Obrigatório seguir):
1. Verifique se o desfecho primário definido nos Métodos é o mesmo enfatizado no Resumo.
2. Identifique se o autor utiliza termos como "tendência de melhoria" para resultados não significativos (p > 0.05).
3. Avalie se o Título do artigo induz a uma conclusão mais forte do que os dados sugerem.
4. Compare a magnitude do efeito (tamanho do efeito) com a significância estatística.

Retorne APENAS um objeto JSON válido com esta estrutura exata:
{
  "verdict_score": number, // 1 (Crítico/Alto Risco) a 5 (Excelente/Sem Spin)
  "spin_detected": boolean,
  "spin_type": string | null, // Ex: "Troca de Desfecho", "Título Enganoso", "Linguagem Inapropriada"
  "explanation": string, // Explicação técnica e direta focada na metodologia.
  "clinical_translation": {
    "outcome": string, // O desfecho principal real detectado
    "result_diff": string, // A diferença numérica real encontrada entre os grupos
    "statistical_significance": string // "Não Significativo (p=0.XX)" ou "Significativo (p<0.XX)"
  },
  "recommendation": string // Veredito para o clínico (ex: "Não mude sua conduta. O estudo falhou no desfecho primário.")
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

            // Log the audit action
            try {
                const { logAction } = await import('@/lib/logger');
                await logAction('AUDIT_EVIDENCE', {
                    filename: file.name,
                    verdict: jsonResponse.verdict_score,
                    spin_detected: jsonResponse.spin_detected
                });
            } catch (logErr) {
                console.error('Failed to log audit action:', logErr);
            }

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

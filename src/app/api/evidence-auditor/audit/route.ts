// 1. Imports
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SPIN_KNOWLEDGE_BASE } from '@/features/evidence-auditor/constants/spin-criteria';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Gemini safely
const getModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada no servidor.");
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const picot = formData.get('picot') as string;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        // Buffer conversion
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Robust PDF loading logic
        let pdfParse;
        try {
            // Using eval-require to bypass build-time checks if needed or standard require
            // @ts-ignore
            const lib = require('pdf-parse');
            pdfParse = typeof lib === 'function' ? lib : (lib?.default || lib);

            // Check if it's strictly a function
            if (typeof pdfParse !== 'function' && lib && typeof lib === 'object') {
                for (const key of Object.keys(lib)) {
                    if (typeof lib[key] === 'function') {
                        pdfParse = lib[key];
                        break;
                    }
                }
            }
        } catch (importErr: any) {
            console.error('Import Error (pdf-parse):', importErr);
            return NextResponse.json({
                error: 'Falha no servidor',
                details: 'O motor de PDF não pôde ser carregado. Tente novamente em instantes.'
            }, { status: 500 });
        }

        if (typeof pdfParse !== 'function') {
            return NextResponse.json({
                error: 'Erro de biblioteca',
                details: 'O processador de PDF carregou de forma incorreta.'
            }, { status: 500 });
        }

        let pdfData;
        try {
            // Some PDFs might trigger internal errors in pdf-parse
            pdfData = await pdfParse(buffer);
        } catch (parseErr: any) {
            console.error('Core PDF parsing error:', parseErr);
            return NextResponse.json({
                error: 'Arquivo ilegível',
                details: 'O PDF enviado é inválido, está corrompido ou protegido. Salve uma nova via do PDF e tente novamente.'
            }, { status: 422 });
        }

        const articleText = pdfData?.text || "";
        if (!articleText.trim()) {
            return NextResponse.json({
                error: 'Texto não encontrado',
                details: 'O PDF parece ser apenas uma imagem (scan). O auditor precisa de PDFs pesquisáveis (com texto selecionável).'
            }, { status: 422 });
        }

        // Clean and truncate text for AI (approx 85k chars is safe for Flash)
        const truncatedText = articleText.slice(0, 85000);

        const model = getModel();
        const prompt = `
ATUE COMO UM AUDITOR SÊNIOR DE PBE.
SUA MISSÃO: Auditar o artigo científico abaixo em busca de "SPIN" (Viés de Apresentação).

--- BASE DE CONHECIMENTO ---
${SPIN_KNOWLEDGE_BASE}
---

CONTEXTO PICOT: ${picot || 'Não informado'}

TEXTO DO ARTIGO:
${truncatedText}

---
Retorne APENAS um JSON válido seguindo exatamente esta estrutura:
{
  "verdict_score": number, 
  "spin_detected": boolean,
  "spin_type": string | null,
  "explanation": string,
  "clinical_translation": {
    "outcome": string,
    "result_diff": string,
    "statistical_significance": string
  },
  "recommendation": string
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON Extraction
        let jsonResponse;
        try {
            const cleanJson = text.match(/\{[\s\S]*\}/)?.[0] || text;
            jsonResponse = JSON.parse(cleanJson);
        } catch (jsonErr) {
            console.error('AI JSON Parse Error:', text);
            return NextResponse.json({
                error: 'Erro na resposta da IA',
                details: 'A IA gerou dados em formato inválido. Tente novamente.'
            }, { status: 500 });
        }

        // Logging (background)
        try {
            const { logAction } = await import('@/lib/logger');
            await logAction('AUDIT_EVIDENCE', {
                filename: file.name,
                verdict: jsonResponse.verdict_score,
                spin_detected: jsonResponse.spin_detected
            });
        } catch (e) { }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('Auditor Critical Error:', error);
        return NextResponse.json({
            error: 'Erro interno no Auditor',
            details: error.message || 'Erro desconhecido'
        }, { status: 500 });
    }
}

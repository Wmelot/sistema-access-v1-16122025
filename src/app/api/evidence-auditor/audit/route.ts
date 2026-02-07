// 1. Imports
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SPIN_KNOWLEDGE_BASE } from '@/features/evidence-auditor/constants/spin-criteria';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Gemini safely
const getModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurada no servidor.");
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
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const picotData = JSON.parse(formData.get('picot') as string || '{}');
        const protocolsSummary = formData.get('protocols') as string || 'Nenhum protocolo cadastrado.';

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        const picotSummary = `
           - PACIENTE (P): ${picotData.p || 'Não informado'}
           - INTERVENÇÃO (I): ${picotData.i || 'Não informado'}
           - CONTROLE (C): ${picotData.c || 'Não informado'}
           - DESFECHO (O): ${picotData.o || 'Não informado'}
           - TEMPO (T): ${picotData.t || 'Não informado'}
        `;

        console.log(`Auditor: Recebido arquivo ${file.name} (${file.size} bytes)`);

        // Buffer conversion to Base64 for Gemini Native PDF Support
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const model = getModel();
        const promptText = `
ATUE COMO UM AUDITOR SÊNIOR DE PBE (PRÁTICA BASEADA EM EVIDÊNCIAS), ESPECIALISTA EM METODOLOGIA CIENTÍFICA.
SUA MISSÃO: Analisar rigorosamente o artigo científico fornecido em PDF, expondo falhas metodológicas e interpretativas.

--- IDIOMA DE RESPOSTA ---
Você deve responder TODOS os campos de texto do JSON em PORTUGUÊS (Brasil).

--- RIGOR NA JUSTIFICATIVA DE VIÉS ---
Se você classificar o risco de viés como "High" ou "Moderate", você DEVE detalhar o porquê na "explanation". 
Para REVISÕES SISTEMÁTICAS (Cochrane ou outras), considere:
- Se a busca está desatualizada (mais de 5-10 anos).
- Se houve alta heterogeneidade (I²) sem explicação.
- Se as conclusões ignoram a baixa qualidade dos estudos primários incluídos (AMSTAR/ROBIS).
- Se houver SPIN na conclusão (ex: resultados não significativos descritos como "tendência de melhora").

--- REGRAS DE OURO ---
1. SEM CHUTÔMETROS: Se os dados não sustentam uma conclusão, aponte isso claramente.
2. RIGOR METODOLÓGICO: Diferencie correlação de causalidade. Verifique se o desfecho primário foi alcançado.
3. TRADUÇÃO CLÍNICA: Extraia o efeito real e o IC95% se houver.
4. CÁLCULO DE EFEITO: Se faltar Cohen's d ou SMD, estime com base em médias e DP.

--- BASE DE CONHECIMENTO DE SPIN (VIÉS) ---
${SPIN_KNOWLEDGE_BASE}

--- PROTOCOLOS EXISTENTES NO SISTEMA ---
${protocolsSummary}

--- CONTEXTO PICOT (Desejado pelo usuário) ---
${picotSummary}

--- TAREFA ---
1. Analise o documento PDF. Identifique TIPO DE ESTUDO e QUALIDADE METODOLÓGICA.
2. Identifique o TIPO DE ESTUDO (Ex: Ensaio Clínico Randomizado, Revisão Sistemática, etc).
3. Verifique se a revista consta na Beall's List.
4. Identifique o Fator de Impacto (JCR/SJR).
5. Avalie o SPIN e o RISCO DE VIÉS detalhadamente.
6. Forneça um resumo detalhado da metodologia (Participantes, grupos, intervenções, dosagens).
7. Verifique se este artigo se encaixa em algum dos PROTOCOLOS EXISTENTES.
8. Extraia os dados estruturados.

Retorne APENAS o JSON (Português):
{
  "verdict_score": number (0-5), 
  "spin_detected": boolean,
  "spin_type": string | null,
  "study_type": string,
  "journal_info": {
     "name": string,
     "is_predatory": boolean,
     "predatory_evidence": string | null,
     "impact_factor": string
  },
  "methodological_quality": string,
  "bias_risk": "Low" | "Moderate" | "High",
  "explanation": string (JUSTIFICATIVA DETALHADA DO RISCO DE VIÉS E QUALIDADE),
  "calculated_effect_size": string,
  "author_conclusion": string,
  "real_conclusion": string,
  "methodology_summary": {
     "participants": string,
     "groups": string,
     "interventions": string,
     "dosage": string
  },
  "clinical_translation": {
    "outcome": string,
    "result_diff": string,
    "statistical_significance": string
  },
  "recommendation": string,
  "protocol_suggestion": {
     "match_found": boolean,
     "protocol_id": string | null,
     "suggested_title": string,
     "suggested_region": string,
     "reason": string
  },
  "structured_data": {
     "titulo": string,
     "tipo_estudo": string,
     "autor": string,
     "ano": string,
     "nota_qualidade": string,
     "resumo_educativo": string,
     "pontos_chave": string[],
     "analise_antispin": string,
     "doi_link": string | null
  }
}
`;

        // Modern way: Send PDF as inlineData directly to Gemini
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            },
            promptText
        ]);

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
                error: 'Falha na IA',
                details: 'O cérebro da IA gerou uma resposta mal formatada. Tente novamente.'
            }, { status: 500 });
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('Auditor Critical Error:', error);
        return NextResponse.json({
            error: 'Erro no Processamento',
            details: error.message || 'Houve um problema na comunicação com o motor de inteligência clinical.'
        }, { status: 500 });
    }
}

"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { REGIONAL_EVIDENCE_BASE } from "@/lib/ai/prompts";

const SUGGESTION_PROMPT = `
Você é um Fisioterapeuta Especialista em Diagnóstico Cinesiológico e Prática Baseada em Evidências (PBE).
Sua tarefa é analisar o relato de um paciente (HMA) e a região afetada para sugerir os melhores testes físicos e questionários (PROMs) baseados em evidências.

REGRAS:
1. Sugira testes com alta especificidade/sensibilidade para a região.
2. Explique brevemente o porquê de cada sugestão baseado no relato do paciente.
3. Se houver sinais de alerta no texto, enfatize testes de triagem (ex: Slump, SLR).
4. Retorne APENAS um JSON estruturado.

FORMATO DE RESPOSTA (JSON STRICT):
{
  "tests": [
    { "name": "Nome do Teste", "reason": "Justificativa baseada no relato" }
  ],
  "promps": [
    { "name": "Nome do Questionário", "reason": "Justificativa" }
  ],
  "hypotheses": ["Hipótese 1", "Hipótese 2"]
}
`;

export async function getSmartSuggestions(hma: string, region: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return { success: false, msg: "API Key não configurada" };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        const regionalData = (REGIONAL_EVIDENCE_BASE as any)[region] || {};

        const payload = {
            hma,
            region,
            regional_guidelines: regionalData.guidelines,
            regional_key_tests: regionalData.key_tests
        };

        const result = await model.generateContent([
            { text: SUGGESTION_PROMPT + "\n\nPAYLOAD:\n" + JSON.stringify(payload) }
        ]);

        const response = result.response.text();
        return { success: true, data: JSON.parse(response) };

    } catch (error) {
        console.error("AI Suggestion Error:", error);
        return { success: false, msg: "Erro ao gerar sugestões" };
    }
}

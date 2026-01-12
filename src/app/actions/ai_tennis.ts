'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

// Interface para o retorno da IA
interface ShoeRecommendationData {
    recommendations: Array<{
        name: string;
        type: string;
        index: string;
        drop: string;
        weight: string;
        stack: string;
        flexibility: string;
        stability: string;
    }>;
    transition_strategy: string;
    maintenance_strategy: string;
    adaptation_strategy: string;
}

interface ActionResponse {
    success: boolean;
    data?: ShoeRecommendationData | { advice: string; recommendations: never[] };
    message?: string;
}

export async function generateShoeRecommendation(patientId: string, formData: any): Promise<ActionResponse> {
    try {
        const apiKey = process.env.OPENAI_API_KEY; // Note: Variable name is OPENAI_API_KEY but using GoogleGenerativeAI? keeping as is for now or switching to GEMINI_API_KEY if that's the intention. Assuming env var name is fixed.

        if (!apiKey) {
            return { success: false, message: 'Chave da API não configurada.' };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const systemInstruction = "Você é um especialista em fisioterapia, biomecânica e calçados esportivos.";

        const prompt = `
            ${systemInstruction}
            Seu objetivo é recomendar os 3 melhores tênis para o paciente e fornecer um plano de transição detalhado.
    
            DADOS DO PACIENTE (JSON):
            ${JSON.stringify(formData, null, 2)}
    
            CONTEXTO DA ANÁLISE:
            1. "minimalist_index_result": É o Índice de Minimalismo do paciente (0-100%).
            2. Analise "Queixa Principal", "Objetivos", "Tipo de Pisada", "Peso", "Drop atual".
            3. Se o índice for baixo (0-40%) e o paciente quiser migrar, sugira tênis de TRANSIÇÃO.
            4. Se o índice for alto (>70%), sugira manutenção ou aprimoramento.
    
            RETORNO ESPERADO (JSON ESTRITO):
            {
                "recommendations": [
                    { 
                        "name": "Nome do Modelo com Versão", 
                        "type": "Minimalista / Transição / Maximalista", 
                        "index": "Estimativa % (ex: 96%)", 
                        "drop": "ex: 0mm", 
                        "weight": "ex: 150g", 
                        "stack": "ex: 6mm", 
                        "flexibility": "Alta/Média/Baixa", 
                        "stability": "Mínima/Neutra/Estável" 
                    }
                ],
                "transition_strategy": "Texto explicativo sobre como fazer a transição segura (volume, frequencia) baseada no índice atual.",
                "maintenance_strategy": "Orientações sobre cuidados a longo prazo e manutenção da mecânica de corrida.",
                "adaptation_strategy": "Exercícios ou focos de fortalecimento para adaptação ao novo calçado."
            }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const content = result.response.text();

        if (!content) {
            return { success: false, message: 'Sem resposta da IA.' };
        }

        try {
            const parsed = JSON.parse(content) as ShoeRecommendationData;
            return { success: true, data: parsed };
        } catch (e) {
            console.warn("AI returned invalid JSON, falling back to text.");
            return { success: true, data: { advice: content, recommendations: [] } };
        }

    } catch (error: any) {
        console.error('AI Action Error:', error);
        return { success: false, message: 'Erro interno ao gerar recomendação.' };
    }
}

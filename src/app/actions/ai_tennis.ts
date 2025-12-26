'use server';

import { createClient } from '@/lib/supabase/server';

export async function generateShoeRecommendation(patientId: string, formData: any) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, message: 'Chave da API OpenAI não configurada.' };
    }

    try {
        // Construct a prompt based on Form Data
        // We assume formData contains keys like 'tipo_pisada', 'peso', 'altura', etc.
        // Since the fields have random IDs, we might need the Field Definitions too, 
        // OR we just dump the Key-Value pairs if they are descriptive.
        // For better results, we rely on the Label if possible, but here we just pass the JSON 
        // and ask the AI to interpret.

        const prompt = `
        Você é um especialista em fisioterapia, biomecânica e calçados esportivos.
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // Or gpt-4 if available and preferred
                messages: [
                    { role: 'system', content: 'Você é um assistente útil especializado em tênis de corrida e ortopedia.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('OpenAI Error:', err);
            return { success: false, message: 'Erro ao contatar a inteligência artificial.' };
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            return { success: false, message: 'Sem resposta da IA.' };
        }

        // Try to parse JSON
        try {
            const parsed = JSON.parse(content);
            return { success: true, data: parsed };
        } catch (e) {
            // If AI returned text instead of JSON, just return text
            return { success: true, data: { advice: content, recommendations: [] } };
        }

    } catch (error: any) {
        console.error('AI Action Error:', error);
        return { success: false, message: 'Erro interno ao gerar recomendação.' };
    }
}

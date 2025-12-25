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
        Seu objetivo é recomendar os 3 melhores tênis para o paciente, baseado nos dados fornecidos.

        CONTEXTO DOS DADOS:
        1. O JSON abaixo contém chaves (IDs) e valores.
        2. "minimalist_index_result": É o Índice de Minimalismo Atual do paciente (0-100%). 
           - Alto (70-100%): Já usa calçado minimalista.
           - Baixo (0-30%): Usa calçado muito estruturado.
           - Considere isso na transição ou manutenção.
        3. Procure por respostas que indiquem: "Queixa Principal", "Objetivos", "Tipo de Pisada", "Peso", "Drop atual".
        4. Os valores podem ser frases como "5/5 = < 125" (Isso indica o valor do critério). Interprete o significado.

        Dados do Paciente (JSON):
        ${JSON.stringify(formData, null, 2)}
        
        Sua resposta deve ser estritamente um JSON no seguinte formato, sem markdown:
        {
            "recommendations": [
                { "name": "Nome do Tênis", "brand": "Marca", "reason": "Motivo da escolha (Conecte com a queixa/índice)", "price_range": "R$ Min - Max" }
            ],
            "advice": "Conselho técnico focado na transição ou adaptação ao calçado."
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

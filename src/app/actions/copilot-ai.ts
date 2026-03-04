'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

interface StructuredHmaResponse {
    success: boolean;
    data?: {
        qp: string;
        hma: string;
        eva: number | null;
        raw: string;
        medications: string[];
        comorbidities: string[];
        activities: string[];
    };
    message?: string;
}

export async function generateStructuredHma(rawTranscript: string, specialty: string): Promise<StructuredHmaResponse> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { success: false, message: 'Chave da API não configurada.' };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
            Você é um ${specialty} e um Fisioterapeuta Ortopédico de altíssimo nível, inspirado na minúcia clínica de David Magee (Orthopedic Physical Assessment).
            Abaixo está a transcrição bruta da fala do paciente (e possivelmente do fisioterapeuta) durante a anamnese.
            Sua tarefa é extrair as queixas relatadas e redigi-las de forma rica, estruturada e utilizando os termos técnicos corretos da anatomia topográfica.

            REGRAS OBRIGATÓRIAS:
            1. NÃO invente informações que não foram ditas na transcrição.
            2. REMOVA e IGNORE perguntas e falas iniciais do fisioterapeuta (ex: "O que te traz aqui?", "Boa tarde fulano como posso ajudar?").
            3. IGNORE TOTALMENTE conversas paralelas, amenidades, piadas, papo sobre futebol, bar, clima, ou qualquer assunto não-clínico.
            4. A Queixa Principal (qp) deve ser EXATAMENTE a fala do paciente sobre o que ele sente, entre aspas (SIC). PROIBIDO usar introduções como "Paciente relata queixas de..." ou "O paciente apresenta...". Coloque APENAS a fala. Exemplo correto: "dor no bumbum e pontadas no pé".
            5. A História da Moléstia Atual (hma) deve ser estruturada narrativa no estilo Magee (Início e Mecanismo da Lesão, Comportamento dos Sintomas, Fatores de Melhora/Piora e Limitações Funcionais).
            6. PROIBIDO usar termos genéricos terminados em "-algia" (ex: Gonalgia, Cervicalgia). Substitua SEMPRE por descrições anatômicas precisas (ex: "Dor na região anterior do joelho", "Dor na coluna cervical alta").
            7. Se a dor e intensidade (0 a 10) for mencionada pelo paciente, extraia apenas o número inteiro no campo (eva). Caso contrário retorne null.
            8. Se forem citados medicamentos (ex: Dipirona, Torsilax, Dorflex), liste os nomes em (medications).
            9. Se forem citadas comorbidades/doenças prévias (ex: Hipertensão, Artrite, Diabetes), liste em (comorbidities).
            10. Se forem citadas atividades específicas que o paciente tem dificuldade (ex: Subir escadas, Correr, Agachar), liste no máximo 3 em (activities).

            Responda EXATAMENTE neste formato JSON:
            {
                "qp": "Apenas a queixa principal do paciente",
                "hma": "A história longa detalhada e estruturada estilo Magee",
                "eva": 0, // Apenas o número da intensidade da dor de 0 a 10, ou null
                "medications": ["Medicamento 1", "Medicamento 2"], // Array de strings, ou vazio []
                "comorbidities": ["Doença 1"], // Array de strings, ou vazio []
                "activities": ["Atividade 1", "Atividade 2"], // Array de no max 3 strings curtas refletindo dificuldade, ou vazio []
                "raw": "A transcrição completa sem cortes (devolva a \${rawTranscript} aqui)"
            }

            TRANSCRIÇÃO BRUTA:
            "${rawTranscript}"
        `;

        const result = await model.generateContent(prompt);
        const content = result.response.text();

        if (!content) {
            return { success: false, message: 'Sem resposta da IA.' };
        }

        try {
            const parsed = JSON.parse(content);
            return { success: true, data: parsed };
        } catch (e) {
            return { success: false, message: 'A resposta da IA não estava estruturada corretamente.' };
        }
    } catch (error: any) {
        console.error('AI HMA Structuring Error:', error);
        return { success: false, message: 'Erro interno ao processar a transcrição.' };
    }
}

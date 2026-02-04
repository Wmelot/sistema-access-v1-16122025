import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

export async function generateClinicalEvolution(notes: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
    ATUE COMO UM FISIOTERAPEUTA SÊNIOR ESPECIALISTA EM TRAUMATO-ORTOPEDIA E BIOMECÂNICA.
    Sua tarefa é transformar notas breves e informais em uma EVOLUÇÃO CLÍNICA TÉCNICA, FORMAL E COMPLETA.

    REGRAS CRÍTICAS:
    1. USE LINGUAGEM TÉCNICA DE ALTO NÍVEL (Ex: em vez de "dor no joelho", use "gonalgia"; em vez de "dobrar", use "flexão").
    2. NÃO invente informações que não estão nas notas, mas expanda a redação para parecer profissional.
    3. SIGA ESTRITAMENTE O MODELO ABAIXO. Não adicione introduções ou conclusões.
    4. NÃO USE MARKDOWN. Não use negrito (**), itálico, tabelas ou headers (##). Apenas texto simples.

    MODELO DE RESPOSTA OBRIGATÓRIO:

    Evolução:
    (Descreva aqui a condição do paciente, relato de dor [EVA se houver], observações da inspeção e palpação. Use termos como: "Paciente refere...", "Apresenta quadro álgico...", "Edema moderado...", "ADM preservada/reduzida...").

    Conduta:
    (Liste tecnicamente os procedimentos realizados. Ex: "Cinesioterapia: fortalecimento de...", "Terapia Manual: mobilização articular de...", "Eletrotermofototerapia: US...", "Educação em dor...").

    Plano:
    (Defina o foco para o próximo atendimento. Ex: "Progredir carga nos exercícios...", "Reavaliar ADM...", "Manter protocolo atual...").

    ---
    Notas Originais do Profissional: "${notes}"
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text.trim();
    } catch (error) {
        console.error("Error generating evolution:", error);
        throw new Error("Falha ao gerar evolução com IA.");
    }
}

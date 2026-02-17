import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

export async function generateClinicalEvolution(notes: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

export async function generateDiagnosticAnalysis(findings: any[]) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
    ATUE COMO UM ENGENHEIRO DE SOFTWARE SÊNIOR E ARQUITETO DE SISTEMAS DA PLATAFORMA AXIOM.
    Abaixo estão resultados de um check-up técnico de uma organização/clínica.
    Sua tarefa é analisar esses resultados e fornecer um RESUMO EXECUTIVO PARA O SUPORTE.

    O QUE VOCÊ DEVE ENTREGAR:
    1. DIAGNÓSTICO: Explique o que os erros significam em termos de sistema (ex: conflito de RLS, problema de tenancy, falta de colunas).
    2. CAUSA PROVÁVEL: Por que isso aconteceu?
    3. SOLUÇÃO RECOMENDADA: O que o técnico deve fazer para corrigir (SQL, ajuste de código ou configuração).

    REGRAS:
    - SEJA CURTO E DIRETO.
    - NÃO USE MARKDOWN COMPLEXO (use apenas texto organizado).
    - FOQUE NA ARQUITETURA MULTI-TENANT E SEGURANÇA.
    - IDIOMA: PORTUGUÊS (PT-BR).

    RESULTADOS DO CHECK-UP:
    ${JSON.stringify(findings, null, 2)}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("AI Diagnostic Error:", error);
        return "Não foi possível gerar análise de IA para este diagnóstico.";
    }
}

export async function generateStrategicAnalysis(metrics: any) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `
    ATUE COMO UM CONSULTOR DE NEGÓCIOS DE ALTO NÍVEL (Business Shark) ESPECIALISTA EM ESCALABILIDADE DE CLÍNICAS DE SAÚDE E SAAS.
    Analise os seguintes dados da plataforma Axiom e de suas clínicas clientes:
    ${JSON.stringify(metrics, null, 2)}

    OBJETIVOS DA SUA ANÁLISE:
    1. **Identificação de Churn:** Quais clínicas estão em risco? (Baixo engajamento, queda de agendamentos).
    2. **Estratégias de Crescimento:** Sugira 3 estratégias práticas (ex: planos de fidelidade, bonificação, descontos por indicação).
    3. **Pós-Venda Premium:** Como elevar a percepção de valor da clínica para o paciente?
    4. **Métricas Chave:** Quais métricas o Master deve observar agora?

    FORMATO:
    - Use um tom profissional, direto e ambicioso (Shark approach).
    - Organize em seções claras com títulos curtos. Sempre use um título principal impactante.
    - Foco em retenção e LTV (Lifetime Value).
    - Idioma: Português (PT-BR).
    - NÃO USE MARKDOWN COMPLEXO, apenas texto limpo e organizado.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("AI Strategy Error:", error);
        return "Erro ao processar inteligência estratégica. Verifique a configuração da API Key.";
    }
}

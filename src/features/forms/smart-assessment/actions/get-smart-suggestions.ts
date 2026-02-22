"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { REGIONAL_EVIDENCE_BASE, DETAILED_TEST_INFO } from "@/lib/ai/prompts";

const SUGGESTION_PROMPT = `
Você é um Fisioterapeuta Especialista em Diagnóstico Cinesiológico e PBE rigoroso.
Sua tarefa é sugerir o roteiro de exame físico baseado EXCLUSIVAMENTE em evidências reais (Magee, Dutton, JOSPT).

DIRETRIZES DE RACIOCÍNIO CLÍNICO:
1. GROUNDING: Use APENAS os dados fornecidos em 'regional_guidelines', 'regional_key_tests' e 'regional_functional_tests'.
2. BANDEIRAS DE ALERTA: Se o usuário marcou flags positivas no payload, priorize testes que investiguem a gravidade dessas flags (ex: triagem neurológica para radiculopatia se houver fraqueza).
3. MULTI-REGIÃO: Se houver mais de uma região, sugira testes que façam o diagnóstico diferencial entre elas (ex: diferenciar dor referida da lombar vs dor local no quadril).
4. É PROIBIDO inventar testes. Se não souber, peça mais dados na HMA.

DETALHAMENTO DE TESTES:
Para cada teste físico sugerido, você DEVE retornar uma descrição breve da execução e os valores de Sensibilidade (Sn) e Especificidade (Sp) se conhecidos.

Retorne APENAS um JSON estruturado.

FORMATO DE RESPOSTA (JSON STRICT):
{
  "tests": [
    { 
      "name": "Nome do Teste REAL", 
      "reason": "Justificativa clínica", 
      "description": "Como executar o teste",
      "sn": "0.XX",
      "sp": "0.XX",
      "isNeurological": true/false, 
      "region": "ID da região" 
    }
  ],
  "promps": [
    { "name": "Nome do Questionário REAL", "reason": "Justificativa" }
  ],
  "hypotheses": ["Hipótese principal", "Diferencial"]
}
`;

const HMA_SCRIPT_PROMPT = `
Você é um preceptor de fisioterapia sênior.
O aluno informou a Queixa Principal (QP) do paciente.

Sua tarefa é:
1. Gerar um roteiro de 4 a 6 perguntas INTERATIVAS e CRÍTICAS para coletar uma HMA rica.
2. DETECTAR todas as regiões de interesse prováveis baseadas na QP.

Regiões permitidas (DEVE ser um array desses IDs exatos):
- 'spine_lumbar', 'spine_cervical', 'shoulder', 'knee', 'ankle_foot', 'hip'

Retorne APENAS um JSON no formato:
{
  "questions": ["pergunta 1", "pergunta 2", ...],
  "detectedRegions": ["id_regiao_1", "id_regiao_2"]
}
`;

const FINAL_REPORT_PROMPT = `
Você é um Fisioterapeuta Especialista em Prática Baseada em Evidências (PBE).
Sua tarefa é cruzar todos os dados da avaliação para gerar uma síntese diagnóstica fisioterapêutica e uma proposta de conduta.

DIRETRIZES:
1. SÍNTESE DIAGNÓSTICA: Não apenas cite a patologia, mas descreva a disfunção funcional e o estágio clínico (ex: Fase de modulação de dor, instabilidade mecânica, etc).
2. CONDUTA: Deve ser específica, citando intervenções baseadas em PBE para as regiões afetadas.
3. PLANO: Sugira frequência de atendimentos e marcos de reavaliação.
4. RISCO: Mencione se há necessidade de monitorar red flags ou se o prognóstico é favorável.

Retorne APENAS um JSON structured:
{
  "diagnostic": "Frase curta com a impressão clínica principal",
  "conduct": "Parágrafo com as condutas sugeridas",
  "plan": "Frequência e duração estimada",
  "risk": "Baixo/Médio/Alto Risco + Justificativa breve"
}
`;

export async function getHmaQuestions(qp: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, msg: "API Key não configurada" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
      { text: HMA_SCRIPT_PROMPT + "\n\nQUEIXA PRINCIPAL:\n" + qp }
    ]);

    const response = result.response.text();
    return { success: true, data: JSON.parse(response) };
  } catch (error) {
    console.error("HMA Script Error:", error);
    return { success: false, msg: "Erro ao gerar roteiro" };
  }
}

export async function getSmartSuggestions(hma: string, regions: string[], flags: Record<string, boolean> = {}) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, msg: "API Key não configurada" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const consolidatedGuidelines: string[] = [];
    const consolidatedKeyTests: string[] = [];
    const consolidatedFunctionalTests: string[] = [];

    regions.forEach(region => {
      const data = (REGIONAL_EVIDENCE_BASE as any)[region];
      if (data) {
        if (data.guidelines) consolidatedGuidelines.push(...data.guidelines);
        if (data.key_tests) consolidatedKeyTests.push(...data.key_tests);
        if (data.functional_tests) consolidatedFunctionalTests.push(...data.functional_tests);
      }
    });

    const payload = {
      hma,
      regions,
      flags: Object.entries(flags).filter(([_, v]) => v).map(([k, _]) => k),
      regional_guidelines: [...new Set(consolidatedGuidelines)],
      regional_key_tests: [...new Set(consolidatedKeyTests)],
      regional_functional_tests: [...new Set(consolidatedFunctionalTests)]
    };

    try {
      const result = await model.generateContent([
        { text: SUGGESTION_PROMPT + "\n\nPAYLOAD:\n" + JSON.stringify(payload) }
      ]);
      const response = result.response.text();
      return { success: true, data: JSON.parse(response), isFallback: false };
    } catch (aiError: any) {
      console.warn("Gemini API Error (Falling back to local database):", aiError.message);

      // Mecanismo de Fallback: Criar resposta baseada na base local
      const fallbackData = {
        tests: [] as any[],
        promps: [] as any[],
        hypotheses: ["Avaliação regional necessária", "Diferencial de tecidos moles"]
      };

      regions.forEach(r => {
        const data = (REGIONAL_EVIDENCE_BASE as any)[r];
        if (data) {
          // Adiciona testes chave como sugestão padrão
          const keyTests = (data.key_tests || []).slice(0, 4).map((t: string) => {
            const testName = t.split(' (')[0];
            const detailed = (DETAILED_TEST_INFO as any)[testName] || {};
            return {
              name: testName,
              reason: "Teste padrão ouro para a região conforme diretrizes da classe.",
              description: detailed.description || "Descrição em desenvolvimento na base Axiom.",
              sn: detailed.sn || "N/A",
              sp: detailed.sp || "N/A",
              isNeurological: t.toLowerCase().includes('neuro') || t.toLowerCase().includes('spurling') || t.toLowerCase().includes('slump'),
              region: r
            };
          });
          fallbackData.tests.push(...keyTests);

          // Adiciona funcional como sugestão
          const funcTests = (data.functional_tests || []).slice(0, 2).map((t: string) => ({
            name: t,
            reason: "Avaliação funcional de controle motor.",
            description: "Avaliação dinâmica de padrão de movimento em cadeia cinemática.",
            sn: "N/A",
            sp: "N/A",
            isNeurological: false,
            region: r
          }));
          fallbackData.tests.push(...funcTests);
        }
      });

      return {
        success: true,
        data: fallbackData,
        isFallback: true,
        msg: "Modo Offline: Sugestões baseadas em Protocolos Padrão (IA Temporariamente Indisponível)."
      };
    }
  } catch (error: any) {
    console.error("Critical System Error:", error);
    return { success: false, msg: "Erro sistêmico ao processar avaliação." };
  }
}

export async function generateFinalReport(payload: {
  hma: string,
  qp: string,
  regions: string[],
  flags: Record<string, boolean>,
  examData: any
}) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { success: false, msg: "API Key não configurada" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
      { text: FINAL_REPORT_PROMPT + "\n\nACHADOS CLÍNICOS:\n" + JSON.stringify(payload) }
    ]);

    const response = result.response.text();
    return { success: true, data: JSON.parse(response) };
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return {
      success: true,
      data: {
        diagnostic: "Não foi possível gerar síntese via IA. Favor preencher manualmente.",
        conduct: "Baseado nos protocolos PBE selecionados para " + payload.regions.join(', '),
        plan: "Frequência a definir conforme quadro clínico.",
        risk: "Monitorar sintomas."
      },
      isFallback: true
    };
  }
}

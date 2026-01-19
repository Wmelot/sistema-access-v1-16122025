
import { InjuryType, InjuryStatus } from "@/utils/shoe-logic";

// --- TABELA DE METS (Referência Clínica) ---
export const KCAL_TABLE: Record<string, number> = {
    "Corrida Leve": 600,
    "Corrida Moderada": 800,
    "Corrida Intensa": 1000,
    "Caminhada": 300,
    "Musculação": 400,
    "Futebol": 700,
    "Natação": 600,
    "Ciclismo": 500,
    "Crossfit": 800,
    "Funcional": 500,
    "Pilates": 300,
    "Yoga": 250,
    "Outros": 400
};

// --- CÁLCULO DE GASTO CALÓRICO E NÍVEL DE ATIVIDADE ---
export function calculateActivityLevel(weight: number, sports: any[]) {
    const safeWeight = Number(weight) || 70;
    const safeSports = Array.isArray(sports) ? sports : [];

    let weeklyBurn = 0;
    let totalMinutes = 0;

    safeSports.forEach((s) => {
        const met = KCAL_TABLE[s?.type] || 300;
        const duration = Number(s?.duration) || 0;
        const freq = Number(s?.freq) || 0;

        // Fórmula: (METs / 70kg base) * peso_atual * (horas)
        const hourlyBurnAdjusted = (met / 70) * safeWeight;
        weeklyBurn += hourlyBurnAdjusted * (duration / 60) * freq;
        totalMinutes += freq * duration;
    });

    let level = "Sedentário";
    let color = "bg-slate-500";
    let riskText = "Alto Risco";

    // Classificação simplificada baseada na OMS (150min moderado/intenso)
    if (totalMinutes >= 150) { level = "Ativo"; color = "bg-green-500"; riskText = "Baixo Risco"; }
    if (totalMinutes >= 300) { level = "Muito Ativo"; color = "bg-purple-600"; riskText = "Risco Mínimo"; }

    return {
        weeklyBurn: Math.round(weeklyBurn),
        totalMinutes,
        hours: Math.floor(totalMinutes / 60),
        mins: totalMinutes % 60,
        level,
        color,
        riskText
    };
}

// --- CÁLCULO DE FPI-6 (FOOT POSTURE INDEX) ---
export function calculateFpiScore(values: any) {
    if (!values) return { score: 0, status: 'Neutro', color: 'bg-green-500' };

    // Soma os valores de -2 a +2
    const score = Object.values(values).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);

    let status = "Neutro";
    let color = "bg-green-500";
    let description = "Alinhamento fisiológico com excelente distribuição de carga.";

    if (score >= 6) {
        status = "Plano";
        color = "bg-red-500";
        description = "Queda do arco medial, aumentando o estresse em estruturas internas.";
    } else if (score <= -1) { // Ajustado para ser mais sensível ao pé cavo (-1 já indica tendência)
        status = "Cavo";
        color = "bg-orange-500";
        description = "Arco elevado, gerando picos de pressão no calcanhar e metatarsos.";
    }

    return { score, status, color, description };
}

// --- CÁLCULO DE EFICIÊNCIA FUNCIONAL (EFEP) ---
export function calculateEfepScore(items: any[]) {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;

    let total = 0;
    let count = 0;

    items.forEach((i) => {
        const v = parseFloat(i.score);
        if (!isNaN(v)) {
            total += v;
            count++;
        }
    });

    // Retorna percentual de 0 a 100
    // A pontuação original é média de 0-10, então multiplicamos por 10
    return count === 0 ? 0 : Math.round((total / count) * 10);
}

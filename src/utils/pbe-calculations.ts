
import { InjuryType, InjuryStatus } from "@/utils/shoe-logic";

// --- TABELA DE METS (Referência Clínica) ---
export const KCAL_TABLE: Record<string, number> = { "Arremesso de Peso/Disco": 300, "Balé": 450, "Basquete": 650, "Beach Tênis": 550, "Bicicleta Ergométrica (Intensa)": 600, "Bike (Ciclismo de Estrada)": 500, "Boxe (Treino)": 800, "Caminhada (5 km/h)": 300, "Caminhada em Trilha (Hiking)": 450, "Capoeira": 650, "Corrida (10 km/h)": 900, "Crossfit": 700, "Dança de Salão": 350, "Danças Urbanas/Hip Hop": 500, "Escalada": 600, "Esgrima": 450, "Frescobol": 400, "Futebol": 800, "Futsal": 750, "Futevôlei": 600, "Ginástica Artística": 400, "Ginástica Laboral": 150, "Ginástica Olímpica": 500, "Golfe": 250, "Handebol": 700, "Hidroginástica": 400, "Jiu-Jitsu": 750, "Judô": 700, "Karatê": 650, "Kickboxing": 850, "Krav Maga": 700, "Musculação": 350, "Muay Thai": 800, "Natação (Crawl moderado)": 600, "Natação (Borboleta/Intenso)": 850, "Padel": 550, "Patinação": 500, "Pilates": 300, "Pular Corda (Rápido)": 950, "Remo": 600, "Rugby": 800, "Skate": 400, "Spinning": 700, "Squash": 900, "Surf": 350, "Tênis": 500, "Tênis de Mesa": 300, "Treino Funcional": 550, "Triatlo": 900, "Vôlei de Praia": 600, "Vôlei de Quadra": 400, "Yoga": 250, "Zumba": 550 };

// --- CÁLCULO DE GASTO CALÓRICO E NÍVEL DE ATIVIDADE ---
export function calculateActivityLevel(weight: number, sports: any[]) {
    const safeWeight = Number(weight) || 70;
    const safeSports = Array.isArray(sports) ? sports : [];

    let weeklyBurn = 0;
    let totalMinutes = 0;

    safeSports.forEach((s) => {
        // Usa a KCAL_TABLE. Se não encontrar, assume 400 KCAL (Met moderado genérico)
        const activityName = s?.type || "";
        const activityKcal = KCAL_TABLE[activityName] || 400; // Caloria hora pessoa 70kg
        const duration = Number(s?.duration) || 0; // min
        const freq = Number(s?.freq) || 0; // vezes por semana

        // Fórmula de Regra de 3 Simples do Gasto:
        // Se uma pessoa de 70kg gasta 'activityKcal' em 1 HORA (60min)...
        // A pessoa atual de 'safeWeight' kg vai gastar: activityKcal * (safeWeight / 70)
        const hourlyBurnAdjusted = activityKcal * (safeWeight / 70);

        // Gasto semanal da modalidade = Gasto / hora * (horas_treinadas_na_semana)
        weeklyBurn += hourlyBurnAdjusted * (duration / 60) * freq;
        totalMinutes += freq * duration;
    });

    let level = "Sedentário";
    let color = "bg-red-50 text-red-600 border-red-200";
    let riskText = "Alto Risco";

    // Classificação baseada na OMS (150min moderado/intenso)
    if (totalMinutes >= 150) { level = "Ativo"; color = "bg-green-50 text-green-700 border-green-200"; riskText = "Baixo Risco"; }
    if (totalMinutes > 300) { level = "Muito Ativo"; color = "bg-purple-50 text-purple-700 border-purple-200"; riskText = "Risco Mínimo"; }

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
    if (!values || typeof values !== 'object') return { score: 0, status: 'Neutro', color: 'bg-green-500', description: 'Alinhamento fisiológico com excelente distribuição de carga.' };

    // Soma os valores de -2 a +2
    const score = Object.values(values).reduce((acc: number, curr: any) => {
        let v = 0;
        if (typeof curr === 'string' || typeof curr === 'number') {
            v = Number(curr);
        }
        return acc + (isNaN(v) ? 0 : v);
    }, 0);

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

export type InjuryType =
    | 'none'
    | 'knee'
    | 'achilles'
    | 'plantar_fascia'
    | 'metatarsal'
    | 'tibial_posterior'
    | 'stress_fracture';

export type InjuryStatus = 'acute' | 'persistent' | 'prevention';

interface ShoeRecommendation {
    title: string;
    characteristics: string[];
    dropAdvice: string;
    transitionAdvice: string;
    minimalistIndexTarget: string;
}

export function getShoeRecommendation(
    injury: InjuryType,
    status: InjuryStatus,
    currentShoeIndex: number
): ShoeRecommendation {

    // 1. LESÃO AGUDA (Dor forte agora)
    if (status === 'acute') {
        return {
            title: "Proteção Máxima (Maximalista)",
            characteristics: [
                "Amortecimento Alto (>30mm)",
                "Estrutura Rígida para proteção",
                "Estabilidade aumentada"
            ],
            dropAdvice: "Manter Drop habitual ou aumentar temporariamente para alívio.",
            transitionAdvice: "NÃO realizar transição agora. Foco em reduzir carga tecidual.",
            minimalistIndexTarget: "< 40% (Estruturado)"
        };
    }

    // 2. PATOLOGIAS ESPECÍFICAS (Baseado no PDF The Running Clinic)
    switch (injury) {
        case 'knee': // Dor no Joelho / Patelo-femoral
            return {
                title: "Redução de Carga no Joelho",
                characteristics: [
                    "Tênis mais Leve (< 250g)",
                    "Menor amortecimento (aumenta cadência)",
                    "Baixa interferência mecânica"
                ],
                dropAdvice: "Reduzir Drop (0 a 6mm) para diminuir torque no joelho.",
                transitionAdvice: "Transição gradual: 1 min a mais por treino com o novo calçado.",
                minimalistIndexTarget: "> 70% (Minimalista/Intermediário)"
            };

        case 'achilles': // Tendão de Aquiles / Panturrilha
            return {
                title: "Proteção do Tendão de Aquiles",
                characteristics: [
                    "Drop Alto Obrigatório (> 10mm)",
                    "Contraforte macio (evitar compressão)",
                    "Sola flexível na frente"
                ],
                dropAdvice: "MANTER Drop Alto. Não reduzir drop enquanto houver sintomas.",
                transitionAdvice: "Evite calçados planos (Zero Drop) nesta fase.",
                minimalistIndexTarget: "< 50% (Tradicional)"
            };

        case 'plantar_fascia': // Fascite Plantar
            return {
                title: "Suporte da Fáscia Plantar",
                characteristics: [
                    "Suporte de Arco (Navicular)",
                    "Sola Rígida (pouca torção)",
                    "Amortecimento no calcanhar"
                ],
                dropAdvice: "Drop Médio a Alto (8-12mm).",
                transitionAdvice: "Use palmilha de conforto se necessário. Evite andar descalço.",
                minimalistIndexTarget: "40-60% (Estruturado)"
            };

        case 'metatarsal': // Metatarsalgia / Neuroma / Fratura
            return {
                title: "Proteção do Antepé",
                characteristics: [
                    "Caixa de dedos larga (Wide Toe Box)",
                    "Sola Rígida (Rocking Chair/Mata-borrão)",
                    "Botão de Metatarso (se palmilha)"
                ],
                dropAdvice: "Drop Baixo a Médio para evitar sobrecarga na frente.",
                transitionAdvice: "Priorize conforto e espaço para os dedos.",
                minimalistIndexTarget: "Variável (Foco na largura)"
            };

        case 'tibial_posterior': // Canelite Medial / Tibial Posterior
            return {
                title: "Controle de Pronação",
                characteristics: [
                    "Estabilidade Medial",
                    "Controle de Movimento (Anti-pronação)",
                    "Sola mais rígida"
                ],
                dropAdvice: "Drop Alto (> 10mm) ajuda a reduzir tensão.",
                transitionAdvice: "Mantenha o suporte até remissão total dos sintomas.",
                minimalistIndexTarget: "< 40% (Maximalista/Controle)"
            };

        default: // Prevenção / Sem Lesão
            return {
                title: "Performance & Adaptação Natural",
                characteristics: [
                    "Leveza (< 220g)",
                    "Flexibilidade total",
                    "Poucas tecnologias"
                ],
                dropAdvice: "Drop baixo (0-6mm) estimula técnica de corrida.",
                transitionAdvice: "Se quiser migrar para minimalista: 1 mês de adaptação para cada 10% de mudança no índice.",
                minimalistIndexTarget: "70-100% (Minimalista)"
            };
    }
}

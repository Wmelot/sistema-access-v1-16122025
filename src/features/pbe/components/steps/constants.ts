export const PREV_TREATMENTS = [
    "Acupuntura", "Crioterapia", "Fisioterapia", "Mackenzie",
    "Medicação", "Palmilha", "Pilates", "Repouso"
]

export const PHYSICAL_ACTIVITIES = [
    "Artes Marciais", "Atletismo", "Basquete", "Beach Tênis", "Caiaque",
    "Caminhada", "Ciclismo", "Corrida", "Dança", "Funcional",
    "Futebol", "Futvôlei", "Hidroginástica", "Jiu-jitsu",
    "Musculação", "Natação", "Padel", "Pilates", "Tênis", "Vôlei", "Crossfit"
]

export const EXERCISE_LIST = [
    "Fortalecimento do músculo glúteo médio com o quadril em extensão (Ex. Drop pélvico)",
    "Fortalecimento do músculo glúteo médio com o quadril e joelhos fletidos (Ex. Ostra)",
    "Fortalecimento excêntrico na posição alongada do músculo tríceps sural",
    "Fortalecimento do músculo glúteo máximo",
    "Fortalecimento de músculos do CORE, principalmente transverso abdominal e multífidos",
    "Fortalecimento de glúteo médio (Ex. Ponte unilateral/lateral)",
    "Fortalecimento de quadríceps em cadeia cinética fechada e/ou aberta",
    "Fortalecimento excêntrico de isquiosurais em posição alongada",
    "Exercícios para ganho de mobilidade de quadril",
    "Exercícios para ganho de mobilidade de tornozelo"
]

export const ANATOMICAL_ZONES = {
    anterior: {
        head: { right: { x: 50.08, y: 8.36 } },
        cervical: { right: { x: 49.90, y: 19.02 } },
        thoracic: { right: { x: 49.63, y: 28.22 } },
        shoulder: { right: { x: 32.15, y: 22.43 }, left: { x: 68.27, y: 22.55 } },
        elbow: { right: { x: 28.60, y: 37.23 }, left: { x: 71.19, y: 37.34 } },
        wrist: { right: { x: 23.17, y: 48.85 }, left: { x: 77.04, y: 48.62 } },
        lumbar: { right: { x: 50.52, y: 41.22 } },
        sacrum: { right: { x: 49.69, y: 50.14 } },
        hip: { right: { x: 37.37, y: 49.91 }, left: { x: 62.42, y: 50.14 } },
        knee: { right: { x: 41.96, y: 71.52 }, left: { x: 58.87, y: 71.40 } },
        ankle: { right: { x: 42.80, y: 91.48 }, left: { x: 57.62, y: 91.48 } }
    },
    posterior: {
        lumbar: { right: { x: 50, y: 42 } },
        glute: { right: { x: 57.62, y: 51.55 }, left: { x: 40.92, y: 51.55 } },
        achilles: { right: { x: 57.20, y: 93.59 }, left: { x: 42.80, y: 93.24 } }
    },
    feet: {
        calcaneus: { left: { x: 16.39, y: 74.58 }, right: { x: 16.39, y: 74.58 } },
        arch: { left: { x: 21.29, y: 50.23 }, right: { x: 21.29, y: 50.23 } },
        metatarsal1: { left: { x: 25.34, y: 36.25 }, right: { x: 25.34, y: 36.25 } },
        metatarsal3: { left: { x: 16.49, y: 33.81 }, right: { x: 16.49, y: 33.81 } },
        metatarsal5: { left: { x: 7.6, y: 40.19 }, right: { x: 7.6, y: 40.19 } },
        baseMeta5: { left: { x: 51.08, y: 64.35 }, right: { x: 51.08, y: 64.35 } }
    }
}

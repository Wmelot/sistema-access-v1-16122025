export interface Book {
    id: string;
    title: string;
    author: string;
    type: 'Básico' | 'Complementar';
}

export interface Topic {
    id: string;
    title: string;
    classesNeeded: number;
    bibliographyIds: string[];
    isPractical: boolean;
    resources: string[];
    methodology: string;
    date?: Date | null;
}

export interface Assessment {
    id: string;
    name: string;
    date: Date | null;
    points: number;
    type: 'Individual' | 'Dupla' | 'Prática' | 'Teórica';
    isSubstitutive?: boolean;
    substitutesIds?: string[];
    classesNeeded: number;
    content?: string;
}

export const METHODOLOGY_GUIDE: Record<string, { desc: string, activities: string[], links: { label: string, url: string }[] }> = {
    'Aula Dialogada': {
        desc: 'O professor atua como mediador, provocando reflexões a partir do conhecimento prévio do aluno.',
        activities: ['Mapa mental coletivo no quadro', 'Roda de discussão sobre tema polêmico', 'Debate 360 graus'],
        links: [{ label: 'Guia Nova Escola', url: 'https://novaescola.org.br' }]
    },
    'PBL': {
        desc: 'Problem-Based Learning: Os alunos aprendem através da resolução cooperativa de problemas complexos e reais.',
        activities: ['Resolução de caso clínico real', 'Planejamento de tratamento em grupo', 'Simulação de diagnóstico'],
        links: [{ label: 'Metodologias Ativas USP', url: 'https://eaulas.usp.br' }]
    },
    'Sala Invertida': {
        desc: 'O aluno estuda a teoria em casa (vídeos/textos) e usa o tempo de sala para atividades práticas e dúvidas.',
        activities: ['Quiz rápido sobre o vídeo prévio', 'Aplicação prática do conteúdo lido', 'Consultoria do professor por grupo'],
        links: [{ label: 'Flipped Classroom Guide', url: 'https://rtalbert.org' }]
    },
    'Gamificação': {
        desc: 'Uso de elementos de jogos (pontos, rankings, desafios) para engajar e motivar o aprendizado.',
        activities: ['Competição de Quiz (Kahoot)', 'Missões com recompensas acadêmicas', 'Escape Room de conceitos'],
        links: [{ label: 'Kahoot Business', url: 'https://kahoot.com' }, { label: 'Quizizz', url: 'https://quizizz.com' }]
    },
    'Estudo de Caso': {
        desc: 'Análise profunda de uma situação específica para aplicar conceitos teóricos na prática profissional.',
        activities: ['Relatório de intervenção fisioterapêutica', 'Análise de exames reais', 'Dramatização de atendimento'],
        links: [{ label: 'Harvard Case Method', url: 'https://hbsp.harvard.edu' }]
    },
    'Demonstração Prática': {
        desc: 'O professor executa a técnica enquanto os alunos observam, seguida de prática supervisionada imediata.',
        activities: ['Técnica de palpação em duplas', 'Manuseio de equipamentos', 'Avaliação postural real'],
        links: [{ label: 'Physiopedia', url: 'https://www.physio-pedia.com' }]
    }
};

export const RESOURCE_OPTIONS = [
    'Projetor Multimedia',
    'Lousa / Quadro Branco',
    'Artigos Científicos (PDF)',
    'Macas de Atendimento',
    'Esqueleto Humano Articulado',
    'Modelos Anatômicos 3D',
    'Slides Interativos e Mentímetro',
    'Laboratório de Informática / Tablets',
    'Vídeos de Demonstração Clínica',
    'Plataformas de Avaliação Digital',
    'Equipamentos de Eletrotermoterapia',
    'Simuladores de Realidade Virtual',
    'Materiais de Consumo (Atadura, Algodão)',
    'Prontuários de Casos Clínicos Reais'
];

export const PRINT_STYLES = (orientation: 'portrait' | 'landscape', fontSize: 'small' | 'medium' | 'large') => `
@media print {
  @page {
    size: A4 ${orientation};
    margin: 0mm !important;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-area {
    padding: 15mm !important;
    box-shadow: none !important;
    border: none !important;
    width: 100% !important;
    min-height: 100vh !important;
    zoom: ${fontSize === 'small' ? '0.75' : fontSize === 'medium' ? '0.85' : '1.0'};
  }
  .no-print {
    display: none !important;
  }
  .break-inside-avoid {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  header, section, footer {
    display: block !important;
    page-break-inside: avoid !important;
  }
}
`;

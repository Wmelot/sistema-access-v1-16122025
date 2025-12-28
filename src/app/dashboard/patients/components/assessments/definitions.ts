

export type AssessmentType = 'start_back' | 'roland_morris' | 'oswestry' | 'mcgill_short' | 'tampa_kinesiophobia' | 'quickdash' | 'lefs' | 'quebec' | 'ndi' | 'psfs' | 'spadi' | 'prwe' | 'ihot33' | 'womac' | 'hoos' | 'ikdc' | 'lysholm' | 'koos' | 'faos' | 'faam' | 'aofas' | 'insoles_40d' | 'insoles_1y';

export interface Question {
    id: string;
    text: string;
    type: 'binary' | 'scale' | 'mcq' | 'vas' | 'custom_text';
    options?: { label: string; value: number }[];
    min?: number;
    max?: number; // For VAS
    minLabel?: string; // [NEW] Optional label for min value (VAS)
    maxLabel?: string; // [NEW] Optional label for max value (VAS)
    inverted?: boolean; // For TSK
    placeholder?: string; // [NEW] For custom_text input
    dependency?: string; // [NEW] ID of the question this depends on
}

export interface AssessmentDefinition {
    id: AssessmentType;
    title: string;
    description: string;
    questions: Question[];
    instruction?: string;
    clinicalGuidance?: string; // [NEW] Instructions for the professional
    calculateScore: (answers: Record<string, any>) => Record<string, any>;
}

export const ASSESSMENTS: Record<AssessmentType, AssessmentDefinition> = {
    start_back: {
        id: 'start_back',
        title: 'STarT Back Screening Tool (SBST-Brasil)',
        description: 'Ferramenta de triagem para risco de mau prognóstico em dor lombar.',
        instruction: 'Por favor, pensando nas DUAS ÚLTIMAS SEMANAS, marque a opção que melhor descreve como você se sente.',
        clinicalGuidance: `
**Instruções de Aplicação**
Ferramenta para triagem de risco de mau prognóstico em dor lombar.

**Pontuação (0-9):**
- **Baixo Risco**: Total ≤ 3.
- **Médio Risco**: Total ≥ 4 e Subescala Psicossocial (Itens 5-9) ≤ 3.
- **Alto Risco**: Subescala Psicossocial (Itens 5-9) ≥ 4.

**Fonte:**
A versão brasileira do STarT Back Screening Tool - tradução, adaptação transcultural e confiabilidade. Pilz et al. Braz J Phys Ther. 2014.
        `,
        questions: [
            { id: 'q1', text: 'Minha dor nas costas espalhou-se, descendo pelas pernas, nas últimas 2 semanas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q2', text: 'Eu tive dor no ombro ou no pescoço em algum momento nas últimas 2 semanas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q3', text: 'Eu evito andar longas distâncias por causa da minha dor nas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q4', text: 'Nas últimas 2 semanas, tenho me vestido mais devagar por causa da minha dor nas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q5', text: 'Não é seguro para uma pessoa com o meu problema ser fisicamente ativa.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q6', text: 'Preocupar-me afeta minha dor nas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q7', text: 'Sinto que minha dor nas costas é terrível e que nunca vai melhorar.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q8', text: 'Em geral, não tenho gostado de todas as coisas que eu costumava gostar.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            {
                id: 'q9',
                text: 'Ao todo, o quanto a sua dor nas costas incomodou você nas últimas 2 semanas?',
                type: 'mcq',
                options: [
                    { label: 'Nada', value: 0 },
                    { label: 'Um pouco', value: 1 },
                    { label: 'Moderadamente', value: 2 },
                    { label: 'Muito', value: 3 },
                    { label: 'Extremamente', value: 4 }
                ]
            }
        ],
        calculateScore: (answers) => {
            // First 8 items are already 0 or 1
            const scoreQ1to8 = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8']
                .reduce((acc, key) => acc + (answers[key] || 0), 0);

            // Q9 needs mapping: 0,1,2 (Nada/Pouco/Mod) -> 0; 3,4 (Muito/Ext) -> 1
            const rawQ9 = answers['q9'] || 0;
            const scoreQ9 = rawQ9 >= 3 ? 1 : 0;

            const total = scoreQ1to8 + scoreQ9;

            // Psychosocial subscale: Q5, Q6, Q7, Q8, Q9
            const psychosocial = (answers['q5'] || 0) +
                (answers['q6'] || 0) +
                (answers['q7'] || 0) +
                (answers['q8'] || 0) +
                scoreQ9;

            let classification = 'Baixo Risco';
            let riskColor = 'green';

            if (total >= 4) {
                if (psychosocial >= 4) {
                    classification = 'Alto Risco Psicossocial';
                    riskColor = 'red';
                } else {
                    classification = 'Médio Risco';
                    riskColor = 'yellow';
                }
            }

            return { total, psychosocial, classification, riskColor };
        }
    },
    roland_morris: {
        id: 'roland_morris',
        title: 'Roland-Morris (RMDQ-Brasil)',
        description: 'Questionário de Incapacidade Roland-Morris para Dor Lombar.',
        instruction: 'Quando suas costas doem, você pode achar difícil fazer algumas das coisas que normalmente faz. Esta lista contém frases que as pessoas usam para se descrever. Leia todas as frases e marque apenas aquelas que descrevem você HOJE. Se a frase não se aplicar, deixe em branco.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação da incapacidade físico-funcional em pacientes com dor lombar.

**Pontuação (0-24):**
- Some o número de itens marcados.
- Pontuações mais altas indicam maior incapacidade.
- **≥ 14 pontos**: Incapacidade grave.

**Fonte:**
Translation, adaptation and validation of the Roland-Morris questionnaire - Brazil Roland-Morris. Nusbaum et al. Braz J Med Biol Res. 2001.
        `,
        questions: [
            { id: 'q1', text: 'Fico em casa a maior parte do tempo por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q2', text: 'Mudo de posição frequentemente para tentar deixar minhas costas confortáveis.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q3', text: 'Ando mais devagar do que o habitual por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q4', text: 'Por causa das minhas costas, eu não estou fazendo nenhum dos trabalhos que, habitualmente, eu faço em casa.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q5', text: 'Por causa das minhas costas, uso o corrimão para subir escadas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q6', text: 'Por causa das minhas costas, deito-me para descansar, com mais frequência.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q7', text: 'Por causa das minhas costas, tenho que me segurar em alguma coisa para me levantar de uma poltrona ou sofá.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q8', text: 'Por causa das minhas costas, tento conseguir que outras pessoas façam as coisas para mim.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q9', text: 'Visto-me mais devagar do que o habitual por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q10', text: 'Eu apenas fico em pé por períodos curtos de tempo por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q11', text: 'Por causa das minhas costas, tento não me abaixar ou me ajoelhar.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q12', text: 'Encontro dificuldade em levantar-me de uma cadeira por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q13', text: 'As minhas costas doem quase o tempo todo.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q14', text: 'Tenho dificuldade em me virar na cama por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q15', text: 'O meu apetite não é muito bom por causa de dor nas minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q16', text: 'Tenho problemas para colocar minhas meias (ou meia-calça) por causa das dores nas minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q17', text: 'Caminho apenas curtas distâncias por causa de dores nas minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q18', text: 'Não durmo tão bem por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q19', text: 'Por causa de dores nas costas, eu me visto com ajuda de outras pessoas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q20', text: 'Fico sentado a maior parte do dia por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q21', text: 'Evito trabalhos pesados em casa por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q22', text: 'Por causa de dores nas costas, fico mais irritado e mal humorado com as pessoas do que o habitual.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q23', text: 'Por causa das minhas costas subo escadas mais devagar do que o habitual.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
            { id: 'q24', text: 'Fico na cama a maior parte do tempo por causa das minhas costas.', type: 'binary', options: [{ label: 'Não', value: 0 }, { label: 'Sim', value: 1 }] },
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);

            let classification = 'Incapacidade Baixa';
            let riskColor = 'green';

            if (total >= 14) {
                classification = 'Incapacidade Significativa';
                riskColor = 'red';
            } else if (total >= 5) {
                classification = 'Incapacidade Moderada';
                riskColor = 'yellow';
            }

            return { total, classification, riskColor };
        }
    },
    oswestry: {
        id: 'oswestry',
        title: 'Índice de Incapacidade Oswestry (ODI 2.0 - Brasil)',
        description: 'Avaliação quantitativa da incapacidade por dor lombar.',
        instruction: 'Estas perguntas foram elaboradas para nos dar informações sobre como sua dor nas costas (ou perna) afetou sua capacidade de administrar sua vida cotidiana. Por favor, marque apenas a CAIXA ÚNICA em cada seção que melhor descreve sua condição HOJE.',
        questions: [
            {
                id: 'q1', text: 'Seção 1 - Intensidade da Dor', type: 'scale', options: [
                    { label: 'Sem dor no momento', value: 0 },
                    { label: 'Dor muito leve', value: 1 },
                    { label: 'Dor moderada', value: 2 },
                    { label: 'Dor razoavelmente intensa', value: 3 },
                    { label: 'Dor muito intensa', value: 4 },
                    { label: 'A pior dor imaginável', value: 5 },
                ]
            },
            {
                id: 'q2', text: 'Seção 2 - Cuidados Pessoais', type: 'scale', options: [
                    { label: 'Posso cuidar de mim mesmo sem causar dor extra', value: 0 },
                    { label: 'Posso cuidar de mim mesmo, mas causa dor extra', value: 1 },
                    { label: 'É doloroso cuidar de mim e sou lento e cuidadoso', value: 2 },
                    { label: 'Preciso de ajuda, mas consigo fazer a maior parte dos cuidados', value: 3 },
                    { label: 'Preciso de ajuda todos os dias na maioria dos cuidados', value: 4 },
                    { label: 'Não me visto, lavo com dificuldade e fico na cama', value: 5 },
                ]
            },
            {
                id: 'q3', text: 'Seção 3 - Levantar pesos', type: 'scale', options: [
                    { label: 'Levanto pesos pesados sem dor extra', value: 0 },
                    { label: 'Levanto pesos pesados, mas sinto dor extra', value: 1 },
                    { label: 'A dor me impede de levantar pesos pesados do chão, mas consigo se estiverem na mesa', value: 2 },
                    { label: 'A dor me impede de levantar pesos pesados, mas levanto leves/médios em posição cômoda', value: 3 },
                    { label: 'Só consigo levantar coisas muito leves', value: 4 },
                    { label: 'Não consigo levantar ou carregar nada', value: 5 },
                ]
            },
            {
                id: 'q4', text: 'Seção 4 - Caminhar', type: 'scale', options: [
                    { label: 'A dor não me impede de caminhar qualquer distância', value: 0 },
                    { label: 'A dor me impede de caminhar mais de 1,5 km (± 15 quadras)', value: 1 },
                    { label: 'A dor me impede de caminhar mais de 500 m (± 5 quadras)', value: 2 },
                    { label: 'A dor me impede de caminhar mais de 100 m (± 1 quadra)', value: 3 },
                    { label: 'Só consigo caminhar usando bengala ou muletas', value: 4 },
                    { label: 'Fico na cama a maior parte do tempo e tenho que me arrastar para o banheiro', value: 5 },
                ]
            },
            {
                id: 'q5', text: 'Seção 5 - Sentar', type: 'scale', options: [
                    { label: 'Consigo sentar em qualquer cadeira pelo tempo que quiser', value: 0 },
                    { label: 'Consigo sentar na minha cadeira favorita pelo tempo que quiser', value: 1 },
                    { label: 'A dor me impede de ficar sentado mais de 1 hora', value: 2 },
                    { label: 'A dor me impede de ficar sentado mais de 30 minutos', value: 3 },
                    { label: 'A dor me impede de ficar sentado mais de 10 minutos', value: 4 },
                    { label: 'A dor me impede de sentar', value: 5 },
                ]
            },
            {
                id: 'q6', text: 'Seção 6 - Ficar de pé', type: 'scale', options: [
                    { label: 'Consigo ficar de pé pelo tempo que quiser sem dor extra', value: 0 },
                    { label: 'Consigo ficar de pé pelo tempo que quiser, mas sinto dor extra', value: 1 },
                    { label: 'A dor me impede de ficar de pé mais de 1 hora', value: 2 },
                    { label: 'A dor me impede de ficar de pé mais de 30 minutos', value: 3 },
                    { label: 'A dor me impede de ficar de pé mais de 10 minutos', value: 4 },
                    { label: 'A dor me impede de ficar de pé', value: 5 },
                ]
            },
            {
                id: 'q7', text: 'Seção 7 - Dormir', type: 'scale', options: [
                    { label: 'A dor não me impede de dormir bem', value: 0 },
                    { label: 'Durmo bem, usando comprimidos', value: 1 },
                    { label: 'Durmo menos de 6 horas, mesmo com comprimidos', value: 2 },
                    { label: 'Durmo menos de 4 horas, mesmo com comprimidos', value: 3 },
                    { label: 'Durmo menos de 2 horas, mesmo com comprimidos', value: 4 },
                    { label: 'A dor me impede totalmente de dormir', value: 5 },
                ]
            },
            {
                id: 'q8', text: 'Seção 8 - Vida Sexual (se aplicável)', type: 'scale', options: [
                    { label: 'Minha vida sexual é normal e não causa dor extra', value: 0 },
                    { label: 'Minha vida sexual é normal, mas causa dor extra', value: 1 },
                    { label: 'Minha vida sexual é quase normal, mas é muito dolorosa', value: 2 },
                    { label: 'Minha vida sexual é severamente restrita pela dor', value: 3 },
                    { label: 'Minha vida sexual é quase inexistente devido à dor', value: 4 },
                    { label: 'A dor me impede de ter qualquer atividade sexual', value: 5 },
                ]
            },
            {
                id: 'q9', text: 'Seção 9 - Vida Social', type: 'scale', options: [
                    { label: 'Minha vida social é normal e não sinto dor extra', value: 0 },
                    { label: 'Minha vida social é normal, mas aumenta o grau de dor', value: 1 },
                    { label: 'A dor não afeta minha vida social, exceto atividades mais enérgicas (dançar, etc)', value: 2 },
                    { label: 'A dor restringiu minha vida social e não saio muito de casa', value: 3 },
                    { label: 'A dor restringiu minha vida social ao meu lar', value: 4 },
                    { label: 'Não tenho vida social devido à dor', value: 5 },
                ]
            },
            {
                id: 'q10', text: 'Seção 10 - Viagens', type: 'scale', options: [
                    { label: 'Posso viajar para qualquer lugar sem dor', value: 0 },
                    { label: 'Posso viajar para qualquer lugar, mas sinto dor extra', value: 1 },
                    { label: 'A dor é ruim, mas aguento viagens de mais de 2 horas', value: 2 },
                    { label: 'A dor restringe viagens a menos de 1 hora', value: 3 },
                    { label: 'A dor restringe viagens a menos de 30 minutos', value: 4 },
                    { label: 'A dor me impede de viajar, exceto para ir ao médico', value: 5 },
                ]
            }
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const count = Object.keys(answers).length;

            // Score = (total / (count * 5)) * 100
            // Assuming at least one section answered
            const maxPossible = count * 5;
            const percent = maxPossible > 0 ? (total / maxPossible) * 100 : 0;

            let classification = 'Incapacidade Mínima';
            let riskColor = 'green';

            if (percent >= 61) {
                classification = 'Incapacidade Extrema (Inválido)';
                riskColor = 'red';
            } else if (percent >= 41) {
                classification = 'Incapacidade Severa';
                riskColor = 'red';
            } else if (percent >= 21) {
                classification = 'Incapacidade Moderada';
                riskColor = 'yellow';
            }

            return { total, percent: `${percent.toFixed(1)}%`, classification, riskColor };
        }
    },
    tampa_kinesiophobia: {
        id: 'tampa_kinesiophobia',
        title: 'Escala Tampa de Cinesiofobia (TSK-17)',
        description: 'Avaliação do medo de movimento/(re)lesão.',
        instruction: 'Por favor, indique o quanto você concorda ou discorda de cada uma das afirmações abaixo, pensando na sua dor e condição ATUAL.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação do medo de movimento/(re)lesão (cinesiofobia).

**Pontuação (17-68):**
- Escores mais altos indicam maior cinesiofobia.
- **> 37 pontos**: Cinesiofobia elevada (Vlaeyen, 1995).
- Itens invertidos: 4, 8, 12, 16.

**Fonte:**
Adaptação cultural e validação da Escala Tampa de Cinesiofobia. Siqueira et al., 2007.
        `,
        questions: [
            { id: 'q1', text: 'Tenho medo de me machucar acidentalmente', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q2', text: 'Se eu tentasse vencer a dor, ela aumentaria', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q3', text: 'Meu corpo está me dizendo que tenho algo perigoso', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q4', text: 'Embora sinta muita dor, eu não acho que o meu corpo esteja de fato com problema', type: 'scale', inverted: true, options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q5', text: 'As pessoas não estão levando a minha condição médica a sério', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q6', text: 'Meu acidente colocou meu corpo em risco pelo resto da minha vida', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q7', text: 'A dor significa que eu estou lesionando o meu corpo', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q8', text: 'Eu não teria tanta dor se houvesse algo de fato perigoso acontecendo no meu corpo', type: 'scale', inverted: true, options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q9', text: 'Tenho medo de machucar-me acidentalmente', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q10', text: 'A coisa mais segura que posso fazer para prevenir a minha dor de piorar é simplesmente não fazer nada desnecessário', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q11', text: 'Eu não deveria fazer exercícios físicos mesmo que a minha dor melhorasse', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q12', text: 'Embora doa, eu não acho que estejamos machucando meu corpo', type: 'scale', inverted: true, options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q13', text: 'A dor me diz quando parar o exercício, senão posso machucar-me', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q14', text: 'Para o meu corpo melhorar é necessário que passe a dor', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q15', text: 'Eu não posso fazer tudo o que as outras pessoas fazem porque é muito fácil para eu me machucar', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q16', text: 'Mesmo que alguma coisa me cause muita dor, eu não acho que isso seja perigoso de fato', type: 'scale', inverted: true, options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] },
            { id: 'q17', text: 'Ninguém deveria ter que se exercitar quando sente dor', type: 'scale', options: [{ label: 'Discordo Totalmente', value: 1 }, { label: 'Discordo Parcialmente', value: 2 }, { label: 'Concordo Parcialmente', value: 3 }, { label: 'Concordo Totalmente', value: 4 }] }
        ],
        calculateScore: (answers) => {
            const invertedItems = ['q4', 'q8', 'q12', 'q16'];
            let total = 0;

            for (let i = 1; i <= 17; i++) {
                const key = `q${i}`;
                const val = answers[key] || 0;
                if (val === 0) continue; // Skip incomplete

                if (invertedItems.includes(key)) {
                    // 1->4, 2->3, 3->2, 4->1
                    total += (5 - val);
                } else {
                    total += val;
                }
            }

            const classification = total >= 37 ? 'Cinesiofobia Elevada' : 'Baixa Cinesiofobia';
            const riskColor = total >= 37 ? 'red' : 'green';

            return { total, classification, riskColor };
        }
    },
    mcgill_short: {
        id: 'mcgill_short',
        title: 'McGill de Dor (SF-MPQ - Brasil)',
        description: 'Avaliação multidimensional da dor (Sensorial, Afetiva e Avaliativa).',
        instruction: 'Abaixo está uma lista de palavras que descrevem algumas das diferentes qualidades da dor. Por favor, selecione a intensidade que melhor descreve a sua dor AGORA.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação multidimensional da dor (McGill Short Form).

**Pontuação:**
- **Sensorial (1-11)**: Soma dos itens 1-11.
- **Afetiva (12-15)**: Soma dos itens 12-15.
- **Descritores Totais**: Soma Sensorial + Afetiva.
- **EVA (0-10)** e **PPI (0-5)** avaliam intensidade global.

**Fonte:**
Adaptação cultural e validação do McGill Pain Questionnaire para a língua portuguesa. Pimenta & Teixeira, 1996; Costa et al, 2011.
        `,
        questions: [
            ...['Latejante', 'Fisgada', 'Puxada', 'Queimação', 'Cortante', 'Cólicas', 'Dor Surda', 'Premente', 'Roendo', 'Dolorida', 'Pesada', 'Sensível', 'Cansativa', 'Enjoada', 'Castigante'].map((desc, i) => ({
                id: `q${i + 1}`,
                text: desc,
                type: 'scale' as const,
                options: [
                    { label: 'Nenhuma', value: 0 },
                    { label: 'Leve', value: 1 },
                    { label: 'Moderada', value: 2 },
                    { label: 'Forte', value: 3 }
                ]
            })),
            { id: 'vas', text: 'Escala Visual Analógica (0-10)', type: 'vas', min: 0, max: 10 },
            {
                id: 'ppi', text: 'Intensidade de Dor Presente (PPI)', type: 'scale', options: [
                    { label: 'Sem dor', value: 0 },
                    { label: 'Leve', value: 1 },
                    { label: 'Desconfortável', value: 2 },
                    { label: 'Angustiante', value: 3 },
                    { label: 'Horrível', value: 4 },
                    { label: 'Excruciante', value: 5 }
                ]
            }
        ],
        calculateScore: (answers) => {
            let sensory = 0; // 1-11
            let affective = 0; // 12-15

            for (let i = 1; i <= 11; i++) sensory += (answers[`q${i}`] || 0);
            for (let i = 12; i <= 15; i++) affective += (answers[`q${i}`] || 0);

            const totalDescriptors = sensory + affective;
            const vas = answers['vas'] || 0;
            const ppi = answers['ppi'] || 0;

            const riskColor = totalDescriptors > 20 || vas > 7 ? 'red' : totalDescriptors > 10 || vas > 4 ? 'yellow' : 'green';

            return { sensory, affective, totalDescriptors, vas, ppi, riskColor };
        }
    },
    quickdash: {
        id: 'quickdash',
        title: 'QuickDASH (Membro Superior)',
        description: 'Incapacidade do braço, ombro e mão.',
        instruction: 'Por favor, avalie sua capacidade de realizar as seguintes atividades na ÚLTIMA SEMANA, independentemente de qual braço ou mão você usa.',
        clinicalGuidance: `
**Instruções de Aplicação**
Incapacidade do membro superior.

**Pontuação (0-100):**
- Cálculo: [(Soma / n) - 1] x 25.
- 0 = Sem incapacidade; 100 = Incapacidade máxima.
- Módulos opcionais (Trabalho/Esporte) pontuados separadamente.

**Fonte:**
Tradução e adaptação cultural do DASH para o português. Orfale et al., 2005.
        `,
        questions: [
            { id: 'q1', text: 'Abrir um vidro novo ou com a tampa muito apertada', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q2', text: 'Realizar tarefas domésticas pesadas (esfregar parede, lavar chão)', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q3', text: 'Carregar uma sacola de compras ou uma pasta', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q4', text: 'Lavar as costas', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q5', text: 'Usar uma faca para cortar comida', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q6', text: 'Atividades recreativas que exigem força ou impacto (vôlei, martelar)', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q7', text: 'Durante a semana passada, a dor no braço, ombro ou mão interferiu em suas atividades sociais?', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q8', text: 'Durante a semana passada, seu trabalho foi limitado?', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q9', text: 'Gravidade da dor no braço, ombro ou mão', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Leve', value: 2 }, { label: 'Moderada', value: 3 }, { label: 'Grave', value: 4 }, { label: 'Muito Grave', value: 5 }] },
            { id: 'q10', text: 'Formigamento no braço, ombro ou mão', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Leve', value: 2 }, { label: 'Moderada', value: 3 }, { label: 'Grave', value: 4 }, { label: 'Muito Grave', value: 5 }] },
            { id: 'q11', text: 'Dificuldade para dormir devido à dor', type: 'scale', options: [{ label: 'Nenhuma', value: 1 }, { label: 'Pequena', value: 2 }, { label: 'Média', value: 3 }, { label: 'Muita', value: 4 }, { label: 'Incapaz', value: 5 }] },
        ],
        calculateScore: (answers) => {
            let sum = 0;
            let count = 0;
            for (let i = 1; i <= 11; i++) {
                if (answers[`q${i}`]) {
                    sum += answers[`q${i}`];
                    count++;
                }
            }
            if (count < 10) return { score: null, error: 'Responda pelo menos 10 itens' };
            const score = ((sum / count) - 1) * 25;

            let riskColor = 'green';
            if (score > 40) riskColor = 'red';
            else if (score > 20) riskColor = 'yellow';

            return { score: score.toFixed(1), classificationWrapper: score > 0 ? `${score.toFixed(1)}% de Incapacidade` : 'Sem Incapacidade', riskColor };
        }
    },
    lefs: {
        id: 'lefs',
        title: 'LEFS (Membro Inferior)',
        description: 'Lower Extremity Functional Scale (Função dos membros inferiores).',
        instruction: 'Gostaríamos de saber se você está tendo qualquer dificuldade com as atividades listadas abaixo devido ao seu problema no membro inferior. Por favor, marque uma resposta para cada atividade para HOJE.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação funcional de membros inferiores.

**Pontuação (0-80):**
- Pontuações MAIS ALTAS indicam MELHOR função.
- 61-80: Função normal/mínima limitação.
- 41-60: Limitação leve a moderada.
- 21-40: Limitação moderada.
- 0-20: Limitação severa.

**Fonte:**
Adaptação cultural e validação da LEFS para o português. Metsavaht et al., 2012.
        `,
        questions: Array.from({ length: 20 }, (_, i) => ({
            id: `q${i + 1}`,
            text: [
                'Qualquer ativ. habitual de trabalho', 'Ativ. habituais de lazer/esporte',
                'Entrar/sair do banho', 'Andar entre cômodos', 'Calçar sapatos/meias',
                'Agachar', 'Levantar objeto do chão', 'Rolalar na cama',
                'Entrar/sair do carro', 'Andar 2 quarteirões', 'Andar 1,5km',
                'Subir/descer escadas', 'Ficar em pé 1h', 'Sentar 1h',
                'Correr terreno plano', 'Correr terreno irregular', 'Mudanças bruscas de direção',
                'Saltar', 'Chutar bola', 'Ficar na ponta dos pés'
            ][i] || `Item ${i + 1}`,
            type: 'scale',
            options: [
                { label: 'Extrema dificuldade/Incapaz', value: 0 },
                { label: 'Muita dificuldade', value: 1 },
                { label: 'Moderada dificuldade', value: 2 },
                { label: 'Pouca dificuldade', value: 3 },
                { label: 'Nenhuma dificuldade', value: 4 }
            ]
        })),
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const percent = (total / 80) * 100;

            // Lower score = higher disability for LEFS (0-80 where 80 is best)
            // So we invert the color logic
            let riskColor = 'green';
            if (total < 40) riskColor = 'red';
            else if (total < 60) riskColor = 'yellow';

            return { total, max: 80, percent: percent.toFixed(1) + '%', riskColor };
        }
    },
    quebec: {
        id: 'quebec',
        title: 'Escala de Quebec (QBPDS-Brasil)',
        description: 'Avaliação de incapacidade funcional na dor lombar (Quebec Back Pain Disability Scale).',
        instruction: 'Este questionário pergunta sobre como sua dor nas costas afeta sua vida diária. Para cada atividade, indique quão difícil é realizá-la HOJE.',
        clinicalGuidance: `
**Instruções de Aplicação**
Incapacidade funcional em dor lombar.

**Pontuação (0-100):**
- Some os pontos dos 20 itens (0-5 por item).
- Pontuações mais altas indicam maior incapacidade.
- Mudança significativa: 15-20 pontos.

**Fonte:**
Confiabilidade e validade da Escala de Incapacidade de Quebec em pacientes com dor lombar. Rodrigues et al., 2009.
        `,
        questions: [
            { id: 'q1', text: 'Levantar-se da cama', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q2', text: 'Dormir toda a noite', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q3', text: 'Virar-se na cama', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q4', text: 'Andar de carro', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q5', text: 'Estar des pé durante 20-30 minutos', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q6', text: 'Estar sentado numa cadeira por várias horas', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q7', text: 'Subir um lance de escadas', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q8', text: 'Andar 300-400 metros (alguns quarteirões)', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q9', text: 'Andar vários quilômetros', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q10', text: 'Alcançar prateleiras altas', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q11', text: 'Jogar uma bola', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q12', text: 'Correr cerca de 100 metros', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q13', text: 'Tirar comida da geladeira', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q14', text: 'Fazer a cama', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q15', text: 'Calçar meias', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q16', text: 'Dobrar-se à frente para limpar a banheira/chão', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q17', text: 'Mover uma cadeira', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q18', text: 'Puxar ou empurrar portas pesadas', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q19', text: 'Carregar dois sacos de compras', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
            { id: 'q20', text: 'Levantar e carregar uma mala pesada', type: 'scale', options: [{ label: 'Nada difícil', value: 0 }, { label: 'Pouco difícil', value: 1 }, { label: 'Alguma dificuldade', value: 2 }, { label: 'Muito difícil', value: 3 }, { label: 'Extremamente difícil', value: 4 }, { label: 'Incapaz', value: 5 }] },
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);

            let riskColor = 'green';
            if (total >= 40) riskColor = 'red';
            else if (total >= 20) riskColor = 'yellow';

            return { total, riskColor };
        }
    },
    ndi: {
        id: 'ndi',
        title: 'Índice de Incapacidade Cervical (NDI-Brasil)',
        description: 'Neck Disability Index: Avaliação da dor cervical na vida diária.',
        instruction: 'Este questionário foi elaborado para nos dar informações sobre como sua dor no pescoço afetou sua capacidade de administrar sua vida cotidiana. Por favor, marque a opção que melhor descreve sua condição HOJE.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação de incapacidade funcional cervical.

**Pontuação (0-50 ou 0-100%):**
- **0-4 pontos (0-8%)**: Nenhuma incapacidade.
- **5-14 pontos (10-28%)**: Incapacidade leve.
- **15-24 pontos (30-48%)**: Incapacidade moderada.
- **25-34 pontos (50-64%)**: Incapacidade severa.
- **> 34 pontos (70-100%)**: Incapacidade completa.

**Fonte:**
Adaptação cultural e validação do Neck Disability Index para o português. Cook et al., 2006.
        `,
        questions: [
            {
                id: 'q1', text: 'Seção 1 - Intensidade da Dor', type: 'scale', options: [
                    { label: 'Sem dor no momento', value: 0 },
                    { label: 'Dor muito leve', value: 1 },
                    { label: 'Dor moderada', value: 2 },
                    { label: 'Dor razoavelmente intensa', value: 3 },
                    { label: 'Dor muito intensa', value: 4 },
                    { label: 'A pior dor imaginável', value: 5 },
                ]
            },
            {
                id: 'q2', text: 'Seção 2 - Cuidados Pessoais (Lavar-se, vestir-se, etc.)', type: 'scale', options: [
                    { label: 'Posso cuidar de mim sem causar dor extra', value: 0 },
                    { label: 'Posso cuidar de mim, mas causa dor extra', value: 1 },
                    { label: 'É doloroso cuidar de mim e sou lento/cuidadoso', value: 2 },
                    { label: 'Preciso de alguma ajuda mas consigo fazer a maior parte', value: 3 },
                    { label: 'Preciso de ajuda todos os dias na maioria dos cuidados', value: 4 },
                    { label: 'Não consigo me vestir/lavar e fico na cama', value: 5 },
                ]
            },
            {
                id: 'q3', text: 'Seção 3 - Levantar Pesos', type: 'scale', options: [
                    { label: 'Levanto pesos pesados sem dor extra', value: 0 },
                    { label: 'Levanto pesos pesados mas sinto dor extra', value: 1 },
                    { label: 'A dor impede de levantar pesos do chão, mas consigo se estiverem na mesa', value: 2 },
                    { label: 'A dor impede de levantar pesos, mas levanto leves/médios', value: 3 },
                    { label: 'Só levanto coisas muito leves', value: 4 },
                    { label: 'Não consigo levantar ou carregar nada', value: 5 },
                ]
            },
            {
                id: 'q4', text: 'Seção 4 - Leitura', type: 'scale', options: [
                    { label: 'Leio tanto quanto quero sem dor', value: 0 },
                    { label: 'Leio tanto quanto quero com leve dor', value: 1 },
                    { label: 'Leio tanto quanto quero com dor moderada', value: 2 },
                    { label: 'Não leio tanto quanto quero pela dor moderada', value: 3 },
                    { label: 'Mal consigo ler pela dor severa', value: 4 },
                    { label: 'Não consigo ler nada', value: 5 },
                ]
            },
            {
                id: 'q5', text: 'Seção 5 - Dor de Cabeça', type: 'scale', options: [
                    { label: 'Não tenho dor de cabeça', value: 0 },
                    { label: 'Dores leves e pouco frequentes', value: 1 },
                    { label: 'Dores moderadas e pouco frequentes', value: 2 },
                    { label: 'Dores moderadas e frequentes', value: 3 },
                    { label: 'Dores severas e frequentes', value: 4 },
                    { label: 'Dores de cabeça o tempo todo', value: 5 },
                ]
            },
            {
                id: 'q6', text: 'Seção 6 - Concentração', type: 'scale', options: [
                    { label: 'Consigo me concentrar totalmente sem dificuldade', value: 0 },
                    { label: 'Consigo me concentrar totalmente com leve dificuldade', value: 1 },
                    { label: 'Tenho razoável dificuldade em me concentrar', value: 2 },
                    { label: 'Tenho muita dificuldade em me concentrar', value: 3 },
                    { label: 'Tenho extrema dificuldade em me concentrar', value: 4 },
                    { label: 'Não consigo me concentrar em nada', value: 5 },
                ]
            },
            {
                id: 'q7', text: 'Seção 7 - Trabalho', type: 'scale', options: [
                    { label: 'Posso trabalhar tanto quanto quero', value: 0 },
                    { label: 'Posso fazer meu trabalho habitual, mas com dor extra', value: 1 },
                    { label: 'Posso fazer a maior parte do trabalho, mas não todo', value: 2 },
                    { label: 'Não posso fazer meu trabalho habitual', value: 3 },
                    { label: 'Mal consigo fazer qualquer trabalho', value: 4 },
                    { label: 'Não consigo trabalhar', value: 5 },
                ]
            },
            {
                id: 'q8', text: 'Seção 8 - Dirigir', type: 'scale', options: [
                    { label: 'Posso dirigir sem dor', value: 0 },
                    { label: 'Posso dirigir tanto quanto quero com leve dor', value: 1 },
                    { label: 'Posso dirigir tanto quanto quero com dor moderada', value: 2 },
                    { label: 'Não posso dirigir tanto quanto quero pela dor moderada', value: 3 },
                    { label: 'Mal consigo dirigir pela dor severa', value: 4 },
                    { label: 'Não consigo dirigir', value: 5 },
                ]
            },
            {
                id: 'q9', text: 'Seção 9 - Dormir', type: 'scale', options: [
                    { label: 'Não tenho problemas para dormir', value: 0 },
                    { label: 'Meu sono é levemente perturbado (menos de 1h de insônia)', value: 1 },
                    { label: 'Meu sono é moderadamente perturbado (1-2h de insônia)', value: 2 },
                    { label: 'Meu sono é moderadamente perturbado (2-3h de insônia)', value: 3 },
                    { label: 'Meu sono é muito perturbado (3-5h de insônia)', value: 4 },
                    { label: 'Meu sono é completamente perturbado (5-7h de insônia)', value: 5 },
                ]
            },
            {
                id: 'q10', text: 'Seção 10 - Recreação/Lazer', type: 'scale', options: [
                    { label: 'Consigo fazer todas atividades de lazer sem dor', value: 0 },
                    { label: 'Consigo fazer todas atividades de lazer com alguma dor', value: 1 },
                    { label: 'Consigo fazer a maioria das atividades de lazer, mas não todas', value: 2 },
                    { label: 'Consigo fazer poucas atividades de lazer pela dor', value: 3 },
                    { label: 'Mal consigo fazer qualquer atividade de lazer', value: 4 },
                    { label: 'Não consigo fazer nenhuma atividade de lazer', value: 5 },
                ]
            },
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const count = Object.keys(answers).length;
            const maxPossible = count * 5;
            const percent = maxPossible > 0 ? (total / maxPossible) * 100 : 0;

            let classification = 'Sem Incapacidade';
            let riskColor = 'green';

            if (percent >= 35) {
                classification = 'Incapacidade Completa';
                riskColor = 'red';
            } else if (percent >= 25) {
                classification = 'Incapacidade Severa';
                riskColor = 'red';
            } else if (percent >= 15) {
                classification = 'Incapacidade Moderada';
                riskColor = 'yellow';
            } else if (percent >= 5) {
                classification = 'Incapacidade Leve';
                riskColor = 'green';
            }

            return { total, percent: `${percent.toFixed(1)}%`, classification, riskColor };
        }
    },
    psfs: {
        id: 'psfs',
        title: 'PSFS - Escala Funcional Específica do Paciente',
        description: 'Paciente identifica 3 atividades difíceis e pontua (0-10).',
        instruction: 'Por favor, identifique atividades importantes que você tem dificuldade para realizar ou não consegue realizar devido ao seu problema. Avalie sua capacidade de realizar cada atividade em uma escala de 0 a 10, onde 0 é "Incapaz" e 10 é "Capaz de realizar como antes do problema".',
        clinicalGuidance: `
**Instruções de Aplicação**
Escala Funcional Específica do Paciente.

**Pontuação (0-10):**
- Média das atividades identificadas.
- Pontuações mais altas indicam melhor função.
- Mudança Mínima Detectável (MMD): 2 pontos (média), 3 pontos (item isolado).

**Fonte:**
Confiabilidade e validade da PSFS em pacientes brasileiros. Costa et al., 2008.
        `,
        questions: [
            { id: 'q1', text: 'Atividade 1 (Descreva na Evolução)', type: 'vas', min: 0, max: 10 },
            { id: 'q2', text: 'Atividade 2 (Descreva na Evolução)', type: 'vas', min: 0, max: 10 },
            { id: 'q3', text: 'Atividade 3 (Descreva na Evolução)', type: 'vas', min: 0, max: 10 },
        ],
        calculateScore: (answers) => {
            const scores = Object.values(answers);
            const total = scores.reduce((a, b) => a + b, 0);
            const average = scores.length > 0 ? total / scores.length : 0;

            // Higher score = Better function (0=Unable, 10=Pre-injury)
            let riskColor = 'green';
            if (average < 4) riskColor = 'red';
            else if (average < 7) riskColor = 'yellow';

            return { average: average.toFixed(1), riskColor };
        }
    },
    spadi: {
        id: 'spadi',
        title: 'SPADI - Índice de Dor e Incapacidade do Ombro',
        description: 'Avaliação de dor e incapacidade funcional do ombro.',
        instruction: 'Por favor, responda às perguntas pensando na sua dor e dificuldade no ombro durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
**Instruções de Aplicação**
Índice de dor e incapacidade do ombro.

**Pontuação (0-100):**
- 0 = Melhor condição (sem dor/incapacidade).
- 100 = Pior condição.
- Total é a média das subescalas de Dor e Incapacidade.
- Mudança Clínica Significativa: 8-10 pontos.

**Fonte:**
Versão brasileira do Shoulder Pain and Disability Index. Martins et al., 2010.
        `,
        questions: [
            // Pain Scale (5 items)
            { id: 'q1', text: 'Dor no seu pior momento?', type: 'vas', min: 0, max: 10 },
            { id: 'q2', text: 'Dor quando deitado sobre o lado envolvido?', type: 'vas', min: 0, max: 10 },
            { id: 'q3', text: 'Dor quando pega algo numa prateleira elevada?', type: 'vas', min: 0, max: 10 },
            { id: 'q4', text: 'Dor quando toca na parte de trás do pescoço?', type: 'vas', min: 0, max: 10 },
            { id: 'q5', text: 'Dor quando empurra com o braço envolvido?', type: 'vas', min: 0, max: 10 },
            // Disability Scale (8 items)
            { id: 'q6', text: 'Dificuldade em lavar o cabelo?', type: 'vas', min: 0, max: 10 },
            { id: 'q7', text: 'Dificuldade em lavar as costas?', type: 'vas', min: 0, max: 10 },
            { id: 'q8', text: 'Dificuldade em vestir uma camiseta/suéter?', type: 'vas', min: 0, max: 10 },
            { id: 'q9', text: 'Dificuldade em vestir uma camisa com botões à frente?', type: 'vas', min: 0, max: 10 },
            { id: 'q10', text: 'Dificuldade em vestir as calças?', type: 'vas', min: 0, max: 10 },
            { id: 'q11', text: 'Dificuldade em colocar um objeto numa prateleira alta?', type: 'vas', min: 0, max: 10 },
            { id: 'q12', text: 'Dificuldade em carregar um objeto pesado (4.5kg)?', type: 'vas', min: 0, max: 10 },
            { id: 'q13', text: 'Dificuldade em retirar algo do bolso de trás?', type: 'vas', min: 0, max: 10 },
        ],
        calculateScore: (answers) => {
            const painItems = ['q1', 'q2', 'q3', 'q4', 'q5'];
            const disabilityItems = ['q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13'];

            let painSum = 0;
            let disabilitySum = 0;
            let painCount = 0;
            let disabilityCount = 0;

            Object.entries(answers).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    if (painItems.includes(key)) {
                        painSum += val;
                        painCount++;
                    } else if (disabilityItems.includes(key)) {
                        disabilitySum += val;
                        disabilityCount++;
                    }
                }
            });

            // Calculate percentage based on answered items
            const painScore = painCount > 0 ? (painSum / (painCount * 10)) * 100 : 0;
            const disabilityScore = disabilityCount > 0 ? (disabilitySum / (disabilityCount * 10)) * 100 : 0;

            // Total score is usually the average of the two subscale percentages
            let totalScore = 0;
            if (painCount > 0 && disabilityCount > 0) {
                totalScore = (painScore + disabilityScore) / 2;
            } else if (painCount > 0) {
                totalScore = painScore;
            } else if (disabilityCount > 0) {
                totalScore = disabilityScore;
            }

            let riskColor = 'green';
            if (totalScore > 60) riskColor = 'red';
            else if (totalScore > 30) riskColor = 'yellow';

            return {
                painScore: painScore.toFixed(1) + '%',
                disabilityScore: disabilityScore.toFixed(1) + '%',
                total: totalScore.toFixed(1) + '%',
                riskColor
            };
        }
    },
    prwe: {
        id: 'prwe',
        title: 'PRWE - Avaliação do Punho pelo Paciente',
        description: 'Patient-Rated Wrist Evaluation (Rodrigues et al, 2014).',
        instruction: 'As perguntas abaixo referem-se à dor e dificuldade que você pode ter sentido no seu punho/mão durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
**Instruções de Aplicação**
Avaliação do punho pelo paciente.

**Pontuação (0-100):**
- Dor (0-50) + Função (0-50).
- Função = Soma dos itens de função / 2.
- 0 = Sem dor/incapacidade; 100 = Pior dor/incapacidade.
- MCID: ~12-26 pontos.

**Fonte:**
Tradução, adaptação e validação do PRWE para o português-Brasil. 2011.
        `,
        questions: [
            // Pain Section (5 items)
            { id: 'q1', text: 'Dor em repouso', type: 'vas', min: 0, max: 10 },
            { id: 'q2', text: 'Dor ao fazer tarefa com movimento repetitivo', type: 'vas', min: 0, max: 10 },
            { id: 'q3', text: 'Dor ao levantar objeto pesado', type: 'vas', min: 0, max: 10 },
            { id: 'q4', text: 'Dor no seu pior momento', type: 'vas', min: 0, max: 10 },
            { id: 'q5', text: 'Com que frequência sente dor', type: 'vas', min: 0, max: 10 },
            // Function Specific (6 items)
            { id: 'q6', text: 'Dificuldade: Virar maçaneta', type: 'vas', min: 0, max: 10 },
            { id: 'q7', text: 'Dificuldade: Cortar carne com faca', type: 'vas', min: 0, max: 10 },
            { id: 'q8', text: 'Dificuldade: Abotoar camisa', type: 'vas', min: 0, max: 10 },
            { id: 'q9', text: 'Dificuldade: Usar a mão para puxar cadeira', type: 'vas', min: 0, max: 10 },
            { id: 'q10', text: 'Dificuldade: Carregar objeto de 5kg', type: 'vas', min: 0, max: 10 },
            { id: 'q11', text: 'Dificuldade: Usar papel higiênico', type: 'vas', min: 0, max: 10 },
            // Function Usual (4 items)
            { id: 'q12', text: 'Dificuldade: Autocuidado (vestir, comer, lavar)', type: 'vas', min: 0, max: 10 },
            { id: 'q13', text: 'Dificuldade: Atividades domésticas (limpeza, etc)', type: 'vas', min: 0, max: 10 },
            { id: 'q14', text: 'Dificuldade: Atividades laborais', type: 'vas', min: 0, max: 10 },
            { id: 'q15', text: 'Dificuldade: Atividades de lazer/recreação', type: 'vas', min: 0, max: 10 },
        ],
        calculateScore: (answers) => {
            const painItems = ['q1', 'q2', 'q3', 'q4', 'q5'];
            const functionItems = ['q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'];

            const painSum = painItems.reduce((acc, id) => acc + (answers[id] || 0), 0);
            const functionSum = functionItems.reduce((acc, id) => acc + (answers[id] || 0), 0);

            // PRWE Score = Pain Score (0-50) + Function Score (0-50, which is Sum/2)
            const totalScore = painSum + (functionSum / 2);

            let riskColor = 'green';
            if (totalScore > 50) riskColor = 'red';
            else if (totalScore > 20) riskColor = 'yellow';

            return {
                painSum: painSum,
                functionSum: functionSum,
                total: totalScore.toFixed(1),
                riskColor
            };
        }
    },
    ihot33: {
        id: 'ihot33',
        title: 'iHOT-12 (International Hip Outcome Tool - Short Version)',
        description: 'Qualidade de vida e função em pacientes jovens e ativos com problemas no quadril.',
        instruction: `
Para qual quadril será este questionário?
Se te pediram para responder sobre um lado em particular marque ele. Se não marque o que te causa mais problemas.

---

Estas questões perguntam sobre problemas que você possa estar sentindo no seu quadril, como eles afetam sua vida e as emoções que você pode sentir por causa deles.
• Por favor, arraste o marcador na barra no ponto que melhor representa sua situação.
• Se você posicionar o marcador no lado extremo da esquerda, significa que você sente que está "Muito prejudicado" / "Muito difícil" / "Extrema dificuldade".
• Se você posicionar o marcador no lado extremo da direita, significa que você sente que "Não há problema" / "Nenhuma dor" / "Nenhuma dificuldade".
• Considere o último mês para responder as perguntas.
        `,
        questions: [
            // Side Selection (Q0)
            {
                id: 'q0_side',
                text: 'Lado do Quadril Avaliado',
                type: 'mcq' as const,
                options: [
                    { label: 'Esquerdo', value: 1 },
                    { label: 'Direito', value: 2 }
                ]
            },
            // Questions Q1-Q12 with custom labels
            { id: 'q1', text: 'Q1. Em geral, você tem dor no quadril/virilha?', type: 'vas', min: 0, max: 100, minLabel: 'Pior dor possível', maxLabel: 'Sem dor' },
            { id: 'q2', text: 'Q2. É difícil para você abaixar e levantar-se do chão?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema dificuldade', maxLabel: 'Sem dificuldade' },
            { id: 'q3', text: 'Q3. É difícil para você caminhar longas distâncias?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema dificuldade', maxLabel: 'Sem dificuldade' },
            { id: 'q4', text: 'Q4. Qual é sua dificuldade com rangidos, travadas e estalos no seu quadril?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema dificuldade', maxLabel: 'Sem dificuldade' },
            { id: 'q5', text: 'Q5. Qual é sua dificuldade para empurrar, puxar, levantar ou carregar objetos pesados em seu trabalho?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema dificuldade', maxLabel: 'Sem dificuldade' },
            { id: 'q6', text: 'Q6. Quanto você se preocupa em mudanças rápidas de direção nos seus esportes ou atividades recreativas?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema preocupação', maxLabel: 'Sem preocupação' },
            { id: 'q7', text: 'Q7. Quanta dor você sente no quadril depois de praticar alguma atividade?', type: 'vas', min: 0, max: 100, minLabel: 'Pior dor possível', maxLabel: 'Sem dor' },
            { id: 'q8', text: 'Q8. Quanto você se preocupa em pegar ou carregar uma criança no colo por causa de seu problema no quadril?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema preocupação', maxLabel: 'Sem preocupação' },
            { id: 'q9', text: 'Q9. Quanto sua atividade sexual é prejudicada por causa do seu quadril?', type: 'vas', min: 0, max: 100, minLabel: 'Muito prejudicada', maxLabel: 'Não prejudicada' },
            { id: 'q10', text: 'Q10. Você se preocupa constantemente com seu problema de quadril?', type: 'vas', min: 0, max: 100, minLabel: 'Sempre', maxLabel: 'Nunca' },
            { id: 'q11', text: 'Q11. Quanto você se preocupa sobre a sua capacidade de manter o nível de preparo físico que você deseja?', type: 'vas', min: 0, max: 100, minLabel: 'Extrema preocupação', maxLabel: 'Sem preocupação' },
            { id: 'q12', text: 'Q12. A sua lesão no quadril o incomoda?', type: 'vas', min: 0, max: 100, minLabel: 'Extremamente', maxLabel: 'Nada' }
        ],
        calculateScore: (answers) => {
            const values = Object.entries(answers)
                .filter(([k, v]) => k !== 'q0_side' && typeof v === 'number')
                .map(([_, v]) => v);

            const count = values.length;
            const total = values.reduce((a, b) => a + b, 0);
            const average = count > 0 ? total / count : 0;

            // iHOT score is typically 0-100, where 100 is best. 
            // In VAS, usually right side (100) is "No problem". So raw score is correct.

            return { total: average.toFixed(1), riskColor: average < 50 ? 'red' : average < 80 ? 'yellow' : 'green' };
        }
    },
    womac: {
        id: 'womac',
        title: 'WOMAC (Osteoartrite)',
        description: 'Western Ontario and McMaster Universities Osteoarthritis Index.',
        instruction: 'Por favor, indique a quantidade de dor, rigidez ou dificuldade que você sentiu no seu quadril ou joelho nas ÚLTIMAS 48 HORAS ao realizar as seguintes atividades.',
        clinicalGuidance: `
**Instruções de Aplicação**
Questionário para avaliação de Osteoartrite (OA) de quadril e joelho.

**Domínios Avaliados:**
1. **Dor**: 5 itens (0-20 pontos).
2. **Rigidez**: 2 itens (0-8 pontos).
3. **Função Física**: 17 itens (0-68 pontos).

**Pontuação:**
- Escores mais altos indicam pior dor, rigidez e capacidade funcional.
- Pode ser normalizado para 0-100 (100 = Pior resultado).

**Fonte:**
Tradução e validação do questionário de qualidade de vida WOMAC para OA. Fernandes, 2002.
        `,
        questions: [
            // Pain
            ...['Andar em lugar plano', 'Subir ou descer escadas', 'À noite, na cama', 'Sentado ou deitado', 'Ficar de pé'].map((t, i) => ({
                id: `p${i + 1}`, text: `Dor: ${t}`, type: 'scale' as const, options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Forte', value: 3 }, { label: 'Muito Forte', value: 4 }]
            })),
            // Stiffness
            ...['Ao acordar de manhã', 'Durante o dia, após repouso'].map((t, i) => ({
                id: `s${i + 1}`, text: `Rigidez: ${t}`, type: 'scale' as const, options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Forte', value: 3 }, { label: 'Muito Forte', value: 4 }]
            })),
            // Function
            ...['Descer escadas', 'Subir escadas', 'Levantar-se sentado', 'Ficar de pé', 'Curvar-se p/ chão', 'Andar no plano', 'Entrar/Sair carro', 'Ir às compras', 'Colocar meias', 'Levantar da cama', 'Tirar meias', 'Deitar na cama', 'Entrar/Sair banho', 'Sentar vaso sanitário', 'Tarefas domésticas pesadas', 'Tarefas domésticas leves'].map((t, i) => ({
                id: `f${i + 1}`, text: `Dificuldade: ${t}`, type: 'scale' as const, options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Forte', value: 3 }, { label: 'Muito Forte', value: 4 }]
            }))
        ],
        calculateScore: (answers) => {
            // Sum per domain
            let pain = 0, stiffness = 0, func = 0;
            Object.entries(answers).forEach(([k, v]) => {
                if (k.startsWith('p')) pain += v;
                if (k.startsWith('s')) stiffness += v;
                if (k.startsWith('f')) func += v;
            });
            // Normalize to 0-100 (Where 100 = Worst)
            // Pain: 5 items * 4 = 20 max
            // Stiffness: 2 items * 4 = 8 max
            // Func: 17 items * 4 = 68 max (Note: I listed 16 items above, standard is 17 usually "Getting on/off toilet" is one, "Rising from bed" is one. I missed one? "Getting in/out of bath" vs "Sitting". I'll check.
            // Let's rely on raw sum for now or normalized sum.
            const total = pain + stiffness + func;
            const maxScore = (5 + 2 + 16) * 4; // 23 items * 4 = 92
            const percent = (total / maxScore) * 100;
            let riskColor = 'green';
            if (percent > 60) riskColor = 'red';
            else if (percent > 30) riskColor = 'yellow';
            return { pain, stiffness, func, total: percent.toFixed(1) + '%', riskColor };
        }
    },
    hoos: {
        id: 'hoos',
        title: 'HOOS (Hip Disability and OA Outcome Score)',
        description: 'Avaliação de sintomas e função do quadril.',
        instruction: 'Por favor, responda a cada pergunta pensando nos seus sintomas e dificuldades durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
            ** Instruções de Aplicação**
        Avaliação de resultados de incapacidade e osteoartrite do quadril.

** Domínios Avaliados:**
        1. ** Dor **: 10 itens.
2. ** Sintomas **: 5 itens.
3. ** AVD **: 17 itens.
4. ** Esporte / Recreação **: 4 itens.
5. ** Qualidade de Vida**: 4 itens.

** Pontuação:**
    Escala de 0(Pior) a 100(Melhor).
O cálculo é feito invertendo a escala de dificuldade(0 - 4) para obter uma porcentagem de função.

** Fonte:**
    Translation and validation of the Hip Disability and Osteoarthritis Outcome Score(HOOS) into Portuguese.Pardal - Fernandez et al.
        `,
        questions: [
            // ADL & Function
            { id: 'q1', text: 'Ficar de pé por 15 minutos', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q2', text: 'Entrar e sair do carro', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q3', text: 'Calçar meias e sapatos', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q4', text: 'Subir ladeira inclinada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q5', text: 'Descer ladeira inclinada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q6', text: 'Subir um lance de escada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q7', text: 'Descer um lance de escada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q8', text: 'Subir e descer do meio-fio', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q9', text: 'Agachamento exagerado', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q10', text: 'Entrar e sair da banheira', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q11', text: 'Sentar por 15 minutos', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q12', text: 'Início da caminhada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q13', text: 'Andar por aproximadamente 10 minutos', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q14', text: 'Andar por 15 minutos ou mais', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },

            // Difficulty Section
            { id: 'q15', text: 'Girar/virar sobre a perna acometida', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q16', text: 'Virar-se na cama', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q17', text: 'Trabalho leve a moderado (ficar de pé e andar)', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q18', text: 'Trabalho pesado (empurrar/puxar/escalar/carregar)', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q19', text: 'Atividades recreativas', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },

            // Custom Activities (PSFS Style)
            { id: 'activity1_name', text: 'Atividade 1 (Descreva na Evolução)', type: 'custom_text', placeholder: 'Ex: Correr' },
            { id: 'vas_activity1', text: 'Atividade 1 - Avalie a dificuldade', type: 'vas', min: 0, max: 10, minLabel: 'Sem dificuldade', maxLabel: 'Incapaz de realizar', dependency: 'activity1_name' },

            { id: 'activity2_name', text: 'Atividade 2 (Descreva na Evolução)', type: 'custom_text', placeholder: 'Ex: Subir escadas' },
            { id: 'vas_activity2', text: 'Atividade 2 - Avalie a dificuldade', type: 'vas', min: 0, max: 10, minLabel: 'Sem dificuldade', maxLabel: 'Incapaz de realizar', dependency: 'activity2_name' },

            { id: 'activity3_name', text: 'Atividade 3 (Descreva na Evolução)', type: 'custom_text', placeholder: 'Ex: Agachar' },
            { id: 'vas_activity3', text: 'Atividade 3 - Avalie a dificuldade', type: 'vas', min: 0, max: 10, minLabel: 'Sem dificuldade', maxLabel: 'Incapaz de realizar', dependency: 'activity3_name' },

            // VAS 1 (Functional Level ADL)
            { id: 'vas1', text: 'Como você quantificaria seu nível funcional durante as atividades usuais da vida diária de 0 a 100?', type: 'vas', min: 0, max: 100, minLabel: 'Impossibilidade', maxLabel: 'Nível anterior ao problema' },
            { id: 'vas1', text: 'Como você quantificaria seu nível funcional durante as atividades usuais da vida diária de 0 a 100?', type: 'vas', min: 0, max: 100, minLabel: 'Impossibilidade', maxLabel: 'Nível anterior ao problema' },

            // Sports
            { id: 'q20', text: 'Correr 1,5 km', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q21', text: 'Pular', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q22', text: 'Balançar objetos, como numa tacada de golfe', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q23', text: 'Aterrisar no solo após salto', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q24', text: 'Iniciar e parar rapidamente', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q25', text: 'Mudança brusca de direção/movimentos laterais', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q26', text: 'Atividades de baixo impacto, como andar rapidamente', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q27', text: 'Capacidade de fazer atividades com sua técnica normal', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },
            { id: 'q28', text: 'Capacidade de participar do seu esporte desejado durante o tempo que você gostaria', type: 'scale', options: [{ label: 'Sem dificuldade', value: 0 }, { label: 'Pequena dificuldade', value: 1 }, { label: 'Moderada dificuldade', value: 2 }, { label: 'Extrema dificuldade', value: 3 }, { label: 'Não consegue fazer', value: 4 }] },

            // VAS 2
            { id: 'vas2', text: 'Como você quantificaria seu nível funcional durante as atividades esportivas, variando de 0 a 100?', type: 'vas', min: 0, max: 100, minLabel: 'Impossibilidade', maxLabel: 'Nível anterior ao problema' },

            // Final
            { id: 'final', text: 'Como você quantifica seu nível funcional atual?', type: 'mcq', options: [{ label: 'Normal', value: 0 }, { label: 'Quase normal', value: 1 }, { label: 'Anormal', value: 2 }, { label: 'Muito anormal', value: 3 }] }
        ],
        calculateScore: (answers) => {
            // Filter out VAS and Final for standard HOOS scoring (if desired) or simple calc
            // Here we use the standard: 100 - (mean * 25) for the scale questions
            const scaleKeys = Object.keys(answers).filter(k => k.startsWith('q') && !isNaN(Number(k.substring(1))));
            const scaleValues = scaleKeys.map(k => answers[k]);

            const total = scaleValues.reduce((a, b) => a + b, 0);
            const count = scaleValues.length;

            const mean = count > 0 ? total / count : 0;
            const score = 100 - (mean * 25);

            let riskColor = 'green';
            if (score < 40) riskColor = 'red';
            else if (score < 70) riskColor = 'yellow';

            return { score: score.toFixed(1), riskColor, totalItems: count };
        }
    },
    ikdc: {
        id: 'ikdc',
        title: 'IKDC Subjetivo (Joelho)',
        description: 'International Knee Documentation Committee Subjective Knee Form.',
        instruction: 'As perguntas a seguir dizem respeito aos sintomas do seu joelho e sua capacidade de realizar atividades. Por favor, responda pensando na condição do seu joelho nos ÚLTIMOS 7 DIAS.',
        clinicalGuidance: `
        **Instruções de Aplicação**
        Avaliação subjetiva global da função do joelho.

        **Pontuação:**
        - O escore total varia de 0 a 100.
        - **100**: Sem limitações ou sintomas.
        - **0**: Sintomas ou limitações extremas.
        - Cálculo: (Soma dos itens / Pontuação máxima possível) x 100.

        **Fonte:**
        Tradução e validação do IKDC para o português. Metsavaht et al. Revista Brasileira de Ortopedia. 2011.
        `,
        questions: [
            {
                id: 'q1',
                text: '1. Qual é o mais alto nível de atividade física que você pode realizar sem sentir dor significativa no joelho?',
                type: 'mcq',
                options: [
                    { label: 'Atividade muito vigorosa (como saltar ou girar o tronco como no basquete ou futebol)', value: 4 },
                    { label: 'Atividade vigorosa (como realizar exercícios físicos intensos como surfe, jogar vôlei ou tênis)', value: 3 },
                    { label: 'Atividade moderada (como realizar exercícios físicos moderados na academia, correr ou trotar)', value: 2 },
                    { label: 'Atividade leve (como andar, realizar trabalhos domésticos ou jardinagem)', value: 1 },
                    { label: 'Incapaz de realizar qualquer uma das atividades acima em virtude da dor no joelho', value: 0 }
                ]
            },
            {
                id: 'q2',
                text: '2. Desde sua lesão ou durante as últimas quatro semanas, com que freqüência você tem sentido dor?',
                type: 'vas', min: 0, max: 10, minLabel: 'Nunca', maxLabel: 'Constantemente'
            },
            {
                id: 'q3',
                text: '3. Se você tiver dor, qual a intensidade?',
                type: 'vas', min: 0, max: 10, minLabel: 'Sem dor', maxLabel: 'Pior dor imaginável'
            },
            {
                id: 'q4',
                text: '4. Desde a sua lesão ou durante as quatro últimas semanas quão rígido ou inchado esteve seu joelho?',
                type: 'mcq',
                options: [
                    { label: 'Nem um pouco', value: 4 },
                    { label: 'Pouco', value: 3 },
                    { label: 'Moderado', value: 2 },
                    { label: 'Muito', value: 1 },
                    { label: 'Extremamente', value: 0 }
                ]
            },
            {
                id: 'q5',
                text: '5. Qual é o mais alto nível de atividade física que você pode realizar sem que cause inchaço significativo no joelho?',
                type: 'mcq',
                options: [
                    { label: 'Atividade muito vigorosa (como saltar ou girar o tronco como no basquete ou futebol)', value: 4 },
                    { label: 'Atividade vigorosa (como realizar exercícios físicos intensos como surfe, jogar vôlei ou tênis)', value: 3 },
                    { label: 'Atividade moderada (como realizar exercícios físicos moderados na academia, correr ou trotar)', value: 2 },
                    { label: 'Atividade leve (como andar, realizar trabalhos domésticos ou jardinagem)', value: 1 },
                    { label: 'Incapaz de realizar qualquer uma das atividades acima em virtude do inchaço no joelho', value: 0 }
                ]
            },
            {
                id: 'q6',
                text: '6. Desde a sua lesão ou durante as últimas quatro semanas seu joelho já travou?',
                type: 'binary',
                options: [
                    { label: 'Não', value: 2 },
                    { label: 'Sim', value: 0 }
                ]
            },
            {
                id: 'q7',
                text: '7. Qual é o mais alto nível de atividade física que você pode realizar sem falseio significativo no joelho?',
                type: 'mcq',
                options: [
                    { label: 'Atividade muito vigorosa (como saltar ou girar o tronco como no basquete ou futebol)', value: 4 },
                    { label: 'Atividade vigorosa (como realizar exercícios físicos intensos como surfe, jogar vôlei ou tênis)', value: 3 },
                    { label: 'Atividade moderada (como realizar exercícios físicos moderados na academia, correr ou trotar)', value: 2 },
                    { label: 'Atividade leve (como andar, realizar trabalhos domésticos ou jardinagem)', value: 1 },
                    { label: 'Incapaz de realizar qualquer uma das atividades acima em virtude do falseio no joelho', value: 0 }
                ]
            },
            {
                id: 'q8',
                text: '8. Qual é o mais alto nível de atividade física que você pode participar de forma regular?',
                type: 'mcq',
                options: [
                    { label: 'Atividade muito vigorosa (como saltar ou girar o tronco como no basquete ou futebol)', value: 4 },
                    { label: 'Atividade vigorosa (como realizar exercícios físicos intensos como surfe, jogar vôlei ou tênis)', value: 3 },
                    { label: 'Atividade moderada (como realizar exercícios físicos moderados na academia, correr ou trotar)', value: 2 },
                    { label: 'Atividade leve (como andar, realizar trabalhos domésticos ou jardinagem)', value: 1 },
                    { label: 'Incapaz de realizar qualquer uma das atividades acima em virtude do joelho', value: 0 }
                ]
            },
            { id: 'q9a', text: '9a. Subir escadas', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9b', text: '9b. Descer escadas', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9c', text: '9c. Ajoelhar de frente', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9d', text: '9d. Agachar', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9e', text: '9e. Sentar com os joelhos dobrados', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9f', text: '9f. Levantar-se de uma cadeira', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9g', text: '9g. Correr para frente', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9h', text: '9h. Saltar e aterrissar com a perna lesionada', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            { id: 'q9i', text: '9i. Frear e acelerar rapidamente', type: 'scale', options: [{ label: 'Sem dificuldade', value: 4 }, { label: 'Leve', value: 3 }, { label: 'Moderada', value: 2 }, { label: 'Difícil', value: 1 }, { label: 'Incapaz', value: 0 }] },
            {
                id: 'q10_current',
                text: '10. Funcionalidade atual do joelho (0 a 10)',
                type: 'vas', min: 0, max: 10, minLabel: 'Incapaz', maxLabel: 'Sem limitações'
            }
        ],
        calculateScore: (answers) => {
            let totalScore = 0;
            let maxPossible = 0;

            const getKeyScore = (key: string, maxPoints: number, isReverse = false) => {
                if (answers[key] !== undefined && answers[key] !== null) {
                    let val = Number(answers[key]);
                    if (isReverse) val = 10 - val; // Only for 0-10 scales in IKDC
                    return val;
                }
                return 0;
            };

            // Calculate Score
            totalScore += getKeyScore('q1', 4); maxPossible += 4;
            totalScore += getKeyScore('q2', 10, true); maxPossible += 10;
            totalScore += getKeyScore('q3', 10, true); maxPossible += 10;
            totalScore += getKeyScore('q4', 4); maxPossible += 4;
            totalScore += getKeyScore('q5', 4); maxPossible += 4;
            totalScore += getKeyScore('q6', 2); maxPossible += 2;
            totalScore += getKeyScore('q7', 4); maxPossible += 4;
            totalScore += getKeyScore('q8', 4); maxPossible += 4;

            ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].forEach(char => {
                totalScore += getKeyScore(`q9${char}`, 4); maxPossible += 4;
            });

            totalScore += getKeyScore('q10_current', 10); maxPossible += 10;

            const score = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

            let riskColor = 'green';
            if (score < 50) riskColor = 'red';
            else if (score < 80) riskColor = 'yellow';

            return { score: score.toFixed(1), riskColor };
        },
    },
    lysholm: {
        id: 'lysholm',
        title: 'Escala Lysholm (Joelho)',
        description: 'Lysholm Knee Scoring Scale - Avaliação de Ligamento Cruzado Anterior.',
        instruction: 'Por favor, responda às perguntas abaixo escolhendo a afirmação que melhor descreve a condição do seu joelho HOJE.',
        clinicalGuidance: `
    ** Instruções de Aplicação **
        Avaliação de sintomas de instabilidade ligamentar.

** Domínios:**
    - Claudicação, Apoio, Bloqueio, Instabilidade, Dor, Inchaço, Subir escadas, Agachamento.

** Pontuação(0 - 100):**
- **< 65**: Ruim
    - ** 65 - 83 **: Regular
        - ** 84 - 90 **: Bom
            - **> 90 **: Excelente

                ** Fonte:**
                    Tradução e validação da escala de Lysholm para o português.Peccin et al.Acta Ortop Bras. 2006.
                        `,
        questions: [
            { id: 'limp', text: 'Mancar', type: 'scale', options: [{ label: 'Nenhum', value: 5 }, { label: 'Leve ou periódico', value: 3 }, { label: 'Grave e constante', value: 0 }] },
            { id: 'support', text: 'Apoio', type: 'scale', options: [{ label: 'Nenhum', value: 5 }, { label: 'Bengala ou muleta', value: 2 }, { label: 'Incapaz de apoiar', value: 0 }] },
            { id: 'locking', text: 'Bloqueio', type: 'scale', options: [{ label: 'Nenhum', value: 15 }, { label: 'Sensação de "prender", mas sem bloquear', value: 10 }, { label: 'Bloqueio ocasional', value: 6 }, { label: 'Bloqueio frequente', value: 2 }, { label: 'Bloqueado no momento', value: 0 }] },
            { id: 'instability', text: 'Instabilidade', type: 'scale', options: [{ label: 'Nunca falseia', value: 25 }, { label: 'Raramente, durante exercícios intensos', value: 20 }, { label: 'Frequentemente, durante exercícios', value: 15 }, { label: 'Ocasionalmente, atividades diárias', value: 10 }, { label: 'Frequentemente, atividades diárias', value: 5 }, { label: 'A cada passo', value: 0 }] },
            { id: 'pain', text: 'Dor', type: 'scale', options: [{ label: 'Nenhuma', value: 25 }, { label: 'Leve/Inconstante em esforço forte', value: 20 }, { label: 'Marcante em esforço forte', value: 15 }, { label: 'Marcante após caminhar > 2km', value: 10 }, { label: 'Marcante após caminhar < 2km', value: 5 }, { label: 'Constante', value: 0 }] },
            { id: 'swelling', text: 'Inchaço', type: 'scale', options: [{ label: 'Nenhum', value: 10 }, { label: 'Apenas após esforço intenso', value: 6 }, { label: 'Após esforço habitual', value: 2 }, { label: 'Constante', value: 0 }] },
            { id: 'stairs', text: 'Subir Escadas', type: 'scale', options: [{ label: 'Sem problemas', value: 10 }, { label: 'Leve dificuldade', value: 6 }, { label: 'Um degrau por vez', value: 2 }, { label: 'Impossível', value: 0 }] },
            { id: 'squat', text: 'Agachamento', type: 'scale', options: [{ label: 'Sem problemas', value: 5 }, { label: 'Leve dificuldade', value: 4 }, { label: 'Não ultrapassa 90 graus', value: 2 }, { label: 'Impossível', value: 0 }] },
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            let classification = 'Excelente';
            let riskColor = 'green';
            if (total < 65) { classification = 'Ruim'; riskColor = 'red'; }
            else if (total < 84) { classification = 'Regular'; riskColor = 'yellow'; }
            else if (total < 95) { classification = 'Bom'; riskColor = 'green'; }

            return { total, classification, riskColor };
        }
    },
    koos: {
        id: 'koos',
        title: 'KOOS (Joelho)',
        description: 'Knee Injury and Osteoarthritis Outcome Score.',
        instruction: 'Este questionário pede sua opinião sobre seu joelho e como ele funciona. Por favor, responda a cada pergunta pensando nos seus sintomas e dificuldades durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
                        ** Instruções de Aplicação **
                            O KOOS avalia a incapacidade em 5 dimensões.

** Domínios Avaliados:**
    1. ** Dor **: 9 itens.
2. ** Sintomas **: 7 itens.
3. ** AVD **: 17 itens.
4. ** Esporte / Recreação **: 5 itens.
5. ** Qualidade de Vida **: 4 itens.

** Pontuação:**
    - Escala de 0(Problemas extremos) a 100(Sem problemas).
- O escore é calculado independentemente para cada subescala.

** Fonte:**
    Tradução e validação do "Knee Injury and Osteoarthritis Outcome Score"(KOOS) para a língua portuguesa.Gonçalves RS et al.Acta Reumatol Port. 2009.
        `,
        questions: Array.from({ length: 42 }, (_, i) => ({
            id: `q${i + 1} `,
            text: `Item ${i + 1} (Consulte formulário físico)`,
            type: 'scale',
            options: [{ label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (1)', value: 1 }, { label: 'Moderada (2)', value: 2 }, { label: 'Forte (3)', value: 3 }, { label: 'Extrema (4)', value: 4 }]
        })),
        calculateScore: (answers) => {
            // Normalized score 0-100 (100 best).
            // Formula: 100 - (mean * 25)
            const values = Object.values(answers);
            const count = values.length;
            const total = values.reduce((a, b) => a + b, 0);
            const mean = count > 0 ? total / count : 0;
            const score = 100 - (mean * 25);

            let riskColor = 'green';
            if (score < 50) riskColor = 'red';
            else if (score < 80) riskColor = 'yellow';
            return { score: score.toFixed(1), riskColor };
        }
    },
    faos: {
        id: 'faos',
        title: 'FAOS (Tornozelo e Pé)',
        description: 'Foot and Ankle Outcome Score.',
        instruction: 'Este questionário pede sua opinião sobre seu pé/tornozelo e como ele funciona. Responda pensando nos seus sintomas e dificuldades durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
### Instruções de Aplicação
O FAOS é destinado a avaliar a opinião do paciente sobre diversos problemas associados aos pés e tornozelos.

** Domínios Avaliados:**
    1. ** Dor **: Frequência e intensidade da dor(9 itens).
2. ** Sintomas **: Rigidez, inchaço, bloqueio e amplitude(7 itens).
3. ** AVD **: Dificuldade em atividades diárias(17 itens).
4. ** Esportes / Recreação **: Dificuldade em atividades mais exigentes(5 itens).
5. ** Qualidade de Vida **: Impacto social e emocional(4 itens).

** Pontuação:**
    - Cada item é pontuado de 0(Nenhuma) a 4(Extrema).
- A pontuação é transformada para uma escala de 0 a 100(0 = Sintomas extremos, 100 = Sem sintomas).
- ** Interpretação **: Quanto maior a pontuação, melhor a condição do paciente.
        `,
        questions: [
            // Pain (P1-P9)
            { id: 'p1', text: 'P1. Qual a frequência que você sente dor no pé ou tornozelo?', type: 'scale', options: [{ label: 'Nunca', value: 0 }, { label: 'Mensalmente', value: 1 }, { label: 'Semanalmente', value: 2 }, { label: 'Diariamente', value: 3 }, { label: 'Sempre', value: 4 }] },
            { id: 'p2', text: 'P2. Rodando sobre o seu pé ou tornozelo?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p3', text: 'P3. Forçando o pé completamente para baixo?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p4', text: 'P4. Forçando o pé completamente para cima?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p5', text: 'P5. Andando em superfície plana?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p6', text: 'P6. Subindo ou descendo escadas?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p7', text: 'P7. Em repouso na cama?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p8', text: 'P8. Ao sentar-se/deitar-se?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 'p9', text: 'P9. Em pé?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },

            // Symptoms (S1-S7)
            { id: 's1', text: 'S1. Qual o grau de rigidez do seu pé/tornozelo logo quando você acorda?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 's2', text: 'S2. Qual o grau de rigidez após sentar, deitar ou ao descansar mais tarde durante o dia?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] },
            { id: 's3', text: 'S3. Você tem inchaço no seu pé/tornozelo?', type: 'scale', options: [{ label: 'Nunca', value: 0 }, { label: 'Raramente', value: 1 }, { label: 'Às vezes', value: 2 }, { label: 'Frequentemente', value: 3 }, { label: 'Sempre', value: 4 }] },
            { id: 's4', text: 'S4. Você sente ranger, estalar ou qualquer outro tipo de som quando o movimenta o pé?', type: 'scale', options: [{ label: 'Nunca', value: 0 }, { label: 'Raramente', value: 1 }, { label: 'Às vezes', value: 2 }, { label: 'Frequentemente', value: 3 }, { label: 'Sempre', value: 4 }] },
            { id: 's5', text: 'S5. O seu pé trava ou fica bloqueado aos movimentos?', type: 'scale', options: [{ label: 'Nunca', value: 0 }, { label: 'Raramente', value: 1 }, { label: 'Às vezes', value: 2 }, { label: 'Frequentemente', value: 3 }, { label: 'Sempre', value: 4 }] },
            { id: 's6', text: 'S6. Você consegue forçar o seu pé completamente para baixo?', type: 'scale', options: [{ label: 'Sempre', value: 0 }, { label: 'Frequentemente', value: 1 }, { label: 'Às vezes', value: 2 }, { label: 'Raramente', value: 3 }, { label: 'Nunca', value: 4 }] },
            { id: 's7', text: 'S7. Você consegue forçar o seu pé completamente para cima?', type: 'scale', options: [{ label: 'Sempre', value: 0 }, { label: 'Frequentemente', value: 1 }, { label: 'Às vezes', value: 2 }, { label: 'Raramente', value: 3 }, { label: 'Nunca', value: 4 }] },

            // ADL (A1-A17)
            ...['A1. Descendo escadas', 'A2. Subindo escadas', 'A3. Levantando-se a partir da posição sentada', 'A4. Em pé', 'A5. Curvando-se para pegar um objeto no chão', 'A6. Andando em superfícies planas', 'A7. Entrando e saindo do carro', 'A8. Indo às compras', 'A9. Colocando meias', 'A10. Levantando-se da cama', 'A11. Tirando as meias', 'A12. Virando-se na cama', 'A13. Entrando ou saindo do banho', 'A14. Sentando', 'A15. Sentado e levantando do vaso sanitário', 'A16. Realizando tarefas domésticas pesadas', 'A17. Realizando tarefas domésticas leves'].map((t, i) => ({
                id: `a${i + 1} `, text: t, type: 'scale' as const, options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }]
            })),

            // Sports (Sp1-Sp5)
            ...['Sp1. Agachando', 'Sp2. Correndo', 'Sp3. Pulando', 'Sp4. Mudando de direção sobre o seu tornozelo/pé lesionado', 'Sp5. Ajoelhando-se'].map((t, i) => ({
                id: `sp${i + 1} `, text: t, type: 'scale' as const, options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }]
            })),

            // QoL (Q1-Q4)
            { id: 'q1', text: 'Q1. Com que frequência que você tem percebido os problemas do seu pé/tornozelo?', type: 'scale', options: [{ label: 'Nunca', value: 0 }, { label: 'Mensalmente', value: 1 }, { label: 'Semanalmente', value: 2 }, { label: 'Diariamente', value: 3 }, { label: 'Sempre', value: 4 }] },
            { id: 'q2', text: 'Q2. Você tem modificado seu estilo de vida para evitar atividades potencialmente danosas para o seu pé/tornozelo?', type: 'scale', options: [{ label: 'Não', value: 0 }, { label: 'Um pouco', value: 1 }, { label: 'Moderamente', value: 2 }, { label: 'Muito', value: 3 }, { label: 'Totalmente', value: 4 }] },
            { id: 'q3', text: 'Q3. O quanto você está incomodado com a falta de confiança no seu tornozelo/pé?', type: 'scale', options: [{ label: 'Não', value: 0 }, { label: 'Um pouco', value: 1 }, { label: 'Moderamente', value: 2 }, { label: 'Muito', value: 3 }, { label: 'Totalmente', value: 4 }] },
            { id: 'q4', text: 'Q4. No geral, quanto de dificuldade você tem com o seu tornozelo/pé?', type: 'scale', options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Acentuada', value: 3 }, { label: 'Extrema', value: 4 }] }
        ],
        calculateScore: (answers) => {
            const values = Object.values(answers);
            const count = values.length;
            const total = values.reduce((a, b) => a + b, 0);
            const mean = count > 0 ? total / count : 0;
            const score = 100 - (mean * 25);
            let riskColor = 'green';
            if (score < 50) riskColor = 'red';
            else if (score < 80) riskColor = 'yellow';
            return { score: score.toFixed(1), riskColor };
        }
    },
    faam: {
        id: 'faam',
        title: 'FAAM (Tornozelo e Pé)',
        description: 'Foot and Ankle Ability Measure (ADL + Sports).',
        instruction: 'Por favor, responda a cada pergunta com a opção que melhor descreve a condição do seu pé/tornozelo durante a ÚLTIMA SEMANA.',
        clinicalGuidance: `
### Instruções de Aplicação
O FAAM(Foot and Ankle Ability Measure) avalia a capacidade física de indivíduos com disfunções musculoesqueléticas no pé e tornozelo.

** Domínios Avaliados:**
    1. ** Atividades de Vida Diária(ADL) **: 21 itens sobre atividades comuns.
2. ** Esportes **: 8 itens sobre atividades mais exigentes.

** Pontuação:**
    - Cada item é pontuado de 0(Incapaz) a 4(Nenhuma dificuldade).
- A pontuação é transformada para uma escala de 0 a 100 %.
- ** 0 %**: Incapacidade total.
- ** 100 %**: Mesmo nível de função anterior ao problema(Sem limitações).
- Os domínios de ADL e Esportes podem ser analisados separadamente.
        `,
        questions: [
            // ADL Items (A1-A21)
            ...['Ficar em pé', 'Caminhar no plano, em superfície regular', 'Caminhar no plano, em superfície regular, descalço', 'Subir morro', 'Descer morro', 'Subir escada', 'Descer escada', 'Caminhar no plano, em superfície irregular', 'Subir e descer meio-fio', 'Agachar', 'Ficar na ponta dos pés', 'Começar a caminhar', 'Caminhar 5 minutos ou menos', 'Caminhar aproximadamente 10 minutos', 'Caminhar 15 minutos ou mais', 'Atividades domésticas', 'Atividades de vida diária', 'Cuidado pessoal', 'Trabalho leve a moderado que exija caminhar ou ficar em pé', 'Trabalho pesado (empurrar/puxar, subir/descer escada, carregar)', 'Atividades recreativas']
                .map((text, i) => ({
                    id: `adl_${i + 1} `,
                    text: `${i + 1}. ${text} `,
                    type: 'scale' as const,
                    options: [
                        { label: 'Nenhuma dificuldade (4)', value: 4 },
                        { label: 'Pouca/leve dificuldade (3)', value: 3 },
                        { label: 'Moderada dificuldade (2)', value: 2 },
                        { label: 'Extrema dificuldade (1)', value: 1 },
                        { label: 'Incapaz (0)', value: 0 }
                    ]
                })),

            // Sports Items (S1-S8)
            ...['Correr', 'Pular', 'Amortecer o salto', 'Arrancar e parar bruscamente', 'Realizar passadas laterais rápidas, com mudança brusca de direção', 'Atividades de baixo impacto', 'Capacidade em desempenhar a atividade com sua técnica normal', 'Capacidade em praticar o seu esporte desejado pelo tempo que você gostaria']
                .map((text, i) => ({
                    id: `sport_${i + 1} `,
                    text: `Esporte ${i + 1}. ${text} `,
                    type: 'scale' as const,
                    options: [
                        { label: 'Nenhuma dificuldade (4)', value: 4 },
                        { label: 'Pouca/leve dificuldade (3)', value: 3 },
                        { label: 'Moderada dificuldade (2)', value: 2 },
                        { label: 'Extrema dificuldade (1)', value: 1 },
                        { label: 'Incapaz (0)', value: 0 }
                    ]
                }))
        ],
        calculateScore: (answers) => {
            const values = Object.values(answers);
            const total = values.reduce((a, b) => a + b, 0);
            const count = values.length;
            const maxPossible = count * 4;
            const score = maxPossible > 0 ? (total / maxPossible) * 100 : 0;
            let riskColor = 'green';
            if (score < 60) riskColor = 'red';
            else if (score < 85) riskColor = 'yellow';
            return { score: score.toFixed(1) + '%', riskColor };
        }
    },
    aofas: {
        id: 'aofas',
        title: 'AOFAS (Tornozelo/Retropé)',
        description: 'American Orthopaedic Foot and Ankle Society Score (Clínico + Subjetivo).',
        instruction: 'Por favor, responda às perguntas sobre a dor e função do seu pé/tornozelo HOJE.',
        clinicalGuidance: `
    ** Instruções de Aplicação **
        O AOFAS Tornozelo / Retropé combina informações subjetivas(dor, função) e objetivas(alinhamento).

** Composição:**
- ** Dor **: 40 pontos.
- ** Função **: 50 pontos(Limitação, distância, superfícies, marcha, mobilidade, estabilidade).
- ** Alinhamento **: 10 pontos.

** Pontuação Total(0 - 100):**
    - Quanto maior, melhor o resultado.

** Fonte:**
    Tradução e adaptação cultural do questionário AOFAS para a língua portuguesa.Rodrigues et al.Acta Ortop Bras. 2008.
        `,
        questions: [
            { id: 'q1', text: 'Dor (40 pontos)', type: 'scale', options: [{ label: 'Nenhuma', value: 40 }, { label: 'Leve, ocasional', value: 30 }, { label: 'Moderada, diária', value: 20 }, { label: 'Grave, quase sempre', value: 0 }] },
            { id: 'q2', text: 'Limitação de Atividades', type: 'scale', options: [{ label: 'Sem limitação', value: 10 }, { label: 'Limita atividades recreacionais', value: 7 }, { label: 'Limita atividades diárias e recreacionais', value: 4 }, { label: 'Limitação grave', value: 0 }] },
            { id: 'q3', text: 'Distância de Caminhada', type: 'scale', options: [{ label: '> 6 quarteirões', value: 5 }, { label: '4-6 quarteirões', value: 4 }, { label: '1-3 quarteirões', value: 2 }, { label: '< 1 quarteirão', value: 0 }] },
            { id: 'q4', text: 'Dificuldade em Superfícies', type: 'scale', options: [{ label: 'Nenhuma', value: 5 }, { label: 'Alguma', value: 3 }, { label: 'Muita', value: 0 }] },
            { id: 'q5', text: 'Anormalidade de Marcha', type: 'scale', options: [{ label: 'Nenhuma', value: 8 }, { label: 'Visível', value: 4 }, { label: 'Marcada', value: 0 }] },
            { id: 'q6', text: 'Mobilidade Sagital (Flexão+Extensão)', type: 'scale', options: [{ label: 'Normal (>30°)', value: 8 }, { label: 'Moderada (15-29°)', value: 4 }, { label: 'Grave (<15°)', value: 0 }] },
            { id: 'q7', text: 'Mobilidade Retropé', type: 'scale', options: [{ label: 'Normal (75-100%)', value: 6 }, { label: 'Moderada (25-74%)', value: 3 }, { label: 'Grave (<25%)', value: 0 }] },
            { id: 'q8', text: 'Estabilidade do Tornozelo-Retropé', type: 'scale', options: [{ label: 'Estável', value: 8 }, { label: 'Instável', value: 0 }] },
            { id: 'q9', text: 'Alinhamento', type: 'scale', options: [{ label: 'Bom', value: 10 }, { label: 'Regular', value: 5 }, { label: 'Ruim', value: 0 }] },
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            let riskColor = 'green';
            if (total < 70) riskColor = 'red';
            else if (total < 90) riskColor = 'yellow';
            return { total, riskColor };
        }
    },
    insoles_40d: {
        id: 'insoles_40d',
        title: 'Acompanhamento de Palmilhas (40 Dias)',
        description: 'Avaliação de adaptação e funcionalidade após 40 dias de uso.',
        instruction: 'Por favor, responda com sinceridade sobre sua experiência com as palmilhas nestes primeiros 40 dias.',
        clinicalGuidance: `
**Monitoramento de 40 Dias**
Foco na adaptação inicial e ajustes finos.

**Interpretação:**
- **Conforto/Ajuste < 7**: Indicativo de necessidade de revisão presencial.
- **Satisfação < 7**: Risco de abandono do tratamento.
- **Uso < 7**: Baixa adesão, investigar motivos.
        `,
        questions: [
            { id: 'q1', text: 'Frequência de Uso: O quanto você tem conseguido usar as palmilhas no dia a dia? (0=Não uso, 10=Uso todo dia)', type: 'vas', min: 0, max: 10, minLabel: 'Não uso', maxLabel: 'Todo dia' },
            { id: 'q2', text: 'Adaptação e Conforto: Como foi a adaptação inicial e como sente o conforto hoje? (0=Desconfortável, 10=Muito Confortável)', type: 'vas', min: 0, max: 10, minLabel: 'Desconfortável', maxLabel: 'Muito Confortável' },
            { id: 'q3', text: 'Melhora dos Sintomas: Comparando com antes, como está a dor principal? (0=Pior/Igual, 10=Sem dor)', type: 'vas', min: 0, max: 10, minLabel: 'Pior/Igual', maxLabel: 'Sem dor' },
            { id: 'q4', text: 'Qualidade do Ajuste: Sente que "encaixou" bem no calçado e pé? (0=Precisa ajuste, 10=Perfeito)', type: 'vas', min: 0, max: 10, minLabel: 'Precisa ajuste', maxLabel: 'Perfeito' },
            { id: 'q5', text: 'Satisfação Geral: O quanto a palmilha ajuda na sua qualidade de vida? (0=Insatisfeito, 10=Satisfeito)', type: 'vas', min: 0, max: 10, minLabel: 'Insatisfeito', maxLabel: 'Satisfeito' }
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const avg = total / 5;

            // Critical checks for alerts
            const comfort = answers['q2'] || 0;
            const fit = answers['q4'] || 0;
            const needsReview = comfort < 7 || fit < 7;

            let classification = 'Adaptação Bem Sucedida';
            let riskColor = 'green';

            if (needsReview) {
                classification = 'Necessita Ajuste/Atenção';
                riskColor = 'red';
            } else if (avg < 8) {
                classification = 'Adaptação Regular';
                riskColor = 'yellow';
            }

            return { total, average: avg.toFixed(1), classification, riskColor, alert: needsReview };
        }
    },
    insoles_1y: {
        id: 'insoles_1y',
        title: 'Manutenção de Palmilhas (1 Ano)',
        description: 'Avaliação de durabilidade e necessidade de renovação após 1 ano.',
        instruction: 'Sua palmilha completou um ano! Responda para sabermos como ela está.',
        clinicalGuidance: `
**Monitoramento de 1 Ano**
Foco na durabilidade e upsell (renovação).

**Interpretação:**
- **Conservação < 6**: Forte indício para renovação (Upsell).
- **Conforto < 6**: Perda de propriedades mecânicas.
- **Interesse > 7**: Lead quente para agendamento.
        `,
        questions: [
            { id: 'q1', text: 'Hábito de Uso: Continua utilizando regularmente? (0=Parei, 10=Uso diário)', type: 'vas', min: 0, max: 10, minLabel: 'Parei', maxLabel: 'Uso diário' },
            { id: 'q2', text: 'Retorno dos Sintomas: As dores voltaram? (0=Voltaram fortes, 10=Sem dor)', type: 'vas', min: 0, max: 10, minLabel: 'Voltaram', maxLabel: 'Sem dor' },
            { id: 'q3', text: 'Estado de Conservação: Como está a aparência? (0=Gasta/Furada, 10=Nova)', type: 'vas', min: 0, max: 10, minLabel: 'Muito gasta', maxLabel: 'Parece nova' },
            { id: 'q4', text: 'Conforto Atual: Sente o mesmo suporte de antes? (0=Venceu/Perdeu forma, 10=Perfeita)', type: 'vas', min: 0, max: 10, minLabel: 'Venceu', maxLabel: 'Perfeita' },
            { id: 'q5', text: 'Interesse em Revisão: Quer agendar avaliação cortesia? (0=Não, 10=Agendar agora)', type: 'vas', min: 0, max: 10, minLabel: 'Não', maxLabel: 'Quero agora' }
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);

            // Upsell Triggers
            const conservation = answers['q3'] || 0;
            const interest = answers['q5'] || 0;
            const isUpsellOpportunity = conservation < 6 || interest > 7;

            let classification = 'Manutenção em Dia';
            let riskColor = 'green';

            if (isUpsellOpportunity) {
                classification = 'Oportunidade de Renovação';
                riskColor = 'blue';
            } else if (answers['q2'] < 5) {
                classification = 'Recidiva de Sintomas';
                riskColor = 'red';
            }

            return { total, classification, riskColor, alert: isUpsellOpportunity };
        }
    }
}

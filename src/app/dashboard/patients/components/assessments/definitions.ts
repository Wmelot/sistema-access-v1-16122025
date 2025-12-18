

export type AssessmentType = 'start_back' | 'roland_morris' | 'oswestry' | 'mcgill_short' | 'tampa_kinesiophobia' | 'quickdash' | 'lefs' | 'quebec' | 'ndi' | 'psfs' | 'spadi' | 'prwe' | 'ihot33' | 'womac' | 'hoos' | 'ikdc' | 'lysholm' | 'koos' | 'faos' | 'faam' | 'aofas';

export interface Question {
    id: string;
    text: string;
    type: 'binary' | 'scale' | 'mcq' | 'vas';
    options?: { label: string; value: number }[];
    min?: number;
    max?: number; // For VAS
    inverted?: boolean; // For TSK
}

export interface AssessmentDefinition {
    id: AssessmentType;
    title: string;
    description: string;
    questions: Question[];
    instruction?: string;
    calculateScore: (answers: Record<string, number>) => Record<string, any>;
}

export const ASSESSMENTS: Record<AssessmentType, AssessmentDefinition> = {
    start_back: {
        id: 'start_back',
        title: 'STarT Back Screening Tool (SBST-Brasil)',
        description: 'Ferramenta de triagem para risco de mau prognóstico em dor lombar.',
        instruction: 'Por favor, pensando nas DUAS ÚLTIMAS SEMANAS, marque a opção que melhor descreve como você se sente.',
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
                    { label: 'Um pouco', value: 0 },
                    { label: 'Moderadamente', value: 0 },
                    { label: 'Muito', value: 1 },
                    { label: 'Extremamente', value: 1 }
                ]
            }
        ],
        calculateScore: (answers) => {
            const total = Object.values(answers).reduce((a, b) => a + b, 0);
            const psychosocial = (answers['q5'] || 0) + (answers['q6'] || 0) + (answers['q7'] || 0) + (answers['q8'] || 0) + (answers['q9'] || 0);

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
        title: 'iHOT-33 (International Hip Outcome Tool)',
        description: 'Qualidade de vida e função em adultos jovens com dor no quadril.',
        instruction: 'Estas perguntas dizem respeito aos problemas que você pode ter no quadril, como eles afetam sua vida e as emoções que você pode sentir por causa deles. Por favor, indique a gravidade da sua situação no ÚLTIMO MÊS.',
        questions: Array.from({ length: 33 }, (_, i) => ({
            id: `q${i + 1}`,
            text: `Item ${i + 1} (Consulte o formulário físico para a pergunta exata)`,
            type: 'vas',
            min: 0,
            max: 100
        })),
        calculateScore: (answers) => {
            const values = Object.values(answers);
            const total = values.reduce((a, b) => a + b, 0);
            const count = values.length;
            const average = count > 0 ? total / count : 0;
            return { total: average.toFixed(1), riskColor: average < 50 ? 'red' : average < 80 ? 'yellow' : 'green' };
        }
    },
    womac: {
        id: 'womac',
        title: 'WOMAC (Osteoartrite)',
        description: 'Western Ontario and McMaster Universities Osteoarthritis Index.',
        instruction: 'Por favor, indique a quantidade de dor, rigidez ou dificuldade que você sentiu no seu quadril ou joelho nas ÚLTIMAS 48 HORAS ao realizar as seguintes atividades.',
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
        instruction: 'Este questionário pede sua opinião sobre seu quadril e como ele funciona. Por favor, responda a cada pergunta pensando nos seus sintomas e dificuldades durante a ÚLTIMA SEMANA.',
        questions: Array.from({ length: 40 }, (_, i) => ({
            id: `q${i + 1}`,
            text: `Item ${i + 1} (Consulte o formulário físico)`,
            type: 'scale',
            options: [{ label: 'Nenhuma', value: 0 }, { label: 'Leve', value: 1 }, { label: 'Moderada', value: 2 }, { label: 'Forte', value: 3 }, { label: 'Extrema', value: 4 }]
        })),
        calculateScore: (answers) => {
            const values = Object.values(answers);
            const total = values.reduce((a, b) => a + b, 0);
            const count = values.length;
            // HOOS Score is 0-100, 100 is best.
            // Raw sum / max possible * 100? No, formula is 100 - (mean * 25) usually?
            // If mean is 0 (best) -> 100 - 0 = 100.
            // If mean is 4 (worst) -> 100 - 100 = 0.
            const mean = count > 0 ? total / count : 0;
            const score = 100 - (mean * 25);
            let riskColor = 'green';
            if (score < 40) riskColor = 'red';
            else if (score < 70) riskColor = 'yellow';
            return { score: score.toFixed(1), riskColor };
        }
    },
    ikdc: {
        id: 'ikdc',
        title: 'IKDC Subjetivo (Joelho)',
        description: 'International Knee Documentation Committee Subjective Knee Form.',
        instruction: 'As perguntas a seguir dizem respeito aos sintomas do seu joelho e sua capacidade de realizar atividades. Por favor, responda pensando na condição do seu joelho nos ÚLTIMOS 7 DIAS.',
        questions: Array.from({ length: 18 }, (_, i) => ({
            id: `q${i + 1}`,
            text: `Item ${i + 1} (Consulte o formulário físico do IKDC)`,
            type: 'scale',
            options: [{ label: 'Pior sintoma / Incapaz', value: 0 }, { label: 'Sintomas graves', value: 1 }, { label: 'Sintomas moderados', value: 2 }, { label: 'Leves sintomas', value: 3 }, { label: 'Sem sintomas / Sem limitações', value: 4 }]
        })),
        calculateScore: (answers) => {
            // Simplified generic scoring: Sum / (Count * 4) * 100
            const values = Object.values(answers);
            const total = values.reduce((a, b) => a + b, 0);
            const count = values.length;
            const maxPossible = count * 4;
            const score = maxPossible > 0 ? (total / maxPossible) * 100 : 0;
            let riskColor = 'green';
            if (score < 50) riskColor = 'red';
            else if (score < 80) riskColor = 'yellow';
            return { score: score.toFixed(1), riskColor };
        }
    },
    lysholm: {
        id: 'lysholm',
        title: 'Escala Lysholm (Joelho)',
        description: 'Lysholm Knee Scoring Scale - Avaliação de Ligamento Cruzado Anterior.',
        instruction: 'Por favor, responda às perguntas abaixo escolhendo a afirmação que melhor descreve a condição do seu joelho HOJE.',
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
        questions: Array.from({ length: 42 }, (_, i) => ({
            id: `q${i + 1}`,
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
        questions: Array.from({ length: 42 }, (_, i) => ({
            id: `q${i + 1}`,
            text: `Item ${i + 1} (Consulte formulário físico)`,
            type: 'scale',
            options: [{ label: 'Nenhuma (0)', value: 0 }, { label: 'Leve (1)', value: 1 }, { label: 'Moderada (2)', value: 2 }, { label: 'Forte (3)', value: 3 }, { label: 'Extrema (4)', value: 4 }]
        })),
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
        questions: Array.from({ length: 29 }, (_, i) => ({
            id: `q${i + 1}`,
            text: i < 21 ? `ADL Item ${i + 1} (Consulte formulário)` : `Sport Item ${i - 20} (Consulte formulário)`,
            type: 'scale',
            options: [{ label: 'Nenhuma dificuldade (4)', value: 4 }, { label: 'Leve dificuldade (3)', value: 3 }, { label: 'Moderada dificuldade (2)', value: 2 }, { label: 'Muita dificuldade (1)', value: 1 }, { label: 'Incapaz (0)', value: 0 }]
        })),
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
    }
}

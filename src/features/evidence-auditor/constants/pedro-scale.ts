/**
 * ESCALA PEDRO (Physiotherapy Evidence Database)
 * Diretrizes oficiais para avaliação de qualidade metodológica de Ensaios Clínicos Randomizados.
 */
export const PEDRO_SCALE_KNOWLEDGE_BASE = `
DIRETRIZES DA ESCALA PEDRO (Para Ensaios Clínicos Randomizados)

A escala PEDro possui 11 itens. O item 1 (critérios de elegibilidade) não é pontuado. O score total varia de 0 a 10.

ITENS DE AVALIAÇÃO:

1. Critérios de Elegibilidade: Os critérios de elegibilidade foram especificados? (Não conta para o score final).

2. Alocação Aleatória: Os sujeitos foram alocados aleatoriamente para os grupos? (Processo imprevisível, ex: sorteio, tabela de números aleatórios).

3. Alocação Oculta: A alocação foi oculta? (Quem recrutou não sabia qual seria o próximo grupo. Ex: envelopes selados opacos, alocação centralizada).

4. Comparabilidade Inicial: Os grupos eram semelhantes no início (linha de base) em relação aos indicadores de prognóstico mais importantes? (Pelo menos uma medida do desfecho principal e uma característica demográfica).

5. Sujeitos Cegos: Houve cegamento de todos os sujeitos?

6. Terapeutas Cegos: Houve cegamento de todos os terapeutas que administraram a terapia?

7. Avaliadores Cegos: Houve cegamento de todos os avaliadores que mediram pelo menos um desfecho chave?

8. Acompanhamento Adequado: Medidas de pelo menos um desfecho chave foram obtidas em mais de 85% dos sujeitos inicialmente alocados nos grupos?

9. Intenção de Tratar: Todos os sujeitos para os quais se obteve medidas de desfecho receberam o tratamento conforme alocado ou, quando isso não ocorreu, os dados foram analisados por "intenção de tratar"?

10. Comparação Entre Grupos: Os resultados das comparações estatísticas entre grupos foram relatados para pelo menos um desfecho chave?

11. Precisão e Variabilidade: O estudo fornece medidas de precisão e variabilidade para pelo menos um desfecho chave? (Ex: desvio padrão, erro padrão, IC95%).

COMO JULGAR (REGRAS CRÍTICAS):
- Responda "Sim" ou "Não" para cada item.
- REGRA PARA O ITEM 9 (INTENÇÃO DE TRATAR): Se o estudo relata acompanhamento de 100% (ou seja, sem perdas de seguimento) E todos os participantes receberam o tratamento conforme alocado, o ITEM 9 DEVE SER PONTUADO COMO "SIM", mesmo que o termo "Análise por Intenção de Tratar" não apareça no texto. Não exija a menção do termo se não houve perdas.
- REGRA PARA O ITEM 8 (ACOMPANHAMENTO): Deve haver medida de pelo menos um desfecho primário em no mínimo 85% dos alocados.
- JUSTIFICATIVA: Forneça uma justificativa curta citando a parte do texto ou a lógica metodológica (ex: "Pontuado Sim pois houve 100% de seguimento e todos os grupos foram analisados como alocados").
- Se o estudo NÃO for um Ensaio Clínico Randomizado (RCT), informe que a escala PEDro não se aplica integralmente.
`;

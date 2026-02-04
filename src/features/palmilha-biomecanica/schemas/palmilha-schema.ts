import { z } from "zod";

const SideSchema = z.object({
    left: z.coerce.number().optional(),
    right: z.coerce.number().optional(),
});

const SideStringSchema = z.object({
    left: z.string().optional(),
    right: z.string().optional(),
});

const FPIItemSchema = z.string().optional(); // Mudado para string livre para flexibilidade, ideal seria enum

const FootConfigSchema = z.object({
    arco: z.string().optional(),
    flexibilidade: z.string().optional(),
    borda: z.string().optional(),
    elevacao: z.string().optional(),
    antepe: z.string().optional(),
    retrope: z.string().optional(),
    absorcao: z.string().optional(),
    pads: z.array(z.string()).optional(), // Array de strings para checkboxes
});

export const PalmilhaSchema = z.object({
    anamnese: z.object({
        queixa_principal: z.string().min(1, "Queixa principal é obrigatória"),
        hma: z.string().optional(),
        eva: z.coerce.number().min(0).max(10),

        efep: z.array(z.object({
            atividade: z.string().optional(),
            nota: z.coerce.number().min(0).max(10).optional(),
        })).optional().default([{}, {}, {}]),

        historico_esportivo: z.object({
            modalidades_detalhado: z.array(z.string()).optional(), // Ou array de objetos se mudar depois
            modalidades: z.array(z.string()).optional(), // Legacy compat
            nivel: z.string().optional(), // Mudado para string para aceitar qualquer valor dos selects novos
        }),

        historia_pregressa: z.object({
            medicacao_uso: z.string().optional(),
            tratamentos_previos: z.array(z.string()).optional(),
            cirurgias: z.string().optional(),
        }).optional(),

        mapa_dor: z.any().optional(), // BodyPainMap value strucure (points array usually)
        observacoes: z.string().optional(),
    }),

    calcado: z.object({
        modelo: z.string().optional(),
        tamanho: z.string().optional(), // Adicionado tamanho aqui (estava na prescrição antes, mas faz sentido aqui)
        peso_gramas: z.coerce.number().optional(),
        drop_mm: z.coerce.number().optional(),
        indice_minimalista: z.object({
            peso_score: z.coerce.number().optional(),
            drop_score: z.coerce.number().optional(),
            flex_longitudinal: z.coerce.number().optional(),
            flex_torsional: z.coerce.number().optional(),
            estabilidade: z.coerce.number().optional(),
            total_percent: z.coerce.number().optional(),
        }),
        observacoes: z.string().optional(),
    }),

    exame_fisico: z.object({
        fpi: z.object({
            talus: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            curvatura_maleolar: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            posicao_calcaneo: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            proeminencia_tln: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            congruencia_arco: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            abducao_antepé: z.object({ left: FPIItemSchema, right: FPIItemSchema }),
            score_total: SideSchema.optional(),
            observacoes: z.string().optional(),
        }),

        // Testes Clínicos
        jack_test: SideSchema,
        lunge_test: SideSchema,
        thomas_test: z.coerce.number().optional(),
        isquiotibiais: z.coerce.number().optional(),
        craig_anteversao: z.coerce.number().optional(),
        navicular_drop: SideSchema.optional(),

        mobilidade: z.object({
            raios: SideSchema,
            mediope: SideSchema,
        }).optional(), // Optional wrapper

        forca_gluteo: z.object({
            medio: SideSchema,
            maximo: SideSchema,
        }).optional(),

        // Dynamic & Images
        ybalance: z.object({
            legLength: SideSchema.optional(),
            composite: SideSchema.optional(),
        }).optional(),

        gait_analysis: z.object({
            left_image: z.array(z.string()).optional(),
            right_image: z.array(z.string()).optional(),
            left_obs: z.string().optional(),
            right_obs: z.string().optional(),
        }).optional(),

        baropodometria: z.object({
            static_image: z.array(z.string()).optional(),
            dynamic_image: z.array(z.string()).optional(),
            observacoes: z.string().optional(),
        }).optional(),

        observacoes: z.string().optional(),
    }),

    prescricao: z.object({
        // Nova estrutura de Palmilha V3
        palmilha: z.object({
            modelo: z.string().optional(),
            tipo: z.string().optional(),
            tamanho: z.string().optional(),
            cobertura: z.string().optional(),

            left_foot: FootConfigSchema.optional(),
            right_foot: FootConfigSchema.optional(),
        }).optional(),

        preco_total: z.coerce.number().optional(),
        observacoes: z.string().optional(),
    }),
});

export type PalmilhaFormValues = z.infer<typeof PalmilhaSchema>;

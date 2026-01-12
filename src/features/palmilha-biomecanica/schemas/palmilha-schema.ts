import { z } from "zod";

const SideSchema = z.object({
    left: z.coerce.number().optional(),
    right: z.coerce.number().optional(),
});

const FPIItemSchema = z.enum(["-2", "-1", "0", "+1", "+2"]).optional();

export const PalmilhaSchema = z.object({
    anamnese: z.object({
        queixa_principal: z.string().min(1, "Queixa principal é obrigatória"),
        hma: z.string().optional(),
        eva: z.coerce.number().min(0).max(10),

        // EFEP reinstate
        efep: z.array(z.object({
            atividade: z.string().optional(),
            nota: z.coerce.number().min(0).max(10).optional(),
        })).optional().default([{}, {}, {}]), // 3 Default items

        historico_esportivo: z.object({
            modalidades: z.array(z.string()).optional(),
            frequencia: z.enum(["Sedentario", "1-2x", "3-4x", "Atleta"]).optional(),
            nivel: z.enum(["Iniciante", "Recreacional", "Competitivo", "Elite"]).optional(),
        }),

        // Detailed History reinstate
        historia_pregressa: z.object({
            medicacao_uso: z.string().optional(),
            tratamentos_previos: z.array(z.string()).optional(),
            cirurgias: z.string().optional(),
        }).optional(),

        // Pain Map reinstate
        mapa_dor: z.object({
            pontos: z.array(z.object({
                id: z.string(),
                x: z.number(),
                y: z.number(),
                label: z.string().optional()
            })).optional(),
            observacoes: z.string().optional()
        }).optional(),

        observacoes: z.string().optional(),
    }),

    objetivos: z.object({
        principais: z.array(z.string()).optional(),
        nivel_experiencia: z.string().optional(),
        status_lesao: z.string().optional(),
    }).optional(),

    calcado: z.object({
        modelo: z.string().optional(),
        peso_gramas: z.coerce.number().optional(),
        drop_mm: z.coerce.number().optional(),
        stack_mm: z.coerce.number().optional(),
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
        jack_test: SideSchema,
        lunge_test: SideSchema,

        // Novos campos solicitados
        thomas_test: z.coerce.number().optional(),
        isquiotibiais: z.coerce.number().optional(),
        craig_anteversao: z.coerce.number().optional(),
        comprimento_membro: z.coerce.number().optional(),

        navicular_drop: SideSchema.optional(),
        mobilidade: z.object({
            raios: SideSchema,
            mediope: SideSchema,
        }),
        forca_gluteo: z.object({
            medio: SideSchema,
            maximo: SideSchema,
        }),
        observacoes: z.string().optional(),
    }),
    prescricao: z.object({
        tipo_palmilha: z.string().default("Biomecânica"),
        correcoes: z.object({
            antepe: z.object({ left: z.string().optional(), right: z.string().optional() }),
            retrope: z.object({ left: z.string().optional(), right: z.string().optional() }),
            arco: z.object({ left: z.string().optional(), right: z.string().optional() }),
        }),
        elementos_extras: z.object({
            barras: z.array(z.string()).optional(),
            piloto: z.boolean().default(false),
        }),
        valor_final: z.coerce.number().optional(),
        observacoes: z.string().optional(),
    }),
});

export type PalmilhaFormValues = z.infer<typeof PalmilhaSchema>;


import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPalmilha20() {
    console.log('Reading original template...')
    const originalPath = path.resolve(__dirname, 'palmilha_biomecanica_original.json')
    const rawData = fs.readFileSync(originalPath, 'utf-8')
    const template = JSON.parse(rawData)

    // 1. Update Basic Info
    template.title = "Consulta Palmilha 2.0"
    template.description = "Versão 2.0: Ícones visuais, correções matemáticas e relatório avançado."
    delete template.id // Let DB generate new ID
    delete template.created_at
    delete template.updated_at

    // 2. Icon Mapping for Sections/Tabs
    const iconMap: Record<string, string> = {
        "Anamnese": "file-text",
        "História Pregressa": "history",
        "Calçados": "footprints",
        "Seleção de Tênis": "shopping-bag",
        "Índice de Minimalismo": "percent",
        "Exame Físico": "activity",
        "FPI (Foot Posture Index)": "layers",
        "Testes Específicos": "clipboard-check",
        "Agachamento Unipodal": "user",
        "Rigidez/Flexibilidade": "move",
        "Dynamic Foot Index (DFI)": "trending-up",
        "Exames": "image",
        "Orientações": "info",
        "Decúbito Dorsal": "align-justify",
        "Força": "zap"
    }

    // 3. Iterate and Enhance Fields
    template.fields = template.fields.map((field: any) => {
        // Add Icons to Tabs and Sections
        if ((field.type === 'tab' || field.type === 'section') && iconMap[field.label]) {
            field.icon = iconMap[field.label]
        }

        // Ensure Slider inputs have correct visual props if supported
        if (field.type === 'slider') {
            field.showValue = true
        }

        // [NEW] Visual Card Transformations
        if (field.id === 'algo_goals_v3') {
            field.variant = 'visual_card'
            field.columns = 3
            // Transform options to object with icon
            field.options = [
                { label: "Reduzir Dor", value: "Reduzir Dor", icon: "comfort" },
                { label: "Performance", value: "Performance", icon: "performance" },
                { label: "Conforto", value: "Conforto", icon: "footprints" }, // comfort icon mapped to HeartPulse
                { label: "Transição", value: "Transição", icon: "play" },
                { label: "Estabilidade", value: "Estabilidade", icon: "stability" }
            ]
        }

        if (field.id === 'algo_xp_v3') {
            field.variant = 'visual_card'
            field.columns = 3
            field.options = [
                { label: "Iniciante (< 6 meses)", value: "Iniciante (< 6 meses)", icon: "user" },
                { label: "Recreacional (> 6 meses)", value: "Recreacional (> 6 meses)", icon: "medal" },
                { label: "Competitivo / Elite", value: "Competitivo / Elite", icon: "trophy" }
            ]
        }

        if (field.id === 'algo_status_v3') {
            field.variant = 'visual_card'
            field.columns = 2 // 2x2 grid
            field.options = [
                { label: "Não Lesionado", value: "Não Lesionado", icon: "check" },
                { label: "Aguda (< 3 sem)", value: "Aguda (< 3 sem)", icon: "alert" },
                { label: "Persistente (> 3 meses)", value: "Persistente (> 3 meses)", icon: "activity" },
                { label: "Retorno ao Esporte", value: "Retorno", icon: "play" } // Fixed value mismatch manually
            ]
        }

        return field
    })

    // 4. Update AI Script
    // Appending strict instructions for the Radar and Shoe features
    template.ai_generation_script += `

## ADDENDUM 2.0: REGRAS VISUAIS E DE CÁLCULO
### 1. Ícones de Calçados
- Para o campo "Calçados", gere a string JSON para renderizar os ícones de Peso, Drop, Stack e Flexibilidade.

### 2. Radar Chart
- O gráfico deve ser obrigatoriamente preenchido com: Dor, Função, Estabilidade, Força, Simetria, Postura.
- Se faltar dado exato, infira do contexto (ex: "Sem queixas de instabilidade" = Estabilidade 100).
`

    console.log('Inserting "Consulta Palmilha 2.0" into database...')

    const { data, error } = await supabase
        .from('form_templates')
        .insert(template)
        .select('id, title')
        .single()

    if (error) {
        console.error('Error creating template:', error)
        return
    }

    console.log(`Success! Created template: [${data.id}] ${data.title}`)
}

createPalmilha20()

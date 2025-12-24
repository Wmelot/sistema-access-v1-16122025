'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAndOrganize(formData: FormData) {
    try {
        const file = formData.get('file') as File
        if (!file) {
            return { success: false, msg: 'Arquivo de áudio não encontrado.' }
        }

        // 1. Transcribe (Whisper)
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'pt',
            prompt: 'O áudio é uma evolução clínica de fisioterapia. Contém termos técnicos, médicos e anatômicos.'
        })

        const rawText = transcription.text

        // 2. Organize (GPT-4o or 3.5-turbo)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Você é um assistente especialista em Fisioterapia. 
                    Sua tarefa é receber um texto ditado (transcrição de áudio) e organizá-lo em uma Evolução Clínica Clara e Profissional.
                    
                    Regras:
                    - Corrija erros gramaticais e de concordância.
                    - Ajuste termos técnicos se estiverem escritos errados.
                    - Mantenha o tom profissional e objetivo.
                    - Se o texto for muito curto ou informal, transforme-o em frases completas.
                    - NÃO adicione informações que não foram ditas.
                    - Formato preferido: Texto corrido organizado ou tópicos (se houver muita informação diferente).
                    - Se o usuário ditar "Pular linha" ou "Novo parágrafo", respeite.
                    
                    Retorne APENAS o texto formatado, sem introduções.`
                },
                {
                    role: "user",
                    content: rawText
                }
            ],
            temperature: 0.3,
        })

        const organizedText = completion.choices[0].message.content

        return { success: true, text: organizedText, raw: rawText }

    } catch (error: any) {
        console.error('AI Error:', error)
        return { success: false, msg: error.message || 'Erro ao processar áudio.' }
    }
}

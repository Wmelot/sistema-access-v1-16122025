'use server'

import { createClient } from "@/lib/supabase/server"

interface FeegowPatient {
    patient_id: number;
    nome: string;
    cpf?: string;
    nascimento?: string; // Format: YYYY-MM-DD
    sexo_id?: number;
    email?: string;
    celular?: string;
    telefone?: string;
}

interface MigrationResult {
    success: boolean;
    total: number;
    imported: number;
    skipped: number;
    updated: number;
    errors: string[];
    recordId?: string;
}

// Separate function for individual fetch
async function fetchPatientDetails(id: number, token: string): Promise<any> { // Return any to inspect structure
    try {
        const url = `https://api.feegow.com/v1/api/patient/search?PatientID=${id}`
        const res = await fetch(url, {
            headers: {
                'x-access-token': token,
                'Content-Type': 'application/json'
            }
        })
        if (!res.ok) return null
        const data = await res.json()
        const content = data.Content || data.content
        return Array.isArray(content) ? content[0] : content
    } catch (e) {
        return null
    }
}

export async function migrateFeegowPatients(token: string, deepFetch: boolean = false): Promise<MigrationResult> {
    const supabase = await createClient()
    const result: MigrationResult = {
        success: false,
        total: 0,
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: []
    }

    const finalToken = token || process.env.FEEGOW_API_TOKEN
    if (!finalToken) {
        result.errors.push("Token inválido ou ausente.")
        return result
    }

    const FEEGOW_URL = "https://api.feegow.com/v1/api/patient/list?Limit=1000"

    try {
        const res = await fetch(FEEGOW_URL, {
            headers: {
                'x-access-token': finalToken,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            const txt = await res.text()
            result.errors.push(`Erro na API Feegow: ${res.status} - ${txt}`)
            return result
        }

        const data = await res.json()
        const patients: any[] = data.Content || data.content || data // Use any[] to safely inspect

        if (!Array.isArray(patients)) {
            result.errors.push("Formato inesperado.")
            return result
        }

        result.total = patients.length

        for (let p of patients) {
            // Flexible field access
            const name = p.nome || p.Nome || p.full_name
            if (!name) continue;

            const id = p.id || p.ID || p.patient_id || p.PatientID || p.Ref

            let cpf = (p.cpf || p.CPF || p.Cpf || '').replace(/\D/g, '') || null
            let birthDate = p.nascimento || p.data_nascimento || p.DataNascimento // YYYY-MM-DD

            // Address fields (initial)
            let cep = p.cep || p.Cep || p.CEP
            let address = p.endereco || p.Endereco || p.logradouro
            let number = p.numero || p.Numero
            let complement = p.complemento || p.Complemento
            let neighborhood = p.bairro || p.Bairro
            let city = p.cidade || p.Cidade
            let state = p.estado || p.Estado || p.uf || p.UF

            // Extra fields
            let occupation = p.profissao || p.Profissao || p.Occupation
            let marketingSource = p.como_conheceu || p.ComoConheceu || p.origem || p.Origem

            // --- DEEP FETCH ---
            if (deepFetch && id) {
                // a bit of throttle
                // await new Promise(r => setTimeout(r, 100)) 
                const details = await fetchPatientDetails(id, finalToken)

                if (details) {
                    const deepCpf = (details.cpf || details.CPF || details.Cpf || '').replace(/\D/g, '')
                    if (deepCpf) cpf = deepCpf

                    if (details.nascimento || details.DataNascimento) {
                        birthDate = details.nascimento || details.DataNascimento
                    }

                    // Deep Address
                    if (!cep) cep = details.cep || details.Cep || details.CEP
                    if (!address) address = details.endereco || details.Endereco || details.logradouro
                    if (!number) number = details.numero || details.Numero
                    if (!complement) complement = details.complemento || details.Complemento
                    if (!neighborhood) neighborhood = details.bairro || details.Bairro
                    if (!city) city = details.cidade || details.Cidade
                    if (!state) state = details.estado || details.Estado || details.uf || details.UF

                    // Deep Extras
                    if (!occupation) occupation = details.profissao || details.Profissao
                    if (!marketingSource) marketingSource = details.como_conheceu || details.ComoConheceu || details.origem
                }
            }

            // Construct Full Address
            // Format: "Rua X, 123, Compl Y - Bairro, Cidade - UF, CEP"
            let fullAddress = null
            if (address) {
                fullAddress = `${address}`
                if (number) fullAddress += `, ${number}`
                if (complement) fullAddress += ` - ${complement}`
                if (neighborhood) fullAddress += ` - ${neighborhood}`
                if (city) fullAddress += `, ${city}`
                if (state) fullAddress += ` - ${state}`
                if (cep) fullAddress += `, ${cep}`
            }

            // Check db
            let existingId = null
            if (cpf) {
                const { data: found } = await supabase.from('patients').select('id').eq('cpf', cpf).single()
                if (found) existingId = found.id
            } else {
                const { data: found } = await supabase.from('patients').select('id').ilike('name', name).single()
                if (found) existingId = found.id
            }

            if (existingId) {
                if (deepFetch) {
                    // Update existing with CPF, Address, and Extras
                    const { error } = await supabase.from('patients').update({
                        cpf,
                        birthdate: birthDate,
                        phone: p.celular || p.Celular || p.telefone || p.Telefone,
                        address: fullAddress,
                        occupation: occupation,
                        marketing_source: marketingSource
                    }).eq('id', existingId)

                    if (!error) result.updated++
                    else result.errors.push(`Erro ao atualizar ${name}: ${error.message}`)
                } else {
                    result.skipped++
                }
                continue
            }

            // Insert
            const { error } = await supabase.from('patients').insert({
                name: name,
                cpf: cpf,
                birthdate: birthDate,
                phone: p.celular || p.Celular || p.telefone || p.Telefone,
                email: p.email || p.Email,
                gender: (p.sexo_id || p.SexoID) === 1 ? 'Masculino' : 'Feminino',
                address: fullAddress,
                occupation,
                marketing_source: marketingSource,
                status: 'active'
            })

            if (error) {
                result.errors.push(`Erro ao criar ${name}: ${error.message}`)
            } else {
                result.imported++
            }
        }


        result.success = true
        return result

    } catch (e: any) {
        result.errors.push(`Erro crítico: ${e.message}`)
        return result
    }
}

export async function createFeegowBackupEvolution(patientId: string, text: string, slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Não autorizado" }

    try {
        // 1. Get Org ID
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', slug).single()
        if (!org) return { error: "Organização não encontrada" }

        // 2. Find "Evolução" template
        const { data: template } = await supabase
            .from('form_templates')
            .select('id')
            .eq('title', 'Evolução')
            .limit(1)
            .single()

        // 3. Extract Date from text (Format: 05/02/2026)
        let recordDate = new Date()
        const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
        if (dateMatch) {
            recordDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`)
        }

        // 4. Create Record
        const { data, error } = await supabase.from('patient_records').insert({
            patient_id: patientId,
            organization_id: org.id,
            template_id: template?.id,
            content: {
                _record_type: 'evolution',
                title: 'Backup Feegow',
                note: text,
                is_backup: true,
                source: 'Feegow'
            },
            status: 'finalized',
            created_at: recordDate.toISOString()
        }).select().single()

        if (error) throw error

        return { success: true, id: data.id }
    } catch (e: any) {
        console.error("Error creating backup evolution:", e)
        return { error: e.message }
    }
}

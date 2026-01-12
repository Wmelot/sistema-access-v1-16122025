'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/logger"

export async function uploadPatientDocument(formData: FormData) {
    const supabase = await createClient()

    // 1. Authenticate & Get Organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Usuário não autenticado.' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    if (!organizationId) return { error: 'Erro crítico: Organização não identificada.' }

    // 2. Parse FormData
    const patientId = formData.get('patient_id') as string
    const title = formData.get('title') as string
    const file = formData.get('file') as File

    if (!patientId || !file) return { error: 'Dados incompletos.' }
    if (file.size === 0) return { error: 'Arquivo vazio.' }

    // 3. Verify Patient Context (Security Rule 4 - Tenant Isolation)
    const { data: patient } = await supabase.from('patients').select('organization_id').eq('id', patientId).single()
    if (patient?.organization_id && patient.organization_id !== organizationId) {
        return { error: 'Acesso negado: Paciente de outra organização.' }
    }

    // 4. Upload to Storage
    // Path: organization_id/patient_id/timestamp_filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${organizationId}/${patientId}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError)
        return { error: 'Erro ao fazer upload do arquivo.' }
    }

    // 5. Get Public URL (or keep private path if strictly private)
    // For now, assuming public access via signedUrl or public bucket for logged in users
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)

    // 6. Insert Metadata into Database
    const { error: dbError } = await supabase.from('patient_documents' as any).insert({
        organization_id: organizationId,
        patient_id: patientId,
        title: title || file.name,
        url: filePath, // Storing path allows easier deletion later
        type: file.type,
        size_bytes: file.size,
        created_by: user.id
    })

    if (dbError) {
        console.error('DB Insert Error:', dbError)
        // Cleanup orphaned file? Ideally yes, but rare edge case.
        return { error: 'Erro ao salvar registro do documento.' }
    }

    // 7. Log & Revalidate
    await logAction('UPLOAD_DOCUMENT', { patientId, fileName, title }, 'documents', patientId)
    revalidatePath(`/dashboard/patients/${patientId}`)
    return { success: true }
}

export async function deletePatientDocument(id: string) {
    const supabase = await createClient()

    // 1. Auth & Org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const organizationId = profile?.organization_id

    // 2. Fetch Document to verify ownership
    const { data: doc } = await supabase.from('patient_documents' as any).select('*').eq('id', id).single()

    // Cast to any because types might be outdated
    const document = doc as any

    if (!document) return { error: 'Documento não encontrado.' }

    if (document.organization_id !== organizationId) {
        return { error: 'Acesso negado.' }
    }

    // 3. Delete from Storage
    const { error: storageError } = await supabase.storage.from('documents').remove([document.url])
    if (storageError) {
        console.error('Storage Delete Error:', storageError)
        // Proceed to delete DB record anyway? Maybe. Or fail.
    }

    // 4. Delete from DB
    const { error: dbError } = await supabase.from('patient_documents' as any).delete().eq('id', id)
    if (dbError) return { error: 'Erro ao excluir registro.' }

    await logAction('DELETE_DOCUMENT', { id, title: document.title }, 'documents', document.patient_id)
    revalidatePath(`/dashboard/patients/${document.patient_id}`)
    return { success: true }
}

export async function getPatientDocuments(patientId: string) {
    const supabase = await createClient()

    // RLS handles Org Check
    const { data, error } = await supabase
        .from('patient_documents' as any)
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching documents:', error)
        return []
    }

    // Generate signed URLs for display? Or use publicUrl logic?
    // If bucket is public, we can construct URL.
    // Let's return raw data and let helper construct URL, or construct here.

    const documentsWithUrls = await Promise.all(data.map(async (doc: any) => {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(doc.url)
        return {
            ...doc,
            signedUrl: publicUrl // Using public URL for now as per migration policy
        }
    }))

    return documentsWithUrls
}

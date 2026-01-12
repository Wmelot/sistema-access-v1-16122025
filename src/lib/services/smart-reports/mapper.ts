
import { createClient } from '@/lib/supabase/server';
import { SmartReportInput } from './types';

export async function fetchAssessmentData(assessmentId: string): Promise<SmartReportInput | null> {
    const supabase = await createClient();

    // 1. Fetch Assessment + Patient Profile
    let assessmentData: any = null;
    let patientProfile: any = null;

    // A. Try `patient_assessments` (Legacy / Direct Assessments)
    const { data: legacyAssessment } = await supabase
        .from('patient_assessments')
        .select(`
            *,
            profiles!patient_id (
                id,
                full_name,
                birth_date,
                gender,
                phone
            )
        `)
        .eq('id', assessmentId)
        .single();

    if (legacyAssessment) {
        assessmentData = legacyAssessment.data;
        patientProfile = legacyAssessment.profiles;
    } else {
        // B. Try `patient_records` (New Flow)
        // Decoupled query to avoid join errors (unknown relation name)
        const { data: attendanceRecord, error: fetchError } = await supabase
            .from('patient_records')
            .select('*')
            .eq('id', assessmentId)
            .single();

        if (fetchError) {
            console.error("Error fetching patient_records:", fetchError);
        }

        if (attendanceRecord) {
            console.log("DEBUG: attendanceRecord found:", attendanceRecord.id);
            console.log("DEBUG: attendanceRecord content keys:", Object.keys(attendanceRecord.content || {}));
            assessmentData = attendanceRecord.content;

            // Now fetch patient info directly using patient_id from the record
            if (attendanceRecord.patient_id) {
                // Try `patients` or `profiles` table. Assuming `profiles` as it's used above.
                // Actually `profiles` seems to be the one used for legacy.
                // But `attendance_records` might link to `patients` (from scheduling).
                // Let's try `patients` first (common in this app), if fail try `profiles`.

                const { data: patientData } = await supabase
                    .from('patients' as any)
                    .select('id, name, date_of_birth, gender, phone')
                    .eq('id', attendanceRecord.patient_id)
                    .single();

                if (patientData) {
                    const pd: any = patientData
                    patientProfile = {
                        full_name: pd.name,
                        birth_date: pd.date_of_birth,
                        gender: pd.gender,
                        phone: pd.phone
                    };
                } else {
                    // Fallback to profiles if patients table didn't yield
                    const { data: profileData } = await supabase
                        .from('profiles' as any)
                        .select('id, full_name, birth_date, gender, phone')
                        .eq('id', attendanceRecord.patient_id)
                        .single();

                    if (profileData) {
                        const prof: any = profileData
                        patientProfile = {
                            full_name: prof.full_name,
                            birth_date: prof.birth_date,
                            gender: prof.gender,
                            phone: prof.phone
                        };
                    }
                }
            }
        }
    }

    if (!assessmentData) {
        console.error("Assessment not found in both tables. ID:", assessmentId);
        return null; // This will trigger the 404
    }

    // 2. Map to SmartReportInput
    // The 'data' (or content) in DB is expected to be the form state. 

    // Safety check: Ensure nested objects exist to avoid crashes

    const rawData = assessmentData || {};

    const reportInput: SmartReportInput = {
        patientId: patientProfile?.id || '', // Might use assessment owner if mapped
        professionalId: '', // TODO: Get from record if needed
        assessmentId: assessmentId,
        data: {
            ...rawData,
            // [ADAPTER] Universal Data Adapter
            // Maps English system keys to Portuguese report keys and ensures deep structure exists
            paciente: {
                nome: patientProfile?.full_name || rawData.patientName || rawData.nome || "Nome Não Informado",
                idade: calculateAge(patientProfile?.birth_date) || rawData.age || 0,
                data_nascimento: patientProfile?.birth_date
            },
            patient: { // Redundant fallback
                name: patientProfile?.full_name,
                age: calculateAge(patientProfile?.birth_date)
            },
            atendimento: {
                data: new Date().toLocaleDateString('pt-BR') // Fallback to today if not provided
            },
            professional: {
                nome: "Dr. Fisioterapeuta", // TODO: Fetch real professional
                crefito: "00000-F"
            },
            dados_formulario: {
                ...rawData, // Spread original data first
                hipotese_diagnostica: rawData.diagnostic?.hypothesis || rawData.hipotese_diagnostica || "Em avaliação",

                // Map BiomechanicsForm keys (English) to Report keys (Portuguese/Snake_case) if needed
                fpi_escore_e: rawData.fpi?.left?.total || 0,
                fpi_escore_d: rawData.fpi?.right?.total || 0,
                lunge_test_e: rawData.flexibility?.lungeLeft || 0,
                lunge_test_d: rawData.flexibility?.lungeRight || 0,

                // Flatten calculated logic if needed
                calculated: rawData.calculated || {
                    radar: {
                        postura: 50, mobilidade: 50, forca: 50, estabilidade: 50, dor: 50,
                        ...rawData.calculated?.radar
                    }
                }
            },

            // Keep flat structure for existing templates
            patientName: patientProfile?.full_name,
            patientAge: calculateAge(patientProfile?.birth_date),
            // Ensure essential keys exist
            patientProfile: rawData.patientProfile || {},
            painPoints: rawData.painPoints || {},
            triage_data: rawData.triage_data || {},
            diagnostic: rawData.diagnostic || { hypothesis: "Não informado" },
            // Legacy Logic Compatibility
            fpi: rawData.fpi || {},
            eva: rawData.eva || 0,
            efep: rawData.efep || { items: [] },
            singleLegSquat: rawData.singleLegSquat || {},
            strength: rawData.strength || {},
            anthropometry: rawData.anthropometry || {},
            flexibility: rawData.flexibility || {},
            rotation: rawData.rotation || {},
            prescription: rawData.prescription || {}
        }
    };

    return reportInput;
}

function calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

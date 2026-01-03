
import { NextResponse } from 'next/server';
import { getPropulsaoAuth, getPropulsaoDb } from '@/lib/integrations/propulsao';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { assessment, patient, professionalId, options } = body;

        // 1. Authenticate with Propulsão
        const auth = getPropulsaoAuth();
        // Using the shared credentials as requested by user
        // In a real multi-tenant system we might need dynamic auth, but user specified this account.
        const userCredential = await signInWithEmailAndPassword(auth, 'wmelot@gmail.com', 'Wmelo@123');
        const user = userCredential.user;

        console.log('Received Propulsão Order:', JSON.stringify(body, null, 2));

        // 2. Map Data
        // Helper to map Arch Types - Updated to match form values (lowercase usually)
        const mapArch = (type: string) => {
            if (!type) return 'Normal';
            const t = type.toLowerCase();
            if (t.includes('cavo') || t.includes('cavus') || t === 'high') return 'Cavo';
            if (t.includes('plano') || t.includes('flat') || t === 'low') return 'Plano';
            return 'Normal';
        };

        const db = getPropulsaoDb();

        // Generate a random ID consistent with their system
        const orderId = `N_pedido-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const docRef = doc(db, 'PEDIDOS', orderId);

        // Safeguard measurements
        const measurements = assessment.measurements || {};
        const antepe = measurements.antepe || { left: 0, right: 0 };
        const retrope = measurements.retrope || { left: 0, right: 0 };
        // Check for typos in form (sometimes uses 'retrope' or 'retrop')

        const payload = {
            id: orderId, // Add ID explicitly inside doc just in case
            Nome_Paciente: patient.name || 'Paciente Sem Nome',
            Email_paciente: patient.email || '',
            Telefone_paciente: patient.phone || '',

            // Ensure Number is number
            Numeracao: Number(assessment.shoeSize) || 0,

            // Product Details
            Produto: options?.produto || 'Biomecanica',
            Cobertura: options?.cobertura || 'EVA Preto e Cinza',

            // Left Foot (Propulsão schema usually flattens specific fields or uses internal JSON.
            // Based on previous simple map, we will use specific fields for Left/Right if they exist, or append to notes/JSON)

            // ARCH
            Arco_Esq: options?.leftFoot?.arco || mapArch(assessment.anthropometry?.archTypeLeft),
            Arco_Dir: options?.rightFoot?.arco || mapArch(assessment.anthropometry?.archTypeRight),

            // We need to verify if Propulsão supports specific fields like 'Elevacao_Esq'.
            // If the schema is strict, we might need to verify field names.
            // Assumption: The Propulsão system accepts flexible JSON or we map to available fields.
            // Given the logging of "undefined" before, it seems strict on SOME fields.
            // For safety, we will put detailed config in a 'Detalhes' JSON field if possible, or try likely field names.

            // However, sticking to the KNOWN field names from previous debugging:
            // Antepe_Esq, Retrope_Esq, etc.

            Antepe_Esq: Number(antepe.left) || 0, // Keeping measurement as base, but could override if UI allowed editing specs directly
            Antepe_Dir: Number(antepe.right) || 0,
            Retrope_Esq: Number(retrope.left) || 0,
            Retrope_Dir: Number(retrope.right) || 0,

            // Detailed Extras (Map to a Note or specific columns if known.
            // Since we don't have the full schema, sending a JSON string in 'Observacoes' is safest for the factory)
            Observacoes: `
PEDIDO DETALHADO:
-----------------
PÉ ESQUERDO:
Elevação: ${options?.leftFoot?.elevacao}
Suporte: ${options?.leftFoot?.suporte}
Borda: ${options?.leftFoot?.borda}
Absorção: ${options?.leftFoot?.absorcao}
PADS: ${Object.keys(options?.leftFoot?.pads || {}).filter((k: any) => options?.leftFoot?.pads[k]).join(', ')}

PÉ DIREITO:
Elevação: ${options?.rightFoot?.elevacao}
Suporte: ${options?.rightFoot?.suporte}
Borda: ${options?.rightFoot?.borda}
Absorção: ${options?.rightFoot?.absorcao}
PADS: ${Object.keys(options?.rightFoot?.pads || {}).filter((k: any) => options?.rightFoot?.pads[k]).join(', ')}

ADICIONAIS DE CUSTO: R$ ${options?.priceAdditional?.toFixed(2)}
            `.trim(),

            // Cost (If there's a field for it, otherwise just in notes)
            ValorAdicional: options?.priceAdditional || 0,

            // Metadata
            IdFisio: user.email,
            DataPedido: new Date().toLocaleDateString('pt-BR'),
            StatusPedido: 'Aguardando Produção',
            dataStamp: Date.now(),
            Origem: 'Sistema Access API'
        };

        // 3. Write to Firestore
        await setDoc(docRef, payload);

        return NextResponse.json({ success: true, orderId });

    } catch (error: any) {
        console.error('Propulsão Integration Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

"use server";

import forge from "node-forge";
import { getSecurityContext } from "@/lib/security";

function getStrictPublicKey(rawKey: string) {
    if (!rawKey) return "";
    const cleanBase64 = rawKey
        .replace(/-----BEGIN PUBLIC KEY-----/g, "")
        .replace(/-----END PUBLIC KEY-----/g, "")
        .replace(/\\n/g, "")
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .replace(/\s/g, "")
        .replace(/"/g, "")
        .trim();
    const lines = cleanBase64.match(/.{1,64}/g) || [];
    return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
}

export async function sendOrderToPropulsao(orderData: any, patientData: any, professionalData: any) {
    console.log("🚀 [sendOrderToPropulsao] INICIANDO ENVIO...");

    try {
        const context = await getSecurityContext().catch(() => null);
        const activeUserEmail = context?.userEmail || professionalData?.email || "contato@axiom.com";

        const AXION_TOKEN = (process.env.AXION_TOKEN || "").trim();
        const PUBLIC_KEY_PEM_RAW = (process.env.PROPULSAO_PUBLIC_KEY || "").trim();

        if (!AXION_TOKEN) {
            return { success: false, error: "Token de autenticação (AXION_TOKEN) não configurado." };
        }

        let publicKeyPem;
        try {
            publicKeyPem = getStrictPublicKey(PUBLIC_KEY_PEM_RAW);
            if (!publicKeyPem || publicKeyPem.length < 50) throw new Error("Chave pública inválida ou ausente.");
        } catch (e: any) {
            return { success: false, error: "Chave pública da Propulsão é inválida." };
        }

        // -------------------------------------------------------------------------
        // 1. DADOS BÁSICOS E METADADOS
        // -------------------------------------------------------------------------
        const now = new Date();
        // Ajuste para Horário de Brasília (GMT-3) caso o servidor esteja em UTC
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const timestamp = Math.floor(brazilTime.getTime() / 1000);
        const orderDate = brazilTime.toISOString().split('T')[0];
        // Dados Sensíveis (Padrão AXIOM)
        const sensitiveData = {
            timestamp: timestamp,
            Email_paciente: (patientData.email || "").toLowerCase(),
            IdFisio: [activeUserEmail.toLowerCase()],
            LocalPedido: "AXIOM",
            Nome_Paciente: (patientData.nome || "").toUpperCase()
        };

        // 2. Criptografia node-forge
        let base64Payload;
        try {
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
            const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
                md: forge.md.sha256.create(),
                mgf1: { md: forge.md.sha256.create() }
            });
            base64Payload = forge.util.encode64(encrypted);
        } catch (e: any) {
            console.error("❌ Erro na Criptografia:", e.message);
            return { success: false, error: "Falha ao criptografar dados: " + e.message };
        }

        // Map helpers
        const mapArco = (a: string) => {
            if (!a) return "Medio";
            if (a.includes("Baixo")) return "Baixo";
            if (a.includes("Alto")) return "Alto";
            return "Medio";
        };

        const mapFlex = (f: string) => {
            if (!f) return "Flexivel";
            const t = f.toLowerCase();
            if (t.includes("rígido") || t.includes("rigido")) return "Rigido";
            return "Flexivel";
        };

        const extractNumericValue = (s: string) => {
            if (!s || s.includes("Sem correção") || s === "0" || s.includes("Neutro") || s === "Nenhuma" || s === "") return 0;

            // Suporte a negativos e decimais (ex: -12, 0.5)
            const match = s.match(/-?\d+(\.\d+)?/);
            if (!match) return 0;

            let val = parseFloat(match[0]);

            // Garantia extra para inversão/supinação se o regex não pegar o sinal mas o texto contiver a palavra
            if (val > 0 && (s.toLowerCase().includes("negativo") || s.toLowerCase().includes("supin"))) {
                val = -val;
            }

            return val;
        };

        const mapArcoDisplay = (s: string) => {
            if (!s) return "";
            if (typeof s !== 'string') return s;
            if (s.includes("Baixo")) return "Baixo";
            if (s.includes("Médio")) return "Médio";
            if (s.includes("Alto")) return "Alto";
            return s;
        };

        const mapBooleanToSimNao = (val: any) => val ? "Sim" : "Não";

        // 3. Info - Enviando chaves em Duplicidade (CamelCase e lowercase) para garantir captura pelo dashboard
        // [FIX] Flattening the body based on Cloud Function logs showing root-level extraction.
        const info = {
            Nome_Paciente: (patientData.nome || "").toUpperCase(),
            Email_Paciente: (patientData.email || "").toLowerCase(),
            IdFisio: [activeUserEmail.toLowerCase()],

            Cobertura: (orderData.general?.cobertura || "EVA Azul").replace(/\s/g, ""),
            // 1. DADOS DE IDENTIFICAÇÃO E METADADOS
            timestamp: timestamp,
            orderDate: orderDate,
            Email_paciente: (patientData.email || "").toLowerCase(),
            Email_fisio: (activeUserEmail || "").toLowerCase(),
            Nome_paciente: (patientData.nome || "").toUpperCase(),
            CPF: patientData.cpf || "",

            // 2. BIOMECÂNICA - PÉ DIREITO (Várias nomenclaturas para segurança)
            Antepe_Dir: extractNumericValue(orderData.rightFoot?.antepe || ""),
            Retrope_Dir: extractNumericValue(orderData.rightFoot?.retrope || ""),
            Arco_Dir: mapArcoDisplay(orderData.rightFoot?.arco || ""),
            Elevacao_Dir: extractNumericValue(orderData.rightFoot?.elevacao || ""),
            Borda_Dir: orderData.rightFoot?.borda?.includes("Borda") ? "Borda" : "Não",

            antepe_dir: extractNumericValue(orderData.rightFoot?.antepe || ""),
            retrope_dir: extractNumericValue(orderData.rightFoot?.retrope || ""),
            arco_dir: mapArcoDisplay(orderData.rightFoot?.arco || ""),
            elevacao_dir: extractNumericValue(orderData.rightFoot?.elevacao || ""),
            borda_dir: orderData.rightFoot?.borda?.includes("Borda") ? "Borda" : "Não",

            // 3. BIOMECÂNICA - PÉ ESQUERDO (Várias nomenclaturas para segurança)
            Antepe_Esq: extractNumericValue(orderData.leftFoot?.antepe || ""),
            Retrope_Esq: extractNumericValue(orderData.leftFoot?.retrope || ""),
            Arco_Esq: mapArcoDisplay(orderData.leftFoot?.arco || ""),
            Elevacao_Esq: extractNumericValue(orderData.leftFoot?.elevacao || ""),
            Borda_Esq: orderData.leftFoot?.borda?.includes("Borda") ? "Borda" : "Não",

            antepe_esq: extractNumericValue(orderData.leftFoot?.antepe || ""),
            retrope_esq: extractNumericValue(orderData.leftFoot?.retrope || ""),
            arco_esq: mapArcoDisplay(orderData.leftFoot?.arco || ""),
            elevacao_esq: extractNumericValue(orderData.leftFoot?.elevacao || ""),
            borda_esq: orderData.leftFoot?.borda?.includes("Borda") ? "Borda" : "Não",

            // 4. ALÍVIOS, PADs E ABSORÇÃO
            Alivio1_dir: orderData.rightFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "Não",
            Alivio1_esq: orderData.leftFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "Não",
            Alivio23_dir: orderData.rightFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "Não",
            Alivio23_esq: orderData.leftFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "Não",
            Alivio45_dir: orderData.rightFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "Não",
            Alivio45_esq: orderData.leftFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "Não",

            barra_dir: orderData.rightFoot?.pads?.['Barra'] ? "Barra" : "Não",
            barra_esq: orderData.leftFoot?.pads?.['Barra'] ? "Barra" : "Não",
            absorcao_dir: (orderData.rightFoot?.absorcao?.includes("Absorção")) ? "Sim" : "Não",
            absorcao_esq: (orderData.leftFoot?.absorcao?.includes("Absorção")) ? "Sim" : "Não",
            gota_perda: mapBooleanToSimNao(!!orderData.rightFoot?.pads?.['Gota'] || !!orderData.leftFoot?.pads?.['Gota']),

            // 5. ARQUIVOS E IMAGENS
            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI=",
            Debug_Raw_Keys: Object.keys(orderData.rightFoot || {}).join(", ")
        };

        console.log("📤 [sendOrderToPropulsao] PAYLOAD INFO:", JSON.stringify(info, null, 2));

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AXION_TOKEN}`,
            "x-axion-token": AXION_TOKEN
        };

        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                ...info,
                payload: base64Payload,
                info: info // Keep it here too for double safety
            }),
            cache: 'no-store'
        });

        const resText = await response.text();
        let orderNumber = undefined;
        try {
            const resJson = JSON.parse(resText);
            orderNumber = resJson.orderNumber || resJson.order || resJson.id || resJson.pedido || resJson.number;
        } catch (e) {
            const match = resText.match(/#(\d+-\d+|\d+)/);
            if (match) orderNumber = match[1];
        }

        if (response.ok) {
            const syncedOrderNumber = await syncOrderNumberFromFirebase(
                (patientData.nome || "").toUpperCase(),
                activeUserEmail.toLowerCase()
            );

            return {
                success: true,
                message: "Pedido enviado com sucesso!",
                orderNumber: syncedOrderNumber || orderNumber,
                synced: !!syncedOrderNumber
            };
        }

        return { success: false, error: `Erro ${response.status}: ${resText || 'Falha no processamento'}` };

    } catch (error: any) {
        console.error("🔥 EXCEÇÃO em sendOrderToPropulsao:", error);
        return { success: false, error: "Falha interna: " + (error.message || "Erro desconhecido") };
    }
}

async function syncOrderNumberFromFirebase(pacienteNome: string, fisioEmail: string) {
    try {
        const { getPropulsaoAuth, getPropulsaoDb } = await import("@/lib/integrations/propulsao");
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");

        const auth = getPropulsaoAuth();
        const db = getPropulsaoDb();

        await signInWithEmailAndPassword(auth, 'wmelot@gmail.com', 'Wmelo@123');

        for (let attempt = 1; attempt <= 3; attempt++) {
            const q = query(
                collection(db, "PEDIDOS"),
                where("Nome_Paciente", "==", pacienteNome),
                where("IdFisio", "array-contains", fisioEmail.toLowerCase()),
                orderBy("dataStamp", "desc"),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const data = doc.data();
                return data.N_Pedido || data.id;
            }
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return null;
    } catch (error: any) {
        return null;
    }
}

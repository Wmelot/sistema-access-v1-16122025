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

        // Ajuste de Timezone: Se estivermos perto da meia-noite UTC, o servidor pode registrar o dia seguinte.
        // Forçamos o timestamp para o momento atual.
        const now = new Date();
        const timestamp = Math.floor(now.getTime() / 1000);

        // 1. Dados Sensíveis (Padrão AXIOM)
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

        // 3. Info - Enviando chaves em Duplicidade (CamelCase e lowercase) para garantir captura pelo dashboard
        const info = {
            Cobertura: (orderData.general?.cobertura || "EVA Azul").replace(/\s/g, ""),
            Numeracao: Number(orderData.general?.tamanho) || 40,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Number(orderData.totalPrice) || 190.00,
            Produto: orderData.general?.produto || "Slim",
            observacoesCompra: orderData.reportText || "",
            PontosGerados: 10,

            Nome_indicacao: professionalData?.nome || "Fisioterapeuta",
            Contato_indicacao: professionalData?.address || "Axiom",

            // Biomecânica - Padrão CamelCase (conforme doc)
            Absorcao_dir: orderData.rightFoot?.absorcao?.includes("Absorção") ? "Sim" : "0",
            Absorcao_esq: orderData.leftFoot?.absorcao?.includes("Absorção") ? "Sim" : "0",

            Antepe_Dir: extractNumericValue(orderData.rightFoot?.antepe || ""),
            Antepe_Esq: extractNumericValue(orderData.leftFoot?.antepe || ""),
            Retrope_Dir: extractNumericValue(orderData.rightFoot?.retrope || ""),
            Retrope_Esq: extractNumericValue(orderData.leftFoot?.retrope || ""),

            Barra_Dir: orderData.rightFoot?.pads?.['Barra'] ? "Barra" : "0",
            Barra_Esq: orderData.leftFoot?.pads?.['Barra'] ? "Barra" : "0",
            Gota_perda: !!orderData.rightFoot?.pads?.['Gota'] || !!orderData.leftFoot?.pads?.['Gota'],

            Elevacao_Dir: (orderData.rightFoot?.elevacao === "Nenhuma" || !orderData.rightFoot?.elevacao) ? 0 : extractNumericValue(orderData.rightFoot?.elevacao),
            Elevacao_Esq: (orderData.leftFoot?.elevacao === "Nenhuma" || !orderData.leftFoot?.elevacao) ? 0 : extractNumericValue(orderData.leftFoot?.elevacao),

            Arco_Dir: mapArco(orderData.rightFoot?.arco || ""),
            Arco_Esq: mapArco(orderData.leftFoot?.arco || ""),

            SuporteArco_dir: mapFlex(orderData.rightFoot?.flexibilidade || ""),
            SuporteArco_esq: mapFlex(orderData.leftFoot?.flexibilidade || ""),

            // Alívios
            Alivio1_dir: orderData.rightFoot?.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "0",
            Alivio1_esq: orderData.leftFoot?.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "0",
            Alivio23_dir: orderData.rightFoot?.pads?.['Alívio 2/3º Metatarso'] ? " 2º/3º Met." : "0",
            Alivio23_esq: orderData.leftFoot?.pads?.['Alívio 2/3º Metatarso'] ? " 2º/3º Met." : "0",
            Alivio45_dir: orderData.rightFoot?.pads?.['Alívio 4/5º Metatarso'] ? " 4º/5º Met." : "0",
            Alivio45_esq: orderData.leftFoot?.pads?.['Alívio 4/5º Metatarso'] ? " 4º/5º Met." : "0",

            Borda_Dir: orderData.rightFoot?.borda?.includes("Borda") ? "Borda" : "0",
            Borda_Esq: orderData.leftFoot?.borda?.includes("Borda") ? "Borda" : "0",

            // Fallback Lowercase para garantir exibição no Dashboard
            antepe_dir: extractNumericValue(orderData.rightFoot?.antepe || ""),
            antepe_esq: extractNumericValue(orderData.leftFoot?.antepe || ""),
            retrope_dir: extractNumericValue(orderData.rightFoot?.retrope || ""),
            retrope_esq: extractNumericValue(orderData.leftFoot?.retrope || ""),
            arco_dir: mapArco(orderData.rightFoot?.arco || ""),
            arco_esq: mapArco(orderData.leftFoot?.arco || ""),
            barra_dir: orderData.rightFoot?.pads?.['Barra'] ? "Barra" : "0",
            barra_esq: orderData.leftFoot?.pads?.['Barra'] ? "Barra" : "0",
            elevacao_dir: (orderData.rightFoot?.elevacao === "Nenhuma" || !orderData.rightFoot?.elevacao) ? 0 : extractNumericValue(orderData.rightFoot?.elevacao),
            elevacao_esq: (orderData.leftFoot?.elevacao === "Nenhuma" || !orderData.leftFoot?.elevacao) ? 0 : extractNumericValue(orderData.leftFoot?.elevacao),

            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI="
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
            body: JSON.stringify({ payload: base64Payload, info: info }),
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

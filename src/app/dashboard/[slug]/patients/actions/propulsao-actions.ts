"use server";

import forge from "node-forge";
import { getSecurityContext } from "@/lib/security";

// Formatação rigorosa da chave pública para evitar erros de criptografia
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
    console.log("🚀 [sendOrderToPropulsao] Enviando pedido...");

    try {
        const context = await getSecurityContext().catch(() => null);
        const activeUserEmail = (professionalData?.email || context?.userEmail || "wmelot@gmail.com").toLowerCase();

        const AXION_TOKEN = (process.env.AXION_TOKEN || "").trim();
        const PUBLIC_KEY_PEM_RAW = (process.env.PROPULSAO_PUBLIC_KEY || "").trim();

        if (!AXION_TOKEN) {
            return { success: false, error: "Token de autenticação (AXION_TOKEN) não configurado." };
        }

        const publicKeyPem = getStrictPublicKey(PUBLIC_KEY_PEM_RAW);

        // 1. DATA E FORMATAÇÃO
        const now = new Date();
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const orderDate = brazilTime.toISOString().split('T')[0];
        const dataPedidoBR = `${String(brazilTime.getDate()).padStart(2, '0')}/${String(brazilTime.getMonth() + 1).padStart(2, '0')}/${brazilTime.getFullYear()}`;

        // Helpers
        const extractDegreeValue = (s: string): string => {
            if (!s || s.includes("Sem correção") || s === "0") return "0";
            const match = s.match(/-?\d+/);
            if (!match) return "0";
            let val = parseInt(match[0]);
            if (val > 0 && (s.toLowerCase().includes("negativo") || s.toLowerCase().includes("supin"))) val = -val;
            return String(val);
        };

        const extractElevation = (s: string): string => {
            const val = parseFloat(s || "0");
            return isNaN(val) ? "0" : String(Math.round(val * 10)); // cm para mm
        };

        // 3. MONTAGEM DOS DADOS (Info e Sensitive Payload)
        const leftFoot = orderData.leftFoot || {};
        const rightFoot = orderData.rightFoot || {};

        const technicalData = {
            // Definição do Produto
            Produto: orderData.general?.produto || "Slim",
            Cobertura: (() => {
                const c = orderData.general?.cobertura || "EVA Azul";
                if (c.includes("Tecido Preto")) return "TECIDOpreto";
                if (c.includes("Tecido Azul")) return "TECIDOazul";
                if (c.includes("EVA Azul") || c.includes("eva azul")) return "EVAazul";
                if (c.includes("Plastazote")) return "Plastazote";
                if (c.includes("Nobuk")) return "Nobuk";
                return c.replace(/\s/g, "");
            })(),
            Numeracao: Number(orderData.general?.tamanho) || 0,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Number(orderData.totalPrice) || 0,

            // Dados Técnicos Direitos
            SuporteArco_dir: rightFoot.flexibilidade?.includes("Semi") ? "Semi-Flexível" : "Flexível",
            Absorcao_dir: (rightFoot.absorcao && rightFoot.absorcao !== "Sem absorção") ? "1" : "0",
            Antepe_Dir: extractDegreeValue(rightFoot.antepe || ""),
            Retrope_Dir: extractDegreeValue(rightFoot.retrope || ""),
            Elevacao_Dir: extractElevation(rightFoot.elevacao || "0"),
            Arco_Dir: rightFoot.arco?.includes("Baixo") ? "Baixo" : (rightFoot.arco?.includes("Alto") ? "Alto" : "Medio"),
            Borda_Dir: rightFoot.borda?.includes("Borda") ? "Borda" : "",

            // Dados Técnicos Esquerdos
            SuporteArco_esq: leftFoot.flexibilidade?.includes("Semi") ? "Semi-Flexível" : "Flexível",
            Absorcao_esq: (leftFoot.absorcao && leftFoot.absorcao !== "Sem absorção") ? "1" : "0",
            Antepe_Esq: extractDegreeValue(leftFoot.antepe || ""),
            Retrope_Esq: extractDegreeValue(leftFoot.retrope || ""),
            Elevacao_Esq: extractElevation(leftFoot.elevacao || "0"),
            Arco_Esq: leftFoot.arco?.includes("Baixo") ? "Baixo" : (leftFoot.arco?.includes("Alto") ? "Alto" : "Medio"),
            Borda_Esq: leftFoot.borda?.includes("Borda") ? "Borda" : "",

            // PADS e Extras
            Alivio1_dir: rightFoot.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "",
            Alivio23_dir: rightFoot.pads?.['Alívio 2/3º Metatarso'] ? "2º/3º Met." : "",
            Alivio45_dir: rightFoot.pads?.['Alívio 4/5º Metatarso'] ? "4º/5º Met." : "",
            Barra_Dir: rightFoot.pads?.['Barra'] ? "Barra" : "",
            gota_dir: rightFoot.pads?.['Gota'] ? "Piloto" : "", // "Piloto" é o termo técnico para Gota na Propulsão

            Alivio1_esq: leftFoot.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "",
            Alivio23_esq: leftFoot.pads?.['Alívio 2/3º Metatarso'] ? "2º/3º Met." : "",
            Alivio45_esq: leftFoot.pads?.['Alívio 4/5º Metatarso'] ? "4º/5º Met." : "",
            Barra_Esq: leftFoot.pads?.['Barra'] ? "Barra" : "",
            gota_esq: leftFoot.pads?.['Gota'] ? "Piloto" : "",

            // Observações
            observacoesCompra: (orderData.reportText || "").substring(0, 1000)
        };

        // CRIPTOGRAFIA RSA-OAEP (TUDO DEVE ESTAR AQUI)
        const sensitiveData = {
            ...technicalData,
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: (patientData.email || "").toLowerCase(),
            Telefone_paciente: (patientData.telefone || patientData.phone || "").replace(/\D/g, ""),
            IdFisio: [activeUserEmail], // Array para o Diego ler index [0]
            LocalPedido: "AXIOM",
            Nome_Paciente: (patientData.nome || patientData.name || "Paciente").toUpperCase(),
            DataPedido: dataPedidoBR,
            orderDate: orderDate,
            Origem: "Axiom"
        };

        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const base64Payload = forge.util.encode64(encrypted);

        const info = {
            ...sensitiveData,
            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI=",
            Nome_indicacao: professionalData?.name || professionalData?.full_name || "Fisioterapeuta Axiom",
            Contato_indicacao: professionalData?.address || professionalData?.clinic || "Axiom"
        };

        // ENVIO — Estrutura solicitada: Root + Payload + Nested Info
        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AXION_TOKEN}`
            },
            body: JSON.stringify({ ...info, payload: base64Payload, info: info }),
            cache: 'no-store'
        });

        if (response.ok) {
            return { success: true, orderNumber: undefined, synced: false };
        }

        const errorText = await response.text();
        return { success: false, error: `Erro na Fábrica: ${response.status} - ${errorText.substring(0, 150)}` };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
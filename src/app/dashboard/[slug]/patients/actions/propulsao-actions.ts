"use server";

import forge from "node-forge";

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
    console.log("🚀 TENTANDO ENDPOINT: pedidos_axion");

    try {
        const AXION_TOKEN = process.env.AXION_TOKEN || "";
        const PUBLIC_KEY_PEM_RAW = process.env.PROPULSAO_PUBLIC_KEY || "";
        const publicKeyPem = getStrictPublicKey(PUBLIC_KEY_PEM_RAW);
        const dataMs = Date.now();
        const profEmail = (professionalData?.email || professionalData?.id || "contato@axiom.com").toLowerCase();

        // 1. Dados Sensíveis (Padrão AXIOM)
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: (patientData.email || "contato@axiom.com").toLowerCase(),
            IdFisio: [profEmail],
            LocalPedido: "AXIOM",
            Nome_Paciente: (patientData.nome || "PACIENTE TESTE").toUpperCase()
        };

        // 2. Criptografia node-forge
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const base64Payload = forge.util.encode64(encrypted);

        // Map helpers
        const mapArco = (a: string) => a.includes("Baixo") ? "Baixo" : a.includes("Alto") ? "Alto" : "Medio";
        const mapFlex = (f: string) => f.includes("Rígido") ? "Rigido" : "Flexivel";

        // 3. Info (Completo conforme INTEGRACAO_PEDIDOS_EXTERNOS.md)
        const info = {
            Cobertura: orderData.general.cobertura || "EVA Azul (Padrão)",
            Numeracao: Math.round(Number(orderData.general.tamanho) || 37),
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Math.round(Number(orderData.totalPrice)) || 190,
            Produto: orderData.general.produto || "Biomecânica",
            dataStamp: dataMs,
            LocalPedido: "AXIOM",
            Nome_indicacao: professionalData.nome || "Axiom Fisioterapia",
            observacoesCompra: orderData.reportText || "",

            // Especificações Técnicas (Obrigatórias para evitar 500)
            Absorcao_dir: orderData.rightFoot.absorcao || "0",
            Absorcao_esq: orderData.leftFoot.absorcao || "0",
            Antepe_Dir: orderData.rightFoot.antepe || "0",
            Antepe_Esq: orderData.leftFoot.antepe || "0",
            Retrope_Dir: orderData.rightFoot.retrope || "0",
            Retrope_Esq: orderData.leftFoot.retrope || "0",
            Elevacao_Dir: orderData.rightFoot.elevacao || "0",
            Elevacao_Esq: orderData.leftFoot.elevacao || "0",

            Arco_Dir: mapArco(orderData.rightFoot.arco),
            Arco_Esq: mapArco(orderData.leftFoot.arco),
            SuporteArco_dir: mapFlex(orderData.rightFoot.flexibilidade),
            SuporteArco_esq: mapFlex(orderData.leftFoot.flexibilidade),

            Barra_Dir: orderData.rightFoot.pads?.['Barra'] ? "Sim" : "0",
            Barra_Esq: orderData.leftFoot.pads?.['Barra'] ? "Sim" : "0",

            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI="
        };

        // 4. Envio
        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-axion-token": AXION_TOKEN
            },
            body: JSON.stringify({ payload: base64Payload, info: info }),
            cache: 'no-store'
        });

        const resText = await response.text();
        let orderNumber = undefined;
        try {
            const resJson = JSON.parse(resText);
            orderNumber = resJson.order || resJson.orderNumber;
        } catch (e) { }

        if (response.ok) {
            console.log("✅ SUCESSO!", resText);
            return { success: true, message: "Pedido enviado com sucesso!", orderNumber };
        }

        console.error("❌ ERRO API:", response.status, resText);
        return { success: false, error: `Erro ${response.status}: ${resText || 'Falha no processamento'}` };

    } catch (error: any) {
        console.error("🔥 EXCEÇÃO:", error.message);
        return { success: false, error: "Falha interna ao processar o pedido." };
    }
}

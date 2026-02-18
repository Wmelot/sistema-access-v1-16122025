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

        // 1. Dados Sensíveis (Padrão AXION)
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: (patientData.email || "wmelot@gmail.com").toLowerCase(),
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
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

        // 3. Info
        const info = {
            Cobertura: orderData.general.cobertura.includes("Azul") ? "EVAazul" : "EVApreto",
            Numeracao: Math.round(Number(orderData.general.tamanho) || 37),
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Math.round(Number(orderData.totalPrice)) || 150,
            Produto: "Slim",
            dataStamp: dataMs,
            LocalPedido: "Propulsão",
            Nome_indicacao: professionalData.nome || "AXION",
            fileE: "UExhY2Vob2xkZXI=",
            fileD: "UExhY2Vob2xkZXI="
        };

        // 4. Envio ( Diego confirmou: pedidos_axion )
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

        if (response.ok) {
            console.log("✅ AGORA FOI!", resText);
            return { success: true, message: "Pedido enviado com sucesso!" };
        }

        console.error("❌ ERRO NO pedidos_axion:", response.status, resText);
        // Se der 403, pode ser o Token vencido ou incorreto no .env
        return { success: false, error: `Erro ${response.status}: Acesso negado. Verifique o Token.` };

    } catch (error: any) {
        console.error("🔥 FALHA:", error.message);
        return { success: false, error: "Falha na comunicação." };
    }
}

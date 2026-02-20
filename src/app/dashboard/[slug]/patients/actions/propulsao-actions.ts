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

        const mapFlex = (f: string) => {
            if (f.includes("Rígido")) return "Rigido";
            if (f.includes("Semirrígido") || f.includes("Semi")) return "Semi-Flexível";
            return "Flexível";
        };

        const extractDegree = (s: string) => {
            if (!s || s.includes("Sem correção") || s === "0") return "0";
            // Extracts the number from strings like "P (+) positivo | 6 graus" or "M (-) negativo | -9 graus"
            const match = s.match(/\| (.*) graus/);
            if (match) {
                const val = match[1].replace(/[^0-9-]/g, "");
                return val.replace("-", ""); // Factory seems to use positive numbers and knows direction by context or signs are stripped
            }
            return "0";
        };

        const mapBarra = (pads: any) => {
            if (pads?.['Gota']) return "Gota";
            if (pads?.['Barra']) return "Sim";
            return "Não";
        };

        const mapAbsorcao = (a: string) => {
            if (a === "Absorção") return "Sim";
            if (a === "Absorção inteira") return "Inteira";
            return "0";
        };

        // 3. Info (Completo conforme mapeamento real do Firestore)
        const info = {
            Cobertura: orderData.general?.cobertura ? orderData.general.cobertura.split('(')[0].trim() : "EVA AZUL",
            Numeracao: Math.round(Number(orderData.general?.tamanho) || 40),
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Number(orderData.totalPrice) || 190.00,
            Produto: orderData.general?.produto || "Slim",
            observacoesCompra: orderData.reportText || "Pedido via Axiom",
            PontosGerados: 0,

            // Dados do Profissional
            Nome_indicacao: professionalData?.nome || "Fisio",
            Contato_indicacao: professionalData?.address || "Endereço Externo",

            // Especificações Técnicas (Mapeadas para o formato da fábrica)
            Absorcao_dir: mapAbsorcao(orderData.rightFoot?.absorcao || ""),
            Absorcao_esq: mapAbsorcao(orderData.leftFoot?.absorcao || ""),

            Antepe_Dir: extractDegree(orderData.rightFoot?.antepe || ""),
            Antepe_Esq: extractDegree(orderData.leftFoot?.antepe || ""),
            Retrope_Dir: extractDegree(orderData.rightFoot?.retrope || ""),
            Retrope_Esq: extractDegree(orderData.leftFoot?.retrope || ""),

            Barra_Dir: mapBarra(orderData.rightFoot?.pads),
            Barra_Esq: mapBarra(orderData.leftFoot?.pads),

            Elevacao_Dir: orderData.rightFoot?.elevacao === "Nenhuma" ? "0" : (orderData.rightFoot?.elevacao || "0"),
            Elevacao_Esq: orderData.leftFoot?.elevacao === "Nenhuma" ? "0" : (orderData.leftFoot?.elevacao || "0"),

            Arco_Dir: mapArco(orderData.rightFoot?.arco || ""),
            Arco_Esq: mapArco(orderData.leftFoot?.arco || ""),

            SuporteArco_dir: mapFlex(orderData.rightFoot?.flexibilidade || ""),
            SuporteArco_esq: mapFlex(orderData.leftFoot?.flexibilidade || ""),

            // Alívios (Campos específicos do Firestore)
            Alivio1_dir: orderData.rightFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "",
            Alivio1_esq: orderData.leftFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "",
            Alivio23_dir: orderData.rightFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "",
            Alivio23_esq: orderData.leftFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "",
            Alivio45_dir: orderData.rightFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "",
            Alivio45_esq: orderData.leftFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "",

            // Borda
            Borda_Dir: orderData.rightFoot?.borda || "Sem Borda",
            Borda_Esq: orderData.leftFoot?.borda || "Sem Borda",

            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI="
        };

        // 4. Envio
        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AXION_TOKEN}`
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

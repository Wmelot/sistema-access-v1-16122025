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
        // Obter o e-mail do usuário ATIVO (logado no Axiom)
        const context = await getSecurityContext().catch(() => null);
        const activeUserEmail = context?.userEmail || professionalData?.email || "contato@axiom.com";

        const AXION_TOKEN = (process.env.AXION_TOKEN || "").trim();
        const PUBLIC_KEY_PEM_RAW = (process.env.PROPULSAO_PUBLIC_KEY || "").trim();

        console.log("   -> E-mail Profissional (Ativo):", activeUserEmail);
        console.log("   -> Token Configurado:", AXION_TOKEN.length > 0 ? "Sim" : "Não");

        if (!AXION_TOKEN) {
            return { success: false, error: "Token de autenticação (AXION_TOKEN) não configurado." };
        }

        let publicKeyPem;
        try {
            publicKeyPem = getStrictPublicKey(PUBLIC_KEY_PEM_RAW);
            if (!publicKeyPem || publicKeyPem.length < 50) throw new Error("Chave pública inválida ou ausente.");
        } catch (e: any) {
            console.error("❌ Erro ao processar chave pública:", e.message);
            return { success: false, error: "Chave pública da Propulsão é inválida." };
        }

        const dataMs = Date.now();

        // 1. Dados Sensíveis (Padrão AXIOM) - Importante usar Nome real e E-mail ativo
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: (patientData.email || "contato@axiom.com").toLowerCase(),
            IdFisio: [activeUserEmail.toLowerCase()],
            LocalPedido: "AXIOM",
            Nome_Paciente: (patientData.nome || "PACIENTE TESTE").toUpperCase()
        };

        console.log("   -> Payload Paciente:", sensitiveData.Nome_Paciente);

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
            if (!f) return "Flexível";
            if (f.includes("Rígido")) return "Rigido";
            if (f.includes("Semirrígido") || f.includes("Semi")) return "Semi-Flexível";
            return "Flexível";
        };

        const extractDegree = (s: string) => {
            if (!s || s.includes("Sem correção") || s === "0" || s.includes("Neutro")) return "0";

            const matchDeg = s.match(/\| (.*) graus/);
            if (matchDeg) {
                return matchDeg[1].replace(/[^0-9-]/g, "").replace("-", "");
            }

            const matchParen = s.match(/\((\d+)º\)/);
            if (matchParen) {
                return matchParen[1];
            }

            return "0";
        };

        const mapBarra = (pads: any) => {
            if (pads?.['Gota']) return "Gota";
            if (pads?.['Barra']) return "Sim";
            return "Não";
        };

        const mapAbsorcao = (a: string) => {
            if (!a) return "0";
            if (a.includes("Absorção")) return "Sim";
            if (a.includes("inteira")) return "Inteira";
            return "0";
        };

        // 3. Info
        const info = {
            Cobertura: orderData.general?.cobertura ? orderData.general.cobertura.split('(')[0].trim() : "EVA AZUL",
            Numeracao: Math.round(Number(orderData.general?.tamanho) || 40),
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Number(orderData.totalPrice) || 190.00,
            Produto: orderData.general?.produto || "Slim",
            observacoesCompra: orderData.reportText || "",
            PontosGerados: 0,

            Nome_indicacao: professionalData?.nome || "Fisio",
            Contato_indicacao: professionalData?.address || "Endereço Externo",

            Absorcao_dir: mapAbsorcao(orderData.rightFoot?.absorcao || ""),
            Absorcao_esq: mapAbsorcao(orderData.leftFoot?.absorcao || ""),

            Antepe_Dir: extractDegree(orderData.rightFoot?.antepe || ""),
            Antepe_Esq: extractDegree(orderData.leftFoot?.antepe || ""),
            Retrope_Dir: extractDegree(orderData.rightFoot?.retrope || ""),
            Retrope_Esq: extractDegree(orderData.leftFoot?.retrope || ""),

            Barra_Dir: mapBarra(orderData.rightFoot?.pads),
            Barra_Esq: mapBarra(orderData.leftFoot?.pads),

            Elevacao_Dir: orderData.rightFoot?.elevacao === "Nenhuma" ? "0" : extractDegree(orderData.rightFoot?.elevacao || "0"),
            Elevacao_Esq: orderData.leftFoot?.elevacao === "Nenhuma" ? "0" : extractDegree(orderData.leftFoot?.elevacao || "0"),

            Arco_Dir: mapArco(orderData.rightFoot?.arco || ""),
            Arco_Esq: mapArco(orderData.leftFoot?.arco || ""),

            SuporteArco_dir: mapFlex(orderData.rightFoot?.flexibilidade || ""),
            SuporteArco_esq: mapFlex(orderData.leftFoot?.flexibilidade || ""),

            Alivio1_dir: orderData.rightFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "",
            Alivio1_esq: orderData.leftFoot?.pads?.['Alívio 1º Metatarso'] ? "Sim" : "",
            Alivio23_dir: orderData.rightFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "",
            Alivio23_esq: orderData.leftFoot?.pads?.['Alívio 2/3º Metatarso'] ? "Sim" : "",
            Alivio45_dir: orderData.rightFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "",
            Alivio45_esq: orderData.leftFoot?.pads?.['Alívio 4/5º Metatarso'] ? "Sim" : "",

            Borda_Dir: orderData.rightFoot?.borda || "Sem Borda",
            Borda_Esq: orderData.leftFoot?.borda || "Sem Borda",

            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI="
        };

        // 4. Envio
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
        console.log(`   -> Resposta da API (${response.status}):`, resText);

        let orderNumber = undefined;
        try {
            const resJson = JSON.parse(resText);
            // Captura flexível de vários campos possíveis para o número do pedido
            orderNumber = resJson.orderNumber || resJson.order || resJson.id || resJson.pedido || resJson.number;

            // Se não encontrou no JSON processado, mas o texto contém algo como "Pedido #12345"
            if (!orderNumber && resText.includes("#")) {
                const match = resText.match(/#(\d+-\d+|\d+)/);
                if (match) orderNumber = match[1];
            }
        } catch (e) {
            // Se não for JSON, tenta via Regex no texto puro
            const match = resText.match(/#(\d+-\d+|\d+)/);
            if (match) orderNumber = match[1];
        }

        if (response.ok) {
            console.log("✅ SUCESSO! Número do Pedido:", orderNumber);
            return { success: true, message: "Pedido enviado com sucesso!", orderNumber };
        }

        return { success: false, error: `Erro ${response.status}: ${resText || 'Falha no processamento'}` };

    } catch (error: any) {
        console.error("🔥 EXCEÇÃO em sendOrderToPropulsao:", error);
        return { success: false, error: "Falha interna: " + (error.message || "Erro desconhecido") };
    }
}

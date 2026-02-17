"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";

interface PropulsaoOrderRequest {
    payload: string;
    info: {
        Cobertura: string;
        Numeracao: number;
        ladoPedido: "Direito" | "Esquerdo" | "DireitoEsquerdo";
        PrecoPedido: number;
        Produto: string;
        observacoesCompra: string;
        PontosGerados: number;
        Nome_indicacao: string;
        Contato_indicacao: string;

        // Technical Specs
        Absorcao_dir: string;
        Absorcao_esq: string;
        Antepe_Dir: string;
        Antepe_Esq: string;
        Retrope_Dir: string;
        Retrope_Esq: string;
        Barra_Dir: string;
        Barra_Esq: string;
        Elevacao_Dir: string;
        Elevacao_Esq: string;
        Arco_Dir: string;
        Arco_Esq: string;
        SuporteArco_dir: string;
        SuporteArco_esq: string;

        // Files
        fileE: string;
        fileD: string;
    };
}

export async function sendOrderToPropulsao(orderData: any, patientData: any, professionalData: any) {
    try {
        const AXION_TOKEN = process.env.AXION_TOKEN;
        const PUBLIC_KEY_PEM = process.env.PROPULSAO_PUBLIC_KEY?.replace(/\\n/g, "\n");

        if (!PUBLIC_KEY_PEM || !AXION_TOKEN) {
            console.error("Missing Propulsão environment variables");
            return { success: false, error: "Configuração de servidor incompleta." };
        }

        // 1. Prepare Sensitive Data (Payload)
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: patientData.email || "",
            IdFisio: [professionalData.id],
            LocalPedido: "AXIOM",
            Nome_Paciente: patientData.nome || "Não Informado"
        };

        // 2. Encrypt Payload using RSA-OAEP SHA-256
        const buffer = Buffer.from(JSON.stringify(sensitiveData));
        const encrypted = crypto.publicEncrypt(
            {
                key: PUBLIC_KEY_PEM,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            buffer
        );
        const base64Payload = encrypted.toString("base64");

        // 3. Prepare Technical Info
        const mapArc = (arc: string) => {
            if (arc.includes("Baixo")) return "Baixo";
            if (arc.includes("Médio")) return "Medio";
            if (arc.includes("Alto")) return "Alto";
            return "Medio";
        };

        const mapFlex = (flex: string) => {
            if (flex.includes("Flexível")) return "Flexivel";
            if (flex.includes("Rígido")) return "Rigido";
            return "Flexivel"; // Default semirrigido as flexivel or handle separately
        };

        const extractDegree = (val: string) => {
            if (!val || val.includes("Sem correção")) return "0";
            const match = val.match(/(-?\d+)\s*graus/);
            return match ? match[1] : "0";
        };

        const info: PropulsaoOrderRequest["info"] = {
            Cobertura: orderData.general.cobertura.split(" (")[0], // Remove "(Padrão)"
            Numeracao: Number(orderData.general.tamanho),
            ladoPedido: "DireitoEsquerdo", // Based on current form logic which does both
            PrecoPedido: orderData.totalPrice,
            Produto: orderData.general.produto === "Slim" ? "Palmilha 3D Slim" : "Palmilha 3D Biomecânica",
            observacoesCompra: orderData.reportText || "",
            PontosGerados: 0,
            Nome_indicacao: professionalData.nome || "Fisioterapeuta",
            Contato_indicacao: professionalData.address || "Endereço da Clínica",

            // Left Foot
            Absorcao_esq: orderData.leftFoot.absorcao === "Sem absorção" ? "0" : "1",
            Antepe_Esq: extractDegree(orderData.leftFoot.antepe),
            Retrope_Esq: extractDegree(orderData.leftFoot.retrope),
            Barra_Esq: orderData.leftFoot.pads["Barra"] ? "1" : "0",
            Elevacao_Esq: orderData.leftFoot.elevacao === "Nenhuma" ? "0" : orderData.leftFoot.elevacao,
            Arco_Esq: mapArc(orderData.leftFoot.arco),
            SuporteArco_esq: mapFlex(orderData.leftFoot.flexibilidade),

            // Right Foot
            Absorcao_dir: orderData.rightFoot.absorcao === "Sem absorção" ? "0" : "1",
            Antepe_Dir: extractDegree(orderData.rightFoot.antepe),
            Retrope_Dir: extractDegree(orderData.rightFoot.retrope),
            Barra_Dir: orderData.rightFoot.pads["Barra"] ? "1" : "0",
            Elevacao_Dir: orderData.rightFoot.elevacao === "Nenhuma" ? "0" : orderData.rightFoot.elevacao,
            Arco_Dir: mapArc(orderData.rightFoot.arco),
            SuporteArco_dir: mapFlex(orderData.rightFoot.flexibilidade),

            // Files from Client
            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI="
        };

        // 4. Send Request to Propulsão API
        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-axion-token": AXION_TOKEN
            },
            body: JSON.stringify({
                payload: base64Payload,
                info: info
            }),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Propulsão API Error:", response.status, errorText);
            return { success: false, error: `Erro na API da Propulsão: ${response.status}` };
        }

        const result = await response.text();
        console.log("Propulsão Success:", result);

        return {
            success: true,
            message: "Pedido enviado com sucesso para a Propulsão!",
            orderNumber: result.match(/#\d+/)?.[0] || result
        };

    } catch (error: any) {
        console.error("Propulsão Integration Crash:", error);
        return { success: false, error: "Erro interno ao processar pedido." };
    }
}

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
        const dataStamp = now.getTime(); // Number em ms, como exige o DOC

        // Ajuste para Horário de Brasília (GMT-3) apenas para a data em formato string
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
        const orderDate = brazilTime.toISOString().split('T')[0];

        // ── Helpers de mapeamento (fielmente ao Firebase real) ──
        const mapCoberturaToDoc = (c: string): string => {
            // Firebase real: "TECIDOpreto", "EVAazul", etc.
            if (!c) return "EVAazul";
            if (c.includes("Tecido Preto") || c.includes("tecido preto")) return "TECIDOpreto";
            if (c.includes("Tecido Azul") || c.includes("tecido azul")) return "TECIDOazul";
            if (c.includes("EVA Azul") || c.includes("eva azul")) return "EVAazul";
            if (c.includes("Plastazote")) return "Plastazote";
            if (c.includes("Nobuk")) return "Nobuk";
            return c.replace(/\s/g, ""); // Fallback: remove espaços
        };

        const mapFlexToSuporteArcoSingle = (foot: any): string => {
            // Firebase real: "Semi-Flexível", "Rígido", "Flexível" — per foot!
            const f = foot?.flexibilidade || "";
            if (f.includes("Rígido") && !f.includes("Semi")) return "Rígido";
            if (f.includes("Semirrígido") || f.includes("Semi")) return "Semi-Flexível";
            return "Flexível";
        };

        const extractDegreeValue = (s: string): string => {
            // DOC: Apenas número como string. Ex: "9", "-6"
            if (!s || s.includes("Sem correção") || s === "0") return "0";
            const match = s.match(/-?\d+/);
            if (!match) return "0";
            let val = parseInt(match[0]);
            // Se o texto diz "negativo" e o número é positivo, inverter
            if (val > 0 && (s.toLowerCase().includes("negativo") || s.toLowerCase().includes("supin"))) {
                val = -val;
            }
            return String(val);
        };

        const extractElevation = (s: string): string => {
            // DOC: Apenas número como string. Ex: "5" (para 0.5cm = 5mm)
            if (!s || s === "0" || s === "0.0") return "0";
            const val = parseFloat(s);
            if (isNaN(val)) return "0";
            return String(Math.round(val * 10)); // Converte cm para mm
        };

        // ── Dados sensíveis (payload criptografado) ──
        // DOC §3: IdFisio DEVE ser STRING (não Array!)
        const sensitiveData = {
            timestamp: Math.floor(dataStamp / 1000),
            Email_paciente: (patientData.email || "").toLowerCase(),
            IdFisio: activeUserEmail.toLowerCase(), // ✅ STRING conforme DOC
            LocalPedido: "AXIOM",
            Nome_Paciente: (patientData.nome || patientData.name || "Paciente").toUpperCase()
        };

        // 2. Encryption
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
            return { success: false, error: "Falha na criptografia: " + e.message };
        }

        // ── 3. Info - EXATAMENTE como o Firebase real da Propulsão armazena ──
        const leftFoot = orderData.leftFoot || {};
        const rightFoot = orderData.rightFoot || {};

        // 🐛 TEMP DEBUG: Verificar exatamente o que chega do componente
        console.log("🐛 [DEBUG] leftFoot COMPLETO:", JSON.stringify(leftFoot));
        console.log("🐛 [DEBUG] rightFoot COMPLETO:", JSON.stringify(rightFoot));
        console.log("🐛 [DEBUG] orderData keys:", Object.keys(orderData));

        // Helper: map arco removing accents to match Firebase ("Medio", not "Médio")
        const mapArco = (foot: any): string => {
            const a = foot?.arco || "";
            if (a.includes("Baixo")) return "Baixo";
            if (a.includes("Alto")) return "Alto";
            return "Medio"; // Firebase real: "Medio" sem acento
        };

        // Helper: map absorcao — Firebase uses "0" for none, value for yes
        const mapAbsorcao = (foot: any): string => {
            if (!foot?.absorcao || foot.absorcao === "Sem absorção" || foot.absorcao === "Não") return "0";
            return "1";
        };

        const info: Record<string, any> = {
            // Identificação
            Nome_Paciente: (patientData.nome || patientData.name || "Paciente").toUpperCase(),
            Email_paciente: (patientData.email || "").toLowerCase(),
            Telefone_paciente: (patientData.telefone || patientData.phone || ""),
            IdFisio: activeUserEmail.toLowerCase(), // ✅ STRING (não array!)
            LocalPedido: "AXIOM",
            Origem: "PEDIDOS",
            dataStamp: dataStamp, // ✅ Number em ms
            orderDate: orderDate,

            // Produto — tipos como Number para bater com Firebase real
            Produto: orderData.general?.produto || "Slim",
            Cobertura: mapCoberturaToDoc(orderData.general?.cobertura || "EVA Azul"),
            Numeracao: Number(orderData.general?.tamanho) || 0, // Firebase real: number (42)
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: Number(orderData.totalPrice) || 0, // Firebase real: number (195)

            // ── SuporteArco por pé (Firebase real: SuporteArco_dir, SuporteArco_esq) ──
            SuporteArco_dir: mapFlexToSuporteArcoSingle(rightFoot),
            SuporteArco_esq: mapFlexToSuporteArcoSingle(leftFoot),

            // ── Pé Direito ──
            Absorcao_dir: mapAbsorcao(rightFoot),
            Alivio1_dir: rightFoot.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "",
            Alivio23_dir: rightFoot.pads?.['Alívio 2/3º Metatarso'] ? "2º/3º Met." : "",
            Alivio45_dir: rightFoot.pads?.['Alívio 4/5º Metatarso'] ? "4º/5º Met." : "",
            Barra_Dir: rightFoot.pads?.['Barra'] ? "Barra" : "",
            Borda_Dir: rightFoot.borda?.includes("Borda") ? "Borda" : "",
            Elevacao_Dir: extractElevation(rightFoot.elevacao || "0"),
            Antepe_Dir: extractDegreeValue(rightFoot.antepe || ""),
            Retrope_Dir: extractDegreeValue(rightFoot.retrope || ""),
            Arco_Dir: mapArco(rightFoot),

            // ── Pé Esquerdo ──
            Absorcao_esq: mapAbsorcao(leftFoot),
            Alivio1_esq: leftFoot.pads?.['Alívio 1º Metatarso'] ? "1º Met." : "",
            Alivio23_esq: leftFoot.pads?.['Alívio 2/3º Metatarso'] ? "2º/3º Met." : "",
            Alivio45_esq: leftFoot.pads?.['Alívio 4/5º Metatarso'] ? "4º/5º Met." : "",
            Barra_Esq: leftFoot.pads?.['Barra'] ? "Barra" : "",
            Borda_Esq: leftFoot.borda?.includes("Borda") ? "Borda" : "",
            Elevacao_Esq: extractElevation(leftFoot.elevacao || "0"),
            Antepe_Esq: extractDegreeValue(leftFoot.antepe || ""),
            Retrope_Esq: extractDegreeValue(leftFoot.retrope || ""),
            Arco_Esq: mapArco(leftFoot),

            // ── Extras ──
            gota_dir: rightFoot.pads?.['Gota'] ? "Gota" : "",
            gota_esq: leftFoot.pads?.['Gota'] ? "Gota" : "",

            // Scanner Files
            fileE: orderData.fileE || "UExhY2Vob2xkZXI=",
            fileD: orderData.fileD || "UExhY2Vob2xkZXI=",

            // Resumo clínico (observacoesCompra)
            observacoesCompra: orderData.reportText || ""
        };

        console.log("📤 [sendOrderToPropulsao] Enviando pedido para:", info.Nome_Paciente, "| Produto:", info.Produto, "| Num:", info.Numeracao);
        console.log("📤 [sendOrderToPropulsao] INFO PÉ DIR:", { Arco: info.Arco_Dir, Antepe: info.Antepe_Dir, Retrope: info.Retrope_Dir, Elevacao: info.Elevacao_Dir, SuporteArco: info.SuporteArco_dir, Absorcao: info.Absorcao_dir, Borda: info.Borda_Dir });
        console.log("📤 [sendOrderToPropulsao] INFO PÉ ESQ:", { Arco: info.Arco_Esq, Antepe: info.Antepe_Esq, Retrope: info.Retrope_Esq, Elevacao: info.Elevacao_Esq, SuporteArco: info.SuporteArco_esq, Absorcao: info.Absorcao_esq, Borda: info.Borda_Esq });

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AXION_TOKEN}`,
            "x-axion-token": AXION_TOKEN
        };

        // Cloud Function faz req.body.info.Cobertura
        // Confirmado pelo erro: "Cannot read properties of undefined (reading 'Cobertura')"
        const requestBody = {
            payload: base64Payload,
            info: info
        };

        const response = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
            cache: 'no-store'
        });

        const resText = await response.text();
        console.log("📥 [sendOrderToPropulsao] Status:", response.status, "| Body:", resText);

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
                (patientData.nome || patientData.name || "Paciente").toUpperCase(),
                activeUserEmail.toLowerCase()
            );

            console.log("📋 [sendOrderToPropulsao] RESULTADO FINAL — syncedOrderNumber:", syncedOrderNumber, "| fromResponse:", orderNumber);

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
        const { getPropulsaoAuth, getPropulsaoDb, getPropulsaoApp } = await import("@/lib/integrations/propulsao");
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const { collection, query, where, limit, getDocs } = await import("firebase/firestore");

        const app = getPropulsaoApp();
        const auth = getPropulsaoAuth();
        const db = getPropulsaoDb();

        console.log("🔍 [syncOrderNumber] Firebase projectId:", app.options.projectId);
        console.log("🔍 [syncOrderNumber] Buscando:", { pacienteNome, fisioEmail });

        await signInWithEmailAndPassword(auth, 'wmelot@gmail.com', 'Wmelo@123');
        console.log("🔍 [syncOrderNumber] Auth OK");

        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔍 [syncOrderNumber] Tentativa ${attempt}/3...`);

            // Query com apenas 1 where clause (sem composite index)
            const q = query(
                collection(db, "PEDIDOS"),
                where("IdFisio", "==", fisioEmail.toLowerCase()),
                limit(20)
            );
            const querySnapshot = await getDocs(q);
            console.log(`🔍 [syncOrderNumber] Tentativa ${attempt}: ${querySnapshot.size} docs para IdFisio=${fisioEmail}`);

            if (!querySnapshot.empty) {
                // Filtrar por nome do paciente e pegar o mais recente (em código)
                let mostRecent: any = null;
                let maxStamp = 0;
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.Nome_Paciente === pacienteNome) {
                        const stamp = data.dataStamp || 0;
                        if (stamp > maxStamp) {
                            maxStamp = stamp;
                            mostRecent = data;
                        }
                    }
                });

                if (mostRecent?.N_Pedido) {
                    console.log("✅ [syncOrderNumber] ENCONTRADO! N_Pedido:", mostRecent.N_Pedido, "| dataStamp:", mostRecent.dataStamp);
                    return mostRecent.N_Pedido;
                }
            }
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 3000));
        }
        console.log("⚠️ [syncOrderNumber] Nenhum pedido encontrado após 3 tentativas");
        return null;
    } catch (error: any) {
        console.error("🔥 [syncOrderNumber] ERRO:", error.message || error);
        return null;
    }
}

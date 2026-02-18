const forge = require('node-forge');
const dotenv = require('dotenv');
const path = require('path');

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const PUBLIC_KEY_PEM = process.env.PROPULSAO_PUBLIC_KEY || "";
const AXION_TOKEN = process.env.AXION_TOKEN || "";

function getCleanKey(key) {
    return key.replace(/\\n/g, '\n').replace(/"/g, '').trim();
}

async function runTest(label, url, includeToken = true, useArrayId = true, localName = "AXIOM") {
    console.log(`\n--- TESTE: ${label} ---`);
    console.log(`URL: ${url} | Token: ${includeToken ? 'SIM' : 'NÃO'}`);

    try {
        const cleanKey = getCleanKey(PUBLIC_KEY_PEM);
        const dataMs = Date.now();

        // 1. Payload Sensível BASEADO NO EXEMPLO DO DOC
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: "warley@exemplo.com",
            IdFisio: useArrayId ? ["wmelot@gmail.com"] : "wmelot@gmail.com",
            LocalPedido: localName,
            Nome_Paciente: "PACIENTE TESTE DIAGNOSTICO"
        };

        const publicKey = forge.pki.publicKeyFromPem(cleanKey);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const base64Payload = forge.util.encode64(encrypted);

        // 2. Info BASEADO NO EXEMPLO DO DOC
        const info = {
            Cobertura: "EVA AZUL",
            Numeracao: 40,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: 190,
            Produto: "Palmilha 3D",
            Nome_indicacao: "Fisio Teste",
            Contato_indicacao: "Endereco Teste",
            Absorcao_dir: "0",
            Absorcao_esq: "0",
            Antepe_Dir: "0",
            Antepe_Esq: "0",
            Retrope_Dir: "0",
            Retrope_Esq: "0",
            Barra_Dir: "0",
            Barra_Esq: "0",
            Elevacao_Dir: "0",
            Elevacao_Esq: "0",
            Arco_Dir: "Medio",
            Arco_Esq: "Medio",
            SuporteArco_dir: "Flexivel",
            SuporteArco_esq: "Flexivel",
            fileE: "UExhY2Vob2xkZXI=",
            fileD: "UExhY2Vob2xkZXI="
        };

        const headers = { "Content-Type": "application/json" };
        if (includeToken) headers["x-axion-token"] = AXION_TOKEN;

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ payload: base64Payload, info: info })
        });

        const resText = await response.text();
        console.log(`Status: ${response.status} | Resposta: ${resText}`);
        return response.ok;

    } catch (e) {
        console.error(`Erro no teste ${label}:`, e.message);
        return false;
    }
}

async function main() {
    const endpoints = [
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion",
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos"
    ];

    console.log("INICIANDO BATERIA DE TESTES FINAIS...");

    // Teste 1: Exatamente como o Doc (pedidos_axion + Token + AXIOM)
    await runTest("DOC_STANDARD", endpoints[0], true, true, "AXIOM");

    // Teste 2: IdFisio como String (alguns backends legados preferem)
    await runTest("STRING_ID", endpoints[0], true, false, "AXIOM");

    // Teste 3: Externos sem Token (como no exemplo do rodapé do doc)
    await runTest("EXTERNOS_NO_TOKEN", endpoints[1], false, true, "AXIOM");

    // Teste EXTRA: Externos COM Token
    await runTest("EXTERNOS_WITH_TOKEN", endpoints[1], true, true, "AXIOM");

    // Teste 4: LocalPedido como AXION (com N)
    await runTest("TYPO_AXION", endpoints[0], true, true, "AXION");
}

main();

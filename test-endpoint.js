const forge = require('node-forge');
require('dotenv').config({ path: '.env.local' });

const AXION_TOKEN = process.env.AXION_TOKEN || "";
const PUBLIC_KEY_PEM_RAW = process.env.PROPULSAO_PUBLIC_KEY || "";

function getStrictPublicKey(rawKey) {
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

async function testEndpoint(url, authHeader) {
    console.log(`\nTesting URL: ${url}`);
    console.log(`Using Auth Header: ${JSON.stringify(authHeader)}`);

    try {
        const publicKeyPem = getStrictPublicKey(PUBLIC_KEY_PEM_RAW);
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: "contato@axiom.com",
            IdFisio: ["contato@axiom.com"],
            LocalPedido: "AXIOM_TEST",
            Nome_Paciente: "PACIENTE TESTE"
        };

        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const base64Payload = forge.util.encode64(encrypted);

        const body = {
            payload: base64Payload,
            info: {
                Cobertura: "EVA AZUL",
                Numeracao: 40,
                ladoPedido: "DireitoEsquerdo",
                PrecoPedido: 190.00,
                Produto: "Slim",
                observacoesCompra: "Teste Técnico",
                PontosGerados: 0,
                Nome_indicacao: "Fisio Teste",
                Contato_indicacao: "Endereço Teste",
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
                Arco_Dir: "Baixo",
                Arco_Esq: "Baixo",
                SuporteArco_dir: "Flexivel",
                SuporteArco_esq: "Flexivel",
                fileE: "UExhY2Vob2xkZXI=",
                fileD: "UExhY2Vob2xkZXI="
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeader
            },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${response.status}`);
        console.log(`Response: ${await response.text()}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

async function run() {
    // Test combinations
    await testEndpoint(
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion",
        { "Authorization": `Bearer ${AXION_TOKEN}` }
    );

    await testEndpoint(
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion",
        { "x-axion-token": AXION_TOKEN }
    );

    await testEndpoint(
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos",
        { "Authorization": `Bearer ${AXION_TOKEN}` }
    );

    await testEndpoint(
        "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos",
        { "x-axion-token": AXION_TOKEN }
    );
}

run();

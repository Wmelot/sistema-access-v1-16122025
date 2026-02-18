
const forge = require('node-forge');
// fetch is global in modern node versions

const AXION_TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";
const PROPULSAO_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtWhUHUaiPlh+uPbdA0aY\nj47iIzNtcB4UTYfxhWTTtANQmLVBVjh5VdvreVZkBJaZtb5swxn82Az10lwvMylS\nL5vGWp40NCGwXUCfQ2v9C8LvTBYotpN8J3gL2Ofrs02mGa84noonbhDF+di/6vOb\nu8hhgE4VRNz/h+h4nD1ZZdBuuzYh/AhH3CHgqiHX8NibH4wwez+Ezy9iGwICDsf6\nuXRa2ln4Et0TnsNOVNqZlnPJl3CcO1sh28xSrLGKzt4Cl8OhL1FKOUC61/wmJ7WJ\n2yXqYJd3Z+oVtKJflyktVQWlp1HkmJ/W3Ov+mPj5V0rn1l+OfnQS8z95HWjIn7hA\n9QIDAQAB\n-----END PUBLIC KEY-----";

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

async function testAxion() {
    console.log("🚀 TESTANDO ENDPOINT: pedidos_axion");

    try {
        const publicKeyPem = getStrictPublicKey(PROPULSAO_PUBLIC_KEY);
        const dataMs = Date.now();

        // 1. Dados Sensíveis (Exactly as in actions)
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "TESTE ANTIGRAVITY"
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
            Cobertura: "EVAazul",
            Numeracao: 40,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: 150,
            Produto: "Slim",
            dataStamp: dataMs,
            LocalPedido: "AXION",
            Nome_indicacao: "AXION",
            fileE: "UExhY2Vob2xkZXI=",
            fileD: "UExhY2Vob2xkZXI="
        };

        const body_base = { info: info };

        async function tryFetch(url, headers, label, body_override) {
            console.log(`Tentando ${label} em ${url}...`);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: JSON.stringify(body_override)
            });
            const text = await response.text();
            console.log(`[${label}] Status: ${response.status} | Res: ${text.substring(0, 100)}`);
            return response.ok;
        }

        const referrers = [
            "https://axiom.com.br/",
            "https://fitsole.com.br/",
            "https://portal.propulsao3d.com.br/",
            "http://localhost:3000"
        ];

        const sensitiveDataVariations = [
            {
                timestamp: Math.floor(dataMs / 1000),
                Email_paciente: "wmelot@gmail.com",
                IdFisio: "wmelot@gmail.com",
                LocalPedido: "AXION",
                Nome_Paciente: "TESTE ANTIGRAVITY"
            },
            {
                timestamp: Math.floor(dataMs / 1000),
                Email_paciente: "wmelot@gmail.com",
                IdFisio: ["wmelot@gmail.com"],
                LocalPedido: "AXION",
                Nome_Paciente: "TESTE ANTIGRAVITY"
            }
        ];

        for (const sensitiveData of sensitiveDataVariations) {
            console.log("\n--- Alterando sensitiveData:", JSON.stringify(sensitiveData).substring(0, 50));
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
            const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
                md: forge.md.sha256.create(),
                mgf1: { md: forge.md.sha256.create() }
            });
            const base64Payload = forge.util.encode64(encrypted);
            const body = { payload: base64Payload, info: info };

            for (const ref of referrers) {
                const headers = {
                    "Content-Type": "application/json",
                    "x-axion-token": AXION_TOKEN,
                    "Referer": ref,
                    "Origin": ref
                };

                await tryFetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", headers, `Axion (${ref})`, body);
                await tryFetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos", headers, `Externos (${ref})`, body);
            }
        }

    } catch (error) {
        console.error("🔥 ERRO FATAL:", error.message);
    }
}

testAxion();


const forge = require('node-forge');

const AXION_TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtWhUHUaiPlh+uPbdA0aY
j47iIzNtcB4UTYfxhWTTtANQmLVBVjh5VdvreVZkBJaZtb5swxn82Az10lwvMylS
L5vGWp40NCGwXUCfQ2v9C8LvTBYotpN8J3gL2Ofrs02mGa84noonbhDF+di/6vOb
u8hhgE4VRNz/h+h4nD1ZZdBuuzYh/AhH3CHgqiHX8NibH4wwez+Ezy9iGwICDsf6
uXRa2ln4Et0TnsNOVNqZlnPJl3CcO1sh28xSrLGKzt4Cl8OhL1FKOUC61/wmJ7WJ
2yXqYJd3Z+oVtKJflyktVQWlp1HkmJ/W3Ov+mPj5V0rn1l+OfnQS8z95HWjIn7hA
9QIDAQAB
-----END PUBLIC KEY-----`;

const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";

async function test(label, encryptionType) {
    try {
        const dataMs = Date.now();
        const sensitiveData = {
            timestamp: Math.floor(dataMs / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "T " + label
        };

        const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
        let encrypted;

        if (encryptionType === 'RSAES-PKCS1-V1_5') {
            encrypted = publicKey.encrypt(JSON.stringify(sensitiveData), 'RSAES-PKCS1-V1_5');
        } else {
            encrypted = publicKey.encrypt(JSON.stringify(sensitiveData), 'RSA-OAEP', {
                md: forge.md.sha256.create()
            });
        }

        const base64Payload = forge.util.encode64(encrypted);

        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": AXION_TOKEN },
            body: JSON.stringify({ payload: base64Payload, info: { Produto: "Test" } })
        });

        const resText = await response.text();
        console.log(`[${label}] | Status: ${response.status} | Res: ${resText.substring(0, 50)}`);
    } catch (e) {
        console.log(`[${label}] Erro: ${e.message}`);
    }
}

async function run() {
    console.log("Brute Force V5 (PKCS1 v1.5 vs OAEP)...\n");
    await test("OAEP-SHA256", "RSA-OAEP");
    await test("PKCS1-V1_5", "RSAES-PKCS1-V1_5");
}

run();


const crypto = require('crypto');

async function testSubtle() {
    const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtWhUHUaiPlh+uPbdA0aY
j47iIzNtcB4UTYfxhWTTtANQmLVBVjh5VdvreVZkBJaZtb5swxn82Az10lwvMylS
L5vGWp40NCGwXUCfQ2v9C8LvTBYotpN8J3gL2Ofrs02mGa84noonbhDF+di/6vOb
u8hhgE4VRNz/h+h4nD1ZZdBuuzYh/AhH3CHgqiHX8NibH4wwez+Ezy9iGwICDsf6
uXRa2ln4Et0TnsNOVNqZlnPJl3CcO1sh28xSrLGKzt4Cl8OhL1FKOUC61/wmJ7WJ
2yXqYJd3Z+oVtKJflyktVQWlp1HkmJ/W3Ov+mPj5V0rn1l+OfnQS8z95HWjIn7hA
9QIDAQAB
-----END PUBLIC KEY-----`;

    const AXION_TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";
    const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";

    try {
        const pKeyClean = PUBLIC_KEY_PEM.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
        const keyBuffer = Buffer.from(pKeyClean, 'base64');

        const key = await crypto.webcrypto.subtle.importKey(
            "spki",
            keyBuffer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );

        const data = JSON.stringify({
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "TEST SUBTLE"
        });

        const encrypted = await crypto.webcrypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            key,
            Buffer.from(data)
        );

        const base64Payload = Buffer.from(encrypted).toString('base64');

        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": AXION_TOKEN },
            body: JSON.stringify({ payload: base64Payload, info: { Produto: "Test" } })
        });

        const resText = await response.text();
        console.log(`[SUBTLE-SHA256] Status: ${response.status} | Res: ${resText.substring(0, 50)}`);
    } catch (e) {
        console.log(`Erro Subtle: ${e.message}`);
    }
}

testSubtle();

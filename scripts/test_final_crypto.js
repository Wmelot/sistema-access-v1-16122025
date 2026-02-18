
const crypto = require('crypto');

async function testFinal() {
    const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtWhUHUaiPlh+uPbdA0aY
j47iIzNtcB4UTYfxhWTTtANQmLVBVjh5VdvreVZkBJaZtb5swxn82Az10lwvMylS
L5vGWp40NCGwXUCfQ2v9C8LvTBYotpN8J3gL2Ofrs02mGa84noonbhDF+di/6vOb
u8hhgE4VRNz/h+h4nD1ZZdBuuzYh/AhH3CHgqiHX8NibH4wwez+Ezy9iGwICDsf6
uXRa2ln4Et0TnsNOVNqZlnPJl3CcO1sh28xSrLGKzt4Cl8OhL1FKOUC61/wmJ7WJ
2yXqYJd3Z+oVtKJflyktVQWlp1HkmJ/W3Ov+mPj5V0rn1l+OfnQS8z95HWjIn7hA
9QIDAQAB
-----END PUBLIC KEY-----`;

    const TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";
    const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";

    const sensitiveData = {
        timestamp: Math.floor(Date.now() / 1000),
        Email_paciente: "wmelot@gmail.com",
        IdFisio: "wmelot@gmail.com",
        LocalPedido: "AXION",
        Nome_Paciente: "TEST FINAL"
    };

    try {
        const encrypted = crypto.publicEncrypt({
            key: PUBLIC_KEY_PEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
            mgf1Hash: "sha256" // Explicitly SHA-256
        }, Buffer.from(JSON.stringify(sensitiveData)));

        const base64Payload = encrypted.toString('base64');

        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": TOKEN },
            body: JSON.stringify({ payload: base64Payload, info: {} })
        });
        const resText = await response.text();
        console.log(`[SHA256-SHA256] Status: ${response.status} | Res: ${resText}`);

        // Try SHA256-SHA1 explicitly too
        const encrypted2 = crypto.publicEncrypt({
            key: PUBLIC_KEY_PEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
            mgf1Hash: "sha1" // Explicitly SHA-1
        }, Buffer.from(JSON.stringify(sensitiveData)));

        const response2 = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": TOKEN },
            body: JSON.stringify({ payload: encrypted2.toString('base64'), info: {} })
        });
        const resText2 = await response2.text();
        console.log(`[SHA256-SHA1] Status: ${response2.status} | Res: ${resText2}`);

    } catch (e) {
        console.log("Erro:", e.message);
    }
}

testFinal();

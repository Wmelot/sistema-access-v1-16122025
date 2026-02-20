
const crypto = require('crypto');

async function testBase64Url() {
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
    const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion";

    try {
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "TEST BASE64URL"
        };

        const encrypted = crypto.publicEncrypt({
            key: PUBLIC_KEY_PEM,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        }, Buffer.from(JSON.stringify(sensitiveData)));

        const base64 = encrypted.toString('base64');
        const base64Url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        console.log("Testing Base64Url...");
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": TOKEN },
            body: JSON.stringify({ payload: base64Url, info: {} })
        });
        const resText = await response.text();
        console.log(`Status: ${response.status} | Res: ${resText}`);
    } catch (e) {
        console.log("Erro:", e.message);
    }
}

testBase64Url();

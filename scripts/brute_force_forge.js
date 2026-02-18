
const forge = require('node-forge');

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

async function test(label, mdType, mgf1Type) {
    try {
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "TEST " + label
        };

        const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);

        let options = {
            md: mdType === 'sha256' ? forge.md.sha256.create() : forge.md.sha1.create()
        };

        if (mgf1Type) {
            options.mgf1 = {
                md: mgf1Type === 'sha256' ? forge.md.sha256.create() : forge.md.sha1.create()
            };
        }

        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', options);
        const base64Payload = forge.util.encode64(encrypted);

        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": AXION_TOKEN },
            body: JSON.stringify({ payload: base64Payload, info: { Produto: "Test" } })
        });

        const resText = await response.text();
        console.log(`[${label}] Status: ${response.status} | Res: ${resText.substring(0, 50)}`);
    } catch (e) {
        console.log(`[${label}] Erro: ${e.message}`);
    }
}

async function run() {
    console.log("Brute Force Forge OAEP Permutations...\n");
    await test("MD256-MGF256", "sha256", "sha256");
    await test("MD256-MGF1", "sha256", "sha1");
    await test("MD1-MGF1", "sha1", "sha1");
    await test("MD256-NOMGF", "sha256", null);
    await test("MD1-NOMGF", "sha1", null);
}

run();

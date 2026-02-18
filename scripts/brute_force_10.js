
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

async function sendVariation(label, payloadMod, infoMod) {
    try {
        const ms = Date.now();
        const sensitiveData = {
            timestamp: Math.floor(ms / 1000),
            Email_paciente: "wmelot@gmail.com",
            IdFisio: "wmelot@gmail.com",
            LocalPedido: "AXION",
            Nome_Paciente: "TEST " + label,
            ...payloadMod
        };

        const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() }
        });
        const base64Payload = forge.util.encode64(encrypted);

        const info = {
            Cobertura: "EVAazul",
            Numeracao: 37,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: 150,
            Produto: "Slim",
            dataStamp: ms,
            LocalPedido: "Propulsão",
            ...infoMod
        };

        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": AXION_TOKEN },
            body: JSON.stringify({ payload: base64Payload, info: info })
        });

        const resText = await response.text();
        console.log(`[${label}] Status: ${response.status} | Res: ${resText.substring(0, 50)}`);
        return response.status === 200;
    } catch (e) {
        console.log(`[${label}] Erro: ${e.message}`);
        return false;
    }
}

async function runBruteForce() {
    console.log("🚀 Iniciando Teste de 10 Variações de Pedido...\n");

    const tests = [
        { label: "1_STRING_ID", payload: { IdFisio: "wmelot@gmail.com" }, info: {} },
        { label: "2_ARRAY_ID", payload: { IdFisio: ["wmelot@gmail.com"] }, info: {} },
        { label: "3_LOCAL_PROPULSAO", payload: { LocalPedido: "Propulsão" }, info: { LocalPedido: "Propulsão" } },
        { label: "4_LOCAL_AXION", payload: { LocalPedido: "AXION" }, info: { LocalPedido: "AXION" } },
        { label: "5_TIMESTAMP_STR", payload: { timestamp: String(Math.floor(Date.now() / 1000)) }, info: {} },
        { label: "6_NUM_STR", payload: {}, info: { Numeracao: "37", PrecoPedido: "150" } },
        { label: "7_DATASTAMP_STR", payload: {}, info: { dataStamp: String(Date.now()) } },
        { label: "8_NO_INFO_LOCAL", payload: {}, info: { LocalPedido: undefined } },
        { label: "9_FITSOLE_LOCAL", payload: { LocalPedido: "Fitsole Frontend" }, info: { LocalPedido: "Fitsole Frontend" } },
        { label: "10_MINIMAL", payload: { Email_paciente: "wmelot@gmail.com" }, info: { Cobertura: "EVAazul", Numeracao: 37, ladoPedido: "DireitoEsquerdo" } }
    ];

    for (const t of tests) {
        await sendVariation(t.label, t.payload, t.info);
        await new Promise(r => setTimeout(r, 1000));
    }
}

runBruteForce();

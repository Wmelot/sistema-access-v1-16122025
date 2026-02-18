
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

async function test() {
    try {
        const sensitiveData = {
            timestamp: Math.floor(Date.now() / 1000),
            Email_paciente: "test@example.com",
            IdFisio: "wmelot@gmail.com", // String
            LocalPedido: "AXIOM",
            Nome_Paciente: "TESTE FINAL"
        };

        const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY_PEM);
        const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');

        const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });

        const base64Payload = forge.util.encode64(encrypted);

        const info = {
            Cobertura: "EVA AZUL",
            Numeracao: 40,
            ladoPedido: "DireitoEsquerdo",
            PrecoPedido: 190.00,
            Produto: "Palmilha 3D",
            observacoesCompra: "Teste Final",
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
        };

        console.log(JSON.stringify({ payload: base64Payload, info: info }));
    } catch (err) {
        console.error(err);
    }
}

test();

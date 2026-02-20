require('dotenv').config({ path: '.env.local' });
const forge = require('node-forge');

async function run() {
    const rawKey = process.env.PROPULSAO_PUBLIC_KEY || "";

    // Testar com a chave usando .replace(/\\n/g, '\n') apenas, sem forçar 64 caracteres
    const publicKeyPem = rawKey.replace(/\\n/g, '\n').replace(/"/g, '');

    const sensitiveData = {
        timestamp: Math.floor(Date.now() / 1000),
        Email_paciente: "email@exemplo.com",
        IdFisio: "wmelot@gmail.com",
        LocalPedido: "AXIOM",
        Nome_Paciente: "Tete User"
    };

    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const buffer = forge.util.createBuffer(JSON.stringify(sensitiveData), 'utf8');
    const encrypted = publicKey.encrypt(buffer.getBytes(), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
    });
    const base64Payload = forge.util.encode64(encrypted);

    const info = {
        Cobertura: "EVA AZUL",
        Numeracao: 40,
        ladoPedido: "DireitoEsquerdo",
        PrecoPedido: 150.00,
        Produto: "Palmilha 3D",
        observacoesCompra: "Obs...",
        PontosGerados: 0,
        Nome_indicacao: "Diego Fisioterapeuta",
        Contato_indicacao: "Endereço completo...",
        Absorcao_dir: "0", Absorcao_esq: "0",
        Antepe_Dir: "0", Antepe_Esq: "0",
        Retrope_Dir: "0", Retrope_Esq: "0",
        Barra_Dir: "0", Barra_Esq: "0",
        Elevacao_Dir: "0", Elevacao_Esq: "0",
        Arco_Dir: "Baixo", Arco_Esq: "Baixo",
        SuporteArco_dir: "Flexivel", SuporteArco_esq: "Flexivel",
        fileE: "UExhY2Vob2xkZXI=", fileD: "UExhY2Vob2xkZXI="
    };

    const body = { payload: base64Payload, info: info };

    console.log("-> Testando: pedidos_axion (com chave bruta formatada direto)");
    const responseAxion = await fetch("https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-axion-token": process.env.AXION_TOKEN },
        body: JSON.stringify(body)
    });
    console.log("Status Axion:", responseAxion.status);
    console.log("Res:", await responseAxion.text());
}
run();

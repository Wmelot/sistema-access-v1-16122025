
const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_axion";
const TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";

async function testHeader(label, headers) {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ payload: "any", info: {} })
        });
        const resText = await response.text();
        console.log(`[${label}] Status: ${response.status} | Res: ${resText.substring(0, 50)}`);
    } catch (e) {
        console.log(`Erro: ${e.message}`);
    }
}

async function run() {
    console.log("Brute Force Headers for 'pedidos_axion'...\n");
    await testHeader("X-AXION-TOKEN", { "x-axion-token": TOKEN });
    await testHeader("AXION-TOKEN", { "axion-token": TOKEN });
    await testHeader("AUTHORIZATION-BEARER", { "Authorization": `Bearer ${TOKEN}` });
    await testHeader("TOKEN", { "token": TOKEN });
}

run();

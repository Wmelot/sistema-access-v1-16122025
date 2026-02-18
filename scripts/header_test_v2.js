
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
    console.log("Brute Force Headers V2 para 'pedidos_axion'...\n");
    await testHeader("AUTH_KEY", { "Authorization": `key=${TOKEN}` });
    await testHeader("X_API_KEY", { "x-api-key": TOKEN });
    await testHeader("API_KEY", { "api-key": TOKEN });
}

run();

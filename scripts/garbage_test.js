
const AXION_TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";
const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";

async function testGarbage() {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-axion-token": AXION_TOKEN },
            body: JSON.stringify({ payload: "bm90X2V2ZW5fY3J5cHRv", info: {} })
        });
        const resText = await response.text();
        console.log(`[GARBAGE TEST] Status: ${response.status} | Res: ${resText}`);
    } catch (e) {
        console.log(`Erro: ${e.message}`);
    }
}

testGarbage();

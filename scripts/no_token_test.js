
const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";

async function testNoToken() {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: "any", info: {} })
        });
        const resText = await response.text();
        console.log(`[NO TOKEN TEST] Status: ${response.status} | Res: ${resText}`);
    } catch (e) {
        console.log(`Erro: ${e.message}`);
    }
}

testNoToken();

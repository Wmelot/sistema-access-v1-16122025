
const URL = "https://us-central1-dev-propulsao.cloudfunctions.net/pedidos_externos";
const TOKEN = "e1d0d69d999ec9faa20574d5fe1c8a3dfb8bc4585fc02fda414884bdb8c04f97";

async function testReferrer(label, referrer) {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-axion-token": TOKEN,
                "Referer": referrer,
                "Origin": referrer
            },
            body: JSON.stringify({ payload: "any", info: {} })
        });
        const resText = await response.text();
        console.log(`[${label}] Status: ${response.status} | Res: ${resText}`);
    } catch (e) {
        console.log(`Erro: ${e.message}`);
    }
}

async function run() {
    console.log("Brute Force Referrers para 'pedidos_externos'...\n");
    await testReferrer("FITSOLE", "https://fitsole.com.br/");
    await testReferrer("AXIOM", "https://axiom.com.br/");
    await testReferrer("PORTAL", "https://portal.propulsao3d.com.br/");
}

run();

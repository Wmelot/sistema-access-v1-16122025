
async function trigger() {
    console.log("Triggering Campaign Processing Cron...")
    try {
        const res = await fetch('http://localhost:3000/api/cron/process-campaigns', {
            method: 'GET'
        })
        const data = await res.json()
        console.log("Result:", data)
    } catch (e) {
        console.error("Error triggering cron:", e)
    }
}

trigger()

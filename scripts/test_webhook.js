const fetch = require('node-fetch'); // Needs node-fetch or native fetch (Node 18+)

// Helper for Node < 18 if needed, but modern Node has fetch global.
// If your environment is old, this might fail, but let's assume Node 18+.

async function run() {
    const url = 'http://localhost:3000/api/webhook-whatsapp';

    const payload = {
        phone: '5531991856084', // Sandbox Number
        isGroup: false,
        message: {
            text: '1' // Simulating "Sim"
        }
    };

    console.log(`Sending POST to ${url}...`);
    console.log('Payload:', payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

run();

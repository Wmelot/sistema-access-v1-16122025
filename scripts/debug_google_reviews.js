
const fs = require('fs');
const path = require('path');

// Manually load .env.local to avoid dotenv config issues if not standard
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error(".env.local not found at", envPath);
            return;
        }
        const initialContent = fs.readFileSync(envPath, 'utf8');
        const lines = initialContent.split('\n');
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            // Split by first equals
            const idx = trimmed.indexOf('=');
            if (idx === -1) return;
            const key = trimmed.substring(0, idx);
            let val = trimmed.substring(idx + 1);
            // Remove quotes if present
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            process.env[key] = val;
        });
    } catch (e) {
        console.error("Error loading env:", e);
    }
}

async function debugGoogleReviews() {
    loadEnv();

    const API_KEY = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
    const PLACE_ID = (process.env.GOOGLE_PLACE_ID || '').trim();

    console.log("--- Google Reviews Debug ---");
    console.log("API_KEY present:", !!API_KEY);
    console.log("PLACE_ID present:", !!PLACE_ID);

    if (PLACE_ID) console.log("PLACE_ID:", PLACE_ID);

    if (!API_KEY || !PLACE_ID) {
        console.error("Missing credentials.");
        return;
    }

    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=pt-BR`;
    console.log("Fetching URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'reviews,rating,userRatingCount,googleMapsUri'
            }
        });

        console.log("Response Status:", res.status, res.statusText);

        const text = await res.text();
        console.log("Response Body:", text.substring(0, 500)); // Log first 500 chars

        if (!res.ok) {
            console.error("Request failed!");
        } else {
            console.log("Request successful!");
            try {
                const json = JSON.parse(text);
                console.log("Review Count:", json.reviews?.length || 0);
            } catch (e) { console.error("JSON parse error", e); }
        }

    } catch (error) {
        console.error("Fetch exception:", error);
    }
}

debugGoogleReviews();

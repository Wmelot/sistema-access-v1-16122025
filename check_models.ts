import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API key found.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Fetching models...");
        // Hack: The SDK might not have listModels exposed directly if it's an old version, or we can just fetch via REST to be sure.
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        console.log(data.models.map((m: any) => m.name).join("\n"));
    } catch (e) {
        console.error("Failed:", e);
    }
}
run();

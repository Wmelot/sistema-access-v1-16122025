const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels in the SDK for genAI directly easily, 
        // but we can try to hit the endpoint or just test a few variants.
        console.log("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("gemini-1.5-flash OK");
    } catch (e) {
        console.error("gemini-1.5-flash FAILED:", e.message);
    }

    try {
        console.log("Testing gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("gemini-pro OK");
    } catch (e) {
        console.error("gemini-pro FAILED:", e.message);
    }
}

listModels();

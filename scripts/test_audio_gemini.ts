import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
if (!process.env.GEMINI_API_KEY) {
  dotenv.config({ path: '.env' });
}

async function testarAudio() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ERRO: GEMINI_API_KEY não encontrada.");
    return;
  }

  console.log("🤖 Conectando ao Gemini...");
  const genAI = new GoogleGenerativeAI(apiKey);

  // 👇 MUDANÇA AQUI: Usando o alias estável que apareceu na sua lista
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const path = "teste.m4a";

  if (!fs.existsSync(path)) {
    console.error(`❌ ERRO: Arquivo '${path}' não encontrado na raiz.`);
    return;
  }

  try {
    console.log(`📂 Lendo '${path}'...`);
    const audioData = fs.readFileSync(path);
    const audioBase64 = audioData.toString("base64");

    console.log("🚀 Enviando áudio para o Gemini (Flash Latest)...");
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "audio/m4a",
          data: audioBase64
        }
      },
      { text: "Transcreva este áudio exatamente como falado." },
    ]);

    console.log("\n--- 📝 TRANSCRIÇÃO ---");
    console.log(result.response.text());
    console.log("----------------------\n");
    console.log("✅ AGORA VAI! Áudio processado.");

  } catch (error) {
    console.error("❌ Erro no processamento:", error);
  }
}

testarAudio();
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from 'pdf-parse';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
        }

        let combinedText = "";

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (file.name.toLowerCase().endsWith(".pdf")) {
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                await parser.destroy();
                combinedText += `\n--- Arquivo: ${file.name} ---\n${result.text}\n`;
            } else {
                combinedText += `\n--- Arquivo: ${file.name} ---\n${buffer.toString("utf-8")}\n`;
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
ATUE COMO UM ASSISTENTE DE DESIGN INSTRUACIONAL E GESTOR ACADÊMICO.
Você receberá o conteúdo extraído de arquivos (Plano de Ensino, Calendário Acadêmico, etc.).
O objetivo é extrair um objeto JSON estruturado contendo a disciplina, a bibliografia e os tópicos para um sistema moderno de cronograma universitário.
Caso haja calendários informando datas de início e término, extraia-os. Se houver mais de um semestre listado (ex: Veterano x Calouro), escolha a primeira que encontrar ou defina as prováveis datas do semestre em curso.

Extraia também referências bibliográficas (Básicas e Complementares) separando por título e autor.
E extraia o plano de unidades/tópicos sequenciais, estimando o número de aulas (classesNeeded) para cobrir a carga horária e relacionando referências.

FORMATO ESTRITO DE RESPOSTA (RETORNE APENAS JSON VÁLIDO):
{
  "courseName": "Nome da Disciplina Encontrado",
  "startDate": "YYYY-MM-DD" (se encontrado no calendário, senão null),
  "endDate": "YYYY-MM-DD" (se encontrado, senão null),
  "books": [
     { "id": "b1", "title": "Bases da Fisiologia", "author": "Guyton", "type": "Básico" },
     { "id": "b2", "title": "Artigo Complementar XYZ", "author": "Vários", "type": "Complementar" }
  ],
  "topics": [
     {
        "id": "t1",
        "title": "1.1. Introdução à Fisiologia...",
        "classesNeeded": 2, // calcule/estime dividindo a carga horária
        "bibliographyIds": ["b1"], // IDs dos livros correspondentes
        "isPractical": false,
        "resources": ["Projetor"], // "Macas", "Modelos 3D", etc.
        "methodology": "Aula Dialogada" // ou "PBL", "Estudo de Caso", "Prática Clínica"
     }
  ]
}

Se os tópicos não tiverem aulas definidas, estime de modo que a soma totalize em torno de 40 a 80 aulas depedendo do curso. Resuma a ementa de forma detalhada, e associe aleatoriamente uma bibliografia.

TEXTO EXTRAÍDO DOS ARQUIVOS:
${combinedText.substring(0, 80000)}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        // Extrai o JSON da resposta markdown usando regex
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No JSON returned from AI", text);
            return NextResponse.json({ error: "Nenhum formato estruturado foi gerado." }, { status: 500 });
        }

        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Error analyzing syllabus:", e);
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
    }
}

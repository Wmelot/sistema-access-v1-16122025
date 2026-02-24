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

        const locationStr = formData.get("location") as string || "Localidade Desconhecida";

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
O objetivo é extrair um objeto JSON estruturado contendo a disciplina, bibliografia, tópicos e AVALIAÇÕES para um sistema moderno de cronograma universitário.

INSTRUÇÕES DE EXTRAÇÃO:
1. NOME DA DISCIPLINA: Identifique o nome completo da disciplina/curso no cabeçalho ou título do Plano de Ensino.
2. DATAS: Identifique as datas de início e término das aulas. Procure por "Calendário Acadêmico" ou seções de "Cronograma". Se houver múltiplos semestres ou categorias (Veterano/Calouro), use a que parecer mais atual ou relevante para o contexto.
3. AVALIAÇÕES: Extraia todas as atividades avaliativas (provas, trabalhos, seminários). Identifique o NOME da atividade, a PONTUAÇÃO (valor) e o TIPO (Teórica, Prática, Individual, etc.). A soma total das pontuações deve idealmente fechar em 100 pontos se possível, baseando-se no que for encontrado.
4. BIBLIOGRAFIA: Separe referências Básicas e Complementares.
5. TÓPICOS: Extraia o plano de unidades sequenciais, estimando o número de aulas (classesNeeded) para cobrir a carga horária e relacionando referências.

FORMATO ESTRITO DE RESPOSTA (RETORNE APENAS JSON VÁLIDO):
{
  "courseName": "Nome da Disciplina Encontrado (EXATO COMO NO DOCUMENTO)",
  "startDate": "YYYY-MM-DD" (se encontrado no calendário, senão null),
  "endDate": "YYYY-MM-DD" (se encontrado, senão null),
  "unclearDates": boolean (true se houver dúvida ou múltiplos calendários conflitantes),
  "holidays": [
      { "date": "YYYY-MM-DD", "desc": "Carnaval" }
  ],
  "books": [
     { "id": "b1", "title": "Bases da Fisiologia", "author": "Guyton", "type": "Básico" }
  ],
  "assessments": [
     { "id": "a1", "name": "Prova Bimestral I", "points": 30, "type": "Teórica", "classesNeeded": 2, "content": "Descrição dos tópicos cobrados" }
  ],
  "topics": [
     {
        "id": "t1",
        "title": "1.1. Introdução à Fisiologia...",
        "classesNeeded": 2,
        "bibliographyIds": ["b1"],
        "isPractical": false,
        "resources": ["Projetor"],
        "methodology": "Aula Dialogada"
     }
  ]
}

Se os tópicos não tiverem aulas definidas, estime de modo que a soma totalize em torno de 40 a 80 aulas dependendo do curso. Resuma a ementa de forma detalhada.
Para as avaliações, caso o PDF mencione apenas "Avaliação 1 - 30 pontos", preencha o máximo de detalhes possível.

ATENÇÃO: Extraia todos os Feriados presentes. Caso as datas explícitas de feriados não estejam no PDF, deduza-os baseando-se no calendário nacional e feriados locais da região informada.
REGIONALIDADE/LOCALIDADE PARA FERIADOS: ${locationStr}

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

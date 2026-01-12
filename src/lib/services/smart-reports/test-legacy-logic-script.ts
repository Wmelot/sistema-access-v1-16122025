
import { reportGenerator } from './generator';

// Mock Data matching the test case
const mockInput = {
    patientId: "legacy_test_script",
    blueprintId: "REPORT_PALMILHA_V2",
    data: {
        patientProfile: { goals: ["Performance"], experience: "competitive", injuryStatus: "none" },
        painPoints: { achilles: { left: true } }, // Distal pain
        fpi: { right: [1, 1, 1, 1, 1, 1], left: [0, 0, 0, 0, 0, 0] }, // FPI Total = 6 (Neutral/Pronated border)
        eva: 2, // Pain score
        // Radar Data Mock
        efep: { items: [{ score: 8 }, { score: 9 }, { score: 10 }] }, // Avg 9 -> 90%
        singleLegSquat: { pelvicDrop: { left: 1, right: 1 }, dynamicValgus: { left: 2, right: 2 } },
        strength: { gluteMedRight: 4, gluteMedLeft: 4, gluteMaxRight: 5, gluteMaxLeft: 5 },
        anthropometry: { legLengthLeft: 90, legLengthRight: 90, navicularLeft: 40, navicularRight: 40 },
        flexibility: {
            mobilityRaysLeft: 0, mobilityRaysRight: 0,
            thomasLeft: 0, thomasRight: 0,
            hamstringLeft: 100, hamstringRight: 100,
            jackLeft: 0, jackRight: 0,
            lungeLeft: 35, lungeRight: 35
        },
        rotation: { left: 30, right: 30 }
    }
};

async function runTest() {
    console.log("--- Starting Legacy Logic Verification ---");
    try {
        const result = await reportGenerator.generate(mockInput as any, "REPORT_PALMILHA_V2");
        const section = result.sections.find(s => s.title === "Avaliação Biomecânica" || s.title === "Seção Principal"); // Title might vary depending on blueprint loaded

        console.log("Blueprint Used:", result.metadata.blueprintUsed);

        if (section) {
            const radar = section.content.find((w: any) => w.type === 'chart_radar');
            const shoe = section.content.find((w: any) => w.type === 'text_block' && w.title.includes('Recomendação'));

            console.log("\n[RADAR WIDGET]");
            if (radar && radar.data) {
                console.log("Data Length:", radar.data.length);
                console.log("Data Items:", JSON.stringify(radar.data, null, 2));
            } else {
                console.error("Radar Widget Not Found or Empty!");
            }

            console.log("\n[SHOE RECOMMENDATION WIDGET]");
            if (shoe && shoe.data) {
                console.log("Recommendation:", shoe.data);
            } else {
                console.error("Shoe Widget Not Found or Empty!");
            }

            const prescription = section.content.find((w: any) => w.type === 'prescription_block');
            console.log("\n[PRESCRIPTION WIDGET]");
            if (prescription && prescription.data) {
                console.log("Justificativa (Auto):", prescription.data.justificativa_auto);
            } else {
                console.error("Prescription Widget Not Found!");
            }
        } else {
            console.error("Main Section Not Found");
        }

    } catch (e) {
        console.error("Execution Error:", e);
    }
    console.log("--- End Verification ---");
}

runTest();

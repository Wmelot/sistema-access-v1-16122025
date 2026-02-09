const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

function loadSheet(file) {
    const wb = xlsx.readFile(path.join(base_path, file));
    return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

async function generateAttachmentReport() {
    console.log("Gerando relatório de anexos...");

    const ptsData = loadSheet("pacientes.xlsx");
    const filesData = loadSheet("arquivos.xlsx");

    const report = filesData.map(f => {
        const p = ptsData.find(pt => String(pt.id) === String(f.PacienteID));
        return {
            paciente: p ? p.nome_paciente : `ID Desconhecido (${f.PacienteID})`,
            arquivo: f.NomeArquivo,
            data: f.DataHora || f.DHUp,
            tipo: f.Tipo || f.TipoArquivoID
        };
    }).sort((a, b) => a.paciente.localeCompare(b.paciente));

    const csvContent = "Paciente,Arquivo,Data,Tipo\n" +
        report.map(r => `"${r.paciente}","${r.arquivo}","${r.data}","${r.tipo}"`).join("\n");

    fs.writeFileSync("/Users/wmelo/Axiom/pacientes_com_anexos_feegow.csv", csvContent);
    console.log(`Relatório gerado com ${report.length} anexos.`);
    console.log("Caminho: /Users/wmelo/Axiom/pacientes_com_anexos_feegow.csv");
}

generateAttachmentReport();

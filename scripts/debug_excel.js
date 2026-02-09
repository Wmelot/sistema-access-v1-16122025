const xlsx = require('xlsx');
const path = require('path');
const base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/";

const files = ["pacientes.xlsx", "agendamentos.xlsx", "_8.xlsx", "form_tabela_12.xlsx"];

files.forEach(f => {
    const wb = xlsx.readFile(path.join(base_path, f));
    console.log(`\nArquivo: ${f}`);
    console.log(`Planilhas: ${wb.SheetNames.join(', ')}`);
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { range: 0, raw: false });
    console.log(`Primeiras 2 linhas de ${f}:`);
    console.log(data.slice(0, 2));
});

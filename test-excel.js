const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filename = "consegue transformar essa imagem na tabela corres....xlsx";
const filePath = path.join(__dirname, filename);

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Sheet Name: ${sheetName}`);
    console.log(`Rows: ${jsonData.length}`);
    if (jsonData.length > 0) {
        console.log('Headers:', Object.keys(jsonData[0]));
        console.log('First Row:', jsonData[0]);
    } else {
        console.log('JSON Data is empty.');
    }
} catch (e) {
    console.error('Error reading file:', e);
}

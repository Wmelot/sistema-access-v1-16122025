// Script para verificar quantos protocolos existem no banco de dados
import { db } from './src/lib/db.js';

async function checkProtocols() {
    try {
        console.log('🔍 Verificando protocolos no banco de dados...\n');

        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_custom = false THEN 1 END) as system_protocols,
                COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_protocols
            FROM clinical_protocols
        `);

        console.log('📊 Resultados:');
        console.log(`   Total de protocolos: ${result.rows[0].total}`);
        console.log(`   Protocolos do sistema: ${result.rows[0].system_protocols}`);
        console.log(`   Protocolos personalizados: ${result.rows[0].custom_protocols}`);
        console.log('');

        // Listar todos os protocolos
        const list = await db.query(`
            SELECT id, title, region, is_custom
            FROM clinical_protocols
            ORDER BY region, title
        `);

        console.log('📋 Lista de protocolos no banco:\n');
        list.rows.forEach((row, index) => {
            const type = row.is_custom ? '[Custom]' : '[System]';
            console.log(`${index + 1}. ${type} ${row.title} (${row.region})`);
        });

    } catch (error) {
        console.error('❌ Erro ao verificar protocolos:', error.message);
    } finally {
        process.exit(0);
    }
}

checkProtocols();

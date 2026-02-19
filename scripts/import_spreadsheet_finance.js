const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://robptuukezhqvtasjyhz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORG_ID = "9571532e-fdf8-4aaa-b236-416fd6459566"; // Access Fisioterapia
const FABIO_ID = "64c95a02-04ce-4ace-b63f-b4210cf282a9";

const expenses = {
    "2025-12-05": [
        { desc: "Aluguel", amt: 4443.75, cat: "Aluguel" },
        { desc: "Sistema Feegow", amt: 350.58, cat: "Sistema" },
        { desc: "INSS - GPS", amt: 2763.90, cat: "Impostos" },
        { desc: "CEMIG", amt: 430.22, cat: "Utilidades" },
        { desc: "Contabilidade", amt: 245.00, cat: "Serviços" },
        { desc: "Maquininha", amt: 49.90, cat: "Taxas" },
        { desc: "Celular", amt: 39.90, cat: "Utilidades" },
        { desc: "Internet", amt: 150.54, cat: "Utilidades" },
        { desc: "Limpeza", amt: 400.00, cat: "Serviços" },
        { desc: "Gastos Material", amt: 174.73, cat: "Suprimentos" }
    ],
    "2026-01-05": [
        { desc: "Aluguel", amt: 4443.75, cat: "Aluguel" },
        { desc: "Sistema Feegow", amt: 768.58, cat: "Sistema" },
        { desc: "INSS - GPS", amt: 2763.90, cat: "Impostos" },
        { desc: "CEMIG", amt: 430.22, cat: "Utilidades" },
        { desc: "Contabilidade", amt: 260.00, cat: "Serviços" },
        { desc: "Maquininha", amt: 49.90, cat: "Taxas" },
        { desc: "Celular", amt: 39.90, cat: "Utilidades" },
        { desc: "Internet", amt: 150.54, cat: "Utilidades" },
        { desc: "Limpeza", amt: 400.00, cat: "Serviços" },
        { desc: "Gastos Material", amt: 174.73, cat: "Suprimentos" },
        { desc: "CREFITO", amt: 432.75, cat: "Taxas" },
        { desc: "Laser", amt: 4920.00, cat: "Equipamento" },
        { desc: "Filtro", amt: 130.00, cat: "Suprimentos" },
        { desc: "Repasse Rayane", amt: 360.00, cat: "Repasse", type: 'income' } // Fixed as income
    ]
};

const fabioStats = [
    { month: 12, year: 2025, total: 20800.00, rate: 9.49, tax: 1973.92, date: "2025-12-31" },
    { month: 1, year: 2026, total: 26060.00, rate: 9.37, tax: 2441.82, date: "2026-01-31" },
    { month: 2, year: 2026, total: 25555.00, rate: 9.49, tax: 2425.17, date: "2026-02-18" }
];

async function run() {
    console.log("🚀 Importando Dados Financeiros (V2 - Com Receitas)...");

    // 1. Insert Expenses & Incomes from Expenses sheet
    for (const [date, items] of Object.entries(expenses)) {
        for (const item of items) {
            const type = item.type || 'expense';
            const { error } = await supabase.from('transactions').insert({
                organization_id: ORG_ID,
                type: type,
                amount: Math.abs(item.amt),
                description: item.desc,
                category: item.cat,
                date: date,
                status: 'paid',
                paid_at: new Date(date).toISOString(),
                is_recurring: true // As requested
            });
            if (error) console.error(`Error inserting ${item.desc}:`, error);
        }
    }

    // 2. Insert Revenue & Taxes
    for (const s of fabioStats) {
        // Revenue (income)
        await supabase.from('transactions').insert({
            organization_id: ORG_ID,
            type: 'income',
            amount: s.total,
            description: `Faturamento Mensal Fabio - ${s.month}/${s.year}`,
            category: 'Serviço',
            date: s.date,
            status: 'paid',
            paid_at: new Date(s.date).toISOString()
        });

        // Tax (expense)
        await supabase.from('transactions').insert({
            organization_id: ORG_ID,
            professional_id: FABIO_ID,
            type: 'expense',
            amount: s.tax,
            description: `Imposto Mensal Clínica (Alíquota: ${s.rate}% sobre R$ ${s.total.toFixed(2)})`,
            category: 'Impostos',
            date: s.date,
            status: 'paid',
            paid_at: new Date(s.date).toISOString()
        });

        // 3. Save to Global Monthly Configs (Target for the UI field)
        await supabase.from('financial_monthly_configs').upsert({
            organization_id: ORG_ID,
            target_month: s.month,
            target_year: s.year,
            tax_rate: s.rate,
            other_deductions: 0,
            updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id, target_month, target_year' });
    }

    console.log("✅ Importação Financeira Concluída!");
}

run();

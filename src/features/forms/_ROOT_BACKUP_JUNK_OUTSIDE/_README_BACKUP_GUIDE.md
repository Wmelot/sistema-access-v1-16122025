# 🗂️ ROOT BACKUP — Guia de Limpeza

> **Não delete os arquivos originais abaixo até migrar o histórico de prontuários!**
> Os arquivos nas pastas `pbe/`, `womens-health/` e `smart-assessment/` ainda são
> referenciados para **leitura de registros históricos** no `RecordClient.tsx`.

---

## ✅ The Big Four (ATIVOS — Não Mexer)

| Formulário | Pasta | ID no Sistema |
|---|---|---|
| 🧠 PBE 5.0 | `pbe-5/` | `pbe-5` |
| 🦶 Palmilha 5.0 | `palmilha-5/` | `palmilha-5` |
| 📋 Evolução Clínica & IA | `clinical-evolution/` | `clinical_evolution_system` |
| 🦶 Pé Insensível | `insensitive-foot/` | `diabetic_foot_system` |

---

## 📦 Legados (Mantidos para Leitura de Histórico — NÃO aparecem no menu)

| Formulário | Pasta Original | ID |
|---|---|---|
| Saúde da Mulher | `womens-health/` | `womens_health_system` |
| Tree Wizard | `smart-assessment/` | `tree_wizard_system` |
| UltimatePBE | `pbe/components/UltimatePBEForm.tsx` | `ultimate_pbe_system` |
| PBE Concept | `pbe/components/ConceptPBEForm.tsx` | `pbe_concept_system` |
| Avaliação Física Avançada (v1) | `pbe/components/AdvancedPhysicalForm.tsx` | `system-physical-assessment` |
| Palmilha Biomecânica V3 | `_ROOT_BACKUP_JUNK_OUTSIDE/palmilha-biomecanica/` | `fde183ad-...` |

---

## 📜 Quando Pode Deletar?

Quando **todos os registros históricos** com esses template_ids forem:
1. Migrados para um novo formato, ou
2. Arquivados em modo somente-leitura sem necessidade de renderização do formulário.

Use o script SQL abaixo para verificar quantos registros ainda existem:

```sql
SELECT template_id, COUNT(*) as total
FROM patient_records
WHERE template_id IN (
    'womens_health_system',
    'tree_wizard_system',
    'ultimate_pbe_system',
    'pbe_concept_system',
    'system-physical-assessment',
    'fde183ad-1c20-4d6c-9efb-89d08f483cf2'
)
GROUP BY template_id
ORDER BY total DESC;
```

---

*Atualizado em: 28/02/2026 — Warley & Antigravity*

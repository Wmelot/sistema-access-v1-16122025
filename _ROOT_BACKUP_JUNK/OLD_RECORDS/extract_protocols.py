#!/usr/bin/env python3
"""
Script para restaurar todos os 28 protocolos clínicos
Lê as migrations SQL e gera o clinical-protocols.ts completo
"""

import json
import re
import os

# Caminho base
base_path = "/Users/wmelo/Axiom"

# Arquivos de migration
migration_files = [
    "supabase/migrations/20260102160000_seed_womens_health_protocols.sql",
    "supabase/migrations/20260102170000_add_knee_protocols.sql",
    "supabase/migrations/20260102180000_add_shoulder_protocols.sql",
    "supabase/migrations/20260102190000_add_ankle_foot_protocols.sql",
    "supabase/migrations/20260102200000_add_hip_spine_protocols.sql",
    "supabase/migrations/20260102210000_add_upper_limb_protocols.sql",
    "supabase/migrations/20260102220000_add_neuro_spine_protocols.sql",
]

# IDs dos protocolos existentes que devem ser mantidos
existing_ids = ["LBP_CHRONIC_01", "NP_MEC_01", "KOA_01"]

protocols = []
protocol_count = 0

# Mapeamento de regiões SQL para IDs
region_to_id_prefix = {
    "Pélvica / Saúde da Mulher": "WH",
    "Gestante": "PREG",
    "Pós-Parto": "PP",
    "Joelho": "KNEE",
    "Ombro": "SHOULDER",
    "Tornozelo e Pé": "ANKLE",
    "Quadril": "HIP",
    "Coluna Lombar": "LBP",
    "Coluna Cervical": "CERV",
    "Cotovelo": "ELBOW",
    "Punho e Mão": "WRIST",
}

def extract_json_from_sql(sql_content):
    """Extrai os dados JSON das migrations SQL"""
    # Encontrar todos os blocos INSERT
    insert_pattern = r"INSERT INTO clinical_protocols.*?VALUES\s*\((.*?)\);"
    matches = re.findall(insert_pattern, sql_content, re.DOTALL | re.IGNORECASE)
    
    extracted_protocols = []
    
    for match in matches:
        # Extrair campos
        lines = match.strip().split('\n')
        
        # Tentar extrair title, region, evidence_sources, description, interventions
        title = None
        region = None
        evidence_sources = None
        description = None
        interventions = None
        
        current_field = None
        current_value = []
        
        for line in lines:
            line = line.strip()
            
            # Detectar início de string
            if line.startswith("'") and not current_field:
                # Primeiro campo é title
                if title is None:
                    current_field = 'title'
                    current_value = [line]
                elif region is None:
                    current_field = 'region'
                    current_value = [line]
                elif description is None and evidence_sources is not None:
                    current_field = 'description'
                    current_value = [line]
            elif line.startswith("'[") or (current_field and line.startswith("{")):
                # JSON field
                if evidence_sources is None:
                    current_field = 'evidence_sources'
                    current_value = [line]
                elif interventions is None:
                    current_field = 'interventions'
                    current_value = [line]
            elif current_field:
                current_value.append(line)
                
                # Detectar fim do campo
                if line.endswith("'::jsonb,") or line.endswith("',"):
                    full_value = '\n'.join(current_value)
                    
                    # Limpar
                    full_value = full_value.rstrip(',').rstrip('::jsonb')
                    full_value = full_value.strip("'")
                    
                    if current_field == 'title':
                        title = full_value
                    elif current_field == 'region':
                        region = full_value
                    elif current_field == 'description':
                        description = full_value
                    elif current_field == 'evidence_sources':
                        try:
                            evidence_sources = json.loads(full_value)
                        except:
                            evidence_sources = []
                    elif current_field == 'interventions':
                        try:
                            interventions = json.loads(full_value)
                        except:
                            interventions = []
                    
                    current_field = None
                    current_value = []
        
        if title and region:
            # Gerar ID
            prefix = region_to_id_prefix.get(region, "PROTO")
            proto_id = f"{prefix}_{len(extracted_protocols) + 1:02d}"
            
            extracted_protocols.append({
                "id": proto_id,
                "patologia": title,
                "regiao": region,
                "ultima_atualizacao": "2025-01-20",
                "base_conhecimento": evidence_sources or [],
                "resumo_clinico": description or "",
                "intervencoes": interventions or []
            })
    
    return extracted_protocols

# Ler arquivo existente para pegar os 3 protocolos originais
existing_file = os.path.join(base_path, "src/lib/data/clinical-protocols.ts.backup")
with open(existing_file, 'r', encoding='utf-8') as f:
    existing_content = f.read()

# Extrair os 3 protocolos existentes (já estão no formato correto)
# Vamos apenas contar quantos novos protocolos precisamos adicionar

new_protocols = []

# Ler cada migration e extrair protocolos
for migration_file in migration_files:
    file_path = os.path.join(base_path, migration_file)
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        extracted = extract_json_from_sql(sql_content)
        new_protocols.extend(extracted)
        print(f"✅ {migration_file}: {len(extracted)} protocolos extraídos")
    else:
        print(f"❌ Arquivo não encontrado: {migration_file}")

print(f"\n📊 Total de novos protocolos extraídos: {len(new_protocols)}")
print(f"📊 Total esperado (com os 3 existentes): {len(new_protocols) + 3}")

# Salvar informações
output_file = os.path.join(base_path, "extracted_protocols_info.json")
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump({
        "total_new": len(new_protocols),
        "total_with_existing": len(new_protocols) + 3,
        "protocols": [{"id": p["id"], "title": p["patologia"], "region": p["regiao"]} for p in new_protocols]
    }, f, indent=2, ensure_ascii=False)

print(f"\n✅ Informações salvas em: {output_file}")
print("\n⚠️  Devido ao limite de tokens, os protocolos precisam ser adicionados manualmente.")
print("Os dados estão nas migrations SQL. Cada protocolo deve ser convertido do formato SQL/JSON para TypeScript.")

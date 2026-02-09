import pandas as pd

base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/"

# 1. Patient IDs
patients = pd.read_excel(base_path + "pacientes.xlsx")
target_names = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"]
p_subset = patients[patients['nome_paciente'].isin(target_names)][['id', 'nome_paciente']]
print("--- Detalhe Pacientes ---")
print(p_subset)

p_ids = p_subset['id'].tolist()

# 2. Check Forms (Assume column 'paciente_id' or similar exists)
# Let's check columns of form_tabela_12.xlsx first
try:
    f12 = pd.read_excel(base_path + "form_tabela_12.xlsx", nrows=1)
    print("\nColunas form_tabela_12:")
    print(f12.columns.tolist())
    
    # Actually most Feegow form tables use 'paciente_id'
    # Let's count records for our patients
    f12_all = pd.read_excel(base_path + "form_tabela_12.xlsx")
    if 'paciente_id' in f12_all.columns:
        print(f"\nRegistros form_tabela_12 para alvos: {f12_all[f12_all['paciente_id'].isin(p_ids)].shape[0]}")
except Exception as e:
    print(f"Erro ao ler form 12: {e}")

# 3. Check Appointments (Jan 19-23, 2026?) 
# User said "semana do dia 19 a 23 de janeiro". Current year is 2026.
# Let's check columns of agendamentos.xlsx
try:
    ag = pd.read_excel(base_path + "agendamentos.xlsx", nrows=1)
    print("\nColunas agendamentos:")
    print(ag.columns.tolist())
    
    ag_all = pd.read_excel(base_path + "agendamentos.xlsx")
    # Date column likely 'data' or 'dh_inicio'
    # Let's see formats
    print("\nExemplo de datas em agendamentos:")
    print(ag_all['data'].head()) if 'data' in ag_all.columns else None
except Exception as e:
    print(f"Erro ao ler agendamentos: {e}")

import pandas as pd

base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/"

files = ["formularios.xlsx", "pacientes.xlsx", "agendamento_status.xlsx"]

for f in files:
    try:
        df = pd.read_excel(base_path + f, nrows=1)
        print(f"\nColunas de {f}:")
        print(df.columns.tolist())
    except Exception as e:
        print(f"Erro ao ler {f}: {e}")

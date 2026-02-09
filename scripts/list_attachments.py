import pandas as pd

base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/"

try:
    # Read files
    files_df = pd.read_excel(base_path + "arquivos.xlsx")
    patients_df = pd.read_excel(base_path + "pacientes.xlsx")
    
    # Merge to get patient names
    # Need to check column names in arquivos.xlsx again
    # Colunas de arquivos.xlsx: ['id', 'paciente_id', 'nome', 'extensao', 'tamanho', 'dh_upload', ...]
    
    # Let's check columns first to be sure
    # print(files_df.columns.tolist())
    
    merged = pd.merge(files_df, patients_df[['id', 'nome_paciente']], left_on='paciente_id', right_on='id', suffixes=('', '_p'))
    
    # Group by patient to see who has most files
    report = merged.groupby('nome_paciente').agg({
        'nome': 'count',
        'id': lambda x: list(x) # List of file records if needed
    }).rename(columns={'nome': 'total_arquivos'}).sort_values('total_arquivos', ascending=False)
    
    print("--- PACIENTES COM MAIS ANEXOS NO FEGOW ---")
    print(report.head(50))
    
    # Save a full list to a text file for the user
    full_list = merged[['nome_paciente', 'nome', 'dh_upload']].sort_values('nome_paciente')
    full_list.to_csv("/Users/wmelo/Axiom/lista_anexos_feegow.csv", index=False)
    print("\nLista completa salva em: /Users/wmelo/Axiom/lista_anexos_feegow.csv")

except Exception as e:
    print(f"Erro ao gerar lista: {e}")

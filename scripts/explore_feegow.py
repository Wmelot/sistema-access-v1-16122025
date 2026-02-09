import pandas as pd

base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/"

# 1. Find Form ID for "Consulta Palmilha"
forms = pd.read_excel(base_path + "formularios.xlsx")
print("--- Formuários ---")
print(forms[forms['Nome'].str.contains("Palmilha", case=False, na=False)][['id', 'Nome']])

# 2. Find Patients
patients = pd.read_excel(base_path + "pacientes.xlsx")
target_patients = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"]
print("\n--- Pacientes ---")
print(patients[patients['nome_paciente'].isin(target_patients)][['id', 'nome_paciente', 'cpf', 'celular']])

# 3. Appointment Statuses
status = pd.read_excel(base_path + "agendamento_status.xlsx")
print("\n--- Status de Agendamento ---")
print(status[['id', 'nome_status']])

from supabase import create_client
import os

url = "https://robptuukezhqvtasjyhz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvYnB0dXVrZXpocXZ0YXNqeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4NjcwMCwiZXhwIjoyMDgzMDYyNzAwfQ.hufdKEjY0XFSIYvrv7FrNyb2aX49JORBulplO19d0u4"
supabase = create_client(url, key)

# Get Org
org = supabase.table('organizations').select('id, slug').eq('slug', 'access-fisioterapia').execute()
print("Org:", org.data)

if org.data:
    org_id = org.data[0]['id']
    
    # Check Professionals
    profs = supabase.table('profiles').select('id, full_name').eq('organization_id', org_id).execute()
    print("\nProfissionais:")
    for p in profs.data:
        print(f"{p['id']}: {p['full_name']}")

    # Check Patients
    target_patients = ["Adaliana Bastos dos Santos Rodrigues", "Adriana Paula da Cruz Barreto"]
    pts = supabase.table('patients').select('id, name').in_('name', target_patients).execute()
    print("\nPacientes encontrados no Axiom:")
    for p in pts.data:
        print(f"{p['id']}: {p['name']}")

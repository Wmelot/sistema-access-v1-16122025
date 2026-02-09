import pandas as pd
import os

base_path = "/Users/wmelo/Axiom/clinic30490_backup_excel/"
search_term = "Dor nos joelhos"

files = [f for f in os.listdir(base_path) if f.endswith(".xlsx")]

for f in files:
    try:
        # Avoid huge files if possible, but let's try
        df = pd.read_excel(os.path.join(base_path, f))
        # Convert all to string for searching
        found = False
        for col in df.columns:
            if df[col].astype(str).str.contains(search_term, case=False, na=False).any():
                found = True
                break
        
        if found:
            print(f"\n--- MATCH FOUND IN {f} ---")
            # Print the row(s) where it's found
            mask = df.apply(lambda row: row.astype(str).str.contains(search_term, case=False).any(), axis=1)
            print(df[mask])
    except Exception as e:
        # print(f"Error reading {f}: {e}")
        pass

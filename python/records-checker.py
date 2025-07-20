import pandas as pd
from collections import Counter

def check_duplicate_user_ids_within_files(file_list):
  for file in file_list:
    print(f"🔍 Checking file: {file}")  # 👈 debug print
    try:
      df = pd.read_csv(file, dtype=str)  # Preserve large IDs
      if 'User ID' not in df.columns:
        print(f"⚠️ Skipping {file} — 'User ID' column not found.")
        continue

      user_ids = df['User ID'].dropna().str.strip()
      counts = Counter(user_ids)
      duplicates = [uid for uid, count in counts.items() if count > 1]

      if duplicates:
        print(f"🚨 Duplicate User IDs found *within* {file}:")
        for dup in duplicates:
          print(f"  - {dup} (appears {counts[dup]} times)")
      else:
        print(f"✅ No duplicate User IDs within {file}.")

    except Exception as e:
      print(f"❌ Error reading {file}: {e}")

check_duplicate_user_ids_within_files(['../public/database/spl-cwc-records.csv', '../public/database/spl-euros-records.csv'])

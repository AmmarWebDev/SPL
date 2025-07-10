import sys
import io
import pandas as pd

# Ensure UTF-8 encoding for emoji output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Load CSV with User ID as string
df = pd.read_csv("../database/SPL Euros records.csv", dtype={'User ID': str})

# Build Identifier
def format_identifier(row):
  if pd.notna(row['User ID']) and row['User ID'].strip():
    return f"<@{row['User ID'].strip()}>"
  else:
    return f"@{row['Username']}"

df['Identifier'] = df.apply(format_identifier, axis=1)

# Group by Identifier and Emoji
grouped = df.groupby(['Identifier', 'Team Emoji'], as_index=False).agg({
  'Goals': 'sum',
  'Assists': 'sum'
})

# Top 10 scorers
top_scorers = grouped.sort_values(by='Goals', ascending=False).head(10)

# Top 10 assist providers
top_assists = grouped.sort_values(by='Assists', ascending=False).head(10)

# Output: Top Scorers
print("# SPL Euros Top 10 Scorers Till Now:")
for i, (_, row) in enumerate(top_scorers.iterrows(), start=1):
  if row['Goals'] > 0:
    goal_label = "goal" if row['Goals'] == 1 else "goals"
    print(f"### {i}. {row['Identifier']} {row['Team Emoji']}: {row['Goals']} {goal_label}")

# Output: Top Assists
print("\n# SPL Euros Top 10 Assistors Till Now:")
for i, (_, row) in enumerate(top_assists.iterrows(), start=1):
  if row['Assists'] > 0:
    assist_label = "assist" if row['Assists'] == 1 else "assists"
    print(f"### {i}. {row['Identifier']} {row['Team Emoji']}: {row['Assists']} {assist_label}")
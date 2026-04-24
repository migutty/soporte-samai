import pandas as pd
df = pd.read_excel("Directorio Teams Phone juzgados administrtaivos.xlsx")
print("COLUMNS:", list(df.columns))
print("ROWS:", len(df))
print("---")
print(df.to_string())

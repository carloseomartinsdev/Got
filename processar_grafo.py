import pandas as pd
import json

# Carrega datasets
df_chars = pd.read_csv('dataset_personagens.csv')
df_inter = pd.read_csv('dataset_interacoes.csv')

# Conta relações por personagem (excluindo marcadores)
exclude = ['CUT TO', 'INT', 'EXT', 'MAN', 'WOMAN', 'ALL', 'MEN', 'WOMEN', 'CROWD']
rel_count = {}
for _, row in df_inter.iterrows():
    p1, p2 = row['personagem_1'], row['personagem_2']
    if p1 not in exclude and p2 not in exclude:
        rel_count[p1] = rel_count.get(p1, 0) + 1
        rel_count[p2] = rel_count.get(p2, 0) + 1

# Merge com falas
chars_data = []
for char, rel in rel_count.items():
    falas_row = df_chars[df_chars['personagem'] == char]
    falas = int(falas_row['quantidade_falas'].values[0]) if len(falas_row) > 0 else 0
    chars_data.append({'name': char, 'relations': rel, 'falas': falas})

# Ordena por relações e filtra por falas > 10
chars_data.sort(key=lambda x: x['relations'], reverse=True)
top_chars = [c for c in chars_data if c['falas'] > 10]

# Salva JSON (apenas top edges)
top_edges = df_inter.nlargest(200, 'quantidade_interacoes')[['personagem_1', 'personagem_2', 'quantidade_interacoes']]
top_edges_list = [{'from': row['personagem_1'], 'to': row['personagem_2'], 'weight': int(row['quantidade_interacoes'])} 
                  for _, row in top_edges.iterrows()]

with open('got_data.json', 'w', encoding='utf-8') as f:
    json.dump({'characters': top_chars, 'edges': top_edges_list}, f, ensure_ascii=False, indent=2)

print(f"Total de personagens com mais de 10 falas: {len(top_chars)}")
print(f"\nTop 10 personagens por relações:")
for i, c in enumerate(top_chars[:10], 1):
    print(f"{i}. {c['name']}: {c['relations']} relações, {c['falas']} falas")

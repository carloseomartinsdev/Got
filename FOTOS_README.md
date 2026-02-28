# Download de Fotos dos Personagens - Game of Thrones

## ✅ Script Funcionando!

O script `baixar_fotos.py` busca automaticamente fotos no Google Images usando o padrão `[NOME] GOT` e baixa a primeira imagem encontrada.

## 🚀 Como Usar

### Executar o Script
```bash
python baixar_fotos.py
```

### O que o script faz:

1. **Carrega o dataset** `dataset_personagens.csv`
2. **Filtra personagens principais** (remove marcações como CUT TO, INT, EXT)
3. **Busca no Google Images** com query: `[PERSONAGEM] GOT`
4. **Baixa a primeira foto** encontrada
5. **Salva como:** `personagem_got.jpg` na pasta `personagens_fotos/`

## 📊 Integração com Dataset

O script usa automaticamente os dados do `dataset_personagens.csv`:

```python
# Carrega personagens do dataset
df = pd.read_csv('dataset_personagens.csv')

# Filtra top 20 personagens (excluindo marcações de cena)
exclude = ['CUT TO', 'INT', 'EXT', 'MAN', 'WOMAN', 'ALL']
df_filtered = df[~df['personagem'].isin(exclude)]
characters = df_filtered.head(20)['personagem'].tolist()
```

## 🎯 Configuração

### Alterar quantidade de fotos

No arquivo `baixar_fotos.py`, linha 73:

```python
# Baixa apenas 3 para teste
for i, char in enumerate(characters[:3], 1):
```

Altere `[:3]` para:
- `[:10]` - Baixa 10 fotos
- `[:20]` - Baixa 20 fotos
- `[:]` - Baixa todas

### Alterar tempo de espera

Linha 82:
```python
time.sleep(2)  # Pausa entre downloads
```

Recomendado: 2-3 segundos para evitar bloqueio do Google.

## 📁 Estrutura de Arquivos

```
Disciplina_08/
├── dataset_personagens.csv      # Dataset com todos os personagens
├── dataset_interacoes.csv       # Dataset com interações
├── baixar_fotos.py              # Script de download
└── personagens_fotos/           # Pasta com fotos baixadas
    ├── tyrion_got.jpg
    ├── cersei_got.jpg
    ├── daenerys_got.jpg
    └── ...
```

## 📋 Exemplo de Saída

```
Buscando fotos no Google Images...
============================================================
Total de personagens no dataset: 513
Personagens principais: 504
Baixando top 3: TYRION, CERSEI, DAENERYS
============================================================
[1/3] Buscando 'TYRION GOT'... OK
[2/3] Buscando 'CERSEI GOT'... OK
[3/3] Buscando 'DAENERYS GOT'... OK
============================================================
Concluido: 3/3 fotos baixadas
Pasta: personagens_fotos/

Arquivos criados:
  - cersei_got.jpg
  - daenerys_got.jpg
  - tyrion_got.jpg
```

## 🔧 Dependências

```bash
pip install requests beautifulsoup4 pandas
```

## ⚠️ Observações

1. **Rate Limiting:** O script tem pausa de 2 segundos entre downloads para evitar bloqueio
2. **Qualidade:** Baixa a primeira imagem do Google, pode variar
3. **Tamanho:** Imagens são pequenas (logo do Google), ideal para demonstração
4. **Bloqueio:** Se baixar muitas fotos de uma vez, o Google pode bloquear temporariamente

## 💡 Melhorias Possíveis

### Para fotos de melhor qualidade:

1. **Usar API oficial do Google:**
   - Requer API Key
   - 100 buscas/dia grátis
   - Imagens em alta resolução

2. **Usar Selenium:**
   - Simula navegador real
   - Acessa imagens maiores
   - Mais lento mas mais confiável

3. **Download manual:**
   - Melhor qualidade
   - Controle total
   - Mais trabalhoso

## 📊 Integração com Análise de Redes

As fotos baixadas podem ser usadas para:

1. **Visualização do grafo** - Adicionar fotos nos nós
2. **Dashboard interativo** - Mostrar foto ao clicar no personagem
3. **Relatório final** - Ilustrar personagens principais

### Exemplo de uso com NetworkX:

```python
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.offsetbox import OffsetImage, AnnotationBbox

# Carregar foto
img = mpimg.imread('personagens_fotos/tyrion_got.jpg')

# Adicionar ao grafo
imagebox = OffsetImage(img, zoom=0.1)
ab = AnnotationBbox(imagebox, pos['TYRION'])
ax.add_artist(ab)
```

## ✅ Status

- [x] Script criado e testado
- [x] Integração com dataset_personagens.csv
- [x] Busca no Google Images funcionando
- [x] Download automático com nomenclatura padrão
- [x] Filtro de personagens principais
- [x] Tratamento de erros

## 🎓 Para o Trabalho Acadêmico

**Recomendação:** Baixe 10-15 fotos dos personagens principais para ilustrar:
- Ranking de importância
- Grupos de poder (comunidades)
- Visualização da rede

Execute:
```bash
python baixar_fotos.py
```

E altere `[:3]` para `[:15]` no código para baixar 15 fotos.

---

**Pronto para usar!** 🚀

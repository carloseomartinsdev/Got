import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
from collections import Counter
import community.community_louvain as community_louvain

def load_data():
    """Carrega os datasets"""
    df_chars = pd.read_csv('dataset_personagens.csv')
    df_inter = pd.read_csv('dataset_interacoes.csv')
    return df_chars, df_inter

def build_graph(df_interactions):
    """Constrói grafo a partir das interações"""
    G = nx.Graph()
    
    for _, row in df_interactions.iterrows():
        char1 = row['personagem_1']
        char2 = row['personagem_2']
        
        if G.has_edge(char1, char2):
            G[char1][char2]['weight'] += 1
        else:
            G.add_edge(char1, char2, weight=1)
    
    return G

def calculate_centralities(G):
    """Calcula todas as métricas de centralidade"""
    print("\nCalculando metricas de centralidade...")
    
    # Degree Centrality
    degree = nx.degree_centrality(G)
    
    # Betweenness Centrality
    betweenness = nx.betweenness_centrality(G, weight='weight')
    
    # Closeness Centrality
    closeness = nx.closeness_centrality(G, distance='weight')
    
    # PageRank
    pagerank = nx.pagerank(G, weight='weight')
    
    # Eigenvector Centrality
    try:
        eigenvector = nx.eigenvector_centrality(G, weight='weight', max_iter=1000)
    except:
        eigenvector = {}
    
    return {
        'degree': degree,
        'betweenness': betweenness,
        'closeness': closeness,
        'pagerank': pagerank,
        'eigenvector': eigenvector
    }

def create_ranking(centralities):
    """Cria ranking consolidado"""
    all_chars = set()
    for metric in centralities.values():
        all_chars.update(metric.keys())
    
    scores = {}
    for char in all_chars:
        char_scores = []
        for metric_name, metric_values in centralities.items():
            if metric_name != 'eigenvector' and char in metric_values:
                char_scores.append(metric_values[char])
        
        if char_scores:
            scores[char] = sum(char_scores) / len(char_scores)
    
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)

def detect_communities(G):
    """Detecta comunidades usando Louvain"""
    partition = community_louvain.best_partition(G, weight='weight')
    
    communities = {}
    for node, comm_id in partition.items():
        if comm_id not in communities:
            communities[comm_id] = []
        communities[comm_id].append(node)
    
    return communities

def visualize_network(G, output='got_network.png'):
    """Visualiza a rede"""
    print(f"\nGerando visualizacao...")
    
    # Remove nós com baixo grau para melhor visualização
    G_filtered = G.copy()
    low_degree = [node for node, degree in dict(G.degree()).items() if degree < 5]
    G_filtered.remove_nodes_from(low_degree)
    
    plt.figure(figsize=(20, 16))
    
    # Layout
    pos = nx.spring_layout(G_filtered, k=3, iterations=50, weight='weight')
    
    # Cores por comunidade
    partition = community_louvain.best_partition(G_filtered, weight='weight')
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
    node_colors = [colors[partition[node] % len(colors)] for node in G_filtered.nodes()]
    
    # Tamanho baseado em degree
    node_sizes = [G_filtered.degree(node, weight='weight') * 30 for node in G_filtered.nodes()]
    
    # Desenha
    nx.draw_networkx_nodes(G_filtered, pos, node_color=node_colors, node_size=node_sizes, alpha=0.8)
    nx.draw_networkx_labels(G_filtered, pos, font_size=8, font_weight='bold')
    
    edges = G_filtered.edges()
    weights = [G_filtered[u][v]['weight'] for u, v in edges]
    max_weight = max(weights) if weights else 1
    edge_widths = [w/max_weight * 5 for w in weights]
    
    nx.draw_networkx_edges(G_filtered, pos, width=edge_widths, alpha=0.2)
    
    plt.title('Rede de Personagens - Game of Thrones', fontsize=20, fontweight='bold')
    plt.axis('off')
    plt.tight_layout()
    plt.savefig(output, dpi=300, bbox_inches='tight')
    print(f"Grafo salvo em: {output}")

def main():
    print("=" * 80)
    print("ANALISE DE REDES - GAME OF THRONES")
    print("=" * 80)
    
    # Carrega dados
    print("\n[1] Carregando datasets...")
    df_chars, df_inter = load_data()
    print(f"   - Personagens: {len(df_chars)}")
    print(f"   - Interacoes: {len(df_inter)}")
    
    # Constrói grafo
    print("\n[2] Construindo grafo...")
    G = build_graph(df_inter)
    print(f"   - Nos (personagens): {G.number_of_nodes()}")
    print(f"   - Arestas (conexoes): {G.number_of_edges()}")
    
    # Calcula centralidades
    print("\n[3] Calculando centralidades...")
    centralities = calculate_centralities(G)
    
    # Mostra resultados
    print("\n" + "=" * 80)
    print("METRICAS DE CENTRALIDADE - TOP 10")
    print("=" * 80)
    
    print("\n[DEGREE CENTRALITY] - Numero de conexoes diretas")
    for i, (char, score) in enumerate(sorted(centralities['degree'].items(), key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"   {i:2}. {char:30} {score:.4f}")
    
    print("\n[BETWEENNESS CENTRALITY] - Ponte entre grupos")
    for i, (char, score) in enumerate(sorted(centralities['betweenness'].items(), key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"   {i:2}. {char:30} {score:.4f}")
    
    print("\n[CLOSENESS CENTRALITY] - Proximidade geral")
    for i, (char, score) in enumerate(sorted(centralities['closeness'].items(), key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"   {i:2}. {char:30} {score:.4f}")
    
    print("\n[PAGERANK] - Importancia ponderada")
    for i, (char, score) in enumerate(sorted(centralities['pagerank'].items(), key=lambda x: x[1], reverse=True)[:10], 1):
        print(f"   {i:2}. {char:30} {score:.4f}")
    
    # Ranking consolidado
    print("\n" + "=" * 80)
    print("RANKING CONSOLIDADO - PERSONAGEM MAIS IMPORTANTE")
    print("=" * 80)
    
    ranking = create_ranking(centralities)
    
    for i, (char, score) in enumerate(ranking[:15], 1):
        print(f"   {i:2}. {char:30} {score:.4f}")
    
    # Detecta comunidades
    print("\n[4] Detectando comunidades (grupos de poder)...")
    communities = detect_communities(G)
    
    print("\n" + "=" * 80)
    print("GRUPOS DE PODER (Comunidades)")
    print("=" * 80)
    
    # Ordena comunidades por tamanho
    sorted_communities = sorted(communities.items(), key=lambda x: len(x[1]), reverse=True)
    
    for i, (comm_id, members) in enumerate(sorted_communities[:10], 1):
        print(f"\nGRUPO {i} ({len(members)} membros):")
        # Mostra apenas os 10 principais membros
        main_members = sorted(members, key=lambda x: G.degree(x, weight='weight'), reverse=True)[:10]
        print(f"   {', '.join(main_members)}")
    
    # Visualização
    print("\n[5] Gerando visualizacao...")
    visualize_network(G)
    
    # Salva ranking
    df_ranking = pd.DataFrame(ranking, columns=['Personagem', 'Score'])
    df_ranking.to_csv('got_ranking.csv', index=False)
    print("   - Ranking salvo em: got_ranking.csv")
    
    # Estatísticas do grafo
    print("\n" + "=" * 80)
    print("ESTATISTICAS DO GRAFO")
    print("=" * 80)
    print(f"   - Densidade: {nx.density(G):.4f}")
    print(f"   - Componentes conectados: {nx.number_connected_components(G)}")
    if nx.is_connected(G):
        print(f"   - Diametro: {nx.diameter(G)}")
        print(f"   - Caminho medio: {nx.average_shortest_path_length(G):.2f}")
    
    print("\n" + "=" * 80)
    print("ANALISE CONCLUIDA!")
    print("=" * 80)
    print("\nRESPOSTA A PERGUNTA DE NEGOCIO:")
    print(f"\nO personagem mais importante matematicamente e: {ranking[0][0]}")
    print(f"Score consolidado: {ranking[0][1]:.4f}")
    print(f"\nTop 3 personagens:")
    for i, (char, score) in enumerate(ranking[:3], 1):
        print(f"   {i}. {char} (score: {score:.4f})")
    print(f"\nForam identificados {len(communities)} grupos de poder na saga.")

if __name__ == '__main__':
    main()

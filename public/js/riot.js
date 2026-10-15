
 // Tela de estatísticas do VALORANT
telas.riot = async () => {
    // Mostra uma mensagem enquanto carrega
    v.innerHTML = `
        <h2>Estatísticas do VALORANT</h2>
        <p>Carregando estatísticas...</p>
    `;

    try {
        // Consulta a API do GameMetrics
        const resposta = await f('/api/riot/estatisticas');

        if (!resposta.sucesso) {
            throw new Error('Falha ao carregar estatísticas.');
        }

        const stats = resposta.estatisticas;

        if (stats.totalPartidas === 0) {
            v.innerHTML = `
                <h2>Estatísticas do VALORANT</h2>
                <p>Nenhuma partida importada ainda.</p>
                <p>Importe suas partidas para visualizar as estatísticas.</p>
            `;
            return;
        }

        // Organiza os dados que aparecerão na tela
        const itens = [
            ['Partidas', stats.totalPartidas],
            ['Vitórias', stats.vitorias],
            ['Derrotas', stats.derrotas],
            ['Kills', stats.kills],
            ['Mortes', stats.deaths],
            ['Assistências', stats.assists],
            ['K/D', Number(stats.kd).toFixed(2)],
            ['KDA', Number(stats.kda).toFixed(2)],
            ['Taxa de vitória', stats.taxaVitoria + '%']
        ];

        // Monta os cartões de estatísticas
        const cards = itens.map(([nome, valor]) => `
            <div class="card">
                <small>${nome}</small>
                <b>${valor}</b>
            </div>
        `).join('');

        // Exibe as estatísticas
        v.innerHTML = `
            <h2>Estatísticas do VALORANT</h2>
            <p>Resumo das partidas importadas</p>
            <div class="cards">
                ${cards}
            </div>
        `;

    } catch (erro) {
        console.error(
            'Erro ao carregar estatísticas VALORANT:',
            erro
        );

        v.innerHTML = `
            <h2>Estatísticas do VALORANT</h2>
            <p class="erro">
                Não foi possível carregar as estatísticas.
            </p>
        `;
    }
};

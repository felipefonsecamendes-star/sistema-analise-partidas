
// Tela de estatísticas e histórico do VALORANT
telas.riot = async () => {
    v.innerHTML = `
        <h2>VALORANT</h2>
        <p>Carregando estatísticas e partidas...</p>
    `;

    try {
        // Busca as estatísticas e as últimas partidas
        const [respostaStats, respostaPartidas] = await Promise.all([
            f('/api/riot/estatisticas'),
            f('/api/riot/minhas-partidas')
        ]);

        if (!respostaStats.sucesso || !respostaPartidas.sucesso) {
            throw new Error('Não foi possível carregar os dados.');
        }

        const stats = respostaStats.estatisticas;
        const partidas = respostaPartidas.partidas;

        // Prepara os cartões de estatísticas
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

        const cards = itens.map(([nome, valor]) => `
            <div class="card">
                <small>${nome}</small>
                <b>${valor}</b>
            </div>
        `).join('');

        // Monta a tabela das partidas
        let historico = '';

        if (partidas.length === 0) {
            historico = `
                <p>Nenhuma partida importada ainda.</p>
            `;
        } else {
            const linhas = partidas.map(partida => {
                const kd = Number(partida.deaths) > 0
                    ? (
                        Number(partida.kills) /
                        Number(partida.deaths)
                    ).toFixed(2)
                    : Number(partida.kills).toFixed(2);

                const resultado = partida.resultado || 'Indefinido';

                const classeResultado = resultado === 'Vitória'
                    ? 'ok'
                    : resultado === 'Derrota'
                        ? 'erro'
                        : '';

                const data = partida.criado_em
                    ? new Date(partida.criado_em)
                        .toLocaleDateString('pt-BR')
                    : '-';

                return `
                    <tr>
                        <td>${esc(data)}</td>
                        <td>${esc(partida.mapa || '-')}</td>
                        <td class="${classeResultado}">
                            ${esc(resultado)}
                        </td>
                        <td>${esc(partida.kills)}</td>
                        <td>${esc(partida.deaths)}</td>
                        <td>${esc(partida.assists)}</td>
                        <td>${esc(kd)}</td>
                    </tr>
                `;
            }).join('');

            historico = `
                <div class="wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Mapa</th>
                                <th>Resultado</th>
                                <th>Kills</th>
                                <th>Mortes</th>
                                <th>Assistências</th>
                                <th>K/D</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhas}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Exibe os dados na tela
        v.innerHTML = `
            <h2>Estatísticas do VALORANT</h2>
            <p>Resumo das partidas importadas</p>

            <div class="cards">
                ${cards}
            </div>

            <h3>Últimas partidas</h3>
            ${historico}
        `;

    } catch (erro) {
        console.error(
            'Erro ao carregar dados do VALORANT:',
            erro
        );

        v.innerHTML = `
            <h2>VALORANT</h2>
            <p class="erro">
                Não foi possível carregar os dados do VALORANT.
            </p>
        `;
    }
};

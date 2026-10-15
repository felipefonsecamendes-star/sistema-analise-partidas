
// Tela de estatísticas e histórico do VALORANT
telas.riot = async () => {
    v.innerHTML = `
        <h2>VALORANT</h2>
        <p>Carregando estatísticas e partidas...</p>
    `;

    try {
        // Busca os dados do usuário logado
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

        // Exibe os cartões e os filtros
        v.innerHTML = `
            <h2>Estatísticas do VALORANT</h2>
            <p>Resumo das partidas importadas</p>

            <div class="cards">
                ${cards}
            </div>

            <h3>Últimas partidas</h3>

            <div class="grid">
                <label>
                    Filtrar por resultado
                    <select id="filtroResultadoRiot">
                        <option value="todas">Todas</option>
                        <option value="Vitória">Vitórias</option>
                        <option value="Derrota">Derrotas</option>
                    </select>
                </label>

                <label>
                    Pesquisar mapa
                    <input
                        type="text"
                        id="pesquisaMapaRiot"
                        placeholder="Ex.: Ascent, Bind, Haven"
                    >
                </label>
            </div>

            <p id="totalFiltradoRiot"></p>

            <div id="historicoRiot"></div>
        `;

        const filtroResultado = $('#filtroResultadoRiot');
        const pesquisaMapa = $('#pesquisaMapaRiot');
        const historicoRiot = $('#historicoRiot');
        const totalFiltrado = $('#totalFiltradoRiot');

        // Desenha a tabela com as partidas filtradas
        function atualizarHistorico() {
            const resultadoSelecionado = filtroResultado.value;
            const mapaPesquisado = pesquisaMapa.value
                .trim()
                .toLowerCase();

            const filtradas = partidas.filter(partida => {
                const resultado = partida.resultado || 'Indefinido';
                const mapa = String(partida.mapa || '')
                    .toLowerCase();

                const correspondeResultado =
                    resultadoSelecionado === 'todas' ||
                    resultado === resultadoSelecionado;

                const correspondeMapa =
                    mapa.includes(mapaPesquisado);

                return correspondeResultado && correspondeMapa;
            });

            totalFiltrado.textContent =
                `Partidas encontradas: ${filtradas.length}`;

            if (filtradas.length === 0) {
                historicoRiot.innerHTML = `
                    <p>Nenhuma partida encontrada.</p>
                `;
                return;
            }

            const linhas = filtradas.map(partida => {
                const kills = Number(partida.kills) || 0;
                const deaths = Number(partida.deaths) || 0;
                const assists = Number(partida.assists) || 0;

                const kd = deaths > 0
                    ? (kills / deaths).toFixed(2)
                    : kills.toFixed(2);

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
                        <td>${kills}</td>
                        <td>${deaths}</td>
                        <td>${assists}</td>
                        <td>${kd}</td>
                    </tr>
                `;
            }).join('');

            historicoRiot.innerHTML = `
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

        // Atualiza os resultados quando o usuário altera os filtros
        filtroResultado.addEventListener(
            'change',
            atualizarHistorico
        );

        pesquisaMapa.addEventListener(
            'input',
            atualizarHistorico
        );

        // Mostra todas as partidas ao abrir a tela
        atualizarHistorico();

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

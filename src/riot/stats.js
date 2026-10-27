
function calcularEstatisticasValorant(partidas) {
    if (!Array.isArray(partidas)) {
        throw new Error('A lista de partidas é inválida.');
    }

    const estatisticas = {
        totalPartidas: 0,
        vitorias: 0,
        derrotas: 0,
        indefinidas: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        headshots: 0,
        bodyshots: 0,
        legshots: 0,
        danoTotal: 0,
        rodadasJogadas: 0,
        kd: 0,
        kda: 0,
        hsPercentual: 0,
        adr: 0,
        acs: 0,
        taxaVitoria: 0
    };

    let pontuacaoTotal = 0;

    for (const partida of partidas) {
        estatisticas.totalPartidas++;

        if (partida.resultado === 'Vitória') {
            estatisticas.vitorias++;
        } else if (partida.resultado === 'Derrota') {
            estatisticas.derrotas++;
        } else {
            estatisticas.indefinidas++;
        }

        estatisticas.kills += Number(partida.kills) || 0;
        estatisticas.deaths += Number(partida.deaths) || 0;
        estatisticas.assists += Number(partida.assists) || 0;

        estatisticas.headshots += Number(partida.headshots) || 0;
        estatisticas.bodyshots += Number(partida.bodyshots) || 0;
        estatisticas.legshots += Number(partida.legshots) || 0;

        estatisticas.danoTotal += Number(partida.dano_total) || 0;
        estatisticas.rodadasJogadas +=
            Number(partida.rodadas_jogadas) || 0;

        pontuacaoTotal += Number(partida.pontuacao) || 0;
    }

    const arredondar = valor => Number(valor.toFixed(2));

    if (estatisticas.deaths > 0) {
        estatisticas.kd = arredondar(
            estatisticas.kills / estatisticas.deaths
        );

        estatisticas.kda = arredondar(
            (estatisticas.kills + estatisticas.assists) /
            estatisticas.deaths
        );
    }

    const totalAcertos =
        estatisticas.headshots +
        estatisticas.bodyshots +
        estatisticas.legshots;

    if (totalAcertos > 0) {
        estatisticas.hsPercentual = arredondar(
            estatisticas.headshots / totalAcertos * 100
        );
    }

    if (estatisticas.rodadasJogadas > 0) {
        estatisticas.adr = arredondar(
            estatisticas.danoTotal / estatisticas.rodadasJogadas
        );

        estatisticas.acs = arredondar(
            pontuacaoTotal / estatisticas.rodadasJogadas
        );
    }

    const partidasDecididas =
        estatisticas.vitorias + estatisticas.derrotas;

    if (partidasDecididas > 0) {
        estatisticas.taxaVitoria = arredondar(
            estatisticas.vitorias / partidasDecididas * 100
        );
    }

    return estatisticas;
}

module.exports = {
    calcularEstatisticasValorant
};

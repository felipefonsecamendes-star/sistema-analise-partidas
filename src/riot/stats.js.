
 // Calcula estatísticas das partidas do VALORANT
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
        kd: 0,
        kda: 0,
        taxaVitoria: 0
    };

    for (const partida of partidas) {
        estatisticas.totalPartidas++;

        const resultado = partida.resultado;

        if (resultado === 'Vitória') {
            estatisticas.vitorias++;
        } else if (resultado === 'Derrota') {
            estatisticas.derrotas++;
        } else {
            estatisticas.indefinidas++;
        }

        estatisticas.kills += Number(partida.kills) || 0;
        estatisticas.deaths += Number(partida.deaths) || 0;
        estatisticas.assists += Number(partida.assists) || 0;
    }

    // Calcula K/D e KDA
    if (estatisticas.deaths > 0) {
        estatisticas.kd = Number(
            (estatisticas.kills / estatisticas.deaths).toFixed(2)
        );

        estatisticas.kda = Number(
            (
                (estatisticas.kills + estatisticas.assists) /
                estatisticas.deaths
            ).toFixed(2)
        );
    }

    // Calcula a taxa de vitória das partidas com resultado
    const partidasDecididas =
        estatisticas.vitorias + estatisticas.derrotas;

    if (partidasDecididas > 0) {
        estatisticas.taxaVitoria = Number(
            (
                (estatisticas.vitorias / partidasDecididas) *
                100
            ).toFixed(2)
        );
    }

    return estatisticas;
}

module.exports = {
    calcularEstatisticasValorant
};

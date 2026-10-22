
function processarPartidaValorant(dadosPartida, puuid, riotContaId) {
    if (!dadosPartida || !puuid || !riotContaId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    const jogadores = dadosPartida.players?.all_players || [];

    const jogador = jogadores.find(
        player => player.puuid === puuid
    );

    if (!jogador) {
        throw new Error('Jogador não encontrado na partida.');
    }

    const equipe = jogador.team?.toLowerCase();
    const dadosEquipe = dadosPartida.teams?.[equipe];

    let resultado = 'Indefinido';

    if (typeof dadosEquipe?.has_won === 'boolean') {
        resultado = dadosEquipe.has_won
            ? 'Vitória'
            : 'Derrota';
    }

    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.metadata?.matchid,
        kills: jogador.stats?.kills ?? 0,
        deaths: jogador.stats?.deaths ?? 0,
        assists: jogador.stats?.assists ?? 0,
        mapa: dadosPartida.metadata?.map || 'Desconhecido',
        resultado,
        pontuacao: jogador.stats?.score ?? 0
    };
}

module.exports = {
    processarPartidaValorant
};

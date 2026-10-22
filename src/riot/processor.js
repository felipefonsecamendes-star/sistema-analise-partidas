
function obterNomeMapa(dadosPartida) {
    return dadosPartida?.metadata?.map?.name
        || dadosPartida?.metadata?.map
        || dadosPartida?.map?.name
        || dadosPartida?.map
        || 'Desconhecido';
}

function processarPartidaValorant(dadosPartida, puuid, riotContaId) {
    if (!dadosPartida || !puuid || !riotContaId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    const jogadores = Array.isArray(dadosPartida.players)
        ? dadosPartida.players
        : dadosPartida.players?.all_players || [];

    const jogador = jogadores.find(
        player => player.puuid === puuid
    );

    if (!jogador) {
        throw new Error('Jogador não encontrado na partida.');
    }

    const equipe = jogador.team?.toLowerCase();
    const equipes = dadosPartida.teams;

    let dadosEquipe;

    if (Array.isArray(equipes)) {
        dadosEquipe = equipes.find(
            team => String(team.teamId || team.team_id || '')
                .toLowerCase() === equipe
        );
    } else {
        dadosEquipe = equipes?.[equipe];
    }

    let resultado = 'Indefinido';

    const venceu = dadosEquipe?.won ?? dadosEquipe?.has_won;

    if (typeof venceu === 'boolean') {
        resultado = venceu ? 'Vitória' : 'Derrota';
    }

    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.metadata?.matchid
            || dadosPartida.metadata?.matchId
            || dadosPartida.matchId,
        kills: jogador.stats?.kills ?? 0,
        deaths: jogador.stats?.deaths ?? 0,
        assists: jogador.stats?.assists ?? 0,
        mapa: obterNomeMapa(dadosPartida),
        resultado,
        pontuacao: jogador.stats?.score ?? 0
    };
}

module.exports = {
    processarPartidaValorant,
    obterNomeMapa
};

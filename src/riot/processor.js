
function processarPartidaValorant(dadosPartida, puuid, riotContaId) {
    if (!dadosPartida || !puuid || !riotContaId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    const jogadores = dadosPartida.players || [];

    // Localiza o jogador pelo PUUID
    const jogador = jogadores.find(
        (player) => player.puuid === puuid
    );

    if (!jogador) {
        throw new Error('Jogador não encontrado na partida.');
    }

    const equipes = dadosPartida.teams || [];

    // Localiza a equipe do jogador
    const equipe = equipes.find(
        (team) => team.teamId === jogador.teamId
    );

    // Identifica o resultado da partida
    let resultado = 'Indefinido';

    if (equipe && typeof equipe.won === 'boolean') {
        resultado = equipe.won ? 'Vitória' : 'Derrota';
    }

    // Organiza as estatísticas para o banco de dados
    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.matchInfo?.matchId,
        kills: jogador.stats?.kills ?? 0,
        deaths: jogador.stats?.deaths ?? 0,
        assists: jogador.stats?.assists ?? 0,
        mapa: dadosPartida.matchInfo?.mapId ?? null,
        resultado: resultado,
        pontuacao: jogador.stats?.score ?? 0
    };
}

module.exports = {
    processarPartidaValorant
};

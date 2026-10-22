
function obterNomeMapa(entrada) {
    const mapa = typeof entrada === 'string'
        ? entrada
        : entrada?.matchInfo?.mapId
            || entrada?.metadata?.map?.name
            || entrada?.metadata?.map
            || entrada?.map?.name
            || entrada?.map;

    if (typeof mapa !== 'string' || !mapa.trim()) {
        return 'Desconhecido';
    }

    const identificador = mapa.split('/').filter(Boolean).pop();

    const nomes = {
        Duality: 'Bind',
        Triad: 'Haven',
        Bonsai: 'Split'
    };

    return nomes[identificador]
        || identificador
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

    const equipe = String(
        jogador.teamId || jogador.team || ''
    ).toLowerCase();

    const equipes = dadosPartida.teams;

    const dadosEquipe = Array.isArray(equipes)
        ? equipes.find(team =>
            String(team.teamId || team.team_id || '')
                .toLowerCase() === equipe
        )
        : equipes?.[equipe];

    const venceu = dadosEquipe?.won ?? dadosEquipe?.has_won;

    const resultado = typeof venceu === 'boolean'
        ? (venceu ? 'Vitória' : 'Derrota')
        : 'Indefinido';

    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.matchInfo?.matchId
            || dadosPartida.metadata?.matchid
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

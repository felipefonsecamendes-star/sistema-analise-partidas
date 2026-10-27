
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
    
    const obterPlacarEquipe = nome => {
        const dados = Array.isArray(equipes)
            ? equipes.find(time =>
                String(time.teamId || time.team_id || time.team || '')
                    .toLowerCase() === nome
            )
            : Object.entries(equipes || {}).find(
                ([chave]) => chave.toLowerCase() === nome
            )?.[1];

        const pontos = dados?.rounds_won
            ?? dados?.roundsWon
            ?? dados?.rounds?.won;

        return pontos != null && Number.isFinite(Number(pontos))
            ? Number(pontos)
            : null;
    };

    const placar_blue = obterPlacarEquipe('blue');
    const placar_red = obterPlacarEquipe('red');


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

    const stats = jogador.stats || {};

    const kills = stats.kills ?? 0;
    const deaths = stats.deaths ?? 0;
    const assists = stats.assists ?? 0;

    const headshots = stats.headshots ?? 0;
    const bodyshots = stats.bodyshots ?? 0;
    const legshots = stats.legshots ?? 0;

    const totalAcertos = headshots + bodyshots + legshots;

    const hs_percentual = totalAcertos > 0
        ? Number((headshots / totalAcertos * 100).toFixed(2))
        : 0;

    const kd = deaths > 0
        ? Number((kills / deaths).toFixed(2))
        : kills;

    const kda = deaths > 0
        ? Number(((kills + assists) / deaths).toFixed(2))
        : kills + assists;

    const rodadas = dadosPartida.rounds?.length
        || dadosPartida.metadata?.rounds_played
        || 0;

    const dano_total = jogador.damage_made
        ?? stats.damage_made
        ?? 0;

    const adr = rodadas > 0
        ? Number((dano_total / rodadas).toFixed(2))
        : 0;

    const pontuacao = stats.score ?? 0;

    const acs = rodadas > 0
        ? Number((pontuacao / rodadas).toFixed(2))
        : 0;

    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.matchInfo?.matchId
            || dadosPartida.metadata?.matchid
            || dadosPartida.metadata?.matchId
            || dadosPartida.matchId,
        kills,
        deaths,
        assists,
        mapa: obterNomeMapa(dadosPartida),
        resultado,
        placar_blue,
        placar_red,
        pontuacao,
        headshots,
        bodyshots,
        legshots,
        dano_total,
        rodadas_jogadas: rodadas,
        hs_percentual,
        kd,
        kda,
        adr,
        acs
    };
}

module.exports = {
    processarPartidaValorant,
    obterNomeMapa
};

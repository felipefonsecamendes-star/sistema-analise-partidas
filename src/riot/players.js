
function processarJogadoresPartida(dadosPartida) {
    if (!dadosPartida) {
        throw new Error('Dados da partida não informados.');
    }

    const jogadores = Array.isArray(dadosPartida.players)
        ? dadosPartida.players
        : dadosPartida.players?.all_players || [];

    const rodadas = dadosPartida.rounds?.length
        || dadosPartida.metadata?.rounds_played
        || 0;

    return jogadores.map(jogador => {
        const stats = jogador.stats || {};

        const kills = Number(stats.kills) || 0;
        const deaths = Number(stats.deaths) || 0;
        const assists = Number(stats.assists) || 0;

        const headshots = Number(stats.headshots) || 0;
        const bodyshots = Number(stats.bodyshots) || 0;
        const legshots = Number(stats.legshots) || 0;

        const totalAcertos = headshots + bodyshots + legshots;

        const hs_percentual = totalAcertos > 0
            ? Number((headshots / totalAcertos * 100).toFixed(2))
            : 0;

        const dano = Number(
            jogador.damage_made ?? stats.damage_made ?? 0
        );

        const pontuacao = Number(stats.score) || 0;

        return {
            puuid: jogador.puuid || null,
            nick: jogador.name || jogador.gameName || null,
            tag: jogador.tag || jogador.tagLine || null,
            equipe: jogador.teamId || jogador.team || null,
            agente: jogador.character || jogador.agent?.name || null,
            kills,
            deaths,
            assists,
            headshots,
            bodyshots,
            legshots,
            hs_percentual,
            adr: rodadas > 0
                ? Number((dano / rodadas).toFixed(2))
                : 0,
            acs: rodadas > 0
                ? Number((pontuacao / rodadas).toFixed(2))
                : 0
        };
    });
}

module.exports = {
    processarJogadoresPartida
};

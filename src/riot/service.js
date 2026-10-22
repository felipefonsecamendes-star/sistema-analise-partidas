
const { riotRequest } = require('./client');
const { henrikRequest } = require('./henrikClient');

// Consulta a API oficial da Riot
async function consultarApiRiot(rota, tipo = 'regional') {
    return riotRequest(rota, tipo);
}

// Busca uma conta pela HenrikDev
async function buscarContaPorRiotId(gameName, tagLine) {
    if (!gameName || !tagLine) {
        throw new Error('Nome e tag da Riot são obrigatórios.');
    }

    const nome = encodeURIComponent(gameName.trim());
    const tag = encodeURIComponent(tagLine.trim());

    const resposta = await henrikRequest(
        `/valorant/v1/account/${nome}/${tag}`
    );

    if (!resposta.data?.puuid) {
        throw new Error('Conta não encontrada.');
    }

    return {
        puuid: resposta.data.puuid,
        gameName: resposta.data.name,
        tagLine: resposta.data.tag,
        region: resposta.data.region
    };
}

// Mantém temporariamente a consulta antiga de partidas
async function buscarPartidaValorant(matchId) {
    if (!matchId) {
        throw new Error('O ID da partida é obrigatório.');
    }

    const id = encodeURIComponent(matchId);

    return consultarApiRiot(
        `/val/match/v1/matches/${id}`,
        'plataforma'
    );
}

// Mantém temporariamente a consulta antiga de histórico
async function buscarHistoricoValorant(puuid) {
    if (!puuid) {
        throw new Error('O PUUID do jogador é obrigatório.');
    }

    const id = encodeURIComponent(puuid);

    return consultarApiRiot(
        `/val/match/v1/matchlists/by-puuid/${id}`,
        'plataforma'
    );
}

module.exports = {
    consultarApiRiot,
    buscarContaPorRiotId,
    buscarPartidaValorant,
    buscarHistoricoValorant
};

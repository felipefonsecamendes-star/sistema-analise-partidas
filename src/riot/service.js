
const { riotRequest } = require('./client');

// Faz uma consulta GET à API da Riot Games
async function consultarApiRiot(rota, tipo = 'regional') {
    return await riotRequest(rota, tipo);
}

// Busca uma conta Riot pelo nome e tag
async function buscarContaPorRiotId(gameName, tagLine) {
    if (!gameName || !tagLine) {
        throw new Error('Nome e tag da Riot são obrigatórios.');
    }

    const nome = encodeURIComponent(gameName);
    const tag = encodeURIComponent(tagLine);

    const rota = `/riot/account/v1/accounts/by-riot-id/${nome}/${tag}`;

    // A API de contas utiliza roteamento regional
    return await consultarApiRiot(rota, 'regional');
}


async function buscarContaPorRiotId(gameName, tagLine) {
    if (!gameName || !tagLine) {
        throw new Error('Nome e tag da Riot são obrigatórios.');
    }

    const { henrikRequest } = require('./henrikClient');

    const nome = encodeURIComponent(gameName.trim());
    const tag = encodeURIComponent(tagLine.trim());

    const resposta = await henrikRequest(
        `/valorant/v1/account/${nome}/${tag}`
    );

    if (!resposta.data?.puuid) {
        throw new Error('Conta não encontrada na HenrikDev.');
    }

    return {
        puuid: resposta.data.puuid,
        gameName: resposta.data.name,
        tagLine: resposta.data.tag
    };
}


    // A API de partidas utiliza roteamento de plataforma
    return await consultarApiRiot(rota, 'plataforma');
}

// Busca o histórico de partidas de um jogador
async function buscarHistoricoValorant(puuid) {
    if (!puuid) {
        throw new Error('O PUUID do jogador é obrigatório.');
    }

    const id = encodeURIComponent(puuid);

    const rota = `/val/match/v1/matchlists/by-puuid/${id}`;

    // O histórico utiliza roteamento de plataforma
    return await consultarApiRiot(rota, 'plataforma');
}

module.exports = {
    consultarApiRiot,
    buscarContaPorRiotId,
    buscarPartidaValorant,
    buscarHistoricoValorant
};

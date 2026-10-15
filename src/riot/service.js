
const config = require('./config');

// Faz uma consulta GET à API da Riot Games
async function consultarApiRiot(rota, tipo = 'regional') {
    if (!config.hasRiotApiKey()) {
        throw new Error('A chave da API Riot não foi configurada.');
    }

    if (!rota || !rota.startsWith('/')) {
        throw new Error('A rota da API Riot é inválida.');
    }

    // Define o servidor correto para a consulta
    const servidor = tipo === 'plataforma'
        ? config.platform
        : config.regionalRouting;

    const url = `https://${servidor}.api.riotgames.com${rota}`;

    const resposta = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Riot-Token': config.apiKey
        }
    });

    if (!resposta.ok) {
        throw new Error(
            `Erro ao consultar a API Riot: ${resposta.status}`
        );
    }

    return await resposta.json();
}

// Busca informações de uma conta Riot
async function buscarContaPorRiotId(gameName, tagLine) {
    if (!gameName || !tagLine) {
        throw new Error('Nome e tag da Riot são obrigatórios.');
    }

    const nome = encodeURIComponent(gameName);
    const tag = encodeURIComponent(tagLine);

    const rota = `/riot/account/v1/accounts/by-riot-id/${nome}/${tag}`;

    return await consultarApiRiot(rota);
}

// Busca informações de uma partida do VALORANT
async function buscarPartidaValorant(matchId) {
    if (!matchId) {
        throw new Error('O ID da partida é obrigatório.');
    }

    const id = encodeURIComponent(matchId);

    const rota = `/val/match/v1/matches/${id}`;

    return await consultarApiRiot(rota);
}

module.exports = {
    consultarApiRiot,
    buscarContaPorRiotId,
    buscarPartidaValorant
};


const config = require('./config');

// Cliente para acessar a API da Riot Games
async function riotRequest(endpoint, tipo = 'regional') {
    // Verifica se a chave da API foi configurada
    if (!config.hasRiotApiKey()) {
        throw new Error('A chave da API Riot não foi configurada.');
    }

    // Verifica se o endpoint é válido
    if (!endpoint || !endpoint.startsWith('/')) {
        throw new Error('O endpoint da API Riot é inválido.');
    }

    // Seleciona o servidor correto
    const servidor = tipo === 'plataforma'
        ? config.platform
        : config.regionalRouting;

    // Monta o endereço da API
    const baseUrl = `https://${servidor}.api.riotgames.com`;
    const url = `${baseUrl}${endpoint}`;

    // Envia a requisição para a Riot Games
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Riot-Token': config.apiKey
        }
    });

    // Verifica se ocorreu algum erro
    if (!response.ok) {
        throw new Error(
            `Erro na API Riot: ${response.status}`
        );
    }

    // Retorna os dados recebidos
    return await response.json();
}

module.exports = {
    riotRequest
};

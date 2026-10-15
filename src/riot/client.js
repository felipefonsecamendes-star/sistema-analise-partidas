
const config = require('./config');

// Cliente para acessar a API da Riot Games
async function riotRequest(endpoint) {
  // Verifica se a chave da API foi configurada
  if (!config.hasRiotApiKey()) {
    throw new Error('A chave da API Riot não foi configurada.');
  }

  // Endereço base da API
  const baseUrl = `https://${config.region}.api.riotgames.com`;

  // Monta o endereço da requisição
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


const riotConfig = {
  region: process.env.RIOT_REGION || 'br',
  platform: process.env.RIOT_PLATFORM || 'br1',
  regionalRouting: process.env.RIOT_ROUTING || 'americas',

  // Chave de acesso à API da Riot Games
  apiKey: process.env.RIOT_API_KEY || '',

  // Configurações de autenticação
  clientId: process.env.RIOT_CLIENT_ID || '',
  clientSecret: process.env.RIOT_CLIENT_SECRET || '',
  redirectUri: process.env.RIOT_REDIRECT_URI || ''
};

// Verifica se existe uma chave configurada
function hasRiotApiKey() {
  return riotConfig.apiKey.trim().length > 0;
}

module.exports = {
  ...riotConfig,
  hasRiotApiKey
};

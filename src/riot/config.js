
const riotConfig = {
  region: process.env.RIOT_REGION || 'br',
  platform: process.env.RIOT_PLATFORM || 'br1',
  regionalRouting: process.env.RIOT_ROUTING || 'americas',
  apiKey: process.env.RIOT_API_KEY || '',
  clientId: process.env.RIOT_CLIENT_ID || '',
  clientSecret: process.env.RIOT_CLIENT_SECRET || '',
  redirectUri: process.env.RIOT_REDIRECT_URI || ''
};

module.exports = riotConfig;

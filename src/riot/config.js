
const riotConfig = {
  region: process.env.RIOT_REGION || 'br',
  apiKey: process.env.RIOT_API_KEY || '',
  clientId: process.env.RIOT_CLIENT_ID || '',
  clientSecret: process.env.RIOT_CLIENT_SECRET || '',
  redirectUri: process.env.RIOT_REDIRECT_URI || ''
};

module.exports = riotConfig;

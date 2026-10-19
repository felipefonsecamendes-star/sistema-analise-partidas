const crypto = require('crypto');
const config = require('./config');

function iniciarLoginRiot(req, res) {
    if (!config.validateRiotOAuthConfig().valid) {
        return res.status(503).json({
            sucesso: false,
            mensagem: 'Login Riot indisponível. Aguardando configuração e autorização do RSO.'
        });
    }

    const state = crypto.randomBytes(32).toString('hex');
    req.session.riotOAuthState = state;

    const url = new URL('https://auth.riotgames.com/authorize');

    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid');
    url.searchParams.set('state', state);

    req.session.save(erro => {
        if (erro) {
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao iniciar autenticação Riot.'
            });
        }

        return res.redirect(url.toString());
    });
}

module.exports = { iniciarLoginRiot };
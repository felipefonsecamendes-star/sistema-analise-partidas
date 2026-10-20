const crypto = require('crypto');
const config = require('./config');

function iniciarLoginRiot(req, res) {
    if (!config.validateRiotOAuthConfig().valid) {
        return res.status(503).json({
            sucesso: false,
           mensagem: 'A conexão automática com a Riot Games estará disponível após a autorização oficial. Por enquanto, utilize o formulário de vinculação manual.'
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

function receberCallbackRiot(req, res) {
    const { code, state, error } = req.query;
    const stateSalvo = req.session.riotOAuthState;

    delete req.session.riotOAuthState;

    if (error) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Autenticação Riot cancelada ou recusada.'
        });
    }

    if (
        typeof code !== 'string' ||
        typeof state !== 'string' ||
        !stateSalvo ||
        state !== stateSalvo
    ) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Retorno de autenticação inválido.'
        });
    }

    return res.status(501).json({
        sucesso: false,
        mensagem: 'Retorno validado. A troca do código por tokens Riot ainda não foi implementada.'
    });
}

module.exports = { iniciarLoginRiot, receberCallbackRiot };

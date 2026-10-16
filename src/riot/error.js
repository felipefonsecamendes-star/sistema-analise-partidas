
// Padroniza os erros da integração com a Riot Games

function tratarErroRiot(erro) {
    // Erro padrão, sem expor informações internas
    const resposta = {
        status: 502,
        sucesso: false,
        mensagem: 'Não foi possível comunicar com a Riot Games.'
    };

    if (!erro) {
        return resposta;
    }

    const status = Number(erro.status);

    // Erros conhecidos da API Riot
    const mensagens = {
        400: 'A solicitação enviada à Riot é inválida.',
        401: 'A autenticação com a Riot falhou.',
        403: 'Acesso negado pela Riot Games.',
        404: 'Conta ou partida não encontrada.',
        429: 'Limite de consultas à Riot atingido.',
        500: 'A Riot apresentou um erro interno.',
        502: 'A Riot apresentou uma falha de comunicação.',
        503: 'Os servidores da Riot estão indisponíveis.',
        504: 'A Riot demorou demais para responder.'
    };

    if (Object.prototype.hasOwnProperty.call(mensagens, status)) {
        // Erros de configuração da chave e falhas da Riot
        // são apresentados ao navegador como falhas de integração.
        resposta.status = [400, 404, 429].includes(status)
            ? status
            : 502;

        resposta.mensagem = mensagens[status];
    }

    // Informa quando uma nova tentativa pode ser realizada
    if (status === 429 && erro.retryAfter != null) {
        const segundos = Number(erro.retryAfter);

        if (
            Number.isFinite(segundos) &&
            segundos >= 0 &&
            segundos <= 86400
        ) {
            resposta.aguardarSegundos = Math.ceil(segundos);
        }
    }

    return resposta;
}

// Envia uma resposta padronizada ao navegador
function responderErroRiot(res, erro) {
    const resposta = tratarErroRiot(erro);

    const {
        status,
        ...dados
    } = resposta;

    // Repassa o tempo de espera quando houver limite da API
    if (status === 429 && dados.aguardarSegundos != null) {
        res.set(
            'Retry-After',
            String(dados.aguardarSegundos)
        );
    }

    return res.status(status).json(dados);
}

module.exports = {
    tratarErroRiot,
    responderErroRiot
};

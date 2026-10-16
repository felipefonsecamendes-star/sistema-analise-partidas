
const config = require('./config');

// Identifica erros comuns da API Riot
function identificarErroRiot(status) {
    const mensagens = {
        400: 'Requisição inválida enviada à Riot.',
        401: 'A chave da API Riot não foi informada.',
        403: 'Acesso negado. Verifique a chave da API e as permissões.',
        404: 'Conta ou partida não encontrada.',
        429: 'Limite de requisições da API Riot atingido.',
        500: 'Erro interno nos servidores da Riot.',
        502: 'Falha de comunicação com a Riot.',
        503: 'Serviço da Riot temporariamente indisponível.',
        504: 'Tempo de resposta do servidor Riot excedido.'
    };

    return mensagens[status] ||
        `Erro inesperado na API Riot: ${status}`;
}

// Cliente para acessar a API da Riot Games
async function riotRequest(endpoint, tipo = 'regional') {
    // Verifica se existe uma chave configurada
    if (!config.hasRiotApiKey()) {
        throw new Error(
            'A chave da API Riot não foi configurada.'
        );
    }

    // Verifica se o endpoint é válido
    if (
        typeof endpoint !== 'string' ||
        !endpoint.startsWith('/') ||
        endpoint.startsWith('//')
    ) {
        throw new Error(
            'O endpoint da API Riot é inválido.'
        );
    }

    // Seleciona o servidor correto
    const servidor = tipo === 'plataforma'
        ? config.platform
        : config.regionalRouting;

    const baseUrl = `https://${servidor}.api.riotgames.com`;
    const url = `${baseUrl}${endpoint}`;

    let response;

    try {
        // Faz a requisição à Riot
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Riot-Token': config.apiKey
            },
            signal: AbortSignal.timeout(10000)
        });
    } catch (erro) {
        // Identifica problemas de conexão e tempo limite
        if (
            erro.name === 'TimeoutError' ||
            erro.name === 'AbortError'
        ) {
            throw new Error(
                'A Riot demorou demais para responder.'
            );
        }

        throw new Error(
            'Não foi possível conectar aos servidores da Riot.'
        );
    }

    // Trata respostas de erro
    if (!response.ok) {
        const mensagem = identificarErroRiot(response.status);

        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');

            const erro = new Error(
                retryAfter
                    ? `${mensagem} Aguarde ${retryAfter} segundos.`
                    : mensagem
            );

            erro.status = response.status;
            erro.retryAfter = retryAfter;

            throw erro;
        }

        const erro = new Error(mensagem);
        erro.status = response.status;

        throw erro;
    }

    // Converte a resposta em JSON
    try {
        return await response.json();
    } catch (erro) {
        throw new Error(
            'A Riot retornou uma resposta inválida.'
        );
    }
}

module.exports = {
    riotRequest,
    identificarErroRiot
};

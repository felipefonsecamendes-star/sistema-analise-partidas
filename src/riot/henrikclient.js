
const BASE_URL = 'https://api.henrikdev.xyz';

async function henrikRequest(endpoint) {
    const apiKey = process.env.HENRIK_API_KEY;

    if (!apiKey) {
        throw new Error('Chave HenrikDev não configurada.');
    }

    if (
        typeof endpoint !== 'string' ||
        !endpoint.startsWith('/') ||
        endpoint.startsWith('//')
    ) {
        throw new Error('Endpoint inválido.');
    }

    let resposta;

    try {
        resposta = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                Authorization: apiKey
            },
            signal: AbortSignal.timeout(10000)
        });
    } catch {
        throw new Error('Falha ao conectar à HenrikDev.');
    }

    if (!resposta.ok) {
        const erro = new Error(
            `Erro na HenrikDev API: ${resposta.status}`
        );
        erro.status = resposta.status;
        throw erro;
    }

    return resposta.json();
}

module.exports = { henrikRequest };

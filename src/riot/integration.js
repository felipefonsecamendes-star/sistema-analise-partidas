
const {
    buscarPartidaValorant,
    buscarHistoricoValorant
} = require('./service');

const {
    processarPartidaValorant
} = require('./processor');

const {
    salvarPartidaRiot
} = require('./repository');

// Verifica se uma partida já está cadastrada
async function verificarPartidaExistente(
    conexao,
    riotContaId,
    matchId
) {
    if (!conexao || !riotContaId || !matchId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    const [partidas] = await conexao.execute(
        `SELECT id
         FROM riot_partida
         WHERE riot_conta_id = ?
           AND match_id = ?
         LIMIT 1`,
        [riotContaId, matchId]
    );

    return partidas.length > 0;
}

// Cria um erro específico para partidas duplicadas
function criarErroPartidaDuplicada() {
    const erro = new Error(
        'Esta partida já foi importada anteriormente.'
    );

    erro.status = 409;

    return erro;
}

// Consulta uma partida e organiza as estatísticas
async function importarPartidaValorant(
    conexao,
    matchId,
    puuid,
    riotContaId
) {
    if (!conexao || !matchId || !puuid || !riotContaId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    // Evita consultar a Riot para partidas já cadastradas
    const partidaExistente = await verificarPartidaExistente(
        conexao,
        riotContaId,
        matchId
    );

    if (partidaExistente) {
        throw criarErroPartidaDuplicada();
    }

    // Busca os dados da partida na Riot
    const dadosPartida = await buscarPartidaValorant(matchId);

    // Organiza as estatísticas do jogador
    const partida = processarPartidaValorant(
        dadosPartida,
        puuid,
        riotContaId
    );

    if (!partida.match_id) {
        throw new Error('A partida não possui um ID válido.');
    }

    // Verifica também o ID retornado pela Riot
    const duplicada = await verificarPartidaExistente(
        conexao,
        riotContaId,
        partida.match_id
    );

    if (duplicada) {
        throw criarErroPartidaDuplicada();
    }

    // Salva as estatísticas no MySQL
    try {
        await salvarPartidaRiot(conexao, partida);
    } catch (erro) {
        // Protege contra importações simultâneas
        if (
            erro.code === 'ER_DUP_ENTRY' ||
            erro.errno === 1062
        ) {
            throw criarErroPartidaDuplicada();
        }

        throw erro;
    }

    return partida;
}

// Busca os IDs das partidas recentes
async function listarPartidasRecentes(puuid) {
    if (!puuid) {
        throw new Error('O PUUID é obrigatório.');
    }

    const historico = await buscarHistoricoValorant(puuid);

    return historico.history || [];
}

module.exports = {
    importarPartidaValorant,
    listarPartidasRecentes,
    verificarPartidaExistente
};

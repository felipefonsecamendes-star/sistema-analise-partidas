
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

    // Salva as estatísticas no MySQL
    await salvarPartidaRiot(conexao, partida);

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
    listarPartidasRecentes
};

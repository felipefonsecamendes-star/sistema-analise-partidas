
// Converte o identificador do mapa em um nome legível
function obterNomeMapa(mapId) {
    if (!mapId || typeof mapId !== 'string') {
        return 'Desconhecido';
    }

    const mapas = {
        '/Game/Maps/Ascent/Ascent': 'Ascent',
        '/Game/Maps/Duality/Duality': 'Bind',
        '/Game/Maps/Triad/Triad': 'Haven',
        '/Game/Maps/Bonsai/Bonsai': 'Split',
        '/Game/Maps/Port/Port': 'Icebox',
        '/Game/Maps/Foxtrot/Foxtrot': 'Breeze',
        '/Game/Maps/Canyon/Canyon': 'Fracture',
        '/Game/Maps/Pitt/Pitt': 'Pearl',
        '/Game/Maps/Jam/Jam': 'Lotus',
        '/Game/Maps/Juliett/Juliett': 'Sunset',
        '/Game/Maps/Infinity/Infinity': 'Abyss'
    };

    // Retorna o nome conhecido, quando disponível
    if (mapas[mapId]) {
        return mapas[mapId];
    }

    // Se for um mapa novo, usa a última parte do caminho
    const partes = mapId.split('/').filter(Boolean);

    return partes[partes.length - 1] || 'Desconhecido';
}

// Processa os dados de uma partida do VALORANT
function processarPartidaValorant(dadosPartida, puuid, riotContaId) {
    if (!dadosPartida || !puuid || !riotContaId) {
        throw new Error('Dados obrigatórios não informados.');
    }

    const jogadores = dadosPartida.players || [];

    // Localiza o jogador pelo PUUID
    const jogador = jogadores.find(
        (player) => player.puuid === puuid
    );

    if (!jogador) {
        throw new Error('Jogador não encontrado na partida.');
    }

    const equipes = dadosPartida.teams || [];

    // Localiza a equipe do jogador
    const equipe = equipes.find(
        (team) => team.teamId === jogador.teamId
    );

    // Identifica o resultado da partida
    let resultado = 'Indefinido';

    if (equipe && typeof equipe.won === 'boolean') {
        resultado = equipe.won ? 'Vitória' : 'Derrota';
    }

    // Converte o identificador do mapa
    const mapa = obterNomeMapa(
        dadosPartida.matchInfo?.mapId
    );

    // Organiza as estatísticas para o banco de dados
    return {
        riot_conta_id: riotContaId,
        match_id: dadosPartida.matchInfo?.matchId,
        kills: jogador.stats?.kills ?? 0,
        deaths: jogador.stats?.deaths ?? 0,
        assists: jogador.stats?.assists ?? 0,
        mapa: mapa,
        resultado: resultado,
        pontuacao: jogador.stats?.score ?? 0
    };
}

module.exports = {
    processarPartidaValorant,
    obterNomeMapa
};

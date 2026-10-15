
 // Busca uma conta Riot pelo PUUID
async function buscarContaRiot(conexao, puuid) {
    if (!puuid) {
        throw new Error('O PUUID é obrigatório.');
    }

    const sql = `
        SELECT
            id,
            usuario_id,
            puuid,
            game_name,
            tag_line,
            criado_em
        FROM riot_conta
        WHERE puuid = ?
        LIMIT 1
    `;

    const [resultados] = await conexao.execute(sql, [puuid]);

    return resultados[0] || null;
}

// Salva uma partida do VALORANT no banco de dados
async function salvarPartidaRiot(conexao, partida) {
    if (!partida || !partida.riot_conta_id || !partida.match_id) {
        throw new Error('Dados obrigatórios da partida não informados.');
    }

    const sql = `
        INSERT INTO riot_partida (
            riot_conta_id,
            match_id,
            kills,
            deaths,
            assists,
            mapa,
            resultado,
            pontuacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            kills = VALUES(kills),
            deaths = VALUES(deaths),
            assists = VALUES(assists),
            mapa = VALUES(mapa),
            resultado = VALUES(resultado),
            pontuacao = VALUES(pontuacao)
    `;

    const valores = [
        partida.riot_conta_id,
        partida.match_id,
        partida.kills ?? 0,
        partida.deaths ?? 0,
        partida.assists ?? 0,
        partida.mapa ?? null,
        partida.resultado ?? null,
        partida.pontuacao ?? 0
    ];

    const [resultado] = await conexao.execute(sql, valores);

    return resultado;
}

module.exports = {
    buscarContaRiot,
    salvarPartidaRiot
};

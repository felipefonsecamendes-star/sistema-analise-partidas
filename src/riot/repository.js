
// Busca uma conta Riot pelo PUUID
async function buscarContaRiot(conexao, puuid) {
    if (!conexao || !puuid) {
        throw new Error('Conexão e PUUID são obrigatórios.');
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

// Salva ou atualiza uma conta Riot no banco
async function salvarContaRiot(conexao, conta) {
    if (
        !conexao ||
        !conta ||
        !conta.usuario_id ||
        !conta.puuid
    ) {
        throw new Error(
            'Dados obrigatórios da conta Riot não informados.'
        );
    }

    const sql = `
        INSERT INTO riot_conta (
            usuario_id,
            puuid,
            game_name,
            tag_line
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            game_name = VALUES(game_name),
            tag_line = VALUES(tag_line)
    `;

    const valores = [
        conta.usuario_id,
        conta.puuid,
        conta.game_name ?? null,
        conta.tag_line ?? null
    ];

    const [resultado] = await conexao.execute(sql, valores);

    return resultado;
}

// Salva uma partida do VALORANT no banco de dados

async function salvarPartidaRiot(conexao, partida) {
    if (
        !conexao ||
        !partida ||
        !partida.riot_conta_id ||
        !partida.match_id
    ) {
        throw new Error(
            'Dados obrigatórios da partida não informados.'
        );
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
            pontuacao,
            headshots,
            bodyshots,
            legshots,
            dano_total,
            rodadas_jogadas,
            hs_percentual,
            kd,
            kda,
            adr,
            acs
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `;

    const valores = [
        partida.riot_conta_id,
        partida.match_id,
        partida.kills ?? 0,
        partida.deaths ?? 0,
        partida.assists ?? 0,
        partida.mapa ?? null,
        partida.resultado ?? null,
        partida.pontuacao ?? 0,
        partida.headshots ?? 0,
        partida.bodyshots ?? 0,
        partida.legshots ?? 0,
        partida.dano_total ?? 0,
        partida.rodadas_jogadas ?? 0,
        partida.hs_percentual ?? 0,
        partida.kd ?? 0,
        partida.kda ?? 0,
        partida.adr ?? 0,
        partida.acs ?? 0
    ];

    const [resultado] = await conexao.execute(
        sql,
        valores
    );

    return resultado;
}


    // Em caso de duplicação, o MySQL gera ER_DUP_ENTRY
    // Esse erro será tratado pela integração Riot
    const [resultado] = await conexao.execute(sql, valores);

    return resultado;
}

module.exports = {
    buscarContaRiot,
    salvarContaRiot,
    salvarPartidaRiot
};

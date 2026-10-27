
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
            placar_blue,
            placar_red,
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
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        partida.placar_blue ?? null,
        partida.placar_red ?? null,
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

async function salvarJogadoresPartida(conexao, partidaId, jogadores) {
    if (!conexao || !partidaId || !Array.isArray(jogadores)) {
        throw new Error('Dados dos jogadores não informados.');
    }

    for (const jogador of jogadores) {
        if (!jogador.puuid) continue;

        const sql = `
            INSERT INTO riot_partida_jogador (
                partida_id, puuid, nick, tag, equipe, agente,
                kills, deaths, assists, headshots, bodyshots,
                legshots, hs_percentual, adr, acs
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nick = VALUES(nick),
                tag = VALUES(tag),
                equipe = VALUES(equipe),
                agente = VALUES(agente),
                kills = VALUES(kills),
                deaths = VALUES(deaths),
                assists = VALUES(assists),
                headshots = VALUES(headshots),
                bodyshots = VALUES(bodyshots),
                legshots = VALUES(legshots),
                hs_percentual = VALUES(hs_percentual),
                adr = VALUES(adr),
                acs = VALUES(acs)
        `;

        const valores = [
            partidaId,
            jogador.puuid,
            jogador.nick ?? null,
            jogador.tag ?? null,
            jogador.equipe ?? null,
            jogador.agente ?? null,
            jogador.kills ?? 0,
            jogador.deaths ?? 0,
            jogador.assists ?? 0,
            jogador.headshots ?? 0,
            jogador.bodyshots ?? 0,
            jogador.legshots ?? 0,
            jogador.hs_percentual ?? 0,
            jogador.adr ?? 0,
            jogador.acs ?? 0
        ];

        await conexao.execute(sql, valores);
    }
}

module.exports = {
    buscarContaRiot,
    salvarContaRiot,
    salvarPartidaRiot,
    salvarJogadoresPartida
};

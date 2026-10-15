
const mysql = require('mysql2/promise');

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

module.exports = {
    buscarContaRiot
};

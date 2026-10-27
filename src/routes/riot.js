
const express = require('express');
const router = express.Router();
const {
    iniciarLoginRiot,
    receberCallbackRiot
} = require('../riot/oauth');

router.get('/login', iniciarLoginRiot);
router.get('/callback', receberCallbackRiot);

const db = require('../db');

const {
    buscarContaPorRiotId,
    buscarHistoricoValorant
} = require('../riot/service');

const {
    buscarContaRiot,
    salvarContaRiot
} = require('../riot/repository');

const {
    importarPartidaValorant
} = require('../riot/integration');

const {
    calcularEstatisticasValorant
} = require('../riot/stats');

const {
    responderErroRiot
} = require('../riot/error');

// Trata erros de operações que usam a API Riot e o banco
function responderErroOperacao(res, erro, mensagem) {
    if (
        erro &&
        Number.isInteger(erro.status) &&
        erro.status >= 400 &&
        erro.status <= 599
    ) {
        return responderErroRiot(res, erro);
    }

    return res.status(500).json({
        sucesso: false,
        mensagem
    });
}

// Verifica se a integração Riot está disponível
router.get('/status', (req, res) => {
    return res.json({
        sucesso: true,
        mensagem: 'Integração Riot configurada no GameMetrics.'
    });
});

// Consulta uma conta Riot pelo nome e tag
router.get('/conta/:nome/:tag', async (req, res) => {
    try {
        const { nome, tag } = req.params;

        const conta = await buscarContaPorRiotId(nome, tag);

        return res.json({
            sucesso: true,
            conta
        });
    } catch (erro) {
        console.error('Erro ao buscar conta Riot:', erro.message);

        return responderErroRiot(res, erro);
    }
});

// Consulta o histórico de partidas do VALORANT
router.get('/historico/:puuid', async (req, res) => {
    try {
        const { puuid } = req.params;

        const historico = await buscarHistoricoValorant(puuid);

        return res.json({
            sucesso: true,
            historico
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico Riot:', erro.message);

        return responderErroRiot(res, erro);
    }
});

// Vincula uma conta Riot ao usuário logado
router.post('/vincular', async (req, res) => {
    try {
        const { nome, tag } = req.body || {};

        if (
            typeof nome !== 'string' ||
            typeof tag !== 'string' ||
            !nome.trim() ||
            !tag.trim()
        ) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o nome e a tag da Riot.'
            });
        }

        const contaRiot = await buscarContaPorRiotId(
            nome.trim(),
            tag.trim()
        );

        if (!contaRiot || !contaRiot.puuid) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Conta Riot não encontrada.'
            });
        }

        const contaExistente = await buscarContaRiot(
            db,
            contaRiot.puuid
        );

        if (contaExistente) {
            return res.status(409).json({
                sucesso: false,
                mensagem: 'Esta conta Riot já está vinculada.'
            });
        }

        await salvarContaRiot(db, {
            usuario_id: req.session.uid,
            puuid: contaRiot.puuid,
            game_name: contaRiot.gameName,
            tag_line: contaRiot.tagLine
        });

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Conta Riot vinculada com sucesso.'
        });
    } catch (erro) {
        console.error('Erro ao vincular conta Riot:', erro.message);

        return responderErroOperacao(
            res,
            erro,
            'Não foi possível vincular a conta Riot.'
        );
    }
});

 // Lista as partidas recentes da conta Riot vinculada

router.get('/partidas-recentes', async (req, res) => {
    try {
        const { henrikRequest } = require('../riot/henrikClient');

        const [contas] = await db.execute(
            `SELECT game_name, tag_line
             FROM riot_conta
             WHERE usuario_id = ?
             LIMIT 1`,
            [req.session.uid]
        );

        if (contas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Vincule sua conta Riot primeiro.'
            });
        }

        const conta = contas[0];
        const nome = encodeURIComponent(conta.game_name);
        const tag = encodeURIComponent(conta.tag_line);

        const resposta = await henrikRequest(
            `/valorant/v3/matches/na/${nome}/${tag}?size=10`
        );

        const partidas = (resposta.data || [])
            .filter(p => p.metadata?.matchid)
            .map(p => ({
                matchId: p.metadata.matchid,
                gameStartTimeMillis: p.metadata.game_start_patched
                    ? Date.parse(p.metadata.game_start_patched) || null
                    : null,
                queueId: p.metadata.mode || null
            }));

        return res.json({
            sucesso: true,
            total: partidas.length,
            partidas
        });

    } catch (erro) {
        console.error('Erro HenrikDev:', erro.message);

        return res.status(erro.status || 500).json({
            sucesso: false,
            mensagem: 'Não foi possível buscar as partidas recentes.'
        });
    }
});

     
// Importa uma partida do VALORANT
router.post('/importar-partida', async (req, res) => {
    try {
        const usuarioId = req.session.uid;
        const { matchId } = req.body || {};

        if (typeof matchId !== 'string' || !matchId.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o ID da partida.'
            });
        }

        const [contas] = await db.execute(
    `SELECT id, puuid
     FROM riot_conta
     WHERE usuario_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [usuarioId]
);

        if (contas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Vincule sua conta Riot primeiro.'
            });
        }

        const conta = contas[0];

        const partida = await importarPartidaValorant(
            db,
            matchId.trim(),
            conta.puuid,
            conta.id
        );

        return res.status(201).json({
            sucesso: true,
            mensagem: 'Partida importada com sucesso.',
            partida
        });
    

} catch (erro) {
    console.error('Erro ao importar partida:', erro.message);

    return responderErroOperacao(
        res,
        erro,
        'Não foi possível importar a partida.'
    );
}
});



 // Lista as partidas importadas do usuário logado
router.get('/minhas-partidas', async (req, res) => {
    try {
        const usuarioId = req.session.uid;

        const sql = `
            SELECT
                p.id,
                p.match_id,
                p.kills,
                p.deaths,
                p.assists,
                p.mapa,
                p.resultado,
                p.pontuacao,
                p.headshots,
                p.bodyshots,
                p.legshots,
                p.dano_total,
                p.rodadas_jogadas,
                p.hs_percentual,
                p.kd,
                p.kda,
                p.adr,
                p.acs,
                p.criado_em,
                c.game_name,
                c.tag_line
            FROM riot_partida AS p
            INNER JOIN riot_conta AS c
                ON p.riot_conta_id = c.id
            WHERE c.usuario_id = ?
            ORDER BY p.criado_em DESC, p.id DESC
            LIMIT 50
        `;

        const [partidas] = await db.execute(
            sql,
            [usuarioId]
        );

        return res.json({
            sucesso: true,
            total: partidas.length,
            partidas
        });
    } catch (erro) {
        console.error(
            'Erro ao listar partidas Riot:',
            erro.message
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível listar as partidas.'
        });
    }
});



 // Retorna as estatísticas do VALORANT do usuário logado
router.get('/estatisticas', async (req, res) => {
    try {
        const usuarioId = req.session.uid;

        const sql = `
            SELECT
                p.kills,
                p.deaths,
                p.assists,
                p.headshots,
                p.bodyshots,
                p.legshots,
                p.dano_total,
                p.rodadas_jogadas,
                p.pontuacao,
                p.resultado
            FROM riot_partida AS p
            INNER JOIN riot_conta AS c
                ON p.riot_conta_id = c.id
            WHERE c.usuario_id = ?
        `;

        const [partidas] = await db.execute(
            sql,
            [usuarioId]
        );

        const estatisticas = calcularEstatisticasValorant(
            partidas
        );

        return res.json({
            sucesso: true,
            estatisticas
        });
    } catch (erro) {
        console.error(
            'Erro ao calcular estatísticas Riot:',
            erro.message
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível calcular as estatísticas.'
        });
    }
});

// Exporta todas as rotas Riot
module.exports = router;

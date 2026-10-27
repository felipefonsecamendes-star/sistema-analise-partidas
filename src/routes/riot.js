
const express = require('express');
const router = express.Router();

const {
    iniciarLoginRiot,
    receberCallbackRiot
} = require('../riot/oauth');

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

router.get('/login', iniciarLoginRiot);
router.get('/callback', receberCallbackRiot);

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

function statusVerificacao(conta) {
    const verificada =
        conta?.propriedade_verificada === true ||
        conta?.propriedade_verificada === 1;

    return {
        propriedade_verificada: verificada,
        tipo: verificada ? 'verificada' : 'consulta',
        mensagem: verificada
            ? 'Propriedade verificada.'
            : 'Conta consultada. Propriedade não verificada.'
    };
}

router.get('/status', (req, res) => {
    return res.json({
        sucesso: true,
        mensagem: 'Consulta de dados Riot disponível.',
        verificacaoAutomatica: false
    });
});

// Consulta pública de dados da conta.
// Consultar não significa comprovar propriedade.
router.get('/conta/:nome/:tag', async (req, res) => {
    try {
        const { nome, tag } = req.params;

        const conta = await buscarContaPorRiotId(nome, tag);

        return res.json({
            sucesso: true,
            conta,
            verificacao: {
                propriedade_verificada: false,
                tipo: 'consulta',
                mensagem: 'Consulta não comprova propriedade.'
            }
        });
    } catch (erro) {
        console.error('Erro ao buscar conta Riot:', erro.message);
        return responderErroRiot(res, erro);
    }
});

router.get('/historico/:puuid', async (req, res) => {
    try {
        const { puuid } = req.params;
        const historico = await buscarHistoricoValorant(puuid);

        return res.json({
            sucesso: true,
            historico,
            propriedade_verificada: false
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico Riot:', erro.message);
        return responderErroRiot(res, erro);
    }
});

// Mantém a rota antiga para compatibilidade com o frontend.
// Ela registra uma consulta, NÃO verifica propriedade.
router.post('/vincular', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;
        const { nome, tag } = req.body || {};

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

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
            if (Number(contaExistente.usuario_id) !== Number(usuarioId)) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        'Esta conta já está registrada em outra consulta.'
                });
            }

            return res.json({
                sucesso: true,
                mensagem:
                    'Conta já adicionada para consulta.',
                conta: {
                    id: contaExistente.id,
                    game_name: contaExistente.game_name,
                    tag_line: contaExistente.tag_line
                },
                verificacao: statusVerificacao(contaExistente)
            });
        }

        await salvarContaRiot(db, {
            usuario_id: usuarioId,
            puuid: contaRiot.puuid,
            game_name: contaRiot.gameName,
            tag_line: contaRiot.tagLine
        });

        return res.status(201).json({
            sucesso: true,
            mensagem:
                'Conta adicionada para consulta. Propriedade não verificada.',
            verificacao: statusVerificacao(null)
        });
    } catch (erro) {
        console.error('Erro ao consultar conta Riot:', erro.message);

        return responderErroOperacao(
            res,
            erro,
            'Não foi possível adicionar a conta para consulta.'
        );
    }
});

// Lista as contas consultadas pelo usuário do GameMetrics.
router.get('/contas-consultadas', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

        const [contas] = await db.execute(
            `SELECT
                id,
                game_name,
                tag_line,
                propriedade_verificada,
                criado_em
             FROM riot_conta
             WHERE usuario_id = ?
             ORDER BY id ASC`,
            [usuarioId]
        );

        return res.json({
            sucesso: true,
            total: contas.length,
            contas: contas.map(conta => ({
                id: conta.id,
                game_name: conta.game_name,
                tag_line: conta.tag_line,
                criado_em: conta.criado_em,
                verificacao: statusVerificacao(conta)
            }))
        });
    } catch (erro) {
        console.error('Erro ao listar contas:', erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível listar as contas consultadas.'
        });
    }
});

// Mantém temporariamente a primeira conta como referência
// para preservar o funcionamento atual da importação.
router.get('/partidas-recentes', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

        const { henrikRequest } = require('../riot/henrikClient');

        const [contas] = await db.execute(
            `SELECT id, game_name, tag_line, propriedade_verificada
             FROM riot_conta
             WHERE usuario_id = ?
             ORDER BY id ASC
             LIMIT 1`,
            [usuarioId]
        );

        if (contas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Consulte uma conta Riot primeiro.'
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
            partidas,
            conta: {
                id: conta.id,
                game_name: conta.game_name,
                tag_line: conta.tag_line
            },
            verificacao: statusVerificacao(conta)
        });
    } catch (erro) {
        console.error('Erro HenrikDev:', erro.message);

        return res.status(erro.status || 500).json({
            sucesso: false,
            mensagem: 'Não foi possível buscar as partidas recentes.'
        });
    }
});

router.post('/importar-partida', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;
        const { matchId } = req.body || {};

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

        if (typeof matchId !== 'string' || !matchId.trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe o ID da partida.'
            });
        }

        const [contas] = await db.execute(
            `SELECT id, puuid, propriedade_verificada
             FROM riot_conta
             WHERE usuario_id = ?
             ORDER BY id ASC
             LIMIT 1`,
            [usuarioId]
        );

        if (contas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Consulte uma conta Riot primeiro.'
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
            partida,
            verificacao: statusVerificacao(conta)
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

router.get('/minhas-partidas', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

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
                c.tag_line,
                c.propriedade_verificada
            FROM riot_partida AS p
            INNER JOIN riot_conta AS c
                ON p.riot_conta_id = c.id
            WHERE c.usuario_id = ?
            ORDER BY p.criado_em DESC, p.id DESC
            LIMIT 50
        `;

        const [partidas] = await db.execute(sql, [usuarioId]);

        return res.json({
            sucesso: true,
            total: partidas.length,
            tipo: 'partidas_consultadas',
            partidas: partidas.map(partida => ({
                ...partida,
                verificacao: statusVerificacao(partida)
            }))
        });
    } catch (erro) {
        console.error('Erro ao listar partidas Riot:', erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível listar as partidas.'
        });
    }
});

router.get('/estatisticas', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

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

        const [partidas] = await db.execute(sql, [usuarioId]);
        const estatisticas = calcularEstatisticasValorant(partidas);

        return res.json({
            sucesso: true,
            tipo: 'estatisticas_de_contas_consultadas',
            propriedadeConfirmada: false,
            estatisticas
        });
    } catch (erro) {
        console.error('Erro ao calcular estatísticas Riot:', erro.message);

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível calcular as estatísticas.'
        });
    }
});

router.get('/partida/:id/detalhes', async (req, res) => {
    try {
        const usuarioId = req.session?.uid;
        const partidaId = Number(req.params.id);

        if (!usuarioId) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Faça login no GameMetrics.'
            });
        }

        if (!Number.isInteger(partidaId) || partidaId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID da partida inválido.'
            });
        }

        const [partidas] = await db.execute(
            `SELECT
                p.*,
                c.game_name,
                c.tag_line,
                c.propriedade_verificada
             FROM riot_partida AS p
             INNER JOIN riot_conta AS c
                ON p.riot_conta_id = c.id
             WHERE p.id = ?
               AND c.usuario_id = ?
             LIMIT 1`,
            [partidaId, usuarioId]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Partida não encontrada.'
            });
        }

        const [jogadores] = await db.execute(
            `SELECT
                nick,
                tag,
                equipe,
                agente,
                kills,
                deaths,
                assists,
                hs_percentual,
                adr,
                acs
             FROM riot_partida_jogador
             WHERE partida_id = ?
             ORDER BY equipe, kills DESC`,
            [partidaId]
        );

        return res.json({
            sucesso: true,
            partida: partidas[0],
            verificacao: statusVerificacao(partidas[0]),
            jogadores
        });
    } catch (erro) {
        console.error(
            'Erro ao buscar detalhes da partida:',
            erro.message
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível carregar os detalhes.'
        });
    }
});

module.exports = router;

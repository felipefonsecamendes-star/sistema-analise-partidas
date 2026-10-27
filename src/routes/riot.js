
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

function exigirLogin(req, res, next) {
    if (!req.session?.uid) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Faça login no GameMetrics.'
        });
    }

    next();
}

function validarContaId(valor) {
    const id = Number(valor);

    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === '' ||
        !Number.isSafeInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

// Retorna apenas contas adicionadas pelo usuário logado.
async function obterContaConsultada(usuarioId, contaId) {
    const id = validarContaId(contaId);

    if (!id) {
        return null;
    }

    const [contas] = await db.execute(
        `SELECT
            id,
            puuid,
            game_name,
            tag_line,
            propriedade_verificada
         FROM riot_conta
         WHERE id = ?
           AND usuario_id = ?
         LIMIT 1`,
        [id, usuarioId]
    );

    return contas[0] || null;
}

router.get('/status', (req, res) => {
    return res.json({
        sucesso: true,
        mensagem: 'Consulta de dados Riot disponível.',
        verificacaoAutomatica: false
    });
});

router.get('/conta/:nome/:tag', async (req, res) => {
    try {
        const { nome, tag } = req.params;

        const conta = await buscarContaPorRiotId(nome, tag);

        return res.json({
            sucesso: true,
            conta,
            verificacao: statusVerificacao(null)
        });
    } catch (erro) {
        console.error('Erro ao buscar conta Riot:', erro.message);
        return responderErroRiot(res, erro);
    }
});

router.get('/historico/:puuid', async (req, res) => {
    try {
        const historico = await buscarHistoricoValorant(
            req.params.puuid
        );

        return res.json({
            sucesso: true,
            historico,
            verificacao: statusVerificacao(null)
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico Riot:', erro.message);
        return responderErroRiot(res, erro);
    }
});

// Nome da rota mantido por compatibilidade.
// Adicionar uma conta não comprova sua propriedade.
router.post('/vincular', exigirLogin, async (req, res) => {
    try {
        const { nome, tag } = req.body || {};
        const usuarioId = req.session.uid;

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

        if (!contaRiot?.puuid) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Conta Riot não encontrada.'
            });
        }

        const existente = await buscarContaRiot(
            db,
            contaRiot.puuid
        );

        if (existente) {
            if (Number(existente.usuario_id) !== Number(usuarioId)) {
                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        'Esta conta já está registrada em outra consulta.'
                });
            }

            return res.json({
                sucesso: true,
                mensagem: 'Conta já adicionada para consulta.',
                contaId: existente.id,
                verificacao: statusVerificacao(existente)
            });
        }

        await salvarContaRiot(db, {
            usuario_id: usuarioId,
            puuid: contaRiot.puuid,
            game_name: contaRiot.gameName,
            tag_line: contaRiot.tagLine
        });

        const novaConta = await buscarContaRiot(
            db,
            contaRiot.puuid
        );

        return res.status(201).json({
            sucesso: true,
            mensagem:
                'Conta adicionada para consulta. Propriedade não verificada.',
            contaId: novaConta?.id || null,
            verificacao: statusVerificacao(novaConta)
        });
    } catch (erro) {
        console.error('Erro ao adicionar conta Riot:', erro.message);

        return responderErroOperacao(
            res,
            erro,
            'Não foi possível adicionar a conta para consulta.'
        );
    }
});

router.get(
    '/contas-consultadas',
    exigirLogin,
    async (req, res) => {
        try {
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
                [req.session.uid]
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
                mensagem: 'Não foi possível listar as contas.'
            });
        }
    }
);

// Partidas recentes da conta escolhida.
router.get(
    '/partidas-recentes',
    exigirLogin,
    async (req, res) => {
        try {
            const conta = await obterContaConsultada(
                req.session.uid,
                req.query.contaId
            );

            if (!conta) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione uma conta Riot válida.'
                });
            }

            const { henrikRequest } = require(
                '../riot/henrikClient'
            );

            const nome = encodeURIComponent(conta.game_name);
            const tag = encodeURIComponent(conta.tag_line);

            const resposta = await henrikRequest(
                `/valorant/v3/matches/na/${nome}/${tag}?size=10`
            );

            const partidas = (resposta.data || [])
                .filter(p => p.metadata?.matchid)
                .map(p => ({
                    matchId: p.metadata.matchid,
                    gameStartTimeMillis:
                        p.metadata.game_start_patched
                            ? Date.parse(
                                p.metadata.game_start_patched
                            ) || null
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

            return res.status(
                Number.isInteger(erro.status) &&
                erro.status >= 400 &&
                erro.status <= 599
                    ? erro.status
                    : 500
            ).json({
                sucesso: false,
                mensagem:
                    'Não foi possível buscar as partidas recentes.'
            });
        }
    }
);

// Importa uma partida da conta selecionada.
router.post(
    '/importar-partida',
    exigirLogin,
    async (req, res) => {
        try {
            const { matchId, contaId } = req.body || {};

            if (
                typeof matchId !== 'string' ||
                !matchId.trim()
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Informe o ID da partida.'
                });
            }

            const conta = await obterContaConsultada(
                req.session.uid,
                contaId
            );

            if (!conta) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione uma conta Riot válida.'
                });
            }

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
    }
);

// Histórico da conta selecionada.
router.get(
    '/minhas-partidas',
    exigirLogin,
    async (req, res) => {
        try {
            const conta = await obterContaConsultada(
                req.session.uid,
                req.query.contaId
            );

            if (!conta) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione uma conta Riot válida.'
                });
            }

            const [partidas] = await db.execute(
                `SELECT
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
                 WHERE c.id = ?
                   AND c.usuario_id = ?
                 ORDER BY p.criado_em DESC, p.id DESC
                 LIMIT 50`,
                [conta.id, req.session.uid]
            );

            return res.json({
                sucesso: true,
                total: partidas.length,
                tipo: 'partidas_consultadas',
                contaId: conta.id,
                verificacao: statusVerificacao(conta),
                partidas
            });
        } catch (erro) {
            console.error('Erro ao listar partidas:', erro.message);

            return res.status(500).json({
                sucesso: false,
                mensagem: 'Não foi possível listar as partidas.'
            });
        }
    }
);

// Estatísticas apenas da conta selecionada.
router.get(
    '/estatisticas',
    exigirLogin,
    async (req, res) => {
        try {
            const conta = await obterContaConsultada(
                req.session.uid,
                req.query.contaId
            );

            if (!conta) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione uma conta Riot válida.'
                });
            }

            const [partidas] = await db.execute(
                `SELECT
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
                 WHERE c.id = ?
                   AND c.usuario_id = ?`,
                [conta.id, req.session.uid]
            );

            const estatisticas =
                calcularEstatisticasValorant(partidas);

            return res.json({
                sucesso: true,
                tipo: 'estatisticas_de_conta_consultada',
                contaId: conta.id,
                verificacao: statusVerificacao(conta),
                estatisticas
            });
        } catch (erro) {
            console.error('Erro ao calcular estatísticas:', erro.message);

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    'Não foi possível calcular as estatísticas.'
            });
        }
    }
);

// Detalhes de partida pertencente à consulta do usuário.
router.get(
    '/partida/:id/detalhes',
    exigirLogin,
    async (req, res) => {
        try {
            const partidaId = Number(req.params.id);

            if (
                !Number.isSafeInteger(partidaId) ||
                partidaId <= 0
            ) {
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
                [partidaId, req.session.uid]
            );

            if (!partidas.length) {
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
                'Erro ao buscar detalhes:',
                erro.message
            );

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    'Não foi possível carregar os detalhes.'
            });
        }
    }
);

module.exports = router;


const express = require('express');
const router = express.Router();

const db = require('../db');

const {
    buscarContaPorRiotId,
    buscarHistoricoValorant
} = require('../riot/service');

const {
    buscarContaRiot,
    salvarContaRiot
} = require('../riot/repository');

// Verifica se a integração Riot está disponível
router.get('/status', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'Integração Riot configurada no GameMetrics.'
    });
});

// Consulta uma conta Riot pelo nome e tag
router.get('/conta/:nome/:tag', async (req, res) => {
    try {
        const { nome, tag } = req.params;

        const conta = await buscarContaPorRiotId(nome, tag);

        res.json({
            sucesso: true,
            conta
        });
    } catch (erro) {
        console.error('Erro ao buscar conta Riot:', erro.message);

        res.status(502).json({
            sucesso: false,
            mensagem: 'Não foi possível consultar a conta Riot.'
        });
    }
});

// Consulta o histórico de partidas do VALORANT
router.get('/historico/:puuid', async (req, res) => {
    try {
        const { puuid } = req.params;

        const historico = await buscarHistoricoValorant(puuid);

        res.json({
            sucesso: true,
            historico
        });
    } catch (erro) {
        console.error('Erro ao buscar histórico Riot:', erro.message);

        res.status(502).json({
            sucesso: false,
            mensagem: 'Não foi possível consultar o histórico de partidas.'
        });
    }
});

// Vincula uma conta Riot ao usuário logado
router.post('/vincular', async (req, res) => {
    try {
        const { nome, tag } = req.body;

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

        // Consulta a conta na API Riot
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

        // Verifica se a conta já está vinculada
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

        // Salva a conta no banco de dados
        await salvarContaRiot(db, {
            usuario_id: req.session.uid,
            puuid: contaRiot.puuid,
            game_name: contaRiot.gameName,
            tag_line: contaRiot.tagLine
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Conta Riot vinculada com sucesso.'
        });
    } catch (erro) {
        console.error('Erro ao vincular conta Riot:', erro.message);

        res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível vincular a conta Riot.'
        });
    }
});

const {
    importarPartidaValorant
} = require('../riot/integration');

// Importa uma partida do VALORANT para o GameMetrics
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

        // Busca a conta Riot vinculada ao usuário
        const [contas] = await db.execute(
            `SELECT id, puuid
             FROM riot_conta
             WHERE usuario_id = ?
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

        // Consulta, processa e salva a partida
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
        console.error(
            'Erro ao importar partida:',
            erro.message
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Não foi possível importar a partida.'
        });
    }
});

module.exports = router;

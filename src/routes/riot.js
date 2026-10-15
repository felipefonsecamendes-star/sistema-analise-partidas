
const express = require('express');
const router = express.Router();

const {
    buscarContaPorRiotId,
    buscarHistoricoValorant
} = require('../riot/service');

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

module.exports = router;

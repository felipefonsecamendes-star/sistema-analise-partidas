
const express = require('express');

const router = express.Router();

// Verifica se a integração Riot está disponível
router.get('/status', (req, res) => {
    res.json({
        sucesso: true,
        mensagem: 'Integração Riot configurada no GameMetrics.'
    });
});

module.exports = router;

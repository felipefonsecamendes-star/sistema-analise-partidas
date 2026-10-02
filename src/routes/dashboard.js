const r = require('express').Router();
const db = require('../db');
// RF16: resumo do painel
r.get('/', async (req, res) => {
  const [[x]] = await db.query(`SELECT COUNT(*) total, SUM(p.resultado='Vitória') vitorias,
    SUM(p.resultado='Derrota') derrotas, AVG(d.kd) kd, AVG(d.precisao) precisao,
    AVG(d.porcentagem_headshot) hs
    FROM partida p JOIN desempenho d USING(id_partida) WHERE p.id_usuario=?`, [req.session.uid]);
  res.json(x);
});
module.exports = r;

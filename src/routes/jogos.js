const r = require('express').Router();
const db = require('../db');
r.get('/', async (req, res) => {
  const [rows] = await db.query('SELECT id_jogo,nome FROM jogo ORDER BY nome');
  res.json(rows);
});
module.exports = r;

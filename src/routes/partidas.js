const r = require('express').Router();
const db = require('../db');

const SEL = `SELECT p.id_partida id, p.data_partida data, j.nome jogo, p.mapa, p.resultado, p.duracao,
  e.kills, e.deaths, e.assists, e.tiros_disparados, e.tiros_acertados, e.headshots,
  e.dinheiro_ganho, e.dinheiro_gasto,
  d.precisao, d.porcentagem_headshot hs_pct, d.kd, d.pontuacao
  FROM partida p JOIN jogo j USING(id_jogo)
  JOIN estatistica e USING(id_partida) JOIN desempenho d USING(id_partida)
  WHERE p.id_usuario=?`;
const n = v => Math.max(0, parseInt(v) || 0);

// RF04 + RF06-RF09: cadastra e calcula indicadores
r.post('/', async (req, res) => {
  const b = req.body;
  const k = n(b.kills), d = n(b.deaths), a = n(b.assists);
  const td = n(b.tiros_disparados), ta = n(b.tiros_acertados), hs = n(b.headshots);
  if (!b.id_jogo || !b.data_partida || !['Vitória', 'Derrota', 'Empate'].includes(b.resultado))
    return res.status(400).json({ erro: 'Jogo, data e resultado são obrigatórios' });
  if (ta > td || hs > k)
    return res.status(400).json({ erro: 'Tiros acertados não podem superar disparados, nem headshots superar kills' });
  const precisao = td ? (ta / td) * 100 : 0;
  const hsPct = k ? (hs / k) * 100 : 0;
  const kd = k / Math.max(d, 1);
  const pontuacao = k * 2 + a - d;
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    const [p] = await c.query(
      'INSERT INTO partida(id_usuario,id_jogo,data_partida,mapa,resultado,duracao) VALUES(?,?,?,?,?,?)',
      [req.session.uid, b.id_jogo, b.data_partida, b.mapa || '', b.resultado, b.duracao || '00:00:00']);
    await c.query(`INSERT INTO estatistica(id_partida,kills,deaths,assists,tiros_disparados,tiros_acertados,
      headshots,dinheiro_ganho,dinheiro_gasto) VALUES(?,?,?,?,?,?,?,?,?)`,
      [p.insertId, k, d, a, td, ta, hs, +b.dinheiro_ganho || 0, +b.dinheiro_gasto || 0]);
    await c.query('INSERT INTO desempenho(id_partida,precisao,porcentagem_headshot,kd,pontuacao) VALUES(?,?,?,?,?)',
      [p.insertId, precisao, hsPct, kd, pontuacao]);
    await c.commit();
    res.json({ id: p.insertId });
  } catch (e) {
    await c.rollback();
    res.status(500).json({ erro: 'Erro ao salvar a partida' });
  } finally { c.release(); }
});

// RF11 + RF13 + RF17: histórico com filtros
r.get('/', async (req, res) => {
  let s = SEL; const a = [req.session.uid]; const q = req.query;
  if (q.jogo) { s += ' AND p.id_jogo=?'; a.push(q.jogo); }
  if (q.de) { s += ' AND p.data_partida>=?'; a.push(q.de); }
  if (q.ate) { s += ' AND p.data_partida<=?'; a.push(q.ate + ' 23:59:59'); }
  const [rows] = await db.query(s + ' ORDER BY p.data_partida DESC', a);
  res.json(rows);
});

r.get('/:id', async (req, res) => {
  const [[row]] = await db.query(SEL + ' AND p.id_partida=?', [req.session.uid, req.params.id]);
  row ? res.json(row) : res.status(404).json({ erro: 'Partida não encontrada' });
});

// RF15
r.delete('/:id', async (req, res) => {
  const [x] = await db.query('DELETE FROM partida WHERE id_partida=? AND id_usuario=?',
    [req.params.id, req.session.uid]);
  res.json({ apagadas: x.affectedRows });
});
module.exports = r;

const r = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const auth = require('../auth');

r.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha || senha.length < 6)
    return res.status(400).json({ erro: 'Preencha tudo (senha mínima: 6 caracteres)' });
  try {
    await db.query('INSERT INTO usuario(nome,email,senha) VALUES(?,?,?)',
      [nome, email, await bcrypt.hash(senha, 10)]);
    res.json({ ok: 1 });
  } catch (e) {
    res.status(400).json({ erro: e.code === 'ER_DUP_ENTRY' ? 'E-mail já cadastrado' : 'Erro ao cadastrar' });
  }
});

r.post('/login', async (req, res) => {
  const [[u]] = await db.query('SELECT * FROM usuario WHERE email=?', [req.body.email]);
  if (!u || !(await bcrypt.compare(req.body.senha || '', u.senha)))
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  req.session.uid = u.id_usuario;
  res.json({ nome: u.nome });
});

r.post('/logout', (req, res) => req.session.destroy(() => res.json({ ok: 1 })));

r.get('/me', auth, async (req, res) => {
  const [[u]] = await db.query('SELECT nome,email FROM usuario WHERE id_usuario=?', [req.session.uid]);
  res.json(u);
});

r.put('/me', auth, async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    await db.query('UPDATE usuario SET nome=?,email=? WHERE id_usuario=?', [nome, email, req.session.uid]);
    if (senha) {
      if (senha.length < 6) return res.status(400).json({ erro: 'Senha mínima: 6 caracteres' });
      await db.query('UPDATE usuario SET senha=? WHERE id_usuario=?', [await bcrypt.hash(senha, 10), req.session.uid]);
    }
    res.json({ ok: 1 });
  } catch (e) { res.status(400).json({ erro: 'E-mail já em uso' }); }
});
module.exports = r;

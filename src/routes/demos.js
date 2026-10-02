const r = require('express').Router({ mergeParams: true });
const multer = require('multer');
const fs = require('fs');
const db = require('../db');
fs.mkdirSync('uploads', { recursive: true });
const up = multer({
  dest: 'uploads/', limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /\.(dem|rofl)$/i.test(f.originalname))
});

// RF05: guarda a demo; status "Pendente" até existir um parser do formato
r.post('/', up.single('demo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo .dem válido' });
  const [[p]] = await db.query('SELECT 1 x FROM partida WHERE id_partida=? AND id_usuario=?',
    [req.params.id, req.session.uid]);
  if (!p) return res.status(404).json({ erro: 'Partida não encontrada' });
  await db.query(`INSERT INTO demo(id_partida,nome_arquivo,caminho_arquivo,status_processamento)
    VALUES(?,?,?,?)`, [req.params.id, req.file.originalname, req.file.path, 'Pendente']);
  res.json({ ok: 1 });
});
module.exports = r;

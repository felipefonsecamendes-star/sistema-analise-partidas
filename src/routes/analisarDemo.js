const r = require('express').Router();
const multer = require('multer');
const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const up = multer({ dest: os.tmpdir(), limits: { fileSize: 1024 * 1024 * 1024 } });

// Recebe a .dem e manda o src/leitorDemo.js analisar em outro processo (com limite de tempo)
r.post('/', up.single('demo'), (req, res) => {
  if (!req.file) return res.status(400).json({ erro: 'Envie um arquivo .dem' });
  const arq = req.file.path;
  if (!/\.dem$/i.test(req.file.originalname)) {
    fs.unlink(arq, () => {});
    return res.status(400).json({ erro: 'O arquivo precisa ser uma demo .dem' });
  }
  const filho = fork(path.join(__dirname, '..', 'leitorDemo.js'), [arq]);
  let respondeu = false;
  const responde = (status, corpo) => {
    if (respondeu) return;
    respondeu = true; clearTimeout(limite); filho.kill(); fs.unlink(arq, () => {});
    res.status(status).json(corpo);
  };
  const limite = setTimeout(() => responde(504, { erro: 'A análise demorou demais. Tente outra demo.' }), 180000);
  filho.on('message', m => m.erro
    ? responde(422, { erro: 'Não consegui ler esta demo: ' + m.erro })
    : responde(200, m.dados));
  filho.on('exit', () => setTimeout(() => responde(422,
    { erro: 'O leitor travou ao abrir esta demo (talvez não seja de CS2 ou esteja incompleta).' }), 300));
});
module.exports = r;

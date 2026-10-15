require('dotenv').config();
const express = require('express');
const session = require('express-session');
const auth = require('./src/auth');
const app = express();

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));
app.use('/api', require('./src/routes/usuarios'));
app.use('/api/jogos', auth, require('./src/routes/jogos'));
app.use('/api/riot', auth, require('./src/routes/riot'));
app.use('/api/dashboard', auth, require('./src/routes/dashboard'));
app.use('/api/demo', auth, require('./src/routes/analisarDemo'));
app.use('/api/partidas/:id/demo', auth, require('./src/routes/demos'));
app.use('/api/partidas', auth, require('./src/routes/partidas'));
app.use(express.static('public'));
app.use((err, req, res, next) => { console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ erro: 'Arquivo grande demais (máximo 1 GB)' }); res.status(500).json({ erro: 'Erro interno' }); });

app.listen(process.env.PORT || 3000, () => console.log('Rodando em http://localhost:' + (process.env.PORT || 3000)));

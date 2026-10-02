// Middleware: só deixa passar quem já fez login (RF02)
module.exports = (req, res, next) =>
  req.session.uid ? next() : res.status(401).json({ erro: 'Faça login' });

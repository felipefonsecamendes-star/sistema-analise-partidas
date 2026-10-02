const $ = s => document.querySelector(s);
const msg = (t, ok) => { $('#msg').textContent = t; $('#msg').className = ok ? 'ok' : 'erro'; };
const post = (u, b) => fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
  .then(async r => { const j = await r.json(); if (!r.ok) throw j.erro; return j; });
const alterna = c => { $('#fl').hidden = c; $('#fc').hidden = !c; msg(''); };
$('#tg').onclick = () => alterna(true);
$('#tv').onclick = () => alterna(false);
$('#fl').onsubmit = async e => {
  e.preventDefault();
  try { await post('/api/login', { email: $('#email').value, senha: $('#senha').value }); location = 'app.html'; }
  catch (x) { msg(x); }
};
$('#fc').onsubmit = async e => {
  e.preventDefault();
  if ($('#cs').value !== $('#cc').value) return msg('As senhas não coincidem');
  try {
    await post('/api/cadastro', { nome: $('#cn').value, email: $('#ce').value, senha: $('#cs').value });
    alterna(false); msg('Conta criada! Faça login.', true);
  } catch (x) { msg(x); }
};

telas.perfil = async () => {
  const u = await f('/api/me');
  v.innerHTML = `<form id="fp" style="max-width:380px"><label>Nome<input id="nome" value="${esc(u.nome)}"></label>
    <label>E-mail<input id="email" type="email" value="${esc(u.email)}"></label>
    <label>Nova senha (opcional)<input id="senha" type="password"></label>
    <button>Salvar</button><p id="msg" class="erro"></p></form>`;
  $('#fp').onsubmit = async e => {
    e.preventDefault();
    try { await f('/api/me', J('PUT', { nome: $('#nome').value, email: $('#email').value, senha: $('#senha').value })); $('#msg').className = 'ok'; $('#msg').textContent = 'Salvo!'; }
    catch (x) { $('#msg').textContent = x; }
  };
};

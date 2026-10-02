telas.historico = async () => {
  const jogos = await f('/api/jogos');
  v.innerHTML = `<div class="grid"><label>Jogo<select id="fj"><option value="">Todos</option>${jogos.map(j => `<option value="${j.id_jogo}">${esc(j.nome)}</option>`).join('')}</select></label>
    <label>De<input id="fd" type="date"></label><label>Até<input id="fa" type="date"></label></div>
    <button id="fb">Filtrar</button> <button class="sec" id="fc">Comparar 2 selecionadas</button>
    <div id="cmp"></div><div class="wrap" id="lista"></div>`;
  let rows = [];
  const carrega = async () => {
    rows = await f(`/api/partidas?jogo=${$('#fj').value}&de=${$('#fd').value}&ate=${$('#fa').value}`);
    $('#lista').innerHTML = `<table><tr><th></th><th>Data</th><th>Jogo</th><th>Mapa</th><th>Result.</th><th>K/D</th><th>Prec.</th><th>HS%</th><th></th></tr>
      ${rows.map(p => `<tr><td><input type="checkbox" class="sel" value="${p.id}"></td><td>${new Date(p.data).toLocaleString('pt-BR')}</td>
      <td>${esc(p.jogo)}</td><td>${esc(p.mapa)}</td><td>${p.resultado}</td><td>${(+p.kd).toFixed(2)}</td>
      <td>${(+p.precisao).toFixed(1)}%</td><td>${(+p.hs_pct).toFixed(1)}%</td>
      <td><button class="sec" data-ver="${p.id}">Ver</button> <button class="red" data-del="${p.id}">Excluir</button></td></tr>`).join('')}</table>`;
  };
  $('#fb').onclick = carrega;
  $('#lista').onclick = async e => {
    if (e.target.dataset.ver) resultado(e.target.dataset.ver);
    if (e.target.dataset.del && confirm('Excluir esta partida?')) { await f('/api/partidas/' + e.target.dataset.del, { method: 'DELETE' }); carrega(); }
  };
  $('#fc').onclick = () => {
    const ids = [...document.querySelectorAll('.sel:checked')].map(x => +x.value);
    if (ids.length !== 2) return ($('#cmp').textContent = 'Marque exatamente 2 partidas.');
    const [a, b] = ids.map(i => rows.find(r => r.id === i));
    const l = ['kd', 'kills', 'deaths', 'assists', 'precisao', 'hs_pct', 'dinheiro_gasto'];
    $('#cmp').innerHTML = `<table><tr><th>Métrica</th><th>A</th><th>B</th></tr>${l.map(k => `<tr><td>${NOMES[k] || k}</td><td>${(+a[k]).toFixed(2)}</td><td>${(+b[k]).toFixed(2)}</td></tr>`).join('')}</table>`;
  };
  carrega();
};

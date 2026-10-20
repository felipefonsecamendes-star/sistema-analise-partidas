// Tela do VALORANT: vincular conta, importar partida, estatísticas e histórico
telas.riot = async () => {
  const riotLoginUrl = '/api/riot/login';
  v.innerHTML = `<h2 class="tit"><img class="ico" style="width:34px;height:34px;margin-right:12px" src="img/valorant.png" alt="">Valorant</h2>
    <section class="painel"><h3 class="sub" style="margin-top:0">Conta Riot</h3>
    <p>Conecte sua conta Riot Games para acessar suas estatísticas.</p>
<a class="btn" href="${riotLoginUrl}" style="display:inline-block;margin-bottom:20px">
  Conectar com Riot Games
</a>
      <form id="fv" class="grid"><label>Nome<input id="rnome" placeholder="SeuNome" required></label>
        <label>Tag<input id="rtag" placeholder="BR1" required></label>
        <div style="align-self:end;margin-bottom:14px"><button>Vincular conta</button></div></form>
      <form id="fi" class="grid"><label style="grid-column:span 2">ID da partida<input id="rmatch" placeholder="Cole aqui o ID da partida" required></label>
        <div style="align-self:end;margin-bottom:14px"><button class="sec">Importar partida</button></div></form>
      <p id="rmsg" class="erro" style="margin:0"></p></section>
    <div id="dados"></div>`;
  const aviso = (t, ok) => { $('#rmsg').className = ok ? 'ok' : 'erro'; $('#rmsg').textContent = t; };
  $('#fv').onsubmit = async e => {
    e.preventDefault();
    try { const r = await f('/api/riot/vincular', J('POST', { nome: $('#rnome').value, tag: $('#rtag').value })); aviso(r.mensagem, true); }
    catch (x) { aviso(x); }
  };
  $('#fi').onsubmit = async e => {
    e.preventDefault();
    try { const r = await f('/api/riot/importar-partida', J('POST', { matchId: $('#rmatch').value.trim() })); aviso(r.mensagem || 'Partida importada.', true); carrega(); }
    catch (x) { aviso(x); }
  };
  async function carrega() {
    try {
      const [s, p] = await Promise.all([f('/api/riot/estatisticas'), f('/api/riot/minhas-partidas')]);
      const e = s.estatisticas, n = x => Number(x) || 0, partidas = p.partidas;
      const itens = [['Partidas', e.totalPartidas], ['Vitórias', e.vitorias], ['Derrotas', e.derrotas], ['Kills', e.kills], ['Mortes', e.deaths],
        ['Assistências', e.assists], ['K/D', n(e.kd).toFixed(2)], ['KDA', n(e.kda).toFixed(2)], ['Taxa de vitória', e.taxaVitoria + '%']];
      $('#dados').innerHTML = `<div class="cards tres">${itens.map(([a, b]) => `<div class="card"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
        <h3 class="sub">Últimas partidas</h3>
        <div class="grid"><label>Resultado<select id="rfr"><option value="">Todos</option><option>Vitória</option><option>Derrota</option></select></label>
        <label>Mapa<input id="rfm" placeholder="Ex.: Ascent, Bind, Haven"></label></div>
        <div id="rhist"></div>`;
      const desenha = () => {
        const mapa = $('#rfm').value.trim().toLowerCase(), res = $('#rfr').value;
        const lista = partidas.filter(x => (!res || x.resultado === res) && String(x.mapa || '').toLowerCase().includes(mapa));
        $('#rhist').innerHTML = lista.length ? `<div class="wrap"><table><tr><th>Data</th><th>Mapa</th><th>Resultado</th><th>Kills</th><th>Mortes</th><th>Assist.</th><th>K/D</th></tr>
          ${lista.map(x => { const k = n(x.kills), d = n(x.deaths);
            return `<tr><td>${x.criado_em ? new Date(x.criado_em).toLocaleDateString('pt-BR') : '-'}</td><td>${esc(x.mapa || '-')}</td><td>${badge(x.resultado || 'Indefinido')}</td>
            <td>${k}</td><td>${d}</td><td>${n(x.assists)}</td><td>${(d ? k / d : k).toFixed(2)}</td></tr>`; }).join('')}</table></div>`
          : '<p class="rot">Nenhuma partida encontrada. Vincule sua conta e importe uma partida acima.</p>';
      };
      $('#rfr').onchange = $('#rfm').oninput = desenha; desenha();
    } catch (x) { $('#dados').innerHTML = `<p class="erro">Não foi possível carregar os dados do Valorant: ${esc(x)}</p>`; }
  }
  carrega();
};

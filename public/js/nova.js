const CAMPOS = [['data_partida', 'Data e hora', 'datetime-local'], ['mapa', 'Mapa', 'text'],
  ['duracao', 'Duração (hh:mm:ss)', 'text'], ['kills', 'Kills'], ['deaths', 'Deaths'], ['assists', 'Assists'],
  ['tiros_disparados', 'Tiros disparados'], ['tiros_acertados', 'Tiros acertados'], ['headshots', 'Headshots'],
  ['dinheiro_ganho', 'Dinheiro ganho'], ['dinheiro_gasto', 'Dinheiro gasto']];
telas.nova = async () => {
  const jogos = await f('/api/jogos');
  v.innerHTML = `<h2 class="tit">Nova partida</h2><form id="fm"><label class="drop">Demo do CS2 (.dem, opcional) - preenche tudo sozinho<input id="demo" type="file" accept=".dem"></label><div id="jogs"></div><div id="prev" class="cards"></div><div class="grid">
    <div style="grid-column:1/-1"><label>Jogo</label><div class="jogos">${jogos.map((j, i) => `<button type="button" class="jogo ${i ? '' : 'on'} ${/valorant/i.test(j.nome) ? 'val' : 'cs'}" data-id="${j.id_jogo}" data-nome="${esc(j.nome)}"><img src="${IMG(j.nome)}" alt=""><b>${esc(j.nome)}</b><small>${/valorant/i.test(j.nome) ? 'Cadastro manual' : 'Aceita demo (.dem)'}</small></button>`).join('')}</div><input type="hidden" id="id_jogo" value="${jogos[0] ? jogos[0].id_jogo : ''}"></div>
    <label>Resultado<select id="resultado"><option>Vitória</option><option>Derrota</option><option>Empate</option></select></label>
    ${CAMPOS.map(([id, l, t = 'number']) => `<label>${l}<input id="${id}" type="${t}" ${t === 'number' ? 'min="0" step="any"' : ''}></label>`).join('')}
    </div>
    <button class="enviar">Analisar partida</button><p id="msg" class="erro"></p></form>`;
  document.querySelectorAll('.jogo').forEach(b => b.onclick = () => {
    document.querySelectorAll('.jogo').forEach(x => x.classList.toggle('on', x === b));
    $('#id_jogo').value = b.dataset.id;
  });
  $('#demo').onchange = lerDemo;
  $('#fm').onsubmit = async e => {
    e.preventDefault();
    const dados = Object.fromEntries([...e.target.elements].filter(x => x.id && x.type !== 'file').map(x => [x.id, x.value]));
    const btn = e.target.querySelector('.enviar'), msg = $('#msg');
    btn.disabled = true; msg.className = 'ok'; msg.textContent = 'Salvando...';
    try {
      const { id } = await f('/api/partidas', J('POST', dados));
      const arq = $('#demo').files[0];
      let aviso = '';
      if (arq) {
        try { const fd = new FormData(); fd.append('demo', arq); await f(`/api/partidas/${id}/demo`, { method: 'POST', body: fd }); }
        catch (x) { aviso = 'A partida foi salva, mas o arquivo da demo não pôde ser anexado: ' + x; }
      }
      await resultado(id);
      if (aviso) v.insertAdjacentHTML('beforeend', `<p class="erro">${esc(aviso)}</p>`);
    } catch (x) { btn.disabled = false; msg.className = 'erro'; msg.textContent = x; msg.scrollIntoView({ behavior: 'smooth' }); }
  };
};
async function resultado(id) {
  const p = await f('/api/partidas/' + id);
  const it = [['K/D', (+p.kd).toFixed(2)], ['Kills', p.kills], ['Deaths', p.deaths], ['Assists', p.assists],
    ['Precisão', (+p.precisao).toFixed(1) + '%'], ['Headshots', p.headshots + ' (' + (+p.hs_pct).toFixed(1) + '%)'],
    ['Dinheiro ganho', p.dinheiro_ganho], ['Dinheiro gasto', p.dinheiro_gasto],
    ['Resultado', p.resultado], ['Mapa', esc(p.mapa)], ['Duração', p.duracao]];
  v.innerHTML = `<h3>Resultado da partida</h3><div class="cards">${it.map(([a, b]) => `<div class="card"><small>${a}</small><b>${b}</b></div>`).join('')}</div>`;
}

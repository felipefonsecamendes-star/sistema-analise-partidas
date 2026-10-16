// Envia a demo para análise, lista os jogadores e preenche o formulário com o escolhido
let demoInfo = null;
async function lerDemo(e) {
  const arq = e.target.files[0], jogs = $('#jogs');
  jogs.innerHTML = $('#prev').innerHTML = ''; demoInfo = null;
  if (!arq) return;
  jogs.innerHTML = '<p>Analisando a demo... pode levar alguns segundos.</p>';
  try {
    const fd = new FormData(); fd.append('demo', arq);
    demoInfo = await f('/api/demo', { method: 'POST', body: fd });
    const cs = [...document.querySelectorAll('.jogo')].find(b => /counter/i.test(b.dataset.nome)); if (cs) cs.click();
    demoInfo.data = new Date(arq.lastModified - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const grupos = {};
    demoInfo.jogadores.forEach((j, i) => (grupos[j.time] ||= []).push(`<option value="${i}">${esc(j.nome)}</option>`));
    jogs.innerHTML = `<label>Quem é você nessa partida? (${demoInfo.rounds} rounds)<select id="jsel"><option value="">Escolha o jogador...</option>
      ${Object.entries(grupos).map(([t, o]) => `<optgroup label="Time ${t}">${o.join('')}</optgroup>`).join('')}</select></label>`;
    $('#jsel').onchange = escolheJogador;
  } catch (x) { jogs.innerHTML = `<p class="erro">${esc(x)}</p>`; e.target.value = ''; }
}
function escolheJogador(e) {
  const j = demoInfo.jogadores[e.target.value];
  if (!j) return ($('#prev').innerHTML = '');
  const set = (id, val) => { if (val != null) $('#' + id).value = val; };
  set('data_partida', demoInfo.data); set('mapa', demoInfo.mapa); set('duracao', demoInfo.duracao); set('resultado', j.resultado);
  ['kills', 'deaths', 'assists', 'tiros_disparados', 'tiros_acertados', 'headshots', 'dinheiro_ganho', 'dinheiro_gasto'].forEach(k => set(k, j[k]));
  const kd = (j.kills / Math.max(j.deaths, 1)).toFixed(2);
  const prec = j.tiros_disparados ? (j.tiros_acertados / j.tiros_disparados * 100).toFixed(1) : '0.0';
  const hs = j.kills ? (j.headshots / j.kills * 100).toFixed(1) : '0.0';
  $('#prev').innerHTML = [['Jogador', esc(j.nome)], ['K/D', kd], ['Kills', j.kills], ['Deaths', j.deaths], ['Assists', j.assists],
    ['Precisão', prec + '%'], ['Headshots', `${j.headshots} (${hs}%)`]].map(([a, b]) => `<div class="card"><small>${a}</small><b>${b}</b></div>`).join('');
}

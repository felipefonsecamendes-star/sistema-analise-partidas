const $ = s => document.querySelector(s);
const v = $('#view');
const telas = {};
let chart;
// fetch que já trata erro e sessão expirada
const f = (u, o) => fetch(u, o).then(async r => {
  const j = await r.json().catch(() => ({ erro: 'Resposta inválida do servidor' }));
  if (r.status === 401) location = '/';
  if (!r.ok) throw j.erro || j.mensagem || 'Erro inesperado';
  return j;
});
const J = (m, b) => ({ method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
// escapa HTML para evitar XSS com dados digitados pelo usuário
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const NOMES = { kd: 'K/D', precisao: 'Precisão %', hs_pct: 'Headshots %', kills: 'Kills', dinheiro_gasto: 'Economia (gasto)' };
function grafico(rows, campos) {
  if (chart) chart.destroy();
  chart = new Chart($('#g'), { type: 'line', data: {
    labels: rows.map(r => new Date(r.data).toLocaleDateString('pt-BR')),
    datasets: campos.map(c => ({ label: NOMES[c], data: rows.map(r => +r[c]), tension: 0, borderColor: '#2f7bff', borderWidth: 2, fill: false, pointRadius: 3, pointBackgroundColor: '#2f7bff' }))
  } });
}

if (window.Chart) { Chart.defaults.color = '#8b96b0'; Chart.defaults.borderColor = 'rgba(255,255,255,.07)'; Chart.defaults.font.family = "'IBM Plex Sans', sans-serif"; }
// logo do jogo, ícone e etiqueta de resultado
const IMG = j => /valorant/i.test(j) ? 'img/valorant.png' : /counter|cs/i.test(j) ? 'img/cs2.png' : '';
const icone = j => IMG(j) ? `<img class="ico" src="${IMG(j)}" alt="">` : '';
const badge = r => `<span class="badge ${r === 'Vitória' ? 'v' : r === 'Derrota' ? 'd' : 'e'}">${esc(r)}</span>`;

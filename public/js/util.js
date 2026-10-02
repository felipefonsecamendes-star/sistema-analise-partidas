const $ = s => document.querySelector(s);
const v = $('#view');
const telas = {};
let chart;
// fetch que já trata erro e sessão expirada
const f = (u, o) => fetch(u, o).then(async r => {
  const j = await r.json().catch(() => ({ erro: 'Resposta inválida do servidor' }));
  if (r.status === 401) location = '/';
  if (!r.ok) throw j.erro;
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
    datasets: campos.map(c => ({ label: NOMES[c], data: rows.map(r => +r[c]), tension: .3 }))
  } });
}

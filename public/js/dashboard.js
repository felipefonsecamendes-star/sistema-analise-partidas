telas.dashboard = async () => {
  const [d, h] = await Promise.all([f('/api/dashboard'), f('/api/partidas')]);
  const n = x => +x || 0;
  const outros = [['Partidas', d.total], ['Vitórias', d.vitorias || 0], ['Derrotas', d.derrotas || 0],
    ['Precisão', n(d.precisao).toFixed(1) + '%'], ['Headshots', n(d.hs).toFixed(1) + '%']];
  v.innerHTML = `<h2 class="tit">Resumo</h2>
    <section class="resumo"><div class="destaque"><span class="rot">K/D médio</span><b>${n(d.kd).toFixed(2)}</b></div>
    ${outros.map(([a, b]) => `<div><span class="rot">${a}</span><b>${b}</b></div>`).join('')}</section>
    <h3 class="sub">K/D nas últimas 10 partidas</h3><div class="painel"><canvas id="g"></canvas></div>`;
  grafico(h.slice(0, 10).reverse(), ['kd']);
};
telas.evolucao = async () => {
  const h = (await f('/api/partidas')).reverse();
  v.innerHTML = `<h2 class="tit">Evolução</h2><label>Métrica<select id="m">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label><div class="painel"><canvas id="g"></canvas></div>`;
  const desenha = () => grafico(h, [$('#m').value]);
  $('#m').onchange = desenha; desenha();
};

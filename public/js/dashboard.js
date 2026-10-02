telas.dashboard = async () => {
  const [d, h] = await Promise.all([f('/api/dashboard'), f('/api/partidas')]);
  const itens = [['Partidas', d.total], ['Vitórias', d.vitorias || 0], ['Derrotas', d.derrotas || 0],
    ['K/D médio', (+d.kd || 0).toFixed(2)], ['Precisão média', (+d.precisao || 0).toFixed(1) + '%'],
    ['Headshots', (+d.hs || 0).toFixed(1) + '%']];
  v.innerHTML = `<div class="cards">${itens.map(([a, b]) => `<div class="card"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    <h3>Últimas partidas (K/D)</h3><canvas id="g"></canvas>`;
  grafico(h.slice(0, 10).reverse(), ['kd']);
};
telas.evolucao = async () => {
  const h = (await f('/api/partidas')).reverse();
  v.innerHTML = `<label>Métrica<select id="m">${Object.entries(NOMES).map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label><canvas id="g"></canvas>`;
  const desenha = () => grafico(h, [$('#m').value]);
  $('#m').onchange = desenha; desenha();
};

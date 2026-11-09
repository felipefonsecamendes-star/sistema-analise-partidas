
const definirTema = jogo => {
  if (jogo === 'valorant' || jogo === 'cs2') {
    document.body.dataset.tema = jogo;
  } else {
    delete document.body.dataset.tema;
  }
};

const abre = t => {
  definirTema(t === 'riot' ? 'valorant' : null);

  document.querySelectorAll('nav [data-t]').forEach(b =>
    b.classList.toggle('on', b.dataset.t === t)
  );

  return telas[t]().catch(e => {
    v.textContent = e;
  });
};

document.querySelectorAll('nav [data-t]').forEach(b =>
  b.onclick = () => abre(b.dataset.t)
);

$('#sair').onclick = async () => {
  await f('/api/logout', { method: 'POST' });
  location = '/';
};

abre('dashboard');

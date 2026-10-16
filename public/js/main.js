const abre = t => {
  document.querySelectorAll('nav [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  return telas[t]().catch(e => { v.textContent = e; });
};
document.querySelectorAll('nav [data-t]').forEach(b => b.onclick = () => abre(b.dataset.t));
$('#sair').onclick = async () => { await f('/api/logout', { method: 'POST' }); location = '/'; };
abre('dashboard');

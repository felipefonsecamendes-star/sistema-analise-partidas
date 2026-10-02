const abre = t => telas[t]().catch(e => { v.textContent = e; });
document.querySelectorAll('nav [data-t]').forEach(b => b.onclick = () => abre(b.dataset.t));
$('#sair').onclick = async () => { await f('/api/logout', { method: 'POST' }); location = '/'; };
abre('dashboard');

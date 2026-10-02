// Roda em processo separado: se o leitor nativo travar numa demo, o servidor continua de pé
const NAO_ARMA = /knife|bayonet|grenade|flashbang|molotov|incgrenade|inferno|decoy|c4|taser|healthshot/i;
const S = x => String(x);
const hhmmss = s => { const p = n => String(Math.floor(n)).padStart(2, '0'); return `${p(s / 3600)}:${p((s % 3600) / 60)}:${p(s % 60)}`; };

function main(arq) {
  const { parseEvent, parseHeader, parsePlayerInfo, parseTicks } = require('@laihoe/demoparser2');
  // lê um evento ignorando o aquecimento; eventos opcionais que falharem viram lista vazia
  const ev = (nome, obrigatorio) => {
    let falha;
    for (const extra of [['is_warmup_period'], []]) {
      try {
        const lista = parseEvent(arq, nome, [], extra);
        return extra.length ? lista.filter(e => !e.is_warmup_period) : lista;
      } catch (e) { falha = e; }
    }
    if (obrigatorio) throw falha;
    return [];
  };
  const mortes = ev('player_death', true);
  const tiros = ev('weapon_fire').filter(e => !NAO_ARMA.test(e.weapon));
  const danos = ev('player_hurt').filter(e => e.attacker_steamid && S(e.attacker_steamid) !== S(e.user_steamid) && !NAO_ARMA.test(e.weapon));
  const rounds = ev('round_end');
  const ultimo = [...rounds, ...mortes].reduce((m, e) => Math.max(m, e.tick || 0), 0);

  const fim = {}, gasto = {};
  try { parseTicks(arq, ['team_num', 'team_rounds_total'], [ultimo]).forEach(x => fim[S(x.steamid)] = x); } catch {}
  try { parseTicks(arq, ['total_cash_spent'], [ultimo]).forEach(x => gasto[S(x.steamid)] = x.total_cash_spent); } catch {}
  const resultado = sid => {
    const a = fim[sid];
    const b = a && Object.values(fim).find(x => x.team_num >= 2 && x.team_num !== a.team_num);
    if (!b) return null;
    return a.team_rounds_total > b.team_rounds_total ? 'Vitória' : a.team_rounds_total < b.team_rounds_total ? 'Derrota' : 'Empate';
  };

  // lista de jogadores; se a demo não trouxer, monta a partir das mortes
  let info = [];
  try { info = parsePlayerInfo(arq).filter(j => j.team_number >= 2 && S(j.steamid) !== '0'); } catch {}
  if (!info.length) {
    const nomes = new Map();
    mortes.forEach(e => [[e.attacker_steamid, e.attacker_name], [e.user_steamid, e.user_name]]
      .forEach(([s, n]) => { if (s && S(s) !== '0' && n) nomes.set(S(s), n); }));
    info = [...nomes].map(([steamid, name]) => ({ steamid, name, team_number: 2 }));
  }
  if (!info.length) throw new Error('nenhum jogador encontrado na demo');

  const jogadores = info.map(j => {
    const sid = S(j.steamid);
    const abates = mortes.filter(e => S(e.attacker_steamid) === sid && S(e.user_steamid) !== sid);
    const disparados = tiros.filter(e => S(e.user_steamid) === sid).length;
    return {
      steamid: sid, nome: j.name, time: j.team_number === 2 ? 1 : 2,
      kills: abates.length,
      deaths: mortes.filter(e => S(e.user_steamid) === sid).length,
      assists: mortes.filter(e => S(e.assister_steamid) === sid).length,
      headshots: abates.filter(e => e.headshot).length,
      tiros_disparados: disparados,
      tiros_acertados: Math.min(disparados, danos.filter(e => S(e.attacker_steamid) === sid).length),
      dinheiro_ganho: 0, dinheiro_gasto: gasto[sid] ?? null, resultado: resultado(sid)
    };
  }).sort((a, b) => a.time - b.time || String(a.nome).localeCompare(String(b.nome)));

  let mapa = '';
  try { mapa = (parseHeader(arq).map_name || '').replace(/^de_/, ''); } catch {}
  return { mapa: mapa.charAt(0).toUpperCase() + mapa.slice(1), duracao: hhmmss(ultimo / 64), rounds: rounds.length, jogadores };
}

try { process.send({ dados: main(process.argv[2]) }, () => process.exit(0)); }
catch (e) { process.send({ erro: String(e.message || e).slice(0, 200) }, () => process.exit(0)); }

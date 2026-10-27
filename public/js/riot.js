
telas.riot = async () => {
  let contaSelecionada = null;
  let contas = [];
  let cacheMapas = null;
  let cacheAgentes = null;

  const numero = valor => Number(valor) || 0;

  const nomeDaConta = conta =>
    `${conta.game_name || ''}#${conta.tag_line || ''}`;

  const statusDaConta = conta =>
    conta?.verificacao?.propriedade_verificada === true
      ? 'Propriedade verificada'
      : 'Propriedade não verificada';

  v.innerHTML = `
    <h2 class="tit">
      <img class="ico"
        style="width:34px;height:34px;margin-right:12px"
        src="img/valorant.png" alt="">
      Valorant
    </h2>

    <section class="painel">
      <h3 class="sub" style="margin-top:0">
        Consultar conta Riot
      </h3>

      <p>
        Consulte estatísticas de jogadores pelo Riot ID.
        Adicionar uma conta não comprova que ela pertence a você.
      </p>

      <form id="fv" class="grid">
        <label>
          Nome
          <input id="rnome" placeholder="NomeDoJogador" required>
        </label>

        <label>
          Tag
          <input id="rtag" placeholder="BR1" required>
        </label>

        <div style="align-self:end;margin-bottom:14px">
          <button type="submit">Consultar conta</button>
        </div>
      </form>

      <h3 class="sub">Contas consultadas</h3>

      <label>
        Selecione uma conta
        <select id="rconta">
          <option value="">Carregando contas...</option>
        </select>
      </label>

      <p id="rstatus" class="rot"></p>

      <h3 class="sub">Partidas recentes</h3>

      <p class="rot">
        Selecione uma partida da conta escolhida para importar.
      </p>

      <div id="rrecentes">
        <p class="rot">Carregando partidas...</p>
      </div>

      <p id="rmsg" class="erro" style="margin:0"></p>
    </section>

    <div id="dados"></div>
  `;

  const aviso = (mensagem, ok) => {
    const elemento = $('#rmsg');
    elemento.className = ok ? 'ok' : 'erro';
    elemento.textContent = mensagem;
  };

  async function carregarContas(preferida = null) {
    const resposta = await f('/api/riot/contas-consultadas');

    contas = resposta.contas || [];

    const ids = contas.map(conta => String(conta.id));
    const anterior = String(contaSelecionada || '');

    if (preferida && ids.includes(String(preferida))) {
      contaSelecionada = String(preferida);
    } else if (ids.includes(anterior)) {
      contaSelecionada = anterior;
    } else {
      contaSelecionada = contas.length
        ? String(contas[0].id)
        : null;
    }

    const seletor = $('#rconta');

    seletor.innerHTML = contas.length
      ? contas.map(conta => `
          <option value="${Number(conta.id)}">
            ${esc(nomeDaConta(conta))}
          </option>
        `).join('')
      : '<option value="">Nenhuma conta cadastrada</option>';

    seletor.value = contaSelecionada || '';

    atualizarStatus();
  }

  function atualizarStatus() {
    const conta = contas.find(
      item => String(item.id) === String(contaSelecionada)
    );

    const elemento = $('#rstatus');

    if (!conta) {
      elemento.textContent = 'Adicione uma conta para começar.';
      return;
    }

    elemento.textContent =
      `${nomeDaConta(conta)} — ${statusDaConta(conta)}`;

    elemento.style.color =
      conta.verificacao?.propriedade_verificada
        ? '#58d68d'
        : '#f0b35a';
  }

  $('#fv').onsubmit = async evento => {
    evento.preventDefault();

    try {
      const resposta = await f(
        '/api/riot/vincular',
        J('POST', {
          nome: $('#rnome').value.trim(),
          tag: $('#rtag').value.trim()
        })
      );

      await carregarContas(resposta.contaId);

      aviso(
        resposta.mensagem ||
        'Conta adicionada para consulta.',
        true
      );

      await atualizarDados();

    } catch (erro) {
      aviso(String(erro), false);
    }
  };

  $('#rconta').onchange = async evento => {
    contaSelecionada = evento.target.value || null;

    atualizarStatus();
    await atualizarDados();
  };

  async function buscarImagemMapa(nomeMapa) {
    try {
      if (!cacheMapas) {
        const resposta = await fetch(
          'https://valorant-api.com/v1/maps?language=pt-BR'
        );

        if (!resposta.ok) {
          throw new Error('Mapas indisponíveis.');
        }

        const dados = await resposta.json();
        cacheMapas = dados.data || [];
      }

      const normalizar = texto =>
        String(texto || '').trim().toLowerCase();

      const mapa = cacheMapas.find(item =>
        normalizar(item.displayName) === normalizar(nomeMapa) ||
        normalizar(item.mapUrl?.split('/').pop()) ===
          normalizar(nomeMapa)
      );

      return mapa?.splash || '';

    } catch (erro) {
      console.warn('Imagem do mapa indisponível:', erro);
      return '';
    }
  }

  async function buscarIconesAgentes() {
    if (cacheAgentes) return cacheAgentes;

    const icones = {};

    try {
      const resposta = await fetch(
        'https://valorant-api.com/v1/agents?language=en-US&isPlayableCharacter=true'
      );

      if (resposta.ok) {
        const dados = await resposta.json();

        for (const agente of dados.data || []) {
          if (agente.displayName && agente.displayIcon) {
            icones[agente.displayName.toLowerCase()] =
              agente.displayIcon;
          }
        }
      }
    } catch (erro) {
      console.warn('Ícones indisponíveis:', erro);
    }

    cacheAgentes = icones;
    return icones;
  }

  async function atualizarDados() {
    const id = contaSelecionada;

    if (!id) {
      $('#rrecentes').innerHTML =
        '<p class="rot">Selecione uma conta Riot.</p>';

      $('#dados').innerHTML =
        '<p class="rot">Nenhuma conta selecionada.</p>';

      return;
    }

    await Promise.all([
      carregarRecentes(id),
      carrega(id)
    ]);
  }

  async function carregarRecentes(id = contaSelecionada) {
    const area = $('#rrecentes');

    area.innerHTML =
      '<p class="rot">Carregando partidas recentes...</p>';

    try {
      const resposta = await f(
        `/api/riot/partidas-recentes?contaId=${encodeURIComponent(id)}`
      );

      if (String(id) !== String(contaSelecionada)) return;

      const partidas = resposta.partidas || [];

      if (!partidas.length) {
        area.innerHTML =
          '<p class="rot">Nenhuma partida recente encontrada.</p>';
        return;
      }

      area.innerHTML = `
        <div class="wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Fila</th>
                <th>Partida</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              ${partidas.map((partida, i) => `
                <tr>
                  <td>
                    ${partida.gameStartTimeMillis
                      ? new Date(
                          partida.gameStartTimeMillis
                        ).toLocaleString('pt-BR')
                      : '-'}
                  </td>

                  <td>${esc(partida.queueId || '-')}</td>
                  <td>Partida ${i + 1}</td>

                  <td>
                    <button class="sec" data-partida="${i}">
                      Importar
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      area.querySelectorAll('[data-partida]').forEach(botao => {
        botao.onclick = async () => {
          const partida = partidas[Number(botao.dataset.partida)];

          if (String(id) !== String(contaSelecionada)) return;

          botao.disabled = true;
          botao.textContent = 'Importando...';

          try {
            const resultado = await f(
              '/api/riot/importar-partida',
              J('POST', {
                matchId: partida.matchId,
                contaId: Number(id)
              })
            );

            aviso(
              resultado.mensagem || 'Partida importada!',
              true
            );

            if (String(id) === String(contaSelecionada)) {
              await carrega(id);
            }

          } catch (erro) {
            aviso(String(erro), false);

          } finally {
            botao.disabled = false;
            botao.textContent = 'Importar';
          }
        };
      });

    } catch (erro) {
      if (String(id) !== String(contaSelecionada)) return;

      area.innerHTML = `
        <p class="rot">
          Não foi possível carregar as partidas recentes:
          ${esc(String(erro))}
        </p>
      `;
    }
  }

  async function carrega(id = contaSelecionada) {
    const area = $('#dados');

    area.innerHTML =
      '<p class="rot">Carregando estatísticas...</p>';

    try {
      const [s, p] = await Promise.all([
        f(
          `/api/riot/estatisticas?contaId=${encodeURIComponent(id)}`
        ),
        f(
          `/api/riot/minhas-partidas?contaId=${encodeURIComponent(id)}`
        )
      ]);

      if (String(id) !== String(contaSelecionada)) return;

      const e = s.estatisticas || {};
      const partidas = p.partidas || [];

      const conta = contas.find(
        item => String(item.id) === String(id)
      );

      const itens = [
        ['Partidas', e.totalPartidas],
        ['Vitórias', e.vitorias],
        ['Derrotas', e.derrotas],
        ['Kills', e.kills],
        ['Mortes', e.deaths],
        ['Assistências', e.assists],
        ['K/D', numero(e.kd).toFixed(2)],
        ['KDA', numero(e.kda).toFixed(2)],
        ['HS%', numero(e.hsPercentual).toFixed(2) + '%'],
        ['ADR', numero(e.adr).toFixed(2)],
        ['ACS', numero(e.acs).toFixed(2)],
        ['Win Rate', numero(e.taxaVitoria).toFixed(2) + '%']
      ];

      area.innerHTML = `
        <h3 class="sub">
          Estatísticas de
          ${esc(conta ? nomeDaConta(conta) : 'conta consultada')}
        </h3>

        <p style="color:#f0b35a;font-weight:600">
          ${esc(conta ? statusDaConta(conta) : 'Não verificada')}
        </p>

        <div class="cards tres">
          ${itens.map(([titulo, valor]) => `
            <div class="card">
              <small>${titulo}</small>
              <b>${valor ?? 0}</b>
            </div>
          `).join('')}
        </div>

        <h3 class="sub">Partidas importadas</h3>

        <div class="grid">
          <label>
            Resultado
            <select id="rfr">
              <option value="">Todos</option>
              <option>Vitória</option>
              <option>Derrota</option>
            </select>
          </label>

          <label>
            Mapa
            <input id="rfm"
              placeholder="Ex.: Ascent, Bind, Haven">
          </label>
        </div>

        <div id="rhist"></div>
      `;

      const desenha = () => {
        const mapa = $('#rfm').value.trim().toLowerCase();
        const resultado = $('#rfr').value;

        const lista = partidas.filter(partida =>
          (!resultado || partida.resultado === resultado) &&
          String(partida.mapa || '')
            .toLowerCase()
            .includes(mapa)
        );

        if (!lista.length) {
          $('#rhist').innerHTML = `
            <p class="rot">
              Nenhuma partida encontrada para esta conta.
            </p>
          `;
          return;
        }

        $('#rhist').innerHTML = `
          <div class="wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Mapa</th>
                  <th>Resultado</th>
                  <th>Kills</th>
                  <th>Mortes</th>
                  <th>Assist.</th>
                  <th>K/D</th>
                  <th>Detalhes</th>
                </tr>
              </thead>

              <tbody>
                ${lista.map(partida => {
                  const k = numero(partida.kills);
                  const d = numero(partida.deaths);

                  return `
                    <tr>
                      <td>
                        ${partida.criado_em
                          ? new Date(
                              partida.criado_em
                            ).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>

                      <td>${esc(partida.mapa || '-')}</td>

                      <td>
                        ${badge(partida.resultado || 'Indefinido')}
                      </td>

                      <td>${k}</td>
                      <td>${d}</td>
                      <td>${numero(partida.assists)}</td>
                      <td>${(d ? k / d : k).toFixed(2)}</td>

                      <td>
                        <button class="sec"
                          data-detalhes="${Number(partida.id)}">
                          Ver partida
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      };

      $('#rhist').onclick = evento => {
        const botao = evento.target.closest('[data-detalhes]');

        if (!botao) return;

        abrirDetalhesPartida(botao.dataset.detalhes, id);
      };

      $('#rfr').onchange = desenha;
      $('#rfm').oninput = desenha;

      desenha();

    } catch (erro) {
      if (String(id) !== String(contaSelecionada)) return;

      area.innerHTML = `
        <p class="erro">
          Não foi possível carregar os dados do Valorant:
          ${esc(String(erro))}
        </p>
      `;
    }
  }

  async function abrirDetalhesPartida(
    partidaId,
    id = contaSelecionada
  ) {
    const area = $('#dados');

    area.innerHTML = `
      <p class="rot">Carregando detalhes da partida...</p>
    `;

    try {
      const resposta = await f(
        `/api/riot/partida/${encodeURIComponent(partidaId)}/detalhes`
      );

      if (String(id) !== String(contaSelecionada)) return;

      const partida = resposta.partida;
      const jogadores = resposta.jogadores || [];

      const nomeConta = String(partida.game_name || '')
        .trim().toLowerCase();

      const tagConta = String(partida.tag_line || '')
        .trim().replace(/^#/, '').toLowerCase();

      const jogadorConsultado = jogador =>
        Boolean(nomeConta && tagConta) &&
        String(jogador.nick || '').trim().toLowerCase() ===
          nomeConta &&
        String(jogador.tag || '')
          .trim()
          .replace(/^#/, '')
          .toLowerCase() === tagConta;

      const nomeMapa = String(partida.mapa || 'Desconhecido');
      const mapa = esc(nomeMapa);
      const resultado = partida.resultado || 'Indefinido';

      const [imagemMapa, iconesAgentes] = await Promise.all([
        buscarImagemMapa(nomeMapa),
        buscarIconesAgentes()
      ]);

      if (String(id) !== String(contaSelecionada)) return;

      const obterIconeAgente = nome =>
        iconesAgentes[String(nome || '').toLowerCase()] || '';

      const equipes = [...new Set(
        jogadores.map(jogador => jogador.equipe || 'Sem equipe')
      )];

      const tabelaJogadores = lista => `
        <div class="wrap">
          <table>
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Agente</th>
                <th>K</th>
                <th>D</th>
                <th>A</th>
                <th>HS%</th>
                <th>ADR</th>
                <th>ACS</th>
              </tr>
            </thead>

            <tbody>
              ${lista.map(jogador => `
                <tr style="${jogadorConsultado(jogador)
                  ? 'background-color:rgba(0,140,255,0.25);outline:2px solid #008cff;outline-offset:-2px;'
                  : ''}">

                  <td>
                    <strong>
                      ${esc(jogador.nick || 'Desconhecido')}
                    </strong>

                    ${jogador.tag
                      ? '#' + esc(jogador.tag)
                      : ''}

                    ${jogadorConsultado(jogador)
                      ? '<small style="display:block;color:#58a6ff">Jogador consultado</small>'
                      : ''}
                  </td>

                  <td>
                    <div style="
                      display:flex;
                      align-items:center;
                      gap:10px;
                    ">
                      ${obterIconeAgente(jogador.agente) ? `
                        <img
                          src="${esc(obterIconeAgente(jogador.agente))}"
                          alt="${esc(jogador.agente || 'Agente')}"
                          style="
                            width:36px;
                            height:36px;
                            object-fit:contain;
                            border-radius:6px;
                          "
                        >
                      ` : ''}

                      <span>
                        ${esc(jogador.agente || '-')}
                      </span>
                    </div>
                  </td>

                  <td>${numero(jogador.kills)}</td>
                  <td>${numero(jogador.deaths)}</td>
                  <td>${numero(jogador.assists)}</td>

                  <td>
                    ${numero(jogador.hs_percentual).toFixed(2)}%
                  </td>

                  <td>${numero(jogador.adr).toFixed(2)}</td>
                  <td>${numero(jogador.acs).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      area.innerHTML = `
        <button class="sec" id="voltarPartidas">
          ← Voltar às partidas
        </button>

        <section class="painel"
          style="margin-top:16px;overflow:hidden">

          <p style="color:#f0b35a;font-weight:600">
            ${esc(partida.game_name || '')}#${esc(partida.tag_line || '')}
            — ${esc(resposta.verificacao?.mensagem ||
              'Propriedade não verificada.')}
          </p>

          ${imagemMapa ? `
            <img
              src="${esc(imagemMapa)}"
              alt="Mapa ${mapa}"
              loading="lazy"
              style="
                display:block;
                width:100%;
                height:300px;
                object-fit:cover;
                object-position:center;
                border-radius:10px;
                margin-bottom:20px;
              "
            >
          ` : ''}

          <h2 class="tit">${mapa}</h2>

          ${partida.placar_blue != null &&
            partida.placar_red != null ? `
            <div style="
              display:flex;
              align-items:center;
              justify-content:center;
              gap:30px;
              margin:24px 0;
              font-size:28px;
              font-weight:bold;
            ">
              <span style="color:#58a6ff">BLUE</span>

              <span style="font-size:38px;color:#fff">
                ${numero(partida.placar_blue)}
                ×
                ${numero(partida.placar_red)}
              </span>

              <span style="color:#ff5865">RED</span>
            </div>
          ` : `
            <p class="rot">
              Placar indisponível para esta partida.
            </p>
          `}

          <div style="margin:14px 0">
            ${badge(resultado)}
          </div>

          <p class="rot">
            Detalhes da partida — VALORANT
          </p>
        </section>

        <h3 class="sub">Placar completo</h3>

        ${jogadores.length
          ? equipes.map(equipe => `
              <section class="painel"
                style="margin-bottom:16px">

                <h3 class="sub">
                  Equipe ${esc(equipe)}
                </h3>

                ${tabelaJogadores(
                  jogadores.filter(
                    jogador =>
                      (jogador.equipe || 'Sem equipe') === equipe
                  )
                )}
              </section>
            `).join('')
          : `
              <p class="rot">
                Esta partida ainda não possui jogadores salvos.
                Importe uma partida nova para visualizar
                o placar completo.
              </p>
            `}
      `;

      $('#voltarPartidas').onclick = () => carrega(id);

    } catch (erro) {
      if (String(id) !== String(contaSelecionada)) return;

      area.innerHTML = `
        <p class="erro">
          Erro ao carregar os detalhes:
          ${esc(String(erro))}
        </p>

        <button class="sec" id="voltarPartidas">
          Voltar às partidas
        </button>
      `;

      $('#voltarPartidas').onclick = () => carrega(id);
    }
  }

  try {
    await carregarContas();
    await atualizarDados();
  } catch (erro) {
    aviso('Não foi possível carregar as contas Riot.', false);

    $('#rconta').innerHTML =
      '<option value="">Erro ao carregar contas</option>';

    $('#rrecentes').innerHTML = '';
    $('#dados').innerHTML = '';
  }
};

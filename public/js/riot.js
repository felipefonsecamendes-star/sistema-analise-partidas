
 // Tela do VALORANT: conta, partidas, estatísticas e detalhes
telas.riot = async () => {
  const riotLoginUrl = '/api/riot/login';

  v.innerHTML = `
    <h2 class="tit">
      <img class="ico"
        style="width:34px;height:34px;margin-right:12px"
        src="img/valorant.png" alt="">
      Valorant
    </h2>

    <section class="painel">
      <h3 class="sub" style="margin-top:0">Conta Riot</h3>
      <p>Conecte sua conta Riot Games para acessar suas estatísticas.</p>

      <a class="btn" href="${riotLoginUrl}"
        style="display:inline-block;margin-bottom:20px">
        Conectar com Riot Games
      </a>

      <form id="fv" class="grid">
        <label>Nome
          <input id="rnome" placeholder="SeuNome" required>
        </label>

        <label>Tag
          <input id="rtag" placeholder="BR1" required>
        </label>

        <div style="align-self:end;margin-bottom:14px">
          <button>Vincular conta</button>
        </div>
      </form>

      <h3 class="sub">Partidas recentes</h3>
      <p class="rot">
        Selecione uma partida para importar suas estatísticas.
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

  $('#fv').onsubmit = async evento => {
    evento.preventDefault();

    try {
      const resposta = await f(
        '/api/riot/vincular',
        J('POST', {
          nome: $('#rnome').value,
          tag: $('#rtag').value
        })
      );

      aviso(resposta.mensagem, true);
      await carregarRecentes();
      await carrega();

    } catch (erro) {
      aviso(String(erro), false);
    }
  };

  // Busca automaticamente imagens oficiais dos mapas
  let cacheMapas = null;

  async function buscarImagemMapa(nomeMapa) {
    try {
      if (!cacheMapas) {
        const resposta = await fetch(
          'https://valorant-api.com/v1/maps?language=pt-BR'
        );

        if (!resposta.ok) {
          throw new Error('Não foi possível consultar os mapas.');
        }

        const dados = await resposta.json();
        cacheMapas = dados.data || [];
      }

      const normalizar = texto =>
        String(texto || '').trim().toLowerCase();

      const mapa = cacheMapas.find(item =>
        normalizar(item.displayName) === normalizar(nomeMapa) ||
        normalizar(item.mapUrl?.split('/').pop()) === normalizar(nomeMapa)
      );

      return mapa?.splash || '';

    } catch (erro) {
      console.warn('Imagem do mapa indisponível:', erro);
      return '';
    }
  }

  async function carregarRecentes() {
    const area = $('#rrecentes');

    area.innerHTML = '<p class="rot">Carregando partidas...</p>';

    try {
      const resposta = await f('/api/riot/partidas-recentes');
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

          botao.disabled = true;
          botao.textContent = 'Importando...';

          try {
            const resposta = await f(
              '/api/riot/importar-partida',
              J('POST', { matchId: partida.matchId })
            );

            aviso(
              resposta.mensagem || 'Partida importada!',
              true
            );

            await carrega();

          } catch (erro) {
            aviso(String(erro), false);

          } finally {
            botao.disabled = false;
            botao.textContent = 'Importar';
          }
        };
      });

    } catch (erro) {
      area.innerHTML = `
        <p class="rot">
          As partidas recentes ainda não estão disponíveis.
          Verifique a conexão com a API do VALORANT.
        </p>
      `;
    }
  }

  async function carrega() {
    try {
      const [s, p] = await Promise.all([
        f('/api/riot/estatisticas'),
        f('/api/riot/minhas-partidas')
      ]);

      const e = s.estatisticas;
      const n = valor => Number(valor) || 0;
      const partidas = p.partidas || [];

      const itens = [
        ['Partidas', e.totalPartidas],
        ['Vitórias', e.vitorias],
        ['Derrotas', e.derrotas],
        ['Kills', e.kills],
        ['Mortes', e.deaths],
        ['Assistências', e.assists],
        ['K/D', n(e.kd).toFixed(2)],
        ['KDA', n(e.kda).toFixed(2)],
        ['HS%', n(e.hsPercentual).toFixed(2) + '%'],
        ['ADR', n(e.adr).toFixed(2)],
        ['ACS', n(e.acs).toFixed(2)],
        ['Win Rate', n(e.taxaVitoria).toFixed(2) + '%']
      ];

      $('#dados').innerHTML = `
        <div class="cards tres">
          ${itens.map(([titulo, valor]) => `
            <div class="card">
              <small>${titulo}</small>
              <b>${valor}</b>
            </div>
          `).join('')}
        </div>

        <h3 class="sub">Últimas partidas</h3>

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
              Nenhuma partida encontrada.
              Vincule sua conta e importe uma partida acima.
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
                  const k = n(partida.kills);
                  const d = n(partida.deaths);

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
                        ${badge(
                          partida.resultado || 'Indefinido'
                        )}
                      </td>

                      <td>${k}</td>
                      <td>${d}</td>
                      <td>${n(partida.assists)}</td>

                      <td>
                        ${(d ? k / d : k).toFixed(2)}
                      </td>

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

      $('#rhist').addEventListener('click', evento => {
        const botao = evento.target.closest('[data-detalhes]');

        if (!botao) return;

        abrirDetalhesPartida(botao.dataset.detalhes);
      });

      $('#rfr').onchange = desenha;
      $('#rfm').oninput = desenha;

      desenha();

    } catch (erro) {
      $('#dados').innerHTML = `
        <p class="erro">
          Não foi possível carregar os dados do Valorant:
          ${esc(String(erro))}
        </p>
      `;
    }
  }

  async function abrirDetalhesPartida(id) {
    const area = $('#dados');

    area.innerHTML = `
      <p class="rot">Carregando detalhes da partida...</p>
    `;

    try {
      const resposta = await f(
        `/api/riot/partida/${encodeURIComponent(id)}/detalhes`
      );

      const partida = resposta.partida;
      const jogadores = resposta.jogadores || [];
     
      const nomeConta = String(partida.game_name || '')
        .trim().toLowerCase();

      const tagConta = String(partida.tag_line || '')
        .trim().replace(/^#/, '').toLowerCase();

      const jogadorVinculado = jogador =>
        Boolean(nomeConta && tagConta) &&
        String(jogador.nick || '').trim().toLowerCase() === nomeConta &&
        String(jogador.tag || '').trim().replace(/^#/, '').toLowerCase() === tagConta;

      const n = valor => Number(valor) || 0;

      const nomeMapa = String(partida.mapa || 'Desconhecido');
      const mapa = esc(nomeMapa);
      const resultado = partida.resultado || 'Indefinido';

      // Carrega a imagem correspondente ao mapa da partida
      const imagemMapa = await buscarImagemMapa(nomeMapa);
     
      // Busca os ícones de todos os agentes
      let iconesAgentes = {};

      try {
        const respostaAgentes = await fetch(
          'https://valorant-api.com/v1/agents?language=en-US&isPlayableCharacter=true'
        );

        if (respostaAgentes.ok) {
          const dadosAgentes = await respostaAgentes.json();

          for (const agente of dadosAgentes.data || []) {
            if (agente.displayName && agente.displayIcon) {
              iconesAgentes[agente.displayName.toLowerCase()] =
                agente.displayIcon;
            }
          }
        }
      } catch (erro) {
        console.warn('Ícones dos agentes indisponíveis:', erro);
      }

      const obterIconeAgente = nome => {
        return iconesAgentes[String(nome || '').toLowerCase()] || '';
      };


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
                <tr style="${jogadorVinculado(jogador)
                  ? 'background:rgba(88,166,255,0.18);'
                  : ''}">

                  <td>
                    <strong>
                      ${esc(jogador.nick || 'Desconhecido')}
                    </strong>
                    ${jogador.tag
                      ? '#' + esc(jogador.tag)
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

    <span>${esc(jogador.agente || '-')}</span>
  </div>
</td>

                  <td>${n(jogador.kills)}</td>
                  <td>${n(jogador.deaths)}</td>
                  <td>${n(jogador.assists)}</td>

                  <td>
                    ${n(jogador.hs_percentual).toFixed(2)}%
                  </td>

                  <td>${n(jogador.adr).toFixed(2)}</td>
                  <td>${n(jogador.acs).toFixed(2)}</td>
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
              <span style="color:#58a6ff">
                BLUE
              </span>

              <span style="font-size:38px;color:#fff">
                ${Number(partida.placar_blue)}
                ×
                ${Number(partida.placar_red)}
              </span>

              <span style="color:#ff5865">
                RED
              </span>
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

      $('#voltarPartidas').onclick = carrega;

    } catch (erro) {
      area.innerHTML = `
        <p class="erro">
          Erro ao carregar os detalhes:
          ${esc(String(erro))}
        </p>

        <button class="sec" id="voltarPartidas">
          Voltar às partidas
        </button>
      `;

      $('#voltarPartidas').onclick = carrega;
    }
  }

  carregarRecentes();
  carrega();
};

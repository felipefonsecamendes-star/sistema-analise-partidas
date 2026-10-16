
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    processarPartidaValorant,
    obterNomeMapa
} = require('../src/riot/processor');

// Cria uma partida simulada para os testes
function criarPartida() {
    return {
        matchInfo: {
            matchId: 'MATCH-123',
            mapId: '/Game/Maps/Ascent/Ascent'
        },
        players: [
            {
                puuid: 'JOGADOR-123',
                teamId: 'Blue',
                stats: {
                    kills: 20,
                    deaths: 10,
                    assists: 5,
                    score: 350
                }
            }
        ],
        teams: [
            {
                teamId: 'Blue',
                won: true
            },
            {
                teamId: 'Red',
                won: false
            }
        ]
    };
}

// Teste 1: processa uma vitória
test('processa corretamente uma vitória', () => {
    const dados = criarPartida();

    const resultado = processarPartidaValorant(
        dados,
        'JOGADOR-123',
        1
    );

    assert.deepEqual(resultado, {
        riot_conta_id: 1,
        match_id: 'MATCH-123',
        kills: 20,
        deaths: 10,
        assists: 5,
        mapa: 'Ascent',
        resultado: 'Vitória',
        pontuacao: 350
    });
});

// Teste 2: processa uma derrota
test('identifica corretamente uma derrota', () => {
    const dados = criarPartida();

    dados.teams[0].won = false;

    const resultado = processarPartidaValorant(
        dados,
        'JOGADOR-123',
        1
    );

    assert.equal(resultado.resultado, 'Derrota');
});

// Teste 3: jogador não encontrado
test('rejeita jogador que não participou da partida', () => {
    const dados = criarPartida();

    assert.throws(
        () => processarPartidaValorant(
            dados,
            'OUTRO-JOGADOR',
            1
        ),
        /Jogador não encontrado na partida/
    );
});

// Teste 4: estatísticas ausentes
test('utiliza zero quando faltam estatísticas', () => {
    const dados = criarPartida();

    delete dados.players[0].stats;

    const resultado = processarPartidaValorant(
        dados,
        'JOGADOR-123',
        1
    );

    assert.equal(resultado.kills, 0);
    assert.equal(resultado.deaths, 0);
    assert.equal(resultado.assists, 0);
    assert.equal(resultado.pontuacao, 0);
});

// Teste 5: resultado indefinido
test('identifica resultado indefinido sem equipe', () => {
    const dados = criarPartida();

    dados.teams = [];

    const resultado = processarPartidaValorant(
        dados,
        'JOGADOR-123',
        1
    );

    assert.equal(resultado.resultado, 'Indefinido');
});

// Teste 6: converte nomes dos mapas
test('converte identificadores de mapas conhecidos', () => {
    assert.equal(
        obterNomeMapa('/Game/Maps/Ascent/Ascent'),
        'Ascent'
    );

    assert.equal(
        obterNomeMapa('/Game/Maps/Duality/Duality'),
        'Bind'
    );

    assert.equal(
        obterNomeMapa('/Game/Maps/Triad/Triad'),
        'Haven'
    );

    assert.equal(
        obterNomeMapa('/Game/Maps/Bonsai/Bonsai'),
        'Split'
    );
});

// Teste 7: mapa desconhecido
test('trata mapas desconhecidos', () => {
    assert.equal(
        obterNomeMapa('/Game/Maps/NovoMapa/NovoMapa'),
        'NovoMapa'
    );

    assert.equal(
        obterNomeMapa(null),
        'Desconhecido'
    );

    assert.equal(
        obterNomeMapa(''),
        'Desconhecido'
    );
});

// Teste 8: dados obrigatórios
test('rejeita dados obrigatórios ausentes', () => {
    const dados = criarPartida();

    assert.throws(
        () => processarPartidaValorant(null, 'JOGADOR-123', 1),
        /Dados obrigatórios não informados/
    );

    assert.throws(
        () => processarPartidaValorant(dados, '', 1),
        /Dados obrigatórios não informados/
    );

    assert.throws(
        () => processarPartidaValorant(dados, 'JOGADOR-123', null),
        /Dados obrigatórios não informados/
    );
});


const test = require('node:test');
const assert = require('node:assert/strict');

const {
    processarPartidaValorant,
    obterNomeMapa
} = require('../src/riot/processor');

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
                damage_made: 2400,
                stats: {
                    kills: 20,
                    deaths: 10,
                    assists: 5,
                    score: 3500,
                    headshots: 12,
                    bodyshots: 24,
                    legshots: 4
                }
            }
        ],
        rounds: Array.from({ length: 20 }, () => ({})),
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

test('processa vitória e estatísticas avançadas', () => {
    const resultado = processarPartidaValorant(
        criarPartida(),
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
        pontuacao: 3500,
        headshots: 12,
        bodyshots: 24,
        legshots: 4,
        dano_total: 2400,
        rodadas_jogadas: 20,
        hs_percentual: 30,
        kd: 2,
        kda: 2.5,
        adr: 120,
        acs: 175
    });
});

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

test('rejeita jogador que não participou da partida', () => {
    assert.throws(
        () => processarPartidaValorant(
            criarPartida(),
            'OUTRO-JOGADOR',
            1
        ),
        /Jogador não encontrado na partida/
    );
});

test('utiliza zero quando faltam estatísticas', () => {
    const dados = criarPartida();

    delete dados.players[0].stats;
    delete dados.players[0].damage_made;
    delete dados.rounds;

    const resultado = processarPartidaValorant(
        dados,
        'JOGADOR-123',
        1
    );

    assert.equal(resultado.kills, 0);
    assert.equal(resultado.deaths, 0);
    assert.equal(resultado.assists, 0);
    assert.equal(resultado.pontuacao, 0);
    assert.equal(resultado.hs_percentual, 0);
    assert.equal(resultado.kd, 0);
    assert.equal(resultado.kda, 0);
    assert.equal(resultado.adr, 0);
    assert.equal(resultado.acs, 0);
});

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

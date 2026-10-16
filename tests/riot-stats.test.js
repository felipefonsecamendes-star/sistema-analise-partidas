
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    calcularEstatisticasValorant
} = require('../src/riot/stats');

// Testa uma lista vazia
test('retorna estatísticas zeradas sem partidas', () => {
    const resultado = calcularEstatisticasValorant([]);

    assert.equal(resultado.totalPartidas, 0);
    assert.equal(resultado.vitorias, 0);
    assert.equal(resultado.derrotas, 0);
    assert.equal(resultado.kills, 0);
    assert.equal(resultado.deaths, 0);
    assert.equal(resultado.assists, 0);
    assert.equal(resultado.kd, 0);
    assert.equal(resultado.kda, 0);
    assert.equal(resultado.taxaVitoria, 0);
});

// Testa uma vitória
test('calcula corretamente uma vitória', () => {
    const partidas = [
        {
            resultado: 'Vitória',
            kills: 20,
            deaths: 10,
            assists: 5
        }
    ];

    const resultado = calcularEstatisticasValorant(partidas);

    assert.equal(resultado.totalPartidas, 1);
    assert.equal(resultado.vitorias, 1);
    assert.equal(resultado.derrotas, 0);
    assert.equal(resultado.kd, 2);
    assert.equal(resultado.kda, 2.5);
    assert.equal(resultado.taxaVitoria, 100);
});

// Testa uma derrota
test('calcula corretamente uma derrota', () => {
    const partidas = [
        {
            resultado: 'Derrota',
            kills: 10,
            deaths: 20,
            assists: 4
        }
    ];

    const resultado = calcularEstatisticasValorant(partidas);

    assert.equal(resultado.derrotas, 1);
    assert.equal(resultado.kd, 0.5);
    assert.equal(resultado.kda, 0.7);
    assert.equal(resultado.taxaVitoria, 0);
});

// Testa várias partidas
test('soma estatísticas de várias partidas', () => {
    const partidas = [
        {
            resultado: 'Vitória',
            kills: 20,
            deaths: 10,
            assists: 5
        },
        {
            resultado: 'Derrota',
            kills: 10,
            deaths: 20,
            assists: 5
        },
        {
            resultado: 'Vitória',
            kills: 15,
            deaths: 15,
            assists: 10
        }
    ];

    const resultado = calcularEstatisticasValorant(partidas);

    assert.equal(resultado.totalPartidas, 3);
    assert.equal(resultado.vitorias, 2);
    assert.equal(resultado.derrotas, 1);
    assert.equal(resultado.kills, 45);
    assert.equal(resultado.deaths, 45);
    assert.equal(resultado.assists, 20);
    assert.equal(resultado.kd, 1);
    assert.equal(resultado.kda, 1.44);
    assert.equal(resultado.taxaVitoria, 66.67);
});

// Testa partidas sem resultado definido
test('contabiliza partidas indefinidas', () => {
    const partidas = [
        {
            resultado: 'Indefinido',
            kills: 5,
            deaths: 5,
            assists: 2
        }
    ];

    const resultado = calcularEstatisticasValorant(partidas);

    assert.equal(resultado.indefinidas, 1);
    assert.equal(resultado.totalPartidas, 1);
    assert.equal(resultado.taxaVitoria, 0);
});

// Testa partidas sem mortes
test('evita divisão por zero', () => {
    const partidas = [
        {
            resultado: 'Vitória',
            kills: 15,
            deaths: 0,
            assists: 5
        }
    ];

    const resultado = calcularEstatisticasValorant(partidas);

    assert.equal(resultado.kd, 0);
    assert.equal(resultado.kda, 0);
});

// Testa entradas inválidas
test('rejeita uma lista de partidas inválida', () => {
    assert.throws(
        () => calcularEstatisticasValorant(null),
        /lista de partidas é inválida/
    );
});

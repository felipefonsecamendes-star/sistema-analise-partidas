
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    verificarPartidaExistente
} = require('../src/riot/integration');

const {
    salvarPartidaRiot
} = require('../src/riot/repository');

// Teste 1: identifica uma partida existente
test('identifica uma partida duplicada', async () => {
    const conexao = {
        async execute(sql, valores) {
            assert.match(sql, /SELECT id/);
            assert.deepEqual(valores, [1, 'MATCH-123']);

            return [[{ id: 10 }]];
        }
    };

    const existe = await verificarPartidaExistente(
        conexao,
        1,
        'MATCH-123'
    );

    assert.equal(existe, true);
});

// Teste 2: reconhece uma partida nova
test('reconhece uma partida ainda não importada', async () => {
    const conexao = {
        async execute() {
            return [[]];
        }
    };

    const existe = await verificarPartidaExistente(
        conexao,
        1,
        'MATCH-456'
    );

    assert.equal(existe, false);
});

// Teste 3: rejeita dados ausentes na consulta
test('rejeita consulta sem dados obrigatórios', async () => {
    await assert.rejects(
        verificarPartidaExistente(null, 1, 'MATCH-123'),
        /Dados obrigatórios não informados/
    );

    await assert.rejects(
        verificarPartidaExistente({}, null, 'MATCH-123'),
        /Dados obrigatórios não informados/
    );

    await assert.rejects(
        verificarPartidaExistente({}, 1, ''),
        /Dados obrigatórios não informados/
    );
});

// Teste 4: salva uma partida nova
test('insere uma partida nova corretamente', async () => {
    let consultas = 0;

    const conexao = {
        async execute(sql, valores) {
            consultas++;

            assert.match(sql, /INSERT INTO riot_partida/);
            assert.doesNotMatch(
                sql,
                /ON DUPLICATE KEY UPDATE/
            );

            assert.deepEqual(valores, [
                1,
                'MATCH-789',
                20,
                10,
                5,
                'Ascent',
'Vitória',
null,
null,
250,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]);

            return [{
                insertId: 15,
                affectedRows: 1
            }];
        }
    };

    const partida = {
        riot_conta_id: 1,
        match_id: 'MATCH-789',
        kills: 20,
        deaths: 10,
        assists: 5,
        mapa: 'Ascent',
        resultado: 'Vitória',
        pontuacao: 250
    };

    const resultado = await salvarPartidaRiot(
        conexao,
        partida
    );

    assert.equal(resultado.insertId, 15);
    assert.equal(resultado.affectedRows, 1);
    assert.equal(consultas, 1);
});

// Teste 5: rejeita dados ausentes no salvamento
test('rejeita partida sem dados obrigatórios', async () => {
    const conexao = {
        async execute() {
            throw new Error('Não deveria executar SQL');
        }
    };

    await assert.rejects(
        salvarPartidaRiot(conexao, null),
        /Dados obrigatórios da partida não informados/
    );

    await assert.rejects(
        salvarPartidaRiot(conexao, {
            riot_conta_id: 1
        }),
        /Dados obrigatórios da partida não informados/
    );

    await assert.rejects(
        salvarPartidaRiot(conexao, {
            match_id: 'MATCH-123'
        }),
        /Dados obrigatórios da partida não informados/
    );
});

// Teste 6: não ignora erros de duplicação do MySQL
test('repassa erro de partida duplicada do banco', async () => {
    const conexao = {
        async execute() {
            const erro = new Error('Duplicate entry');

            erro.code = 'ER_DUP_ENTRY';
            erro.errno = 1062;

            throw erro;
        }
    };

    const partida = {
        riot_conta_id: 1,
        match_id: 'MATCH-123',
        kills: 10,
        deaths: 5,
        assists: 3
    };

    await assert.rejects(
        salvarPartidaRiot(conexao, partida),
        (erro) => {
            assert.equal(erro.code, 'ER_DUP_ENTRY');
            assert.equal(erro.errno, 1062);

            return true;
        }
    );
});


const test = require('node:test');
const assert = require('node:assert/strict');

const {
    tratarErroRiot,
    responderErroRiot
} = require('../src/riot/error');

// Teste 1: partida duplicada
test('retorna erro 409 para partida duplicada', () => {
    const erro = new Error(
        'Esta partida já foi importada anteriormente.'
    );

    erro.status = 409;

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 409);
    assert.equal(resultado.sucesso, false);
    assert.equal(
        resultado.mensagem,
        'Esta partida já foi importada anteriormente.'
    );
});

// Teste 2: conta ou partida não encontrada
test('retorna erro 404 para recurso não encontrado', () => {
    const erro = new Error('Não encontrado');
    erro.status = 404;

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 404);
    assert.equal(
        resultado.mensagem,
        'Conta ou partida não encontrada.'
    );
});

// Teste 3: limite de requisições
test('retorna erro 429 quando a Riot limita consultas', () => {
    const erro = new Error('Muitas requisições');
    erro.status = 429;
    erro.retryAfter = '30';

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 429);
    assert.equal(resultado.aguardarSegundos, 30);
    assert.equal(
        resultado.mensagem,
        'Limite de consultas à Riot atingido.'
    );
});

// Teste 4: falha de autenticação
test('protege detalhes de erro de autenticação', () => {
    const erro = new Error('Token inválido');
    erro.status = 401;

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 502);
    assert.equal(
        resultado.mensagem,
        'A autenticação com a Riot falhou.'
    );
    assert.equal(
        resultado.mensagem.includes('Token inválido'),
        false
    );
});

// Teste 5: falha interna da Riot
test('retorna erro 502 para falha interna da Riot', () => {
    const erro = new Error('Erro interno');
    erro.status = 500;

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 502);
    assert.equal(
        resultado.mensagem,
        'A Riot apresentou um erro interno.'
    );
});

// Teste 6: erro desconhecido
test('retorna mensagem segura para erro desconhecido', () => {
    const erro = new Error('Informação interna secreta');

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 502);
    assert.equal(resultado.sucesso, false);
    assert.equal(
        resultado.mensagem,
        'Não foi possível comunicar com a Riot Games.'
    );
});

// Teste 7: tempo de espera inválido
test('ignora tempo de espera inválido', () => {
    const erro = new Error('Limite de requisições');
    erro.status = 429;
    erro.retryAfter = '-10';

    const resultado = tratarErroRiot(erro);

    assert.equal(resultado.status, 429);
    assert.equal(
        Object.hasOwn(resultado, 'aguardarSegundos'),
        false
    );
});

// Teste 8: resposta HTTP e cabeçalho Retry-After
test('envia status, JSON e Retry-After corretamente', () => {
    const resposta = {
        statusCode: null,
        headers: {},
        dados: null,

        status(codigo) {
            this.statusCode = codigo;
            return this;
        },

        set(nome, valor) {
            this.headers[nome] = valor;
            return this;
        },

        json(dados) {
            this.dados = dados;
            return this;
        }
    };

    const erro = new Error('Limite de consultas');
    erro.status = 429;
    erro.retryAfter = '15';

    const resultado = responderErroRiot(resposta, erro);

    assert.equal(resultado, resposta);
    assert.equal(resposta.statusCode, 429);
    assert.equal(resposta.headers['Retry-After'], '15');
    assert.deepEqual(resposta.dados, {
        sucesso: false,
        mensagem: 'Limite de consultas à Riot atingido.',
        aguardarSegundos: 15
    });
});

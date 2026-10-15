
-- Integração VALORANT com GameMetrics
-- Banco de dados MySQL

-- Tabela para armazenar contas Riot
CREATE TABLE IF NOT EXISTS riot_conta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puuid VARCHAR(100) NOT NULL UNIQUE,
    game_name VARCHAR(100),
    tag_line VARCHAR(10),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Relacionamento com usuário do GameMetrics
    CONSTRAINT fk_riot_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

-- Tabela para armazenar partidas do VALORANT
CREATE TABLE IF NOT EXISTS riot_partida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    riot_conta_id INT NOT NULL,
    match_id VARCHAR(100) NOT NULL,

    -- Estatísticas do jogador
    kills INT NOT NULL DEFAULT 0,
    deaths INT NOT NULL DEFAULT 0,
    assists INT NOT NULL DEFAULT 0,

    -- Informações da partida
    mapa VARCHAR(100),
    resultado VARCHAR(20),
    pontuacao INT NOT NULL DEFAULT 0,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Relacionamento com a conta Riot
    CONSTRAINT fk_partida_riot_conta
        FOREIGN KEY (riot_conta_id)
        REFERENCES riot_conta(id)
        ON DELETE CASCADE
);

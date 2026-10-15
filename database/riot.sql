
-- Integração VALORANT com GameMetrics
-- Banco de dados MySQL

-- Tabela para armazenar contas Riot
CREATE TABLE IF NOT EXISTS riot_conta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    puuid VARCHAR(100) NOT NULL UNIQUE,
    game_name VARCHAR(100),
    tag_line VARCHAR(10),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para armazenar partidas do VALORANT
CREATE TABLE IF NOT EXISTS riot_partida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    riot_conta_id INT NOT NULL,
    match_id VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE DATABASE IF NOT EXISTS gamemetrics CHARACTER SET utf8mb4;
USE gamemetrics;
CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE jogo (
  id_jogo INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  desenvolvedora VARCHAR(100),
  versao VARCHAR(50)
);
CREATE TABLE partida (
  id_partida INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_jogo INT NOT NULL,
  data_partida DATETIME NOT NULL,
  mapa VARCHAR(100),
  resultado VARCHAR(20) NOT NULL,
  duracao TIME,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_jogo) REFERENCES jogo(id_jogo)
);
CREATE TABLE estatistica (
  id_estatistica INT AUTO_INCREMENT PRIMARY KEY,
  id_partida INT NOT NULL,
  kills INT, deaths INT, assists INT,
  tiros_disparados INT, tiros_acertados INT, headshots INT,
  dinheiro_ganho DECIMAL(10,2), dinheiro_gasto DECIMAL(10,2),
  FOREIGN KEY (id_partida) REFERENCES partida(id_partida) ON DELETE CASCADE
);
CREATE TABLE desempenho (
  id_desempenho INT AUTO_INCREMENT PRIMARY KEY,
  id_partida INT NOT NULL,
  precisao DECIMAL(5,2), porcentagem_headshot DECIMAL(5,2),
  kd DECIMAL(6,2), pontuacao DECIMAL(6,2),
  FOREIGN KEY (id_partida) REFERENCES partida(id_partida) ON DELETE CASCADE
);
CREATE TABLE demo (
  id_demo INT AUTO_INCREMENT PRIMARY KEY,
  id_partida INT NOT NULL,
  nome_arquivo VARCHAR(255), caminho_arquivo VARCHAR(500),
  data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
  status_processamento VARCHAR(30),
  FOREIGN KEY (id_partida) REFERENCES partida(id_partida) ON DELETE CASCADE
);

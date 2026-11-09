SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `data_cadastro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `jogo` (
  `id_jogo` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `desenvolvedora` varchar(100) DEFAULT NULL,
  `versao` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_jogo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `partida` (
  `id_partida` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_jogo` int NOT NULL,
  `data_partida` datetime NOT NULL,
  `mapa` varchar(100) DEFAULT NULL,
  `resultado` varchar(20) NOT NULL,
  `duracao` time DEFAULT NULL,
  PRIMARY KEY (`id_partida`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_jogo` (`id_jogo`),
  CONSTRAINT `partida_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `partida_ibfk_2` FOREIGN KEY (`id_jogo`) REFERENCES `jogo` (`id_jogo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `estatistica` (
  `id_estatistica` int NOT NULL AUTO_INCREMENT,
  `id_partida` int NOT NULL,
  `kills` int DEFAULT NULL,
  `deaths` int DEFAULT NULL,
  `assists` int DEFAULT NULL,
  `tiros_disparados` int DEFAULT NULL,
  `tiros_acertados` int DEFAULT NULL,
  `headshots` int DEFAULT NULL,
  `dinheiro_ganho` decimal(10,2) DEFAULT NULL,
  `dinheiro_gasto` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_estatistica`),
  KEY `id_partida` (`id_partida`),
  CONSTRAINT `estatistica_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `partida` (`id_partida`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `desempenho` (
  `id_desempenho` int NOT NULL AUTO_INCREMENT,
  `id_partida` int NOT NULL,
  `precisao` decimal(5,2) DEFAULT NULL,
  `porcentagem_headshot` decimal(5,2) DEFAULT NULL,
  `kd` decimal(6,2) DEFAULT NULL,
  `pontuacao` decimal(6,2) DEFAULT NULL,
  PRIMARY KEY (`id_desempenho`),
  KEY `id_partida` (`id_partida`),
  CONSTRAINT `desempenho_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `partida` (`id_partida`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `demo` (
  `id_demo` int NOT NULL AUTO_INCREMENT,
  `id_partida` int NOT NULL,
  `nome_arquivo` varchar(255) DEFAULT NULL,
  `caminho_arquivo` varchar(500) DEFAULT NULL,
  `data_upload` datetime DEFAULT CURRENT_TIMESTAMP,
  `status_processamento` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_demo`),
  KEY `id_partida` (`id_partida`),
  CONSTRAINT `demo_ibfk_1` FOREIGN KEY (`id_partida`) REFERENCES `partida` (`id_partida`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `riot_conta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `puuid` varchar(100) NOT NULL,
  `game_name` varchar(100) DEFAULT NULL,
  `tag_line` varchar(10) DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `propriedade_verificada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `puuid` (`puuid`),
  KEY `fk_riot_usuario` (`usuario_id`),
  CONSTRAINT `fk_riot_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `riot_partida` (
  `id` int NOT NULL AUTO_INCREMENT,
  `riot_conta_id` int NOT NULL,
  `match_id` varchar(100) NOT NULL,
  `kills` int NOT NULL DEFAULT '0',
  `deaths` int NOT NULL DEFAULT '0',
  `assists` int NOT NULL DEFAULT '0',
  `mapa` varchar(100) DEFAULT NULL,
  `resultado` varchar(20) DEFAULT NULL,
  `pontuacao` int NOT NULL DEFAULT '0',
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `headshots` int DEFAULT '0',
  `bodyshots` int DEFAULT '0',
  `legshots` int DEFAULT '0',
  `dano_total` int DEFAULT '0',
  `rodadas_jogadas` int DEFAULT '0',
  `hs_percentual` decimal(5,2) DEFAULT '0.00',
  `kd` decimal(6,2) DEFAULT '0.00',
  `kda` decimal(6,2) DEFAULT '0.00',
  `adr` decimal(8,2) DEFAULT '0.00',
  `acs` decimal(8,2) DEFAULT '0.00',
  `placar_blue` int DEFAULT NULL,
  `placar_red` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_riot_partida_conta_match` (`riot_conta_id`,`match_id`),
  KEY `idx_riot_partida_data` (`riot_conta_id`,`criado_em`),
  CONSTRAINT `fk_partida_riot_conta` FOREIGN KEY (`riot_conta_id`) REFERENCES `riot_conta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `riot_partida_jogador` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partida_id` int NOT NULL,
  `puuid` varchar(100) DEFAULT NULL,
  `nick` varchar(100) DEFAULT NULL,
  `tag` varchar(20) DEFAULT NULL,
  `equipe` varchar(20) DEFAULT NULL,
  `agente` varchar(100) DEFAULT NULL,
  `kills` int DEFAULT '0',
  `deaths` int DEFAULT '0',
  `assists` int DEFAULT '0',
  `headshots` int DEFAULT '0',
  `bodyshots` int DEFAULT '0',
  `legshots` int DEFAULT '0',
  `hs_percentual` decimal(5,2) DEFAULT '0.00',
  `adr` decimal(8,2) DEFAULT '0.00',
  `acs` decimal(8,2) DEFAULT '0.00',
  `rank` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_partida_jogador` (`partida_id`,`puuid`),
  CONSTRAINT `riot_partida_jogador_ibfk_1` FOREIGN KEY (`partida_id`) REFERENCES `riot_partida` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

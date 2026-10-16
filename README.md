
# GameMetrics

Sistema de Análise de Partidas FPS

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC) do Técnico em Análise e Desenvolvimento de Sistemas.

## Sobre o projeto

O GameMetrics é uma aplicação web criada para organizar e analisar informações de partidas de jogos FPS.

O sistema permite acompanhar partidas, visualizar estatísticas e consultar dados relacionados ao desempenho dos jogadores.

O projeto também possui uma integração com a API da Riot Games para consultar informações do VALORANT.

## Tecnologias utilizadas

- Node.js
- JavaScript
- Express
- MySQL
- HTML
- CSS
- Git e GitHub
- GitHub Actions
- API da Riot Games

## Funcionalidades

- Cadastro e autenticação de usuários
- Gerenciamento de jogos e partidas
- Dashboard de estatísticas
- Análise de arquivos de demonstração
- Consulta de contas Riot pelo Riot ID
- Vinculação de contas Riot
- Consulta do histórico de partidas do VALORANT
- Importação de estatísticas de partidas
- Cálculo de K/D, KDA e taxa de vitória
- Identificação de vitórias e derrotas
- Identificação dos mapas do VALORANT
- Prevenção de importações duplicadas
- Testes automatizados

Algumas funcionalidades dependem da configuração do banco de dados e de credenciais válidas da Riot Games.

## Requisitos

Antes de iniciar, instale:

- Node.js 22 ou versão compatível
- npm
- MySQL
- Git (opcional para baixar o projeto)

## Instalação

### 1. Baixar o projeto

```bash
git clone https://github.com/felipefonsecamendes-star/sistema-analise-partidas.git
```

Entre na pasta:

```bash
cd sistema-analise-partidas
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.

Preencha as configurações conforme seu ambiente.

Exemplo:

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=gamemetrics

SESSION_SECRET=coloque-uma-chave-longa-e-aleatoria

RIOT_REGION=br
RIOT_PLATFORM=br1
RIOT_ROUTING=americas

RIOT_API_KEY=
```

A chave `RIOT_API_KEY` deve ser obtida pelos meios oficiais da Riot Games.

Nunca publique seu arquivo `.env`, senhas ou chaves de API no GitHub.

### 4. Configurar o banco de dados

No MySQL, crie o banco de dados utilizado pelo projeto.

Exemplo:

```sql
CREATE DATABASE IF NOT EXISTS gamemetrics;

USE gamemetrics;
```

Execute os scripts SQL do projeto na seguinte ordem:

1. `database/schema.sql`
2. `database/seed.sql`
3. `database/riot.sql`

O arquivo `riot.sql` cria as tabelas necessárias para armazenar contas e partidas do VALORANT.

### 5. Iniciar o servidor

```bash
npm start
```

Com a porta padrão, acesse:

http://localhost:3000

## Integração com VALORANT

A integração com a Riot Games permite consultar informações de jogadores e partidas.

### Dados processados

Cada partida importada pode armazenar:

- ID da partida
- Conta Riot relacionada
- Quantidade de eliminações (kills)
- Quantidade de mortes (deaths)
- Assistências (assists)
- Nome do mapa
- Resultado da partida
- Pontuação

### Estatísticas calculadas

**K/D**

Relação entre eliminações e mortes:

```text
K/D = kills / deaths
```

**KDA**

Relação entre eliminações, assistências e mortes:

```text
KDA = (kills + assists) / deaths
```

**Taxa de vitória**

Percentual de vitórias entre partidas com resultado definido:

```text
Taxa de vitória = (vitórias / partidas decididas) * 100
```

Quando não existem mortes ou partidas decididas, os cálculos correspondentes retornam zero.

## Prevenção de partidas duplicadas

O sistema verifica se uma partida já foi importada para a mesma conta Riot.

O banco de dados também utiliza uma restrição UNIQUE para impedir registros duplicados.

Quando uma partida já foi importada, a integração pode retornar o código HTTP 409.

## Testes automatizados

O projeto utiliza o sistema de testes integrado do Node.js.

Para executar todos os testes:

```bash
npm test
```

### Arquivos de teste

- `tests/riot-stats.test.js`
- `tests/riot-error.test.js`
- `tests/riot-duplicate.test.js`
- `tests/riot-processor.test.js`

Os testes verificam:

- Cálculo das estatísticas
- Vitórias e derrotas
- Tratamento de erros da Riot
- Limite de requisições
- Identificação de partidas duplicadas
- Salvamento de partidas
- Processamento dos dados dos jogadores
- Conversão dos nomes dos mapas

O projeto possui 29 casos de teste definidos nesses arquivos.

Esses testes utilizam dados simulados e não substituem testes de integração com a API Riot ou com um banco MySQL real.

## GitHub Actions

O GameMetrics possui um workflow para executar os testes automaticamente.

Arquivo de configuração:

```text
.github/workflows/tests.yml
```

O workflow pode ser executado:

- Ao enviar alterações para a branch main
- Ao abrir ou atualizar um Pull Request para main
- Manualmente pela aba Actions do GitHub

## Estrutura principal

```text
sistema-analise-partidas/
|
|-- .github/
|   |-- workflows/
|       |-- tests.yml
|
|-- database/
|   |-- schema.sql
|   |-- seed.sql
|   |-- riot.sql
|
|-- public/
|
|-- src/
|   |-- riot/
|   |-- routes/
|
|-- tests/
|   |-- riot-stats.test.js
|   |-- riot-error.test.js
|   |-- riot-duplicate.test.js
|   |-- riot-processor.test.js
|
|-- .env.example
|-- package.json
|-- server.js
|-- README.md
```

## Observações

A utilização da integração Riot depende de uma chave de API válida e das permissões concedidas pela Riot Games.

A execução dos testes automatizados não exige uma chave da Riot nem uma conexão ativa com o MySQL.

O funcionamento completo da aplicação depende da configuração correta do ambiente.

## Objetivo acadêmico

O GameMetrics foi desenvolvido para aplicar conhecimentos de:

- Desenvolvimento web
- Programação back-end
- Banco de dados relacional
- Integração com APIs
- Tratamento de erros
- Testes automatizados
- Versionamento de código

## Licença

Projeto desenvolvido para fins acadêmicos.

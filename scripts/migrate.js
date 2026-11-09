
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function executarMigrations() {
    const conexao = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        await conexao.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL UNIQUE,
                executada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const pasta = path.join(__dirname, '../database/migrations');

        const arquivos = fs.readdirSync(pasta)
            .filter(arquivo => arquivo.endsWith('.sql'))
            .sort();

        const [registros] = await conexao.query(
            'SELECT nome FROM schema_migrations'
        );

        const executadas = new Set(
            registros.map(registro => registro.nome)
        );

        for (const arquivo of arquivos) {
            if (executadas.has(arquivo)) {
                console.log(`Ignorando: ${arquivo}`);
                continue;
            }

            console.log(`Executando: ${arquivo}`);

            const sql = fs.readFileSync(
                path.join(pasta, arquivo),
                'utf8'
            );

            await conexao.query(sql);

            await conexao.query(
                'INSERT INTO schema_migrations (nome) VALUES (?)',
                [arquivo]
            );

            console.log(`Concluída: ${arquivo}`);
        }

        console.log('Migrations finalizadas com sucesso!');
    } finally {
        await conexao.end();
    }
}

executarMigrations().catch(erro => {
    console.error('Erro ao executar migrations:', erro.message);
    process.exitCode = 1;
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Criar diretório de dados se não existir
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'loteamento.db');

class Database {
    constructor() {
        this.db = null;
    }

    // Conectar ao banco de dados
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar com o banco de dados:', err);
                    reject(err);
                } else {
                    console.log('✅ Conectado ao banco de dados SQLite');
                    this.initializeTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // Inicializar tabelas
    async initializeTables() {
        const tables = [
            // Tabela de usuários para autenticação
            `CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabela de lotes
            `CREATE TABLE IF NOT EXISTS lotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                tamanho TEXT NOT NULL,
                imagens TEXT NOT NULL, -- JSON array
                descricao TEXT,
                telefone TEXT,
                status TEXT DEFAULT 'disponivel',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabela de slides do carrossel
            `CREATE TABLE IF NOT EXISTS carrossel_slides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                imagem TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descricao TEXT NOT NULL,
                ordem INTEGER DEFAULT 0,
                ativo BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabela de configurações
            `CREATE TABLE IF NOT EXISTS configuracoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                valor TEXT NOT NULL,
                tipo TEXT DEFAULT 'string',
                descricao TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabela de logs de atividades
            `CREATE TABLE IF NOT EXISTS atividades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                acao TEXT NOT NULL,
                tabela TEXT NOT NULL,
                registro_id INTEGER,
                dados_anteriores TEXT, -- JSON
                dados_novos TEXT, -- JSON
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
            )`,

            // Tabela de backups
            `CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                arquivo TEXT NOT NULL,
                tamanho INTEGER,
                tipo TEXT DEFAULT 'manual',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Inserir dados padrão se necessário
        await this.insertDefaultData();
    }

    // Inserir dados padrão
    async insertDefaultData() {
        // Verificar se já existem dados
        const lotesCount = await this.get('SELECT COUNT(*) as count FROM lotes');
        const configCount = await this.get('SELECT COUNT(*) as count FROM configuracoes');
        const slidesCount = await this.get('SELECT COUNT(*) as count FROM carrossel_slides');

        // Inserir lotes padrão
        if (lotesCount.count === 0) {
            const lotesDefault = [
                {
                    titulo: 'Long Town',
                    codigo: 'TKBFF-022',
                    valor: '130.000,00',
                    tamanho: '200m²',
                    imagens: JSON.stringify(['./img/lote-1.webp', './img/lote-2.webp', './img/lote-3.jpg']),
                    descricao: 'Lote residencial em área nobre com infraestrutura completa.',
                    telefone: '5534996778018'
                },
                {
                    titulo: 'Garden Ville',
                    codigo: 'TKBFF-023',
                    valor: '150.000,00',
                    tamanho: '250m²',
                    imagens: JSON.stringify(['./img/lote-1.webp', './img/lote-2.webp', './img/lote-3.jpg']),
                    descricao: 'Lote premium com vista privilegiada e fácil acesso.',
                    telefone: '5534996778018'
                }
            ];

            for (const lote of lotesDefault) {
                await this.run(
                    'INSERT INTO lotes (titulo, codigo, valor, tamanho, imagens, descricao, telefone) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [lote.titulo, lote.codigo, lote.valor, lote.tamanho, lote.imagens, lote.descricao, lote.telefone]
                );
            }
            console.log('✅ Lotes padrão inseridos');
        }

        // Inserir slides padrão
        if (slidesCount.count === 0) {
            const slidesDefault = [
                {
                    imagem: 'img/carroussel-1.jpg',
                    titulo: '🏡 Loteamento Premium',
                    descricao: 'Conheça nossos lotes de alto padrão com toda infraestrutura necessária para realizar seus sonhos',
                    ordem: 1
                },
                {
                    imagem: 'img/carroussel-2.jpg',
                    titulo: '📍 Localização Privilegiada',
                    descricao: 'Área estratégica com fácil acesso, próximo a centros urbanos e com infraestrutura completa',
                    ordem: 2
                },
                {
                    imagem: 'img/carroussel-3.jpg',
                    titulo: '💰 Investimento Seguro',
                    descricao: 'Garanta seu lote com as melhores condições de pagamento e valorização garantida',
                    ordem: 3
                }
            ];

            for (const slide of slidesDefault) {
                await this.run(
                    'INSERT INTO carrossel_slides (imagem, titulo, descricao, ordem) VALUES (?, ?, ?, ?)',
                    [slide.imagem, slide.titulo, slide.descricao, slide.ordem]
                );
            }
            console.log('✅ Slides padrão inseridos');
        }

        // Inserir configurações padrão
        if (configCount.count === 0) {
            const configDefault = [
                { chave: 'telefone', valor: '(34) 99999-9999', tipo: 'string', descricao: 'Telefone de contato' },
                { chave: 'email', valor: 'contato@ibizaloteamentos.com', tipo: 'string', descricao: 'Email de contato' },
                { chave: 'endereco', valor: 'Av. dos Loteamentos, 123 - Cidade, Estado', tipo: 'string', descricao: 'Endereço da empresa' },
                { chave: 'titulo_site', valor: 'Loteamento Ibiza', tipo: 'string', descricao: 'Título do site' },
                { chave: 'subtitulo', valor: 'O lugar perfeito para construir seus sonhos espera por você!', tipo: 'string', descricao: 'Subtítulo do site' }
            ];

            for (const config of configDefault) {
                await this.run(
                    'INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES (?, ?, ?, ?)',
                    [config.chave, config.valor, config.tipo, config.descricao]
                );
            }
            console.log('✅ Configurações padrão inseridas');
        }
    }

    // Executar query
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Erro na query:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Buscar um registro
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Erro na query:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Buscar múltiplos registros
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Erro na query:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Fechar conexão
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Erro ao fechar banco de dados:', err);
                        reject(err);
                    } else {
                        console.log('✅ Conexão com banco de dados fechada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Executar transação
    async transaction(queries) {
        await this.run('BEGIN TRANSACTION');
        try {
            const results = [];
            for (const { sql, params } of queries) {
                const result = await this.run(sql, params);
                results.push(result);
            }
            await this.run('COMMIT');
            return results;
        } catch (error) {
            await this.run('ROLLBACK');
            throw error;
        }
    }

    // Registrar atividade
    async logActivity(userId, action, table, recordId, oldData = null, newData = null, ipAddress = null, userAgent = null) {
        try {
            await this.run(
                'INSERT INTO atividades (usuario_id, acao, tabela, registro_id, dados_anteriores, dados_novos, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    userId,
                    action,
                    table,
                    recordId,
                    oldData ? JSON.stringify(oldData) : null,
                    newData ? JSON.stringify(newData) : null,
                    ipAddress,
                    userAgent
                ]
            );
        } catch (error) {
            console.error('Erro ao registrar atividade:', error);
        }
    }
}

// Instância singleton
const database = new Database();

module.exports = database;

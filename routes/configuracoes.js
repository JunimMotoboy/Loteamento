const express = require('express');
const router = express.Router();
const database = require('../database/database');

// GET /api/configuracoes - Listar todas as configurações
router.get('/', async (req, res) => {
    try {
        const configuracoes = await database.all('SELECT * FROM configuracoes ORDER BY chave ASC');
        
        // Converter para formato objeto
        const configObj = {};
        configuracoes.forEach(config => {
            let valor = config.valor;
            
            // Converter tipos
            switch (config.tipo) {
                case 'number':
                    valor = parseFloat(valor);
                    break;
                case 'boolean':
                    valor = valor === 'true' || valor === '1';
                    break;
                case 'json':
                    try {
                        valor = JSON.parse(valor);
                    } catch (e) {
                        valor = config.valor;
                    }
                    break;
                default:
                    valor = config.valor;
            }
            
            configObj[config.chave] = valor;
        });
        
        res.json({
            success: true,
            data: configObj,
            raw: configuracoes
        });
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/configuracoes/:chave - Buscar configuração específica
router.get('/:chave', async (req, res) => {
    try {
        const { chave } = req.params;
        
        const config = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuração não encontrada'
            });
        }
        
        let valor = config.valor;
        
        // Converter tipos
        switch (config.tipo) {
            case 'number':
                valor = parseFloat(valor);
                break;
            case 'boolean':
                valor = valor === 'true' || valor === '1';
                break;
            case 'json':
                try {
                    valor = JSON.parse(valor);
                } catch (e) {
                    valor = config.valor;
                }
                break;
            default:
                valor = config.valor;
        }
        
        res.json({
            success: true,
            data: {
                chave: config.chave,
                valor: valor,
                tipo: config.tipo,
                descricao: config.descricao,
                updated_at: config.updated_at
            }
        });
    } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/configuracoes - Criar nova configuração
router.post('/', async (req, res) => {
    try {
        const { chave, valor, tipo, descricao } = req.body;
        
        // Validações
        if (!chave || valor === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: chave, valor'
            });
        }
        
        // Verificar se chave já existe
        const existingConfig = await database.get('SELECT id FROM configuracoes WHERE chave = ?', [chave]);
        if (existingConfig) {
            return res.status(400).json({
                success: false,
                error: 'Configuração com esta chave já existe'
            });
        }
        
        // Converter valor para string baseado no tipo
        let valorString = valor;
        const tipoFinal = tipo || 'string';
        
        if (tipoFinal === 'json' && typeof valor === 'object') {
            valorString = JSON.stringify(valor);
        } else if (tipoFinal === 'boolean') {
            valorString = valor ? 'true' : 'false';
        } else {
            valorString = String(valor);
        }
        
        // Inserir nova configuração
        const result = await database.run(
            'INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES (?, ?, ?, ?)',
            [chave, valorString, tipoFinal, descricao || '']
        );
        
        // Buscar a configuração criada
        const novaConfig = await database.get('SELECT * FROM configuracoes WHERE id = ?', [result.id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'CREATE',
            'configuracoes',
            result.id,
            null,
            novaConfig,
            req.ip,
            req.get('User-Agent')
        );
        
        res.status(201).json({
            success: true,
            message: 'Configuração criada com sucesso',
            data: novaConfig
        });
    } catch (error) {
        console.error('Erro ao criar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// PUT /api/configuracoes/:chave - Atualizar configuração
router.put('/:chave', async (req, res) => {
    try {
        const { chave } = req.params;
        const { valor, tipo, descricao } = req.body;
        
        // Buscar configuração atual
        const configAtual = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
        if (!configAtual) {
            return res.status(404).json({
                success: false,
                error: 'Configuração não encontrada'
            });
        }
        
        // Converter valor para string baseado no tipo
        let valorString = valor;
        const tipoFinal = tipo || configAtual.tipo;
        
        if (valor !== undefined) {
            if (tipoFinal === 'json' && typeof valor === 'object') {
                valorString = JSON.stringify(valor);
            } else if (tipoFinal === 'boolean') {
                valorString = valor ? 'true' : 'false';
            } else {
                valorString = String(valor);
            }
        } else {
            valorString = configAtual.valor;
        }
        
        // Atualizar configuração
        await database.run(
            'UPDATE configuracoes SET valor = ?, tipo = ?, descricao = ?, updated_at = CURRENT_TIMESTAMP WHERE chave = ?',
            [
                valorString,
                tipoFinal,
                descricao !== undefined ? descricao : configAtual.descricao,
                chave
            ]
        );
        
        // Buscar configuração atualizada
        const configAtualizada = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'UPDATE',
            'configuracoes',
            configAtualizada.id,
            configAtual,
            configAtualizada,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Configuração atualizada com sucesso',
            data: configAtualizada
        });
    } catch (error) {
        console.error('Erro ao atualizar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// DELETE /api/configuracoes/:chave - Excluir configuração
router.delete('/:chave', async (req, res) => {
    try {
        const { chave } = req.params;
        
        // Buscar configuração atual
        const config = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuração não encontrada'
            });
        }
        
        // Excluir configuração
        await database.run('DELETE FROM configuracoes WHERE chave = ?', [chave]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'DELETE',
            'configuracoes',
            config.id,
            config,
            null,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Configuração excluída com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/configuracoes/bulk - Atualizar múltiplas configurações
router.post('/bulk', async (req, res) => {
    try {
        const { configuracoes } = req.body;
        
        if (!configuracoes || typeof configuracoes !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Formato inválido. Envie um objeto com as configurações'
            });
        }
        
        const queries = [];
        const atividades = [];
        
        for (const [chave, valor] of Object.entries(configuracoes)) {
            // Buscar configuração atual
            const configAtual = await database.get('SELECT * FROM configuracoes WHERE chave = ?', [chave]);
            
            if (configAtual) {
                // Converter valor para string baseado no tipo
                let valorString = valor;
                
                if (configAtual.tipo === 'json' && typeof valor === 'object') {
                    valorString = JSON.stringify(valor);
                } else if (configAtual.tipo === 'boolean') {
                    valorString = valor ? 'true' : 'false';
                } else {
                    valorString = String(valor);
                }
                
                queries.push({
                    sql: 'UPDATE configuracoes SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE chave = ?',
                    params: [valorString, chave]
                });
                
                atividades.push({
                    chave,
                    anterior: configAtual.valor,
                    novo: valorString
                });
            } else {
                // Criar nova configuração se não existir
                const valorString = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
                const tipo = typeof valor === 'object' ? 'json' : typeof valor === 'boolean' ? 'boolean' : 'string';
                
                queries.push({
                    sql: 'INSERT INTO configuracoes (chave, valor, tipo) VALUES (?, ?, ?)',
                    params: [chave, valorString, tipo]
                });
                
                atividades.push({
                    chave,
                    anterior: null,
                    novo: valorString
                });
            }
        }
        
        // Executar todas as queries em uma transação
        await database.transaction(queries);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'BULK_UPDATE',
            'configuracoes',
            null,
            null,
            { configuracoes: atividades },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: `${Object.keys(configuracoes).length} configurações atualizadas com sucesso`
        });
    } catch (error) {
        console.error('Erro ao atualizar configurações em lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/configuracoes/public/site - Configurações públicas para o site
router.get('/public/site', async (req, res) => {
    try {
        // Buscar apenas configurações que podem ser públicas
        const configsPublicas = [
            'telefone',
            'email', 
            'endereco',
            'titulo_site',
            'subtitulo'
        ];
        
        const placeholders = configsPublicas.map(() => '?').join(',');
        const configuracoes = await database.all(
            `SELECT chave, valor, tipo FROM configuracoes WHERE chave IN (${placeholders})`,
            configsPublicas
        );
        
        // Converter para formato objeto
        const configObj = {};
        configuracoes.forEach(config => {
            let valor = config.valor;
            
            // Converter tipos
            switch (config.tipo) {
                case 'number':
                    valor = parseFloat(valor);
                    break;
                case 'boolean':
                    valor = valor === 'true' || valor === '1';
                    break;
                case 'json':
                    try {
                        valor = JSON.parse(valor);
                    } catch (e) {
                        valor = config.valor;
                    }
                    break;
                default:
                    valor = config.valor;
            }
            
            configObj[config.chave] = valor;
        });
        
        res.json({
            success: true,
            data: configObj
        });
    } catch (error) {
        console.error('Erro ao buscar configurações públicas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;

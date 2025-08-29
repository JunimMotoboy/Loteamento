const express = require('express');
const router = express.Router();
const database = require('../database/database');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Criar diretório de backups se não existir
const backupDir = path.join(__dirname, '../data/backups');

async function ensureBackupDir() {
    try {
        await fs.access(backupDir);
    } catch {
        await fs.mkdir(backupDir, { recursive: true });
    }
}

// GET /api/backup - Listar backups disponíveis
router.get('/', async (req, res) => {
    try {
        const backups = await database.all(
            'SELECT * FROM backups ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('Erro ao listar backups:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/backup/export - Criar backup completo
router.post('/export', async (req, res) => {
    try {
        const { nome, incluir_logs } = req.body;
        
        await ensureBackupDir();
        
        // Buscar todos os dados
        const lotes = await database.all('SELECT * FROM lotes');
        const slides = await database.all('SELECT * FROM carrossel_slides');
        const configuracoes = await database.all('SELECT * FROM configuracoes');
        
        let atividades = [];
        if (incluir_logs) {
            atividades = await database.all('SELECT * FROM atividades ORDER BY created_at DESC LIMIT 1000');
        }
        
        // Converter imagens dos lotes de JSON string para array
        const lotesFormatted = lotes.map(lote => ({
            ...lote,
            imagens: JSON.parse(lote.imagens || '[]')
        }));
        
        // Criar objeto de backup
        const backupData = {
            metadata: {
                version: '1.0.0',
                created_at: new Date().toISOString(),
                created_by: req.user?.id || 'system',
                include_logs: incluir_logs || false,
                total_lotes: lotes.length,
                total_slides: slides.length,
                total_configuracoes: configuracoes.length,
                total_atividades: atividades.length
            },
            data: {
                lotes: lotesFormatted,
                carrossel_slides: slides,
                configuracoes: configuracoes,
                atividades: atividades
            }
        };
        
        // Gerar nome do arquivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeArquivo = nome ? 
            `${nome.replace(/[^a-zA-Z0-9-_]/g, '')}_${timestamp}.json` : 
            `backup_${timestamp}.json`;
        
        const caminhoArquivo = path.join(backupDir, nomeArquivo);
        
        // Salvar arquivo
        const backupJson = JSON.stringify(backupData, null, 2);
        await fs.writeFile(caminhoArquivo, backupJson, 'utf8');
        
        // Calcular tamanho do arquivo
        const stats = await fs.stat(caminhoArquivo);
        
        // Registrar backup no banco
        const result = await database.run(
            'INSERT INTO backups (nome, arquivo, tamanho, tipo) VALUES (?, ?, ?, ?)',
            [nome || `Backup ${timestamp}`, nomeArquivo, stats.size, 'manual']
        );
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'BACKUP_CREATE',
            'backups',
            result.id,
            null,
            { nome: nomeArquivo, tamanho: stats.size },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Backup criado com sucesso',
            data: {
                id: result.id,
                nome: nomeArquivo,
                tamanho: stats.size,
                download_url: `/api/backup/download/${result.id}`
            }
        });
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/backup/download/:id - Download de backup
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar backup no banco
        const backup = await database.get('SELECT * FROM backups WHERE id = ?', [id]);
        if (!backup) {
            return res.status(404).json({
                success: false,
                error: 'Backup não encontrado'
            });
        }
        
        const caminhoArquivo = path.join(backupDir, backup.arquivo);
        
        // Verificar se arquivo existe
        try {
            await fs.access(caminhoArquivo);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'Arquivo de backup não encontrado'
            });
        }
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'BACKUP_DOWNLOAD',
            'backups',
            id,
            null,
            { arquivo: backup.arquivo },
            req.ip,
            req.get('User-Agent')
        );
        
        // Enviar arquivo
        res.download(caminhoArquivo, backup.arquivo);
    } catch (error) {
        console.error('Erro ao fazer download do backup:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/backup/import - Importar backup
router.post('/import', async (req, res) => {
    try {
        const { backup_data, sobrescrever } = req.body;
        
        if (!backup_data) {
            return res.status(400).json({
                success: false,
                error: 'Dados de backup não fornecidos'
            });
        }
        
        let backupObj;
        try {
            backupObj = typeof backup_data === 'string' ? JSON.parse(backup_data) : backup_data;
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Formato de backup inválido'
            });
        }
        
        // Validar estrutura do backup
        if (!backupObj.data || !backupObj.metadata) {
            return res.status(400).json({
                success: false,
                error: 'Estrutura de backup inválida'
            });
        }
        
        const { lotes, carrossel_slides, configuracoes, atividades } = backupObj.data;
        
        // Preparar queries para transação
        const queries = [];
        
        // Se sobrescrever, limpar dados existentes
        if (sobrescrever) {
            queries.push(
                { sql: 'DELETE FROM lotes', params: [] },
                { sql: 'DELETE FROM carrossel_slides', params: [] },
                { sql: 'DELETE FROM configuracoes', params: [] }
            );
        }
        
        // Importar lotes
        if (lotes && Array.isArray(lotes)) {
            for (const lote of lotes) {
                const imagens = Array.isArray(lote.imagens) ? JSON.stringify(lote.imagens) : lote.imagens;
                
                if (sobrescrever) {
                    queries.push({
                        sql: 'INSERT INTO lotes (titulo, codigo, valor, tamanho, imagens, descricao, telefone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        params: [
                            lote.titulo,
                            lote.codigo,
                            lote.valor,
                            lote.tamanho,
                            imagens,
                            lote.descricao || '',
                            lote.telefone || '',
                            lote.status || 'disponivel'
                        ]
                    });
                } else {
                    // Verificar se código já existe
                    const existingLote = await database.get('SELECT id FROM lotes WHERE codigo = ?', [lote.codigo]);
                    if (!existingLote) {
                        queries.push({
                            sql: 'INSERT INTO lotes (titulo, codigo, valor, tamanho, imagens, descricao, telefone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            params: [
                                lote.titulo,
                                lote.codigo,
                                lote.valor,
                                lote.tamanho,
                                imagens,
                                lote.descricao || '',
                                lote.telefone || '',
                                lote.status || 'disponivel'
                            ]
                        });
                    }
                }
            }
        }
        
        // Importar slides do carrossel
        if (carrossel_slides && Array.isArray(carrossel_slides)) {
            for (const slide of carrossel_slides) {
                queries.push({
                    sql: 'INSERT INTO carrossel_slides (imagem, titulo, descricao, ordem, ativo) VALUES (?, ?, ?, ?, ?)',
                    params: [
                        slide.imagem,
                        slide.titulo,
                        slide.descricao,
                        slide.ordem || 0,
                        slide.ativo !== undefined ? slide.ativo : 1
                    ]
                });
            }
        }
        
        // Importar configurações
        if (configuracoes && Array.isArray(configuracoes)) {
            for (const config of configuracoes) {
                if (sobrescrever) {
                    queries.push({
                        sql: 'INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES (?, ?, ?, ?)',
                        params: [
                            config.chave,
                            config.valor,
                            config.tipo || 'string',
                            config.descricao || ''
                        ]
                    });
                } else {
                    // Verificar se chave já existe
                    const existingConfig = await database.get('SELECT id FROM configuracoes WHERE chave = ?', [config.chave]);
                    if (!existingConfig) {
                        queries.push({
                            sql: 'INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES (?, ?, ?, ?)',
                            params: [
                                config.chave,
                                config.valor,
                                config.tipo || 'string',
                                config.descricao || ''
                            ]
                        });
                    }
                }
            }
        }
        
        // Executar todas as queries em uma transação
        await database.transaction(queries);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'BACKUP_IMPORT',
            'backups',
            null,
            null,
            {
                sobrescrever,
                lotes_importados: lotes?.length || 0,
                slides_importados: carrossel_slides?.length || 0,
                configuracoes_importadas: configuracoes?.length || 0
            },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Backup importado com sucesso',
            data: {
                lotes_importados: lotes?.length || 0,
                slides_importados: carrossel_slides?.length || 0,
                configuracoes_importadas: configuracoes?.length || 0,
                sobrescrever
            }
        });
    } catch (error) {
        console.error('Erro ao importar backup:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// DELETE /api/backup/:id - Excluir backup
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar backup no banco
        const backup = await database.get('SELECT * FROM backups WHERE id = ?', [id]);
        if (!backup) {
            return res.status(404).json({
                success: false,
                error: 'Backup não encontrado'
            });
        }
        
        // Excluir arquivo físico
        const caminhoArquivo = path.join(backupDir, backup.arquivo);
        try {
            await fs.unlink(caminhoArquivo);
        } catch (error) {
            console.warn('Arquivo de backup não encontrado:', caminhoArquivo);
        }
        
        // Excluir registro do banco
        await database.run('DELETE FROM backups WHERE id = ?', [id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'BACKUP_DELETE',
            'backups',
            id,
            backup,
            null,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Backup excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir backup:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/backup/reset - Reset completo do sistema
router.post('/reset', async (req, res) => {
    try {
        const { confirmar } = req.body;
        
        if (confirmar !== 'RESET_COMPLETO') {
            return res.status(400).json({
                success: false,
                error: 'Confirmação necessária. Envie { "confirmar": "RESET_COMPLETO" }'
            });
        }
        
        // Criar backup antes do reset
        const backupAntes = {
            lotes: await database.all('SELECT * FROM lotes'),
            slides: await database.all('SELECT * FROM carrossel_slides'),
            configuracoes: await database.all('SELECT * FROM configuracoes')
        };
        
        // Limpar todas as tabelas (exceto usuários)
        const queries = [
            { sql: 'DELETE FROM atividades', params: [] },
            { sql: 'DELETE FROM lotes', params: [] },
            { sql: 'DELETE FROM carrossel_slides', params: [] },
            { sql: 'DELETE FROM configuracoes', params: [] },
            { sql: 'DELETE FROM backups', params: [] }
        ];
        
        await database.transaction(queries);
        
        // Reinserir dados padrão
        await database.insertDefaultData();
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'SYSTEM_RESET',
            'system',
            null,
            backupAntes,
            { reset_completo: true },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Reset completo realizado com sucesso. Dados padrão restaurados.',
            data: {
                lotes_removidos: backupAntes.lotes.length,
                slides_removidos: backupAntes.slides.length,
                configuracoes_removidas: backupAntes.configuracoes.length
            }
        });
    } catch (error) {
        console.error('Erro ao realizar reset:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/backup/stats - Estatísticas de backup
router.get('/stats', async (req, res) => {
    try {
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total_backups,
                SUM(tamanho) as tamanho_total,
                MAX(created_at) as ultimo_backup
            FROM backups
        `);
        
        // Calcular espaço usado
        let espacoUsado = 0;
        try {
            const arquivos = await fs.readdir(backupDir);
            for (const arquivo of arquivos) {
                const stat = await fs.stat(path.join(backupDir, arquivo));
                espacoUsado += stat.size;
            }
        } catch (error) {
            console.warn('Erro ao calcular espaço usado:', error);
        }
        
        res.json({
            success: true,
            data: {
                ...stats,
                espaco_usado: espacoUsado,
                diretorio_backup: backupDir
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;

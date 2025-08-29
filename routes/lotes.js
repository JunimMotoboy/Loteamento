const express = require('express');
const router = express.Router();
const database = require('../database/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/lotes - Listar todos os lotes
router.get('/', async (req, res) => {
    try {
        const { status, limit, offset } = req.query;
        
        let sql = 'SELECT * FROM lotes';
        let params = [];
        
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
            
            if (offset) {
                sql += ' OFFSET ?';
                params.push(parseInt(offset));
            }
        }
        
        const lotes = await database.all(sql, params);
        
        // Converter imagens de JSON string para array
        const lotesFormatted = lotes.map(lote => ({
            ...lote,
            imagens: JSON.parse(lote.imagens || '[]')
        }));
        
        res.json({
            success: true,
            data: lotesFormatted,
            total: lotesFormatted.length
        });
    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/lotes/:id - Buscar lote por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const lote = await database.get('SELECT * FROM lotes WHERE id = ?', [id]);
        
        if (!lote) {
            return res.status(404).json({
                success: false,
                error: 'Lote não encontrado'
            });
        }
        
        // Converter imagens de JSON string para array
        lote.imagens = JSON.parse(lote.imagens || '[]');
        
        res.json({
            success: true,
            data: lote
        });
    } catch (error) {
        console.error('Erro ao buscar lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/lotes - Criar novo lote
router.post('/', async (req, res) => {
    try {
        const { titulo, codigo, valor, tamanho, imagens, descricao, telefone, status } = req.body;
        
        // Validações
        if (!titulo || !codigo || !valor || !tamanho) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: titulo, codigo, valor, tamanho'
            });
        }
        
        // Verificar se código já existe
        const existingLote = await database.get('SELECT id FROM lotes WHERE codigo = ?', [codigo]);
        if (existingLote) {
            return res.status(400).json({
                success: false,
                error: 'Código do lote já existe'
            });
        }
        
        // Inserir novo lote
        const result = await database.run(
            'INSERT INTO lotes (titulo, codigo, valor, tamanho, imagens, descricao, telefone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                titulo,
                codigo,
                valor,
                tamanho,
                JSON.stringify(imagens || []),
                descricao || '',
                telefone || '',
                status || 'disponivel'
            ]
        );
        
        // Buscar o lote criado
        const novoLote = await database.get('SELECT * FROM lotes WHERE id = ?', [result.id]);
        novoLote.imagens = JSON.parse(novoLote.imagens || '[]');
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'CREATE',
            'lotes',
            result.id,
            null,
            novoLote,
            req.ip,
            req.get('User-Agent')
        );
        
        res.status(201).json({
            success: true,
            message: 'Lote criado com sucesso',
            data: novoLote
        });
    } catch (error) {
        console.error('Erro ao criar lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// PUT /api/lotes/:id - Atualizar lote
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, codigo, valor, tamanho, imagens, descricao, telefone, status } = req.body;
        
        // Buscar lote atual
        const loteAtual = await database.get('SELECT * FROM lotes WHERE id = ?', [id]);
        if (!loteAtual) {
            return res.status(404).json({
                success: false,
                error: 'Lote não encontrado'
            });
        }
        
        // Verificar se código já existe (exceto para o próprio lote)
        if (codigo && codigo !== loteAtual.codigo) {
            const existingLote = await database.get('SELECT id FROM lotes WHERE codigo = ? AND id != ?', [codigo, id]);
            if (existingLote) {
                return res.status(400).json({
                    success: false,
                    error: 'Código do lote já existe'
                });
            }
        }
        
        // Atualizar lote
        await database.run(
            'UPDATE lotes SET titulo = ?, codigo = ?, valor = ?, tamanho = ?, imagens = ?, descricao = ?, telefone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
                titulo || loteAtual.titulo,
                codigo || loteAtual.codigo,
                valor || loteAtual.valor,
                tamanho || loteAtual.tamanho,
                JSON.stringify(imagens || JSON.parse(loteAtual.imagens || '[]')),
                descricao !== undefined ? descricao : loteAtual.descricao,
                telefone !== undefined ? telefone : loteAtual.telefone,
                status || loteAtual.status,
                id
            ]
        );
        
        // Buscar lote atualizado
        const loteAtualizado = await database.get('SELECT * FROM lotes WHERE id = ?', [id]);
        loteAtualizado.imagens = JSON.parse(loteAtualizado.imagens || '[]');
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'UPDATE',
            'lotes',
            id,
            { ...loteAtual, imagens: JSON.parse(loteAtual.imagens || '[]') },
            loteAtualizado,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Lote atualizado com sucesso',
            data: loteAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// DELETE /api/lotes/:id - Excluir lote
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar lote atual
        const lote = await database.get('SELECT * FROM lotes WHERE id = ?', [id]);
        if (!lote) {
            return res.status(404).json({
                success: false,
                error: 'Lote não encontrado'
            });
        }
        
        // Excluir lote
        await database.run('DELETE FROM lotes WHERE id = ?', [id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'DELETE',
            'lotes',
            id,
            { ...lote, imagens: JSON.parse(lote.imagens || '[]') },
            null,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Lote excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/lotes/stats/summary - Estatísticas dos lotes
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await database.all(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as disponiveis,
                COUNT(CASE WHEN status = 'vendido' THEN 1 END) as vendidos,
                COUNT(CASE WHEN status = 'reservado' THEN 1 END) as reservados
            FROM lotes
        `);
        
        // Calcular valor total
        const valores = await database.all('SELECT valor FROM lotes WHERE status = "disponivel"');
        const valorTotal = valores.reduce((total, lote) => {
            const valor = parseFloat(lote.valor.replace(/[^\d,]/g, '').replace(',', '.'));
            return total + (isNaN(valor) ? 0 : valor);
        }, 0);
        
        res.json({
            success: true,
            data: {
                ...stats[0],
                valor_total: valorTotal
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

// POST /api/lotes/:id/status - Alterar status do lote
router.post('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['disponivel', 'vendido', 'reservado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status inválido. Use: disponivel, vendido ou reservado'
            });
        }
        
        // Buscar lote atual
        const loteAtual = await database.get('SELECT * FROM lotes WHERE id = ?', [id]);
        if (!loteAtual) {
            return res.status(404).json({
                success: false,
                error: 'Lote não encontrado'
            });
        }
        
        // Atualizar status
        await database.run(
            'UPDATE lotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'STATUS_CHANGE',
            'lotes',
            id,
            { status: loteAtual.status },
            { status },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: `Status do lote alterado para ${status}`
        });
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const database = require('../database/database');

// GET /api/carrossel - Listar todos os slides
router.get('/', async (req, res) => {
    try {
        const { ativo } = req.query;
        
        let sql = 'SELECT * FROM carrossel_slides';
        let params = [];
        
        if (ativo !== undefined) {
            sql += ' WHERE ativo = ?';
            params.push(ativo === 'true' ? 1 : 0);
        }
        
        sql += ' ORDER BY ordem ASC, created_at ASC';
        
        const slides = await database.all(sql, params);
        
        res.json({
            success: true,
            data: slides
        });
    } catch (error) {
        console.error('Erro ao buscar slides:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/carrossel/:id - Buscar slide por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const slide = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [id]);
        
        if (!slide) {
            return res.status(404).json({
                success: false,
                error: 'Slide não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: slide
        });
    } catch (error) {
        console.error('Erro ao buscar slide:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/carrossel - Criar novo slide
router.post('/', async (req, res) => {
    try {
        const { imagem, titulo, descricao, ordem, ativo } = req.body;
        
        // Validações
        if (!imagem || !titulo || !descricao) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: imagem, titulo, descricao'
            });
        }
        
        // Se ordem não foi especificada, usar a próxima disponível
        let ordemFinal = ordem;
        if (!ordemFinal) {
            const maxOrdem = await database.get('SELECT MAX(ordem) as max_ordem FROM carrossel_slides');
            ordemFinal = (maxOrdem.max_ordem || 0) + 1;
        }
        
        // Inserir novo slide
        const result = await database.run(
            'INSERT INTO carrossel_slides (imagem, titulo, descricao, ordem, ativo) VALUES (?, ?, ?, ?, ?)',
            [
                imagem,
                titulo,
                descricao,
                ordemFinal,
                ativo !== undefined ? (ativo ? 1 : 0) : 1
            ]
        );
        
        // Buscar o slide criado
        const novoSlide = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [result.id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'CREATE',
            'carrossel_slides',
            result.id,
            null,
            novoSlide,
            req.ip,
            req.get('User-Agent')
        );
        
        res.status(201).json({
            success: true,
            message: 'Slide criado com sucesso',
            data: novoSlide
        });
    } catch (error) {
        console.error('Erro ao criar slide:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// PUT /api/carrossel/:id - Atualizar slide
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { imagem, titulo, descricao, ordem, ativo } = req.body;
        
        // Buscar slide atual
        const slideAtual = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [id]);
        if (!slideAtual) {
            return res.status(404).json({
                success: false,
                error: 'Slide não encontrado'
            });
        }
        
        // Atualizar slide
        await database.run(
            'UPDATE carrossel_slides SET imagem = ?, titulo = ?, descricao = ?, ordem = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
                imagem || slideAtual.imagem,
                titulo || slideAtual.titulo,
                descricao || slideAtual.descricao,
                ordem !== undefined ? ordem : slideAtual.ordem,
                ativo !== undefined ? (ativo ? 1 : 0) : slideAtual.ativo,
                id
            ]
        );
        
        // Buscar slide atualizado
        const slideAtualizado = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'UPDATE',
            'carrossel_slides',
            id,
            slideAtual,
            slideAtualizado,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Slide atualizado com sucesso',
            data: slideAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar slide:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// DELETE /api/carrossel/:id - Excluir slide
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar slide atual
        const slide = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [id]);
        if (!slide) {
            return res.status(404).json({
                success: false,
                error: 'Slide não encontrado'
            });
        }
        
        // Excluir slide
        await database.run('DELETE FROM carrossel_slides WHERE id = ?', [id]);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'DELETE',
            'carrossel_slides',
            id,
            slide,
            null,
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Slide excluído com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir slide:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/carrossel/reorder - Reordenar slides
router.post('/reorder', async (req, res) => {
    try {
        const { slides } = req.body; // Array de { id, ordem }
        
        if (!Array.isArray(slides)) {
            return res.status(400).json({
                success: false,
                error: 'Formato inválido. Envie um array de slides com id e ordem'
            });
        }
        
        // Atualizar ordem de cada slide
        const queries = slides.map(slide => ({
            sql: 'UPDATE carrossel_slides SET ordem = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            params: [slide.ordem, slide.id]
        }));
        
        await database.transaction(queries);
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'REORDER',
            'carrossel_slides',
            null,
            null,
            { slides },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Slides reordenados com sucesso'
        });
    } catch (error) {
        console.error('Erro ao reordenar slides:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/carrossel/:id/toggle - Ativar/desativar slide
router.post('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar slide atual
        const slide = await database.get('SELECT * FROM carrossel_slides WHERE id = ?', [id]);
        if (!slide) {
            return res.status(404).json({
                success: false,
                error: 'Slide não encontrado'
            });
        }
        
        // Alternar status ativo
        const novoStatus = slide.ativo ? 0 : 1;
        
        await database.run(
            'UPDATE carrossel_slides SET ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [novoStatus, id]
        );
        
        // Registrar atividade
        await database.logActivity(
            req.user?.id,
            'TOGGLE_STATUS',
            'carrossel_slides',
            id,
            { ativo: slide.ativo },
            { ativo: novoStatus },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: `Slide ${novoStatus ? 'ativado' : 'desativado'} com sucesso`,
            data: { ativo: novoStatus }
        });
    } catch (error) {
        console.error('Erro ao alterar status do slide:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/carrossel/public/active - Slides ativos para o site público
router.get('/public/active', async (req, res) => {
    try {
        const slides = await database.all(
            'SELECT id, imagem, titulo, descricao, ordem FROM carrossel_slides WHERE ativo = 1 ORDER BY ordem ASC'
        );
        
        res.json({
            success: true,
            data: slides
        });
    } catch (error) {
        console.error('Erro ao buscar slides ativos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;

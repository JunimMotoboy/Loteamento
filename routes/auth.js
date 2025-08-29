const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ibiza_loteamento_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// POST /api/auth/login - Login do usuário
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validações
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e password são obrigatórios'
            });
        }
        
        // Buscar usuário
        const user = await database.get('SELECT * FROM usuarios WHERE username = ?', [username]);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
        
        // Verificar senha
        const senhaValida = await bcrypt.compare(password, user.password);
        
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
        
        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Registrar atividade
        await database.logActivity(
            user.id,
            'LOGIN',
            'usuarios',
            user.id,
            null,
            { login_time: new Date().toISOString() },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/auth/register - Registrar novo usuário (apenas para desenvolvimento)
router.post('/register', async (req, res) => {
    try {
        // Verificar se já existe algum usuário (apenas permitir se for o primeiro)
        const existingUsers = await database.get('SELECT COUNT(*) as count FROM usuarios');
        
        if (existingUsers.count > 0) {
            return res.status(403).json({
                success: false,
                error: 'Registro não permitido. Sistema já possui usuários.'
            });
        }
        
        const { username, password, email } = req.body;
        
        // Validações
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e password são obrigatórios'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password deve ter pelo menos 6 caracteres'
            });
        }
        
        // Verificar se username já existe
        const existingUser = await database.get('SELECT id FROM usuarios WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Username já existe'
            });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Criar usuário
        const result = await database.run(
            'INSERT INTO usuarios (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || '', 'admin']
        );
        
        // Buscar usuário criado
        const newUser = await database.get('SELECT id, username, email, role, created_at FROM usuarios WHERE id = ?', [result.id]);
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: newUser
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        // Validações
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                error: 'Senha atual e nova senha são obrigatórias'
            });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }
        
        // Buscar usuário (assumindo que temos middleware de auth que adiciona req.user)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação necessário'
            });
        }
        
        const user = await database.get('SELECT * FROM usuarios WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        
        // Verificar senha atual
        const senhaValida = await bcrypt.compare(current_password, user.password);
        if (!senhaValida) {
            return res.status(400).json({
                success: false,
                error: 'Senha atual incorreta'
            });
        }
        
        // Hash da nova senha
        const hashedNewPassword = await bcrypt.hash(new_password, 12);
        
        // Atualizar senha
        await database.run(
            'UPDATE usuarios SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedNewPassword, userId]
        );
        
        // Registrar atividade
        await database.logActivity(
            userId,
            'PASSWORD_CHANGE',
            'usuarios',
            userId,
            null,
            { password_changed: true },
            req.ip,
            req.get('User-Agent')
        );
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/auth/me - Informações do usuário atual
router.get('/me', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticação necessário'
            });
        }
        
        const user = await database.get(
            'SELECT id, username, email, role, created_at, updated_at FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/auth/logout - Logout (apenas registra a atividade)
router.post('/logout', async (req, res) => {
    try {
        const userId = req.user?.id;
        
        if (userId) {
            // Registrar atividade
            await database.logActivity(
                userId,
                'LOGOUT',
                'usuarios',
                userId,
                null,
                { logout_time: new Date().toISOString() },
                req.ip,
                req.get('User-Agent')
            );
        }
        
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// GET /api/auth/check - Verificar se token é válido
router.get('/check', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Verificar se usuário ainda existe
            const user = await database.get('SELECT id, username, role FROM usuarios WHERE id = ?', [decoded.id]);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }
            
            res.json({
                success: true,
                valid: true,
                data: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (jwtError) {
            res.status(401).json({
                success: false,
                valid: false,
                error: 'Token inválido'
            });
        }
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

// POST /api/auth/init - Inicializar sistema (criar primeiro usuário)
router.post('/init', async (req, res) => {
    try {
        // Verificar se já existe algum usuário
        const existingUsers = await database.get('SELECT COUNT(*) as count FROM usuarios');
        
        if (existingUsers.count > 0) {
            return res.status(400).json({
                success: false,
                error: 'Sistema já foi inicializado'
            });
        }
        
        const { username, password, email } = req.body;
        
        // Validações
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e password são obrigatórios'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password deve ter pelo menos 6 caracteres'
            });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Criar usuário administrador
        const result = await database.run(
            'INSERT INTO usuarios (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || '', 'admin']
        );
        
        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: result.id, 
                username: username, 
                role: 'admin' 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.status(201).json({
            success: true,
            message: 'Sistema inicializado com sucesso',
            data: {
                token,
                user: {
                    id: result.id,
                    username: username,
                    email: email || '',
                    role: 'admin'
                }
            }
        });
    } catch (error) {
        console.error('Erro ao inicializar sistema:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

module.exports = router;

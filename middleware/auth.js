const jwt = require('jsonwebtoken');
const database = require('../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'ibiza_loteamento_secret_key_2024';

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
    try {
        // Extrair token do header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token de acesso necessário',
                code: 'NO_TOKEN'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Verificar e decodificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            } else {
                throw jwtError;
            }
        }
        
        // Verificar se usuário ainda existe no banco
        const user = await database.get(
            'SELECT id, username, email, role FROM usuarios WHERE id = ?',
            [decoded.id]
        );
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Adicionar informações do usuário ao request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
};

// Middleware opcional de autenticação (não bloqueia se não houver token)
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Sem token, continuar sem usuário
            req.user = null;
            return next();
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Verificar se usuário ainda existe
            const user = await database.get(
                'SELECT id, username, email, role FROM usuarios WHERE id = ?',
                [decoded.id]
            );
            
            if (user) {
                req.user = user;
                req.token = token;
            } else {
                req.user = null;
            }
        } catch (jwtError) {
            // Token inválido ou expirado, continuar sem usuário
            req.user = null;
        }
        
        next();
    } catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error);
        req.user = null;
        next();
    }
};

// Middleware para verificar role específica
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticação necessária',
                code: 'AUTH_REQUIRED'
            });
        }
        
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Permissão insuficiente',
                code: 'INSUFFICIENT_PERMISSION',
                required_role: requiredRole,
                user_role: req.user.role
            });
        }
        
        next();
    };
};

// Middleware para verificar se é admin
const requireAdmin = requireRole('admin');

// Middleware para rate limiting por usuário
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        
        // Limpar registros antigos
        for (const [key, data] of requests.entries()) {
            if (now - data.firstRequest > windowMs) {
                requests.delete(key);
            }
        }
        
        // Verificar limite do usuário atual
        const userRequests = requests.get(userId);
        
        if (!userRequests) {
            requests.set(userId, {
                count: 1,
                firstRequest: now
            });
        } else {
            userRequests.count++;
            
            if (userRequests.count > maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: 'Muitas requisições',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retry_after: Math.ceil((windowMs - (now - userRequests.firstRequest)) / 1000)
                });
            }
        }
        
        next();
    };
};

// Middleware para logging de atividades automático
const activityLogger = (action, table) => {
    return async (req, res, next) => {
        // Interceptar a resposta para capturar dados
        const originalSend = res.send;
        
        res.send = function(data) {
            // Registrar atividade apenas se a operação foi bem-sucedida
            if (res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        let recordId = null;
                        let newData = null;
                        
                        // Tentar extrair ID e dados da resposta
                        if (typeof data === 'string') {
                            try {
                                const responseData = JSON.parse(data);
                                if (responseData.data && responseData.data.id) {
                                    recordId = responseData.data.id;
                                    newData = responseData.data;
                                }
                            } catch (e) {
                                // Ignorar erro de parsing
                            }
                        }
                        
                        await database.logActivity(
                            req.user?.id,
                            action,
                            table,
                            recordId,
                            req.oldData || null, // Pode ser definido em middlewares anteriores
                            newData,
                            req.ip,
                            req.get('User-Agent')
                        );
                    } catch (error) {
                        console.error('Erro ao registrar atividade:', error);
                    }
                });
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

// Middleware para capturar dados antigos antes de UPDATE/DELETE
const captureOldData = (table, idParam = 'id') => {
    return async (req, res, next) => {
        try {
            const id = req.params[idParam];
            
            if (id) {
                const oldData = await database.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
                req.oldData = oldData;
            }
            
            next();
        } catch (error) {
            console.error('Erro ao capturar dados antigos:', error);
            next();
        }
    };
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    requireAdmin,
    userRateLimit,
    activityLogger,
    captureOldData
};

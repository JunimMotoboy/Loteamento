const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Importar database e rotas
const database = require('./database/database');
const lotesRoutes = require('./routes/lotes');
const carrosselRoutes = require('./routes/carrossel');
const configRoutes = require('./routes/configuracoes');
const backupRoutes = require('./routes/backup');
const authRoutes = require('./routes/auth');

// Importar middleware de autenticação
const { authMiddleware, optionalAuthMiddleware, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela de tempo
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.'
    }
});

app.use('/api/', limiter);

// Middleware básico
app.use(compression());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rotas da API

// Rotas de autenticação (sem middleware de auth)
app.use('/api/auth', authRoutes);

// Rotas públicas (sem autenticação obrigatória)
app.get('/api/lotes/public', async (req, res) => {
    try {
        const lotes = await database.all('SELECT * FROM lotes WHERE status = "disponivel" ORDER BY created_at DESC');
        
        const lotesFormatted = lotes.map(lote => ({
            ...lote,
            imagens: JSON.parse(lote.imagens || '[]')
        }));
        
        res.json({
            success: true,
            data: lotesFormatted
        });
    } catch (error) {
        console.error('Erro ao buscar lotes públicos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/carrossel/public', async (req, res) => {
    try {
        const slides = await database.all(
            'SELECT id, imagem, titulo, descricao, ordem FROM carrossel_slides WHERE ativo = 1 ORDER BY ordem ASC'
        );
        
        res.json({
            success: true,
            data: slides
        });
    } catch (error) {
        console.error('Erro ao buscar slides públicos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/configuracoes/public', async (req, res) => {
    try {
        const configsPublicas = ['telefone', 'email', 'endereco', 'titulo_site', 'subtitulo'];
        const placeholders = configsPublicas.map(() => '?').join(',');
        const configuracoes = await database.all(
            `SELECT chave, valor, tipo FROM configuracoes WHERE chave IN (${placeholders})`,
            configsPublicas
        );
        
        const configObj = {};
        configuracoes.forEach(config => {
            let valor = config.valor;
            
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
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para dados completos do site (usado pelo JavaScript do frontend)
app.get('/api/site-data', optionalAuthMiddleware, async (req, res) => {
    try {
        // Buscar lotes disponíveis
        const lotes = await database.all('SELECT * FROM lotes WHERE status = "disponivel" ORDER BY created_at DESC');
        
        // Buscar slides ativos
        const slides = await database.all(
            'SELECT id, imagem, titulo, descricao, ordem FROM carrossel_slides WHERE ativo = 1 ORDER BY ordem ASC'
        );
        
        // Buscar configurações públicas
        const configsPublicas = ['telefone', 'email', 'endereco', 'titulo_site', 'subtitulo'];
        const placeholders = configsPublicas.map(() => '?').join(',');
        const configuracoes = await database.all(
            `SELECT chave, valor, tipo FROM configuracoes WHERE chave IN (${placeholders})`,
            configsPublicas
        );
        
        // Formatar lotes
        const lotesFormatted = lotes.map(lote => ({
            ...lote,
            imagens: JSON.parse(lote.imagens || '[]')
        }));
        
        // Formatar configurações
        const configObj = {};
        configuracoes.forEach(config => {
            let valor = config.valor;
            
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
            data: {
                lotes: lotesFormatted,
                slides: slides,
                configuracoes: configObj
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dados do site:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rotas protegidas (requerem autenticação)
app.use('/api/lotes', authMiddleware, requireAdmin, lotesRoutes);
app.use('/api/carrossel', authMiddleware, requireAdmin, carrosselRoutes);
app.use('/api/configuracoes', authMiddleware, requireAdmin, configRoutes);
app.use('/api/backup', authMiddleware, requireAdmin, backupRoutes);

// Rota para servir o dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Rota para servir o site principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota de health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'JSON inválido',
            message: 'Verifique a sintaxe do JSON enviado'
        });
    }
    
    res.status(err.status || 500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            error: 'Endpoint não encontrado',
            path: req.path,
            method: req.method
        });
    } else {
        // Para rotas não-API, redirecionar para o index
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Inicializar banco de dados e servidor
async function startServer() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await database.connect();
        console.log('✅ Banco de dados conectado!');
        
        // Verificar se existe pelo menos um usuário
        const userCount = await database.get('SELECT COUNT(*) as count FROM usuarios');
        
        if (userCount.count === 0) {
            console.log('⚠️  Nenhum usuário encontrado. Use POST /api/auth/init para criar o primeiro usuário.');
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log(`
🚀 Servidor Loteamento Ibiza iniciado!
📍 URL: http://localhost:${PORT}
🏠 Site: http://localhost:${PORT}
⚙️  Dashboard: http://localhost:${PORT}/dashboard
🔧 API Status: http://localhost:${PORT}/api/status
💚 Health Check: http://localhost:${PORT}/health
🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
            `);
            
            if (userCount.count === 0) {
                console.log(`\n👤 Para criar o primeiro usuário administrador:`);
                console.log(`   POST http://localhost:${PORT}/api/auth/init`);
                console.log(`   Body: { "username": "admin", "password": "suasenha", "email": "seu@email.com" }`);
            }
        });
        
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
            server.close(async () => {
                await database.close();
                console.log('✅ Servidor encerrado.');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('🛑 Recebido SIGINT. Encerrando servidor graciosamente...');
            server.close(async () => {
                await database.close();
                console.log('✅ Servidor encerrado.');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();

module.exports = app;

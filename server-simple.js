const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ibiza_loteamento_secret_key_2024';

// Criar diretório de dados se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Arquivos de dados JSON
const dataFiles = {
    users: path.join(dataDir, 'users.json'),
    lotes: path.join(dataDir, 'lotes.json'),
    slides: path.join(dataDir, 'slides.json'),
    config: path.join(dataDir, 'config.json'),
    activities: path.join(dataDir, 'activities.json')
};

// Inicializar arquivos de dados
function initDataFiles() {
    // Usuários
    if (!fs.existsSync(dataFiles.users)) {
        fs.writeFileSync(dataFiles.users, JSON.stringify([], null, 2));
    }
    
    // Lotes padrão
    if (!fs.existsSync(dataFiles.lotes)) {
        const defaultLotes = [
            {
                id: 1,
                titulo: "Long Town",
                codigo: "TKBFF-022",
                valor: "130.000,00",
                tamanho: "200m²",
                imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
                descricao: "Lote residencial em área nobre com infraestrutura completa.",
                telefone: "5534996778018",
                status: "disponivel",
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                titulo: "Garden Ville",
                codigo: "TKBFF-023",
                valor: "150.000,00",
                tamanho: "250m²",
                imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
                descricao: "Lote premium com vista privilegiada e fácil acesso.",
                telefone: "5534996778018",
                status: "disponivel",
                created_at: new Date().toISOString()
            }
        ];
        fs.writeFileSync(dataFiles.lotes, JSON.stringify(defaultLotes, null, 2));
    }
    
    // Slides padrão
    if (!fs.existsSync(dataFiles.slides)) {
        const defaultSlides = [
            {
                id: 1,
                imagem: "img/carroussel-1.jpg",
                titulo: "🏡 Loteamento Premium",
                descricao: "Conheça nossos lotes de alto padrão com toda infraestrutura necessária para realizar seus sonhos",
                ordem: 1,
                ativo: 1
            },
            {
                id: 2,
                imagem: "img/carroussel-2.jpg",
                titulo: "📍 Localização Privilegiada",
                descricao: "Área estratégica com fácil acesso, próximo a centros urbanos e com infraestrutura completa",
                ordem: 2,
                ativo: 1
            },
            {
                id: 3,
                imagem: "img/carroussel-3.jpg",
                titulo: "💰 Investimento Seguro",
                descricao: "Garanta seu lote com as melhores condições de pagamento e valorização garantida",
                ordem: 3,
                ativo: 1
            }
        ];
        fs.writeFileSync(dataFiles.slides, JSON.stringify(defaultSlides, null, 2));
    }
    
    // Configurações padrão
    if (!fs.existsSync(dataFiles.config)) {
        const defaultConfig = {
            telefone: "(34) 99999-9999",
            email: "contato@ibizaloteamentos.com",
            endereco: "Av. dos Loteamentos, 123 - Cidade, Estado",
            titulo_site: "Loteamento Ibiza",
            subtitulo: "O lugar perfeito para construir seus sonhos espera por você!"
        };
        fs.writeFileSync(dataFiles.config, JSON.stringify(defaultConfig, null, 2));
    }
    
    // Atividades
    if (!fs.existsSync(dataFiles.activities)) {
        fs.writeFileSync(dataFiles.activities, JSON.stringify([], null, 2));
    }
}

// Funções para ler/escrever dados
function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token de acesso necessário'
        });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Token inválido'
        });
    }
}

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Middleware básico
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rotas de autenticação
app.post('/api/auth/init', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e password são obrigatórios'
            });
        }
        
        const users = readData(dataFiles.users);
        
        if (users.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Sistema já foi inicializado'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = {
            id: 1,
            username,
            password: hashedPassword,
            email: email || '',
            role: 'admin',
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        writeData(dataFiles.users, users);
        
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Sistema inicializado com sucesso',
            data: {
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                }
            }
        });
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username e password são obrigatórios'
            });
        }
        
        const users = readData(dataFiles.users);
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
        
        const senhaValida = await bcrypt.compare(password, user.password);
        
        if (!senhaValida) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
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
            error: 'Erro interno do servidor'
        });
    }
});

// Rotas públicas
app.get('/api/lotes/public', (req, res) => {
    try {
        const lotes = readData(dataFiles.lotes);
        const lotesDisponiveis = lotes.filter(lote => lote.status === 'disponivel');
        
        res.json({
            success: true,
            data: lotesDisponiveis
        });
    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/carrossel/public', (req, res) => {
    try {
        const slides = readData(dataFiles.slides);
        const slidesAtivos = slides.filter(slide => slide.ativo === 1);
        
        res.json({
            success: true,
            data: slidesAtivos
        });
    } catch (error) {
        console.error('Erro ao buscar slides:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/configuracoes/public', (req, res) => {
    try {
        const config = readData(dataFiles.config);
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/site-data', (req, res) => {
    try {
        const lotes = readData(dataFiles.lotes);
        const slides = readData(dataFiles.slides);
        const config = readData(dataFiles.config);
        
        const lotesDisponiveis = lotes.filter(lote => lote.status === 'disponivel');
        const slidesAtivos = slides.filter(slide => slide.ativo === 1);
        
        res.json({
            success: true,
            data: {
                lotes: lotesDisponiveis,
                slides: slidesAtivos,
                configuracoes: config
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

// Rotas protegidas (exemplo básico)
app.get('/api/lotes', authMiddleware, (req, res) => {
    try {
        const lotes = readData(dataFiles.lotes);
        res.json({
            success: true,
            data: lotes
        });
    } catch (error) {
        console.error('Erro ao buscar lotes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.post('/api/lotes', authMiddleware, (req, res) => {
    try {
        const { titulo, codigo, valor, tamanho, imagens, descricao, telefone } = req.body;
        
        if (!titulo || !codigo || !valor || !tamanho) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: titulo, codigo, valor, tamanho'
            });
        }
        
        const lotes = readData(dataFiles.lotes);
        
        // Verificar se código já existe
        if (lotes.find(lote => lote.codigo === codigo)) {
            return res.status(400).json({
                success: false,
                error: 'Código do lote já existe'
            });
        }
        
        const novoLote = {
            id: Math.max(...lotes.map(l => l.id), 0) + 1,
            titulo,
            codigo,
            valor,
            tamanho,
            imagens: imagens || [],
            descricao: descricao || '',
            telefone: telefone || '',
            status: 'disponivel',
            created_at: new Date().toISOString()
        };
        
        lotes.push(novoLote);
        writeData(dataFiles.lotes, lotes);
        
        res.status(201).json({
            success: true,
            message: 'Lote criado com sucesso',
            data: novoLote
        });
    } catch (error) {
        console.error('Erro ao criar lote:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rotas do site
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'Endpoint não encontrado'
        });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Inicializar dados e servidor
initDataFiles();

const server = app.listen(PORT, () => {
    console.log(`
🚀 Servidor Loteamento Ibiza iniciado!
📍 URL: http://localhost:${PORT}
🏠 Site: http://localhost:${PORT}
⚙️  Dashboard: http://localhost:${PORT}/dashboard
🔧 API Status: http://localhost:${PORT}/api/status
🌍 Ambiente: ${process.env.NODE_ENV || 'development'}

👤 Para criar o primeiro usuário administrador:
   POST http://localhost:${PORT}/api/auth/init
   Body: { "username": "admin", "password": "admin123", "email": "admin@ibiza.com" }
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado.');
        process.exit(0);
    });
});

module.exports = app;

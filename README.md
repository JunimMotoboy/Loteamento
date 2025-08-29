# 🏡 Sistema Loteamento Ibiza

Sistema completo de gerenciamento de loteamentos com dashboard administrativo e site público. Desenvolvido com Node.js, Express, SQLite e frontend responsivo.

## 🚀 Funcionalidades

### 📊 Dashboard Administrativo
- **Autenticação JWT** - Login seguro com tokens
- **Gerenciamento de Lotes** - CRUD completo (criar, editar, excluir)
- **Carrossel Principal** - Gerenciar slides do carrossel
- **Configurações** - Personalizar informações do site
- **Sistema de Backup** - Exportar/importar dados
- **Logs de Atividade** - Rastreamento de todas as ações

### 🌐 Site Público
- **Cards Responsivos** - Exibição otimizada dos lotes
- **Carrossel Interativo** - Slides com controles touch/swipe
- **Integração WhatsApp** - Contato direto via WhatsApp
- **Design Moderno** - Interface responsiva e atrativa
- **Atualizações em Tempo Real** - Dados sincronizados com o dashboard

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite3** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Proteção contra spam

### Frontend
- **HTML5/CSS3** - Estrutura e estilo
- **JavaScript ES6+** - Funcionalidades interativas
- **Bootstrap 5** - Framework CSS
- **Responsive Design** - Compatível com todos os dispositivos

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd Loteamento
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicialize o banco de dados**
```bash
npm run init-db
```

4. **Inicie o servidor**
```bash
npm start
```

5. **Acesse o sistema**
- Site público: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- API Status: http://localhost:3000/api/status

## 🔧 Scripts Disponíveis

```bash
# Iniciar servidor em produção
npm start

# Iniciar servidor em desenvolvimento (com nodemon)
npm run dev

# Inicializar banco de dados
npm run init-db

# Executar testes
npm test
```

## 🔐 Primeiro Acesso

### Criar Usuário Administrador

Faça uma requisição POST para criar o primeiro usuário:

```bash
curl -X POST http://localhost:3000/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "suasenha123",
    "email": "admin@ibizaloteamentos.com"
  }'
```

Ou use um cliente REST como Postman/Insomnia:
- **URL**: `POST http://localhost:3000/api/auth/init`
- **Body**: 
```json
{
  "username": "admin",
  "password": "suasenha123",
  "email": "admin@ibizaloteamentos.com"
}
```

## 📚 API Endpoints

### 🔓 Públicos (sem autenticação)

```
GET  /api/status                    # Status da API
GET  /api/lotes/public             # Lotes disponíveis
GET  /api/carrossel/public         # Slides ativos
GET  /api/configuracoes/public     # Configurações públicas
GET  /api/site-data                # Dados completos do site
```

### 🔐 Autenticação

```
POST /api/auth/init                # Criar primeiro usuário
POST /api/auth/login               # Login
POST /api/auth/logout              # Logout
GET  /api/auth/me                  # Dados do usuário atual
GET  /api/auth/check               # Verificar token
POST /api/auth/change-password     # Alterar senha
```

### 🏠 Lotes (requer autenticação)

```
GET    /api/lotes                  # Listar lotes
GET    /api/lotes/:id              # Buscar lote por ID
POST   /api/lotes                  # Criar lote
PUT    /api/lotes/:id              # Atualizar lote
DELETE /api/lotes/:id              # Excluir lote
POST   /api/lotes/:id/status       # Alterar status
GET    /api/lotes/stats/summary    # Estatísticas
```

### 🎠 Carrossel (requer autenticação)

```
GET    /api/carrossel              # Listar slides
GET    /api/carrossel/:id          # Buscar slide por ID
POST   /api/carrossel              # Criar slide
PUT    /api/carrossel/:id          # Atualizar slide
DELETE /api/carrossel/:id          # Excluir slide
POST   /api/carrossel/reorder      # Reordenar slides
POST   /api/carrossel/:id/toggle   # Ativar/desativar
```

### ⚙️ Configurações (requer autenticação)

```
GET    /api/configuracoes          # Listar configurações
GET    /api/configuracoes/:chave   # Buscar por chave
POST   /api/configuracoes          # Criar configuração
PUT    /api/configuracoes/:chave   # Atualizar configuração
DELETE /api/configuracoes/:chave   # Excluir configuração
POST   /api/configuracoes/bulk     # Atualização em lote
```

### 💾 Backup (requer autenticação)

```
GET    /api/backup                 # Listar backups
POST   /api/backup/export          # Criar backup
GET    /api/backup/download/:id    # Download backup
POST   /api/backup/import          # Importar backup
DELETE /api/backup/:id             # Excluir backup
POST   /api/backup/reset           # Reset completo
GET    /api/backup/stats           # Estatísticas
```

## 🗂️ Estrutura do Projeto

```
Loteamento/
├── 📁 database/
│   └── database.js              # Configuração do banco SQLite
├── 📁 routes/
│   ├── auth.js                  # Rotas de autenticação
│   ├── lotes.js                 # Rotas de lotes
│   ├── carrossel.js             # Rotas do carrossel
│   ├── configuracoes.js         # Rotas de configurações
│   └── backup.js                # Rotas de backup
├── 📁 middleware/
│   └── auth.js                  # Middleware de autenticação
├── 📁 scripts/
│   └── init-database.js         # Script de inicialização
├── 📁 css/
│   ├── style.css                # Estilos do site
│   └── dashboard.css            # Estilos do dashboard
├── 📁 js/
│   ├── script.js                # JavaScript do site
│   └── dashboard.js             # JavaScript do dashboard
├── 📁 img/                      # Imagens do projeto
├── 📁 data/                     # Banco de dados e backups
├── index.html                   # Página principal
├── dashboard.html               # Dashboard administrativo
├── server.js                    # Servidor Express
├── package.json                 # Dependências
└── README.md                    # Este arquivo
```

## 🔒 Segurança

### Medidas Implementadas
- **Autenticação JWT** com expiração
- **Rate Limiting** para prevenir spam
- **Helmet.js** para headers de segurança
- **CORS** configurado adequadamente
- **Senhas criptografadas** com bcrypt
- **Validação de entrada** em todas as rotas
- **Logs de atividade** para auditoria

### Recomendações de Produção
1. **Altere as senhas padrão**
2. **Configure HTTPS**
3. **Use variáveis de ambiente** para dados sensíveis
4. **Configure backup automático**
5. **Monitore os logs** regularmente

## 🌍 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://seudominio.com

# Banco de dados
DB_PATH=./data/loteamento.db
```

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 **Mobile** (320px+)
- 📱 **Tablet** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large Desktop** (1200px+)

## 🎨 Personalização

### Cores e Temas
Edite o arquivo `css/style.css` para personalizar:
- Cores principais
- Fontes
- Espaçamentos
- Animações

### Conteúdo
Use o dashboard para alterar:
- Informações de contato
- Slides do carrossel
- Dados dos lotes
- Configurações gerais

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
```bash
# Reinicialize o banco
npm run init-db
```

### Erro de Permissões
```bash
# Linux/Mac
sudo chown -R $USER:$USER ./data/

# Windows (como administrador)
icacls data /grant %USERNAME%:F /T
```

### Porta em Uso
```bash
# Altere a porta no .env ou package.json
PORT=3001 npm start
```

## 📞 Suporte

Para suporte técnico:
- 📧 Email: suporte@ibizaloteamentos.com
- 📱 WhatsApp: (34) 99999-9999
- 🌐 Site: https://ibizaloteamentos.com

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para Loteamento Ibiza**

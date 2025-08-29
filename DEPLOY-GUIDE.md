# 🚀 Guia de Deploy - Loteamento Ibiza

## ✅ Sistema Funcionando Localmente!

Seu servidor está rodando perfeitamente em http://localhost:3000

## 🌐 Opções para Subir o Sistema para o Ar

### 1. 🆓 **Vercel (Recomendado - Gratuito)**

**Vantagens:**
- Totalmente gratuito
- Deploy automático
- HTTPS incluído
- Muito fácil de usar

**Passos:**

1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

2. **Fazer login:**
```bash
vercel login
```

3. **Fazer deploy:**
```bash
vercel --prod
```

4. **Configurar para Node.js:**
Criar arquivo `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-simple.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server-simple.js"
    }
  ]
}
```

---

### 2. 🆓 **Railway (Recomendado - Gratuito)**

**Vantagens:**
- Gratuito até 500 horas/mês
- Banco de dados incluído
- Deploy automático via GitHub

**Passos:**

1. **Acesse:** https://railway.app
2. **Conecte seu GitHub**
3. **Faça upload do projeto**
4. **Deploy automático!**

---

### 3. 🆓 **Render (Gratuito)**

**Vantagens:**
- Gratuito
- HTTPS automático
- Fácil configuração

**Passos:**

1. **Acesse:** https://render.com
2. **Conecte GitHub**
3. **Selecione o repositório**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `node server-simple.js`

---

### 4. 💰 **DigitalOcean (Pago - $5/mês)**

**Vantagens:**
- Servidor dedicado
- Controle total
- Melhor performance

**Passos:**

1. **Criar Droplet Ubuntu**
2. **Instalar Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Upload do projeto:**
```bash
scp -r . root@seu-ip:/var/www/loteamento
```

4. **Instalar PM2:**
```bash
npm install -g pm2
pm2 start server-simple.js --name loteamento
pm2 startup
pm2 save
```

---

### 5. 💰 **AWS/Google Cloud (Pago)**

**Para projetos maiores e empresariais**

---

## 🎯 **Recomendação: Use o Vercel!**

### Por que Vercel?
- ✅ **100% Gratuito**
- ✅ **Deploy em 2 minutos**
- ✅ **HTTPS automático**
- ✅ **URL personalizada**
- ✅ **Atualizações automáticas**

### Passos Rápidos para Vercel:

1. **Criar conta:** https://vercel.com
2. **Conectar GitHub** (opcional)
3. **Fazer upload do projeto**
4. **Deploy automático!**

---

## 📋 **Preparação para Deploy**

### 1. Criar arquivo `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server-simple.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server-simple.js"
    }
  ]
}
```

### 2. Atualizar `package.json`:
```json
{
  "name": "loteamento-ibiza",
  "version": "1.0.0",
  "main": "server-simple.js",
  "scripts": {
    "start": "node server-simple.js",
    "dev": "node server-simple.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1"
  }
}
```

### 3. Criar `.env` (opcional):
```env
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_super_forte_aqui
PORT=3000
```

---

## 🔧 **Testando Localmente Antes do Deploy**

Seu sistema já está funcionando em:
- **Site:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **API:** http://localhost:3000/api/status

### Criar primeiro usuário admin:
```bash
curl -X POST http://localhost:3000/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123", "email": "admin@ibiza.com"}'
```

---

## 🎉 **Após o Deploy**

1. **Acesse seu site online**
2. **Crie o usuário admin**
3. **Teste todas as funcionalidades**
4. **Compartilhe o link!**

---

## 🆘 **Precisa de Ajuda?**

### Opção 1: Deploy Manual via Vercel Web
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Faça upload da pasta do projeto
4. Deploy automático!

### Opção 2: Usar GitHub
1. Suba o projeto para GitHub
2. Conecte GitHub ao Vercel
3. Deploy automático a cada commit!

---

## 📞 **Suporte**

Se precisar de ajuda com o deploy:
- 📧 Email: suporte@ibizaloteamentos.com
- 📱 WhatsApp: (34) 99999-9999

**🚀 Seu sistema está pronto para o mundo! 🌍**

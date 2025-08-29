const database = require('../database/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        console.log('🔄 Inicializando banco de dados...');
        
        // Conectar ao banco
        await database.connect();
        
        console.log('✅ Banco de dados inicializado com sucesso!');
        console.log('📊 Dados padrão inseridos.');
        
        // Verificar se existe usuário admin
        const adminUser = await database.get('SELECT * FROM usuarios WHERE username = ?', ['admin']);
        
        if (!adminUser) {
            console.log('👤 Criando usuário administrador padrão...');
            
            // Criar usuário admin padrão
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            await database.run(
                'INSERT INTO usuarios (username, password, email, role) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'admin@ibizaloteamentos.com', 'admin']
            );
            
            console.log('✅ Usuário administrador criado:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
        } else {
            console.log('👤 Usuário administrador já existe.');
        }
        
        // Mostrar estatísticas
        const stats = await Promise.all([
            database.get('SELECT COUNT(*) as count FROM lotes'),
            database.get('SELECT COUNT(*) as count FROM carrossel_slides'),
            database.get('SELECT COUNT(*) as count FROM configuracoes'),
            database.get('SELECT COUNT(*) as count FROM usuarios')
        ]);
        
        console.log('\n📈 Estatísticas do banco:');
        console.log(`   Lotes: ${stats[0].count}`);
        console.log(`   Slides do carrossel: ${stats[1].count}`);
        console.log(`   Configurações: ${stats[2].count}`);
        console.log(`   Usuários: ${stats[3].count}`);
        
        console.log('\n🚀 Sistema pronto para uso!');
        console.log('   Dashboard: http://localhost:3000/dashboard');
        console.log('   Site: http://localhost:3000');
        console.log('   API: http://localhost:3000/api/status');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        process.exit(1);
    } finally {
        await database.close();
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;

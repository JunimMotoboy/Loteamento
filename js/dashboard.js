// Estado global do dashboard
let dashboardState = {
    lotes: [],
    carrosselSlides: [],
    configuracoes: {
        telefone: "(34) 99999-9999",
        email: "contato@ibizaloteamentos.com",
        endereco: "Av. dos Loteamentos, 123 - Cidade, Estado",
        tituloSite: "Loteamento Ibiza",
        subtitulo: "O lugar perfeito para construir seus sonhos espera por você!"
    },
    editingLoteId: null
};

// Inicialização do dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadInitialData();
    setupEventListeners();
    updateStats();
});

// Inicializar dashboard
function initializeDashboard() {
    // Carregar dados do localStorage se existirem
    const savedLotes = localStorage.getItem('ibiza_lotes');
    const savedSlides = localStorage.getItem('ibiza_slides');
    const savedConfig = localStorage.getItem('ibiza_config');

    if (savedLotes) {
        dashboardState.lotes = JSON.parse(savedLotes);
    } else {
        // Dados iniciais padrão
        dashboardState.lotes = [
            {
                id: 1,
                titulo: "Long Town",
                codigo: "TKBFF-022",
                valor: "130.000,00",
                tamanho: "200m²",
                imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
                descricao: "Lote residencial em área nobre com infraestrutura completa.",
                telefone: "5534996778018"
            },
            {
                id: 2,
                titulo: "Garden Ville",
                codigo: "TKBFF-023",
                valor: "150.000,00",
                tamanho: "250m²",
                imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
                descricao: "Lote premium com vista privilegiada e fácil acesso.",
                telefone: "5534996778018"
            }
        ];
    }

    if (savedSlides) {
        dashboardState.carrosselSlides = JSON.parse(savedSlides);
    } else {
        dashboardState.carrosselSlides = [
            {
                id: 1,
                imagem: "img/carroussel-1.jpg",
                titulo: "🏡 Loteamento Premium",
                descricao: "Conheça nossos lotes de alto padrão com toda infraestrutura necessária para realizar seus sonhos"
            },
            {
                id: 2,
                imagem: "img/carroussel-2.jpg",
                titulo: "📍 Localização Privilegiada",
                descricao: "Área estratégica com fácil acesso, próximo a centros urbanos e com infraestrutura completa"
            },
            {
                id: 3,
                imagem: "img/carroussel-3.jpg",
                titulo: "💰 Investimento Seguro",
                descricao: "Garanta seu lote com as melhores condições de pagamento e valorização garantida"
            }
        ];
    }

    if (savedConfig) {
        dashboardState.configuracoes = { ...dashboardState.configuracoes, ...JSON.parse(savedConfig) };
    }
}

// Carregar dados iniciais
function loadInitialData() {
    renderLotes();
    renderCarrosselSlides();
    loadConfiguracoes();
    createStatusChart();
}

// Configurar event listeners
function setupEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'lotes': 'Gerenciar Lotes',
                'carrossel': 'Gerenciar Carrossel',
                'configuracoes': 'Configurações'
            };
            document.getElementById('pageTitle').textContent = titles[section];
        });
    });

    // Form submissions
    document.getElementById('loteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarLote();
    });
}

// Mostrar seção específica
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Atualizar estatísticas
function updateStats() {
    const totalLotes = dashboardState.lotes.length;
    const lotesDisponiveis = dashboardState.lotes.length; // Todos disponíveis por enquanto
    const valorTotal = dashboardState.lotes.reduce((total, lote) => {
        const valor = parseFloat(lote.valor.replace(/[^\d,]/g, '').replace(',', '.'));
        return total + valor;
    }, 0);

    document.getElementById('totalLotes').textContent = totalLotes;
    document.getElementById('lotesDisponiveis').textContent = lotesDisponiveis;
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toLocaleString('pt-BR')}`;
}

// Renderizar lotes
function renderLotes() {
    const lotesGrid = document.getElementById('lotesGrid');
    lotesGrid.innerHTML = '';

    dashboardState.lotes.forEach(lote => {
        const loteCard = createLoteCard(lote);
        lotesGrid.appendChild(loteCard);
    });
}

// Criar card de lote
function createLoteCard(lote) {
    const card = document.createElement('div');
    card.className = 'lote-card';
    card.innerHTML = `
        <img src="${lote.imagens[0]}" alt="${lote.titulo}" class="lote-image" onerror="this.src='./img/placeholder.jpg'">
        <div class="lote-content">
            <h3 class="lote-title">${lote.titulo}</h3>
            <div class="lote-info">
                <span><strong>Código:</strong> ${lote.codigo}</span>
                <span><strong>Valor:</strong> R$ ${lote.valor}</span>
                <span><strong>Tamanho:</strong> ${lote.tamanho}</span>
                <span><strong>Imagens:</strong> ${lote.imagens.length}</span>
            </div>
            <p class="text-muted">${lote.descricao || 'Sem descrição'}</p>
            <div class="lote-actions">
                <button class="btn btn-warning btn-sm" onclick="editarLote(${lote.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirLote(${lote.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `;
    return card;
}

// Abrir modal de lote
function openLoteModal(loteId = null) {
    const modal = document.getElementById('loteModal');
    const modalTitle = document.getElementById('loteModalTitle');
    const form = document.getElementById('loteForm');
    
    // Reset form
    form.reset();
    document.getElementById('loteId').value = '';
    dashboardState.editingLoteId = null;
    
    if (loteId) {
        // Modo edição
        const lote = dashboardState.lotes.find(l => l.id === loteId);
        if (lote) {
            modalTitle.textContent = 'Editar Lote';
            document.getElementById('loteId').value = lote.id;
            document.getElementById('loteTitulo').value = lote.titulo;
            document.getElementById('loteCodigo').value = lote.codigo;
            document.getElementById('loteValor').value = lote.valor;
            document.getElementById('loteTamanho').value = lote.tamanho;
            document.getElementById('loteImagens').value = lote.imagens.join(', ');
            document.getElementById('loteDescricao').value = lote.descricao || '';
            dashboardState.editingLoteId = loteId;
        }
    } else {
        // Modo criação
        modalTitle.textContent = 'Adicionar Novo Lote';
    }
}

// Editar lote
function editarLote(loteId) {
    openLoteModal(loteId);
    const modal = new bootstrap.Modal(document.getElementById('loteModal'));
    modal.show();
}

// Salvar lote
function salvarLote() {
    const form = document.getElementById('loteForm');
    const formData = new FormData(form);
    
    const loteData = {
        titulo: document.getElementById('loteTitulo').value,
        codigo: document.getElementById('loteCodigo').value,
        valor: document.getElementById('loteValor').value,
        tamanho: document.getElementById('loteTamanho').value,
        imagens: document.getElementById('loteImagens').value.split(',').map(img => img.trim()),
        descricao: document.getElementById('loteDescricao').value,
        telefone: "5534996778018" // Padrão
    };

    if (dashboardState.editingLoteId) {
        // Atualizar lote existente
        const index = dashboardState.lotes.findIndex(l => l.id === dashboardState.editingLoteId);
        if (index !== -1) {
            dashboardState.lotes[index] = { ...dashboardState.lotes[index], ...loteData };
            showAlert('Lote atualizado com sucesso!', 'success');
        }
    } else {
        // Criar novo lote
        const newId = Math.max(...dashboardState.lotes.map(l => l.id), 0) + 1;
        const newLote = { id: newId, ...loteData };
        dashboardState.lotes.push(newLote);
        showAlert('Lote adicionado com sucesso!', 'success');
    }

    // Salvar no localStorage
    localStorage.setItem('ibiza_lotes', JSON.stringify(dashboardState.lotes));
    
    // Atualizar interface
    renderLotes();
    updateStats();
    updateSiteData();
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('loteModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('loteForm').reset();
    dashboardState.editingLoteId = null;
}

// Excluir lote
function excluirLote(loteId) {
    if (confirm('Tem certeza que deseja excluir este lote?')) {
        dashboardState.lotes = dashboardState.lotes.filter(l => l.id !== loteId);
        localStorage.setItem('ibiza_lotes', JSON.stringify(dashboardState.lotes));
        
        renderLotes();
        updateStats();
        updateSiteData();
        showAlert('Lote excluído com sucesso!', 'success');
    }
}

// Renderizar slides do carrossel
function renderCarrosselSlides() {
    const carrosselItems = document.getElementById('carrosselItems');
    carrosselItems.innerHTML = '';

    dashboardState.carrosselSlides.forEach(slide => {
        const slideElement = createCarrosselSlideElement(slide);
        carrosselItems.appendChild(slideElement);
    });
}

// Criar elemento de slide do carrossel
function createCarrosselSlideElement(slide) {
    const element = document.createElement('div');
    element.className = 'carrossel-item';
    element.innerHTML = `
        <img src="${slide.imagem}" alt="${slide.titulo}" class="carrossel-image" onerror="this.src='./img/placeholder.jpg'">
        <div class="carrossel-content">
            <h4 class="carrossel-title">${slide.titulo}</h4>
            <p class="carrossel-description">${slide.descricao}</p>
            <div class="lote-actions">
                <button class="btn btn-warning btn-sm" onclick="editarSlide(${slide.id})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirSlide(${slide.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `;
    return element;
}

// Salvar slide do carrossel
function salvarSlide() {
    const imagem = document.getElementById('slideImagem').value;
    const titulo = document.getElementById('slideTitulo').value;
    const descricao = document.getElementById('slideDescricao').value;

    const newId = Math.max(...dashboardState.carrosselSlides.map(s => s.id), 0) + 1;
    const newSlide = {
        id: newId,
        imagem,
        titulo,
        descricao
    };

    dashboardState.carrosselSlides.push(newSlide);
    localStorage.setItem('ibiza_slides', JSON.stringify(dashboardState.carrosselSlides));

    renderCarrosselSlides();
    showAlert('Slide adicionado com sucesso!', 'success');

    // Fechar modal e limpar form
    const modal = bootstrap.Modal.getInstance(document.getElementById('carrosselModal'));
    modal.hide();
    document.getElementById('carrosselForm').reset();
}

// Editar slide
function editarSlide(slideId) {
    const slide = dashboardState.carrosselSlides.find(s => s.id === slideId);
    if (slide) {
        document.getElementById('slideImagem').value = slide.imagem;
        document.getElementById('slideTitulo').value = slide.titulo;
        document.getElementById('slideDescricao').value = slide.descricao;
        
        const modal = new bootstrap.Modal(document.getElementById('carrosselModal'));
        modal.show();
        
        // Remover slide atual para substituir
        dashboardState.carrosselSlides = dashboardState.carrosselSlides.filter(s => s.id !== slideId);
    }
}

// Excluir slide
function excluirSlide(slideId) {
    if (confirm('Tem certeza que deseja excluir este slide?')) {
        dashboardState.carrosselSlides = dashboardState.carrosselSlides.filter(s => s.id !== slideId);
        localStorage.setItem('ibiza_slides', JSON.stringify(dashboardState.carrosselSlides));
        
        renderCarrosselSlides();
        showAlert('Slide excluído com sucesso!', 'success');
    }
}

// Carregar configurações
function loadConfiguracoes() {
    document.getElementById('telefone').value = dashboardState.configuracoes.telefone;
    document.getElementById('email').value = dashboardState.configuracoes.email;
    document.getElementById('endereco').value = dashboardState.configuracoes.endereco;
    document.getElementById('tituloSite').value = dashboardState.configuracoes.tituloSite;
    document.getElementById('subtitulo').value = dashboardState.configuracoes.subtitulo;
}

// Salvar configurações
function salvarConfiguracoes() {
    dashboardState.configuracoes = {
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        endereco: document.getElementById('endereco').value,
        tituloSite: document.getElementById('tituloSite').value,
        subtitulo: document.getElementById('subtitulo').value
    };

    localStorage.setItem('ibiza_config', JSON.stringify(dashboardState.configuracoes));
    showAlert('Configurações salvas com sucesso!', 'success');
}

// Atualizar dados do site principal
function updateSiteData() {
    // Esta função seria responsável por sincronizar os dados com o site principal
    // Por enquanto, apenas salva no localStorage para o script.js ler
    const siteData = {
        lotes: dashboardState.lotes,
        configuracoes: dashboardState.configuracoes
    };
    localStorage.setItem('ibiza_site_data', JSON.stringify(siteData));
}

// Criar gráfico de status
function createStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const totalLotes = dashboardState.lotes.length;
    const disponivel = totalLotes;
    const vendido = 0; // Por enquanto todos disponíveis

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Disponível', 'Vendido'],
            datasets: [{
                data: [disponivel, vendido],
                backgroundColor: [
                    '#10b981',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Mostrar alerta
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${message}
    `;

    // Inserir no topo da seção ativa
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        activeSection.insertBefore(alertDiv, activeSection.firstChild);
        
        // Remover após 3 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
}

// Função para exportar dados
function exportarDados() {
    const data = {
        lotes: dashboardState.lotes,
        carrosselSlides: dashboardState.carrosselSlides,
        configuracoes: dashboardState.configuracoes,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ibiza-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Função para importar dados
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.lotes) dashboardState.lotes = data.lotes;
            if (data.carrosselSlides) dashboardState.carrosselSlides = data.carrosselSlides;
            if (data.configuracoes) dashboardState.configuracoes = data.configuracoes;

            // Salvar no localStorage
            localStorage.setItem('ibiza_lotes', JSON.stringify(dashboardState.lotes));
            localStorage.setItem('ibiza_slides', JSON.stringify(dashboardState.carrosselSlides));
            localStorage.setItem('ibiza_config', JSON.stringify(dashboardState.configuracoes));

            // Atualizar interface
            renderLotes();
            renderCarrosselSlides();
            loadConfiguracoes();
            updateStats();
            updateSiteData();

            showAlert('Dados importados com sucesso!', 'success');
        } catch (error) {
            showAlert('Erro ao importar dados. Verifique o arquivo.', 'danger');
        }
    };
    reader.readAsText(file);
}

// Responsive sidebar para mobile
function handleMobileMenu() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
}

// Event listener para resize
window.addEventListener('resize', handleMobileMenu);

// Inicializar menu mobile
handleMobileMenu();

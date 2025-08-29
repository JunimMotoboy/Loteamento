document.addEventListener("DOMContentLoaded", () => {
  // Animação inicial
  const imgHero = document.querySelector(".img-hero");
  const listItems = document.querySelectorAll(".hero nav ul li");

  if (imgHero) imgHero.classList.add("loaded");

  listItems.forEach((item, index) => {
    setTimeout(() => item.classList.add("show"), index * 200);
  });

  // Efeito de scroll
  window.addEventListener("scroll", () => {
    const logo = document.querySelector(".logo");
    const heroSection = document.querySelector(".img-hero");
    const heroContent = document.querySelector(".hero-content");

    const scrollPosition = window.scrollY;

    if (logo) logo.classList.toggle("scrolled", scrollPosition > 50);

    if (heroSection && heroContent) {
      const heroHeight = heroSection.offsetHeight;
      heroContent.classList.toggle("scroll-effect", scrollPosition > heroHeight / 2);
    }
  });

  // Inicializar carrossel melhorado
  initEnhancedCarousel();

  // Carregamento inicial dos cards
  loadInitialCards();
});

// Funcionalidades avançadas do carrossel
function initEnhancedCarousel() {
  const carousel = document.getElementById('carouselPrincipal');
  if (!carousel) return;

  // Criar barra de progresso
  createProgressBar(carousel);

  // Configurar pause no hover
  setupHoverPause(carousel);

  // Configurar suporte a touch/swipe
  setupTouchSupport(carousel);

  // Configurar indicadores de progresso
  setupProgressIndicators(carousel);

  // Melhorar transições
  enhanceTransitions(carousel);
}

// Criar barra de progresso
function createProgressBar(carousel) {
  const progressContainer = document.createElement('div');
  progressContainer.className = 'carousel-progress';
  
  const progressBar = document.createElement('div');
  progressBar.className = 'carousel-progress-bar';
  
  progressContainer.appendChild(progressBar);
  carousel.appendChild(progressContainer);

  // Atualizar progresso
  let interval = 3000; // Mesmo intervalo do Bootstrap
  let startTime = Date.now();
  let isPaused = false;

  function updateProgress() {
    if (!isPaused) {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed / interval) * 100;
      
      if (progress >= 100) {
        progressBar.style.width = '0%';
        startTime = Date.now();
      } else {
        progressBar.style.width = progress + '%';
      }
    }
    requestAnimationFrame(updateProgress);
  }

  updateProgress();

  // Reset no slide change
  carousel.addEventListener('slide.bs.carousel', () => {
    progressBar.style.width = '0%';
    startTime = Date.now();
  });

  // Pause/resume
  carousel.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  carousel.addEventListener('mouseleave', () => {
    isPaused = false;
    startTime = Date.now();
  });
}

// Configurar pause no hover
function setupHoverPause(carousel) {
  const bootstrapCarousel = new bootstrap.Carousel(carousel, {
    interval: 3000,
    pause: 'hover',
    wrap: true,
    touch: true
  });

  // Pause mais suave
  carousel.addEventListener('mouseenter', () => {
    bootstrapCarousel.pause();
    carousel.style.transform = 'translateY(-2px)';
  });

  carousel.addEventListener('mouseleave', () => {
    bootstrapCarousel.cycle();
    carousel.style.transform = 'translateY(0)';
  });
}

// Configurar suporte a touch/swipe para mobile
function setupTouchSupport(carousel) {
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  const minSwipeDistance = 50;

  carousel.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  carousel.addEventListener('touchmove', (e) => {
    // Prevenir scroll vertical durante swipe horizontal
    const deltaX = Math.abs(e.touches[0].clientX - startX);
    const deltaY = Math.abs(e.touches[0].clientY - startY);
    
    if (deltaX > deltaY) {
      e.preventDefault();
    }
  }, { passive: false });

  carousel.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    endY = e.changedTouches[0].clientY;
    
    const deltaX = startX - endX;
    const deltaY = Math.abs(startY - endY);
    
    // Verificar se é um swipe horizontal
    if (Math.abs(deltaX) > minSwipeDistance && deltaY < 100) {
      const bootstrapCarousel = bootstrap.Carousel.getInstance(carousel);
      
      if (deltaX > 0) {
        // Swipe para esquerda - próximo slide
        bootstrapCarousel.next();
      } else {
        // Swipe para direita - slide anterior
        bootstrapCarousel.prev();
      }
    }
  }, { passive: true });
}

// Configurar indicadores de progresso
function setupProgressIndicators(carousel) {
  const indicators = carousel.querySelectorAll('.carousel-indicators button');
  
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('mouseenter', () => {
      indicator.style.transform = 'scale(1.3)';
    });
    
    indicator.addEventListener('mouseleave', () => {
      if (!indicator.classList.contains('active')) {
        indicator.style.transform = 'scale(1)';
      }
    });
  });

  // Atualizar indicadores ativos
  carousel.addEventListener('slide.bs.carousel', (e) => {
    indicators.forEach((indicator, index) => {
      if (index === e.to) {
        indicator.style.transform = 'scale(1.2)';
      } else {
        indicator.style.transform = 'scale(1)';
      }
    });
  });
}

// Melhorar transições
function enhanceTransitions(carousel) {
  const items = carousel.querySelectorAll('.carousel-item');
  
  // Adicionar efeitos de entrada suaves
  carousel.addEventListener('slide.bs.carousel', (e) => {
    const activeItem = carousel.querySelector('.carousel-item.active');
    const nextItem = items[e.to];
    
    // Efeito fade para o item ativo
    if (activeItem) {
      activeItem.style.opacity = '0.7';
    }
  });

  carousel.addEventListener('slid.bs.carousel', (e) => {
    const activeItem = carousel.querySelector('.carousel-item.active');
    
    // Restaurar opacidade
    if (activeItem) {
      activeItem.style.opacity = '1';
      
      // Animar caption
      const caption = activeItem.querySelector('.carousel-caption');
      if (caption) {
        caption.style.animation = 'slideInUp 0.8s ease-out';
      }
    }
  });

  // Lazy loading para imagens
  const images = carousel.querySelectorAll('img');
  images.forEach((img, index) => {
    if (index > 0) { // Não aplicar ao primeiro slide
      const originalSrc = img.src;
      img.src = '';
      img.dataset.src = originalSrc;
    }
  });

  // Carregar imagem quando slide se torna ativo
  carousel.addEventListener('slide.bs.carousel', (e) => {
    const nextItem = items[e.to];
    const img = nextItem.querySelector('img');
    
    if (img && img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  });
}

// Função para detectar se é dispositivo móvel
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Otimizações específicas para mobile
if (isMobileDevice()) {
  document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.getElementById('carouselPrincipal');
    if (carousel) {
      // Reduzir intervalo em mobile para melhor UX
      const bootstrapCarousel = bootstrap.Carousel.getInstance(carousel);
      if (bootstrapCarousel) {
        bootstrapCarousel._config.interval = 4000;
      }
      
      // Mostrar controles sempre em mobile
      const controls = carousel.querySelectorAll('.carousel-control-prev, .carousel-control-next');
      controls.forEach(control => {
        control.style.opacity = '1';
      });
    }
  });
}

// Função para criar cards
function criarCard({ id, imagens, titulo, codigo, valor, tamanho, telefone }) {
  const container = document.getElementById("cards-container");
  const carouselId = `carouselCard${id}`;
  const modalId = `modalCard${id}`;

  const imagensCarousel = imagens.map((img, index) => `
    <div class="carousel-item ${index === 0 ? "active" : ""}">
      <img src="${img}" class="d-block w-100" alt="Slide ${index + 1}" />
    </div>
  `).join("");

  const imagensModal = imagens.map((img) => `
    <img src="${img}" alt="${img}" style="width: 480px; margin: 5px;" />
  `).join("");

  const cardHTML = `
    <div class="card">
      <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
          ${imagensCarousel}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Próximo</span>
        </button>
      </div>
      <div class="card-body">
        <h5 class="card-title">${titulo}</h5>
        <p class="card-text"><strong>Código:</strong> ${codigo}</p>
        <h5><strong>R$ ${valor}</strong></h5>
        <div class="buttons">
          <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${modalId}">Visitar</button>
          <button onclick="window.location.href='https://api.whatsapp.com/send?phone=${telefone}&text=Olá, tenho interesse no ${titulo}.'" type="button" class="btn btn-success">
            Contato
          </button>
        </div>
      </div>
    </div>

    <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}Label">Informações sobre o imóvel</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <div class="img-modal d-flex flex-wrap">
              ${imagensModal}
            </div>
            <h5>Detalhes do imóvel:</h5>
            <ul>
              <li><b>Código:</b> ${codigo}</li>
              <li><b>Valor:</b> R$ ${valor}</li>
              <li><b>Tamanho:</b> ${tamanho}</li>
            </ul>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            <button onclick="window.location.href='https://api.whatsapp.com/send?phone=${telefone}'" type="button" class="btn btn-success">
              Entrar em Contato
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", cardHTML);
}

// Carregar dados do dashboard ou usar dados padrão
function loadSiteData() {
  const savedData = localStorage.getItem('ibiza_site_data');
  if (savedData) {
    const data = JSON.parse(savedData);
    return data.lotes || getDefaultCards();
  }
  return getDefaultCards();
}

// Dados padrão caso não haja dados do dashboard
function getDefaultCards() {
  return [
    {
      id: 1,
      imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
      titulo: "Long Town",
      codigo: "TKBFF-022",
      valor: "130.000,00",
      tamanho: "200m²",
      telefone: "5534996778018",
      descricao: "Lote residencial em área nobre com infraestrutura completa."
    },
    {
      id: 2,
      imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
      titulo: "Garden Ville",
      codigo: "TKBFF-023",
      valor: "150.000,00",
      tamanho: "250m²",
      telefone: "5534996778018",
      descricao: "Lote premium com vista privilegiada e fácil acesso."
    }
  ];
}

// Array com todos os cards (carregado dinamicamente)
let allCards = loadSiteData();

// Elementos e estados
const btnCard = document.querySelector('.btn-card');
let mostrandoTodos = false;

// Função para limpar todos os cards do container
function limparCards() {
  document.getElementById("cards-container").innerHTML = "";
}

// Função para carregar os cards iniciais
function loadInitialCards() {
  limparCards();
  allCards.slice(0, 6).forEach(card => criarCard(card));
  btnCard.textContent = "Ver Mais";
}

// Função para carregar todos os cards
function loadAllCards() {
  limparCards();
  allCards.forEach(card => criarCard(card));
  btnCard.textContent = "Ver Menos";
}

// Evento do botão
btnCard.addEventListener('click', () => {
  mostrandoTodos = !mostrandoTodos;
  
  if (mostrandoTodos) {
    loadAllCards();
  } else {
    loadInitialCards();
  }
});

// Função para recarregar dados do dashboard
function reloadSiteData() {
  allCards = loadSiteData();
  if (mostrandoTodos) {
    loadAllCards();
  } else {
    loadInitialCards();
  }
}

// Verificar atualizações dos dados a cada 5 segundos
setInterval(() => {
  const currentData = JSON.stringify(allCards);
  const newData = JSON.stringify(loadSiteData());
  
  if (currentData !== newData) {
    reloadSiteData();
  }
}, 5000);

// Carregar inicialmente os primeiros cards
loadInitialCards();

// Função para atualizar configurações do site
function updateSiteConfig() {
  const savedData = localStorage.getItem('ibiza_site_data');
  if (savedData) {
    const data = JSON.parse(savedData);
    if (data.configuracoes) {
      // Atualizar título se existir
      const titleElement = document.querySelector('.hero-content h1');
      if (titleElement && data.configuracoes.subtitulo) {
        titleElement.textContent = data.configuracoes.subtitulo;
      }
      
      // Atualizar informações de contato no footer
      const footerContainer = document.querySelector('.footer .container');
      if (footerContainer && data.configuracoes.telefone) {
        const phoneElement = footerContainer.querySelector('p:nth-child(3)');
        const emailElement = footerContainer.querySelector('p:nth-child(4)');
        const addressElement = footerContainer.querySelector('p:nth-child(2)');
        
        if (phoneElement) phoneElement.innerHTML = `📞 Contato: ${data.configuracoes.telefone}`;
        if (emailElement) emailElement.innerHTML = `✉️ E-mail: ${data.configuracoes.email}`;
        if (addressElement) addressElement.innerHTML = `📍 Endereço: ${data.configuracoes.endereco}`;
      }
    }
  }
}

// Atualizar configurações na inicialização
updateSiteConfig();

// Verificar atualizações de configuração
setInterval(updateSiteConfig, 10000);

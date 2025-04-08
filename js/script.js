document.addEventListener("DOMContentLoaded", () => {
    const imgHero = document.querySelector(".img-hero");
    const listItems = document.querySelectorAll(".hero nav ul li");
  
    if (imgHero) imgHero.classList.add("loaded");
  
    listItems.forEach((item, index) => {
      setTimeout(() => item.classList.add("show"), index * 200);
    });
  });
  
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
  
  window.addEventListener("load", () => {
    const imgHero = document.querySelector(".img-hero");
    if (imgHero) imgHero.classList.add("loaded");
  });
  
  function criarCard({
    id,
    imagens,
    titulo,
    codigo,
    valor,
    tamanho,
    telefone
  }) {
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
      <div class="card" style="width: 18rem">
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
          <p class="card-text">${codigo}</p>
          <h5>R$ ${valor} </h5>
          <div class"buttons">
          <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${modalId}">Visitar</button>
          <button onclick="window.location.href='https://api.whatsapp.com/send?phone=${telefone}'" type="button" class="btn btn-success">
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
                <li><b>Valor:</b> ${valor}</li>
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
  
  //Criaçao de Cards 

  criarCard({
    id: 1,
    imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
    titulo: "Ibiza Town",
    codigo: "TKBFF-022",
    valor: "130.000,00",
    tamanho: "200mts",
    telefone: "55999999999"
  });
  
  criarCard({
    id: 2,
    imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
    titulo: "Ibiza Town",
    codigo: "TKBFF-022",
    valor: "130.000,00",
    tamanho: "200mts",
    telefone: "55999999999"
  });
  criarCard({
    id: 3,
    imagens: ["./img/lote-1.webp", "./img/lote-2.webp", "./img/lote-3.jpg"],
    titulo: "Naked",
    codigo: "TKBFF-022",
    valor: "130.000,00",
    tamanho: "200mts",
    telefone: "55999999999"
  });
  
document.addEventListener("DOMContentLoaded", function () {
    // Ativa a animação da imagem e conteúdo ao carregar
    document.querySelector(".img-hero").classList.add("loaded");

    const listItems = document.querySelectorAll('.hero nav ul li');
    listItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('show');
        }, index * 200); // Anima os itens com atraso sequencial
    });
});

// Evento de rolagem para animar o logo e controlar o efeito de scroll da imagem
window.addEventListener("scroll", function () {
    const logo = document.querySelector(".logo");
    const heroSection = document.querySelector(".img-hero");
    const heroContent = document.querySelector(".hero-content");
    
    const scrollPosition = window.scrollY;
    const heroHeight = heroSection.offsetHeight;

    // Adiciona ou remove a classe de rolagem no logo
    if (scrollPosition > 100) {
        logo.classList.add("scrolled");
    } else {
        logo.classList.remove("scrolled");
    }

    // Controla o efeito do conteúdo da seção hero (subir e desaparecer)
    if (scrollPosition > heroHeight / 2) {
        heroContent.classList.add("scroll-effect");
    } else {
        heroContent.classList.remove("scroll-effect");
    }

    // Controla o desaparecimento da imagem hero
    if (scrollPosition > heroHeight) {
        heroSection.classList.add("scroll-fade");
    } else {
        heroSection.classList.remove("scroll-fade");
    }
});

// Inicializa o carregamento da imagem hero com um pequeno delay para suavizar
window.addEventListener("load", function() {
    document.querySelector(".img-hero").classList.add("loaded");
});

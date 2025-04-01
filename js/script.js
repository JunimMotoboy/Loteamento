document.addEventListener("DOMContentLoaded", function () {
    const imgHero = document.querySelector(".img-hero");
    const listItems = document.querySelectorAll(".hero nav ul li");

    // Verifica se os elementos existem antes de manipulá-los
    if (imgHero) {
        imgHero.classList.add("loaded");
    }

    if (listItems.length > 0) {
        listItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add("show");
            }, index * 200);
        });
    }
});

// Evento de rolagem para animar a logo e os efeitos de scroll
window.addEventListener("scroll", function () {
    const logo = document.querySelector(".logo");
    const heroSection = document.querySelector(".img-hero");
    const heroContent = document.querySelector(".hero-content");

    const scrollPosition = window.scrollY;

    if (logo) {
        if (scrollPosition > 50) {
            logo.classList.add("scrolled");
        } else {
            logo.classList.remove("scrolled");
        }
    }

    if (heroSection && heroContent) {
        const heroHeight = heroSection.offsetHeight;

        // Controla o efeito do conteúdo da seção hero (subir e desaparecer)
        if (scrollPosition > heroHeight / 2) {
            heroContent.classList.add("scroll-effect");
        } else {
            heroContent.classList.remove("scroll-effect");
        }
    }
});

// Aguarda o carregamento total da página antes de adicionar a classe 'loaded' na imagem hero
window.addEventListener("load", function () {
    const imgHero = document.querySelector(".img-hero");
    if (imgHero) {
        imgHero.classList.add("loaded");
    }
});

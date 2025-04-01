document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".img-hero").classList.add("loaded");
});
window.onload = function() {
    const listItems = document.querySelectorAll('.hero nav ul li');
    
    listItems.forEach(item => {
        item.classList.add('show');
    });
};
window.addEventListener("scroll", function() {
    const logo = document.querySelector(".logo");
    if (window.scrollY > 100) { 
        logo.classList.add("scrolled");
    } else {
        logo.classList.remove("scrolled");
    }
});

// Para ativar os efeitos ao carregar a página
window.addEventListener("load", function() {
    document.querySelector(".img-hero").classList.add("loaded");
});


document.addEventListener("scroll", function () {
    let heroSection = document.querySelector(".img-hero");
    let heroContent = document.querySelector(".hero-content");

    let scrollPosition = window.scrollY;
    let heroHeight = heroSection.offsetHeight;

    // Quando o usuário rolar além da metade da imagem
    if (scrollPosition > heroHeight / 2) {
        heroContent.classList.add("scroll-effect"); // Faz o texto subir e sumir
    } else {
        heroContent.classList.remove("scroll-effect");
    }

    // Quando a rolagem for maior que a altura da imagem, a imagem desaparece
    if (scrollPosition > heroHeight) {
        heroSection.classList.add("scroll-fade");
    } else {
        heroSection.classList.remove("scroll-fade");
    }
});

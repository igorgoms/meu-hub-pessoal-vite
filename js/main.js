// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const sections = document.querySelectorAll('.app-section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Função para mudar de tema
    themeSwitcher.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }

    // Função de navegação entre seções
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.add('d-none');
        });
        document.getElementById(sectionId).classList.remove('d-none');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            const sectionId = link.id.replace('nav-', '') + '-section';
            showSection(sectionId);
        });
    });

    // Mostrar a primeira seção por padrão
    showSection('kanban-section');

    // Inicializar os módulos
    initKanban();
    initFlashcards();
    initReviews();
});
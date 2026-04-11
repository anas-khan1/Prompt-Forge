/**
 * Shared navbar + theme behavior for legal/support pages.
 * Keeps theme in sync with home page via localStorage("theme").
 */

(function () {
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const themeToggle = document.getElementById('themeToggle');

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            return;
        }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
    }

    function handleScroll() {
        if (!navbar) return;
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    function toggleMobileMenu() {
        if (!hamburger || !navLinks) return;
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    }

    function closeMobileMenu() {
        if (!hamburger || !navLinks) return;
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        handleScroll();
    });

    window.addEventListener('scroll', handleScroll);

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    if (navLinks) {
        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    document.addEventListener('click', (event) => {
        if (!hamburger || !navLinks) return;
        const clickedInsideMenu = navLinks.contains(event.target);
        const clickedHamburger = hamburger.contains(event.target);
        if (!clickedInsideMenu && !clickedHamburger) {
            closeMobileMenu();
        }
    });
})();

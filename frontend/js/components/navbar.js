/**
 * ElevateCV AI — Navbar Component
 * Handles scroll effects, mobile menu toggle, and active link tracking.
 */

const Navbar = (() => {
    let navbar = null;
    let toggle = null;
    let menu   = null;
    let links  = [];
    let isMenuOpen = false;

    /** Add scrolled class when page is scrolled past threshold */
    function handleScroll() {
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.classList.add('navbar--scrolled');
        } else {
            navbar.classList.remove('navbar--scrolled');
        }
    }

    /** Toggle mobile menu */
    function toggleMenu() {
        if (!toggle || !menu) return;
        isMenuOpen = !isMenuOpen;
        toggle.classList.toggle('navbar__toggle--active', isMenuOpen);
        menu.classList.toggle('navbar__menu--open', isMenuOpen);
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    }

    /** Close mobile menu */
    function closeMenu() {
        if (!isMenuOpen || !toggle || !menu) return;
        isMenuOpen = false;
        toggle.classList.remove('navbar__toggle--active');
        menu.classList.remove('navbar__menu--open');
        document.body.style.overflow = '';
    }

    /** Update active link based on current scroll position */
    function updateActiveLink() {
        if (!links || !links.length) return;
        const sections = Helpers.$$('section[id]');
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                links.forEach(link => {
                    link.classList.remove('navbar__link--active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('navbar__link--active');
                    }
                });
            }
        });
    }

    /** Initialize navbar */
    function init() {
        navbar = Helpers.$('#navbar');
        toggle = Helpers.$('#navbar-toggle');
        menu   = Helpers.$('#navbar-menu');
        links  = Helpers.$$('.navbar__link');

        if (!navbar) return;

        window.addEventListener('scroll', Helpers.throttle(handleScroll, 50));
        window.addEventListener('scroll', Helpers.throttle(updateActiveLink, 100));
        if (toggle) toggle.addEventListener('click', toggleMenu);

        links.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        handleScroll();
    }

    return { init };
})();

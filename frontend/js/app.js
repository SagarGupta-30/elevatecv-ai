/**
 * ElevateCV AI — Application Entry Point
 * Initializes all components when the DOM is ready.
 */

document.addEventListener('DOMContentLoaded', () => {
    Navbar.init();
    Hero.init();

    console.log('%c⚡ ElevateCV AI — Loaded', 'color: #6C3CE1; font-weight: bold; font-size: 14px;');
});

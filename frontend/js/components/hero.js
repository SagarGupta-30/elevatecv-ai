/**
 * ElevateCV AI — Hero Component
 * Handles animated stat counters and scroll-triggered reveals.
 */

const Hero = (() => {
    let statsAnimated = false;

    /** Animate all stat counters when hero section enters viewport */
    function animateStats() {
        if (statsAnimated) return;

        const statsSection = Helpers.$('#hero-stats');
        if (!statsSection) return;

        const rect = statsSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (inView) {
            statsAnimated = true;
            const counters = Helpers.$$('.hero__stat-number[data-count]');
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.count, 10);
                Helpers.animateCount(counter, target, 2000);
            });
        }
    }

    /** Initialize scroll-reveal observer */
    function initReveal() {
        const revealElements = Helpers.$$('.reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal--visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        revealElements.forEach(el => observer.observe(el));
    }

    /** Initialize hero */
    function init() {
        window.addEventListener('scroll', Helpers.throttle(animateStats, 100));
        animateStats();
        initReveal();
    }

    return { init };
})();

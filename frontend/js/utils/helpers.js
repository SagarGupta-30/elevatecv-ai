/**
 * ElevateCV AI — Utility Helpers
 * Reusable utility functions used across the application.
 */

const Helpers = (() => {
    /**
     * Debounce a function call.
     * @param {Function} fn - The function to debounce.
     * @param {number} delay - Delay in milliseconds.
     * @returns {Function}
     */
    function debounce(fn, delay = 100) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Throttle a function call.
     * @param {Function} fn - The function to throttle.
     * @param {number} limit - Minimum interval in milliseconds.
     * @returns {Function}
     */
    function throttle(fn, limit = 100) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= limit) {
                lastCall = now;
                fn.apply(this, args);
            }
        };
    }

    /**
     * Select a single DOM element.
     * @param {string} selector - CSS selector.
     * @param {Element} parent - Parent element (defaults to document).
     * @returns {Element|null}
     */
    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    /**
     * Select multiple DOM elements.
     * @param {string} selector - CSS selector.
     * @param {Element} parent - Parent element (defaults to document).
     * @returns {Element[]}
     */
    function $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    /**
     * Animate a number from 0 to a target value.
     * @param {Element} el - The element to update.
     * @param {number} target - Target number.
     * @param {number} duration - Duration in milliseconds.
     */
    function animateCount(el, target, duration = 2000) {
        let start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            el.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Display a standardized toast notification.
     * Delegates to ToastNotif if loaded, otherwise creates a fallback toast element.
     */
    function showToast(message, type = 'success', duration = 3500) {
        if (typeof ToastNotif !== 'undefined' && ToastNotif.show) {
            ToastNotif.show(message, type, duration);
        } else {
            console.log(`[Toast ${type.toUpperCase()}] ${message}`);
        }
    }

    return { debounce, throttle, $, $$, animateCount, showToast };
})();

/**
 * ElevateCV AI — Template Selector UI Component (Sprint 3)
 *
 * Renders a horizontal scrollable strip of template cards inside the
 * live-preview topbar in builder.html.
 *
 * Public API:
 *   TemplateSelector.init(containerEl)   — mount selector inside containerEl
 *   TemplateSelector.setActive(slug)     — programmatically set active card
 *   TemplateSelector.getActive()         — return currently active slug
 *
 * On selection:
 *   1. Writes slug to BuilderState via BuilderState.set('template', slug)
 *   2. PreviewRenderer picks up the change within the next 250ms poll tick
 *   3. No page reload, no AJAX call
 *
 * Depends on: TemplateRegistry, BuilderState
 */

const TemplateSelector = (() => {

    let _containerEl = null;
    let _activeSlug  = null;

    /* ──────────────────────────────────────────────────────────────────
       Determine initial active slug from BuilderState
    ────────────────────────────────────────────────────────────────── */
    function _resolveInitialSlug() {
        if (typeof BuilderState === 'undefined') {
            return TemplateRegistry.DEFAULT_SLUG;
        }
        const data = BuilderState.get();
        const backendVal = data.template || 'default';

        // If the value is already a UI slug (e.g. after a hot switch), use it directly
        const allSlugs = TemplateRegistry.getAll().map(t => t.id);
        if (allSlugs.includes(backendVal)) return backendVal;

        // Otherwise, map backend enum → preferred UI slug
        return TemplateRegistry.fromBackendValue(backendVal);
    }

    /* ──────────────────────────────────────────────────────────────────
       Render the selector strip HTML
    ────────────────────────────────────────────────────────────────── */
    function _buildHTML() {
        const templates = TemplateRegistry.getAll();

        const cards = templates.map(t => `
            <button
                class="tpl-card${_activeSlug === t.id ? ' tpl-card--active' : ''}"
                data-slug="${t.id}"
                aria-label="Switch to ${t.label} template"
                aria-pressed="${_activeSlug === t.id}"
                title="${t.description}"
                id="tpl-card-${t.id}"
                type="button"
            >
                <span class="tpl-card__preview" aria-hidden="true">${_getPreviewIcon(t.id)}</span>
                <span class="tpl-card__label">${t.label}</span>
            </button>
        `).join('');

        return `
        <div class="tpl-selector" id="tpl-selector" role="group" aria-label="Resume template selector">
            <span class="tpl-selector__label">Template</span>
            <div class="tpl-selector__scroll" id="tpl-selector-scroll">
                ${cards}
            </div>
        </div>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Tiny ASCII-art preview icons per template (decorative only)
    ────────────────────────────────────────────────────────────────── */
    function _getPreviewIcon(slug) {
        const icons = {
            'ats-professional': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="8" y="7" width="16" height="2" rx="1" fill="#0f172a"/>
                <rect x="10" y="11" width="12" height="1.2" rx="0.6" fill="#94a3b8"/>
                <rect x="8" y="15" width="16" height="1" rx="0.5" fill="#cbd5e1"/>
                <rect x="8" y="18" width="14" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="21" width="16" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="25" width="16" height="1" rx="0.5" fill="#cbd5e1"/>
                <rect x="8" y="28" width="10" height="1" rx="0.5" fill="#e2e8f0"/>
            </svg>`,
            'modern': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="4" y="2" width="24" height="10" rx="2" fill="#4338ca"/>
                <rect x="8" y="5.5" width="12" height="2.5" rx="1" fill="#fff" opacity="0.9"/>
                <rect x="8" y="9" width="8" height="1" rx="0.5" fill="#fff" opacity="0.6"/>
                <rect x="8" y="15" width="16" height="1" rx="0.5" fill="#4338ca"/>
                <rect x="8" y="18" width="14" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="21" width="16" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="25" width="16" height="1" rx="0.5" fill="#4338ca"/>
                <rect x="8" y="28" width="12" height="1" rx="0.5" fill="#e2e8f0"/>
            </svg>`,
            'minimal': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#fff" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="8" y="7" width="10" height="2" rx="1" fill="#000" opacity="0.7"/>
                <rect x="8" y="11" width="16" height="0.8" rx="0.4" fill="#ccc"/>
                <rect x="8" y="16" width="14" height="0.8" rx="0.4" fill="#ddd"/>
                <rect x="8" y="19" width="16" height="0.8" rx="0.4" fill="#ddd"/>
                <rect x="8" y="22" width="12" height="0.8" rx="0.4" fill="#eee"/>
                <rect x="8" y="27" width="16" height="0.8" rx="0.4" fill="#ccc"/>
                <rect x="8" y="30" width="10" height="0.8" rx="0.4" fill="#ddd"/>
            </svg>`,
            'executive': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="8" y="6" width="10" height="2.5" rx="1" fill="#1a202c"/>
                <rect x="8" y="9.5" width="4" height="1" rx="0.5" fill="#2c5282"/>
                <rect x="20" y="6" width="7" height="1" rx="0.5" fill="#718096"/>
                <rect x="20" y="8" width="6" height="1" rx="0.5" fill="#718096"/>
                <rect x="8" y="14" width="16" height="2" rx="1" fill="#edf2f7"/>
                <rect x="8" y="18" width="14" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="21" width="16" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="8" y="25" width="16" height="2" rx="1" fill="#edf2f7"/>
                <rect x="8" y="29" width="12" height="1" rx="0.5" fill="#e2e8f0"/>
            </svg>`,
            'harvard': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#fff" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="8" y="6" width="16" height="2.5" rx="1" fill="#000" opacity="0.85"/>
                <rect x="9" y="10" width="14" height="0.8" rx="0.4" fill="#999"/>
                <rect x="8" y="13" width="16" height="0.8" rx="0.4" fill="#000"/>
                <rect x="8" y="16" width="14" height="0.8" rx="0.4" fill="#ccc"/>
                <rect x="8" y="19" width="16" height="0.8" rx="0.4" fill="#ccc"/>
                <rect x="8" y="23" width="16" height="0.8" rx="0.4" fill="#000"/>
                <rect x="8" y="26" width="14" height="0.8" rx="0.4" fill="#ccc"/>
                <rect x="8" y="29" width="12" height="0.8" rx="0.4" fill="#ccc"/>
            </svg>`,
            'creative': `<svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="4" y="2" width="24" height="32" rx="2" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
                <rect x="4" y="2" width="3" height="32" rx="1" fill="#0d9488"/>
                <rect x="10" y="6" width="12" height="3" rx="1" fill="#0d9488"/>
                <rect x="10" y="11" width="14" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="10" y="14" width="12" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="10" y="18" width="16" height="1.2" rx="0.6" fill="#99f6e4"/>
                <rect x="10" y="21" width="14" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="10" y="24" width="12" height="1" rx="0.5" fill="#e2e8f0"/>
                <rect x="10" y="28" width="16" height="1.2" rx="0.6" fill="#99f6e4"/>
            </svg>`
        };

        return icons[slug] || icons['ats-professional'];
    }

    /* ──────────────────────────────────────────────────────────────────
       Handle card click — update state + highlight
    ────────────────────────────────────────────────────────────────── */
    function _handleSelect(slug) {
        if (slug === _activeSlug) return;
        _activeSlug = slug;

        // Write to BuilderState — PreviewRenderer polls this
        if (typeof BuilderState !== 'undefined') {
            BuilderState.set('template', slug);
        }

        // Update active card visual
        document.querySelectorAll('.tpl-card').forEach(btn => {
            const isActive = btn.dataset.slug === slug;
            btn.classList.toggle('tpl-card--active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       PUBLIC: mount selector into containerEl
    ────────────────────────────────────────────────────────────────── */
    function init(containerEl) {
        if (!containerEl) return;
        _containerEl = containerEl;
        _activeSlug  = _resolveInitialSlug();

        containerEl.insertAdjacentHTML('beforeend', _buildHTML());

        // Event delegation on the scroll container
        const scrollEl = document.getElementById('tpl-selector-scroll');
        if (scrollEl) {
            scrollEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.tpl-card');
                if (btn && btn.dataset.slug) {
                    _handleSelect(btn.dataset.slug);
                }
            });
        }

        // Scroll active card into view after a brief layout pass
        requestAnimationFrame(() => {
            const activeCard = document.getElementById(`tpl-card-${_activeSlug}`);
            if (activeCard && scrollEl) {
                scrollEl.scrollLeft = activeCard.offsetLeft - 8;
            }
        });
    }

    /* ── PUBLIC: programmatically set active (e.g., after hydrate) ─── */
    function setActive(slug) {
        _activeSlug = slug || TemplateRegistry.DEFAULT_SLUG;
        document.querySelectorAll('.tpl-card').forEach(btn => {
            const isActive = btn.dataset.slug === _activeSlug;
            btn.classList.toggle('tpl-card--active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
    }

    /* ── PUBLIC: return active slug ────────────────────────────────── */
    function getActive() {
        return _activeSlug || TemplateRegistry.DEFAULT_SLUG;
    }

    return { init, setActive, getActive };

})();

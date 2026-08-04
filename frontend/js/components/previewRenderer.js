/**
 * ElevateCV AI — PreviewRenderer (Sprint 3 — Template Engine refactor)
 *
 * Sprint 2 public API preserved (no callers break):
 *   PreviewRenderer.render(resumeData, targetEl)  → one-shot render from any data object
 *   PreviewRenderer.attach(targetEl)              → subscribe to BuilderState, auto-render on change
 *   PreviewRenderer.detach()                      → unsubscribe (cleanup)
 *
 * Sprint 3 changes:
 *   - Rendering is DELEGATED to TemplateRegistry.render(slug, data, el)
 *   - TemplateRegistry selects the template based on BuilderState.get().template
 *   - The hash used for change-detection now includes the template slug,
 *     so switching templates triggers an immediate re-render within the 250ms poll.
 *   - The shared helper functions (esc, v, dateRange, etc.) now live in
 *     TemplateHelpers and are still locally aliased for backward-compat.
 *
 * Rendering rules (enforced inside each template module, not here):
 *   - Empty sections are completely hidden
 *   - isCurrent === true → "Present"
 *   - All text is XSS-sanitized before insertion
 *   - No emojis — contact fields use CSS separator elements
 */

const PreviewRenderer = (() => {

    /* ── Internal state ──────────────────────────────────────────────── */
    let _intervalId = null;
    let _lastHash   = null;
    let _targetEl   = null;

    /* ──────────────────────────────────────────────────────────────────
       Resolve the active template slug from BuilderState.
       Falls back to DEFAULT_SLUG if BuilderState or TemplateRegistry
       are not yet loaded (safety net for script load order issues).
    ────────────────────────────────────────────────────────────────── */
    function _resolveSlug(data) {
        if (typeof TemplateRegistry === 'undefined') return null;

        const rawTemplate = data && data.template;
        if (!rawTemplate) return TemplateRegistry.DEFAULT_SLUG;

        // Check if it's already a UI slug
        const allSlugs = TemplateRegistry.getAll().map(t => t.id);
        if (allSlugs.includes(rawTemplate)) return rawTemplate;

        // Map from backend enum value → UI slug
        return TemplateRegistry.fromBackendValue(rawTemplate);
    }

    /* ──────────────────────────────────────────────────────────────────
       Core render — resolves template, delegates to TemplateRegistry
    ────────────────────────────────────────────────────────────────── */
    function _renderInto(data, targetEl) {
        if (!targetEl) return;

        if (typeof TemplateRegistry === 'undefined') {
            // TemplateRegistry not yet loaded — show placeholder
            targetEl.innerHTML = '<p class="rv-empty">Loading templates…</p>';
            return;
        }

        const slug = _resolveSlug(data);
        TemplateRegistry.render(slug, data, targetEl);
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: one-shot render into a DOM element
    ══════════════════════════════════════════════════════════════════ */
    function render(resumeData, targetEl) {
        _renderInto(resumeData, targetEl);
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: attach to BuilderState for live updates (250ms poll)
    ══════════════════════════════════════════════════════════════════ */
    function attach(targetEl) {
        if (!targetEl) return;
        _targetEl = targetEl;

        // Initial render immediately
        _tick();

        // Hash-change polling — re-renders only when data OR template changes
        if (_intervalId) clearInterval(_intervalId);
        _intervalId = setInterval(_tick, 250);
    }

    function _tick() {
        if (!_targetEl || typeof BuilderState === 'undefined') return;

        const data = BuilderState.get();
        // Include template slug in hash so switching template triggers re-render
        const slug = _resolveSlug(data);
        const hash = slug + '|' + JSON.stringify(data);

        if (hash === _lastHash) return;  // nothing changed — skip render
        _lastHash = hash;

        _renderInto(data, _targetEl);
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: detach — stop live updates
    ══════════════════════════════════════════════════════════════════ */
    function detach() {
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
        _targetEl = null;
        _lastHash = null;
    }

    /* ──────────────────────────────────────────────────────────────────
       Backward-compatible helper aliases
       (TemplateHelpers is the authoritative source; these exist so any
        external code that referenced PreviewRenderer.esc etc. won't break)
    ────────────────────────────────────────────────────────────────── */
    function esc(str) {
        return typeof TemplateHelpers !== 'undefined'
            ? TemplateHelpers.esc(str)
            : String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    return { render, attach, detach, esc };

})();

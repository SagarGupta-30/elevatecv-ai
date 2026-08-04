/**
 * ElevateCV AI — Template Registry (Sprint 3)
 *
 * Single source of truth for all known templates.
 * Manages: slug → descriptor mapping, CSS injection, and rendering dispatch.
 *
 * Public API:
 *   TemplateRegistry.render(slug, data, targetEl)   — inject CSS + render template
 *   TemplateRegistry.getAll()                        — return all template descriptors
 *   TemplateRegistry.getDescriptor(slug)             — get one descriptor
 *   TemplateRegistry.toBackendValue(slug)            — convert UI slug → backend enum value
 *   TemplateRegistry.fromBackendValue(val)           — convert backend value → UI slug
 *   TemplateRegistry.DEFAULT_SLUG                    — 'ats-professional'
 *
 * Slug → Backend enum mapping (Mongoose enum: default|classic|modern|minimal|executive):
 *   ats-professional → default
 *   modern           → modern
 *   minimal          → minimal
 *   executive        → executive
 *   harvard          → classic
 *   creative         → classic  (shares enum; loads as 'harvard' on restore)
 */

const TemplateRegistry = (() => {

    /* ──────────────────────────────────────────────────────────────────
       Template descriptors
       Each entry:
         id            — unique UI slug (also used as CSS class stem)
         label         — display name shown in TemplateSelector
         description   — short tag line for tooltip / aria
         backendValue  — value written to resume.template field
         cssFile       — path to the template's CSS, relative to frontend root
         render        — reference to the template module's render function
                         (populated in _registerAll after scripts load)
    ────────────────────────────────────────────────────────────────── */
    const TEMPLATES = [
        {
            id:           'ats-professional',
            label:        'ATS Professional',
            description:  'Clean, single-column — optimised for ATS scanners',
            backendValue: 'default',
            cssFile:      '../js/templates/ats-professional/template.css',
            render:       null   // populated by _registerAll()
        },
        {
            id:           'modern',
            label:        'Modern',
            description:  'Bold indigo header, colored section accents',
            backendValue: 'modern',
            cssFile:      '../js/templates/modern/template.css',
            render:       null
        },
        {
            id:           'minimal',
            label:        'Minimal',
            description:  'Maximum whitespace, monochrome, lowercase',
            backendValue: 'minimal',
            cssFile:      '../js/templates/minimal/template.css',
            render:       null
        },
        {
            id:           'executive',
            label:        'Executive',
            description:  'Two-column header, slate pill sections, authoritative',
            backendValue: 'executive',
            cssFile:      '../js/templates/executive/template.css',
            render:       null
        },
        {
            id:           'harvard',
            label:        'Harvard',
            description:  'Academic serif, small-caps, thin rules',
            backendValue: 'classic',
            cssFile:      '../js/templates/harvard/template.css',
            render:       null
        },
        {
            id:           'creative',
            label:        'Creative',
            description:  'Teal accent strip, expressive typography, emerald chips',
            backendValue: 'classic',  // shares enum with harvard
            cssFile:      '../js/templates/creative/template.css',
            render:       null
        }
    ];

    /* slug → descriptor index */
    const _bySlug = {};

    /* backend value → preferred UI slug (first registered wins) */
    const _byBackend = {};

    /* CSS files already injected — prevent duplicate <link> tags */
    const _injectedCss = new Set();

    /* ── DEFAULT slug ──────────────────────────────────────────────────── */
    const DEFAULT_SLUG = 'ats-professional';

    /* ──────────────────────────────────────────────────────────────────
       Wire up render function references from the global scope.
       Called once, after all template <script> tags have loaded.
    ────────────────────────────────────────────────────────────────── */
    function _registerAll() {
        const moduleMap = {
            'ats-professional': typeof TemplateProfessional !== 'undefined' ? TemplateProfessional : null,
            'modern':           typeof TemplateModern       !== 'undefined' ? TemplateModern       : null,
            'minimal':          typeof TemplateMinimal      !== 'undefined' ? TemplateMinimal      : null,
            'executive':        typeof TemplateExecutive    !== 'undefined' ? TemplateExecutive    : null,
            'harvard':          typeof TemplateHarvard      !== 'undefined' ? TemplateHarvard      : null,
            'creative':         typeof TemplateCreative     !== 'undefined' ? TemplateCreative     : null
        };

        TEMPLATES.forEach(t => {
            const mod = moduleMap[t.id];
            t.render = mod ? mod.render.bind(mod) : _fallbackRender;

            _bySlug[t.id] = t;

            // Only the first template to register a backend value is the
            // canonical one for reverse-lookup (harvard wins over creative).
            if (!_byBackend[t.backendValue]) {
                _byBackend[t.backendValue] = t.id;
            }
        });
    }

    /* ── Inject a template's CSS once ─────────────────────────────────── */
    function _injectCss(descriptor) {
        if (!descriptor || !descriptor.cssFile) return;
        if (_injectedCss.has(descriptor.cssFile)) return;

        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = descriptor.cssFile;
        document.head.appendChild(link);
        _injectedCss.add(descriptor.cssFile);
    }

    /* ── Fallback renderer (safety net) ───────────────────────────────── */
    function _fallbackRender(data) {
        const pi = (data && data.personalInformation) || {};
        const name = (pi.fullName || '').trim();
        return `
        <div class="resume-paper tpl-ats">
            ${name ? `<header class="ats-header"><h1 class="ats-name">${name}</h1></header>` : ''}
            <p style="padding:20pt;color:#6b7280;font-style:italic;">Template is loading…</p>
        </div>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       PUBLIC — render a template into a target DOM element
    ────────────────────────────────────────────────────────────────── */
    function render(slug, data, targetEl) {
        if (!targetEl) return;

        const descriptor = _bySlug[slug] || _bySlug[DEFAULT_SLUG];
        _injectCss(descriptor);

        if (!data) {
            targetEl.innerHTML = '<p class="rv-empty">Start filling in your resume to see a live preview.</p>';
            return;
        }

        const pi = data.personalInformation || {};
        if (!(pi.fullName || '').trim()) {
            targetEl.innerHTML = '<p class="rv-empty">Enter your full name to see the preview.</p>';
            return;
        }

        const html = descriptor.render
            ? descriptor.render(data)
            : _fallbackRender(data);

        targetEl.innerHTML = html || '<p class="rv-empty">Template rendered nothing.</p>';
    }

    /* ── PUBLIC: all template descriptors ─────────────────────────────── */
    function getAll() {
        return TEMPLATES.map(t => ({
            id:          t.id,
            label:       t.label,
            description: t.description
        }));
    }

    /* ── PUBLIC: single descriptor by slug ────────────────────────────── */
    function getDescriptor(slug) {
        return _bySlug[slug] || null;
    }

    /* ── PUBLIC: convert UI slug → backend enum value ─────────────────── */
    function toBackendValue(slug) {
        const d = _bySlug[slug];
        return d ? d.backendValue : 'default';
    }

    /* ── PUBLIC: convert backend value → preferred UI slug ────────────── */
    function fromBackendValue(val) {
        return _byBackend[val] || DEFAULT_SLUG;
    }

    /* ── Init (call after DOMContentLoaded, after all template scripts) ─ */
    function init() {
        _registerAll();
        // Pre-inject the default template CSS immediately
        _injectCss(_bySlug[DEFAULT_SLUG]);
    }

    return {
        DEFAULT_SLUG,
        init,
        render,
        getAll,
        getDescriptor,
        toBackendValue,
        fromBackendValue
    };

})();

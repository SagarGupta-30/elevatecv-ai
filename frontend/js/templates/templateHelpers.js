/**
 * ElevateCV AI — Template Helpers (Sprint 3)
 *
 * Shared rendering primitives used by ALL template modules.
 * Extracted from PreviewRenderer so no business logic is duplicated.
 *
 * Exposed as window.TemplateHelpers — load before any template module.
 *
 * Public API:
 *   TemplateHelpers.esc(str)                      — XSS-safe entity escape
 *   TemplateHelpers.v(str)                         — trim + falsy → null
 *   TemplateHelpers.dateRange(s, e, isCurrent)     — "Jan 2022 – Present"
 *   TemplateHelpers.bullets(arr)                   — <ul> list or ''
 *   TemplateHelpers.chips(arr, extraClass)         — chip spans or ''
 *   TemplateHelpers.buildContactParts(pi)          — array of contact HTML strings
 *   TemplateHelpers.buildExperienceList(data)      — filtered experience array
 *   TemplateHelpers.buildEducationList(data)       — filtered education array
 *   TemplateHelpers.buildProjectsList(data)        — filtered projects array
 *   TemplateHelpers.buildSkillCategories(data)     — skill category objects
 *   TemplateHelpers.buildCertificationList(data)   — filtered certs array
 *   TemplateHelpers.buildLanguageList(data)        — filtered languages array
 *   TemplateHelpers.isEmpty(data)                  — true if no name entered
 */

const TemplateHelpers = (() => {

    /* ── XSS-safe HTML entity escape ─────────────────────────────────── */
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ── Trim + truthy check (returns null if empty) ──────────────────── */
    function v(str) {
        const t = (str || '').toString().trim();
        return t || null;
    }

    /* ── Date range — handles isCurrent → "Present" ───────────────────── */
    function dateRange(start, end, isCurrent) {
        const s = v(start);
        const e = isCurrent ? 'Present' : v(end);
        if (!s && !e) return '';
        if (!s) return e;
        if (!e) return s;
        return `${s} – ${e}`;
    }

    /* ── Bullet list from string array ────────────────────────────────── */
    function bullets(arr, ulClass, liClass) {
        if (!Array.isArray(arr)) return '';
        const items = arr.filter(Boolean);
        if (!items.length) return '';
        const uc = ulClass ? ` class="${ulClass}"` : '';
        const lc = liClass ? ` class="${liClass}"` : '';
        return `<ul${uc}>${items.map(b => `<li${lc}>${esc(b)}</li>`).join('')}</ul>`;
    }

    /* ── Inline chips from string array ───────────────────────────────── */
    function chips(arr, wrapClass, chipClass) {
        if (!Array.isArray(arr)) return '';
        const items = arr.filter(Boolean);
        if (!items.length) return '';
        const wc = wrapClass ? ` class="${wrapClass}"` : '';
        const cc = chipClass || 'rv-chip';
        return `<div${wc}>${items.map(c =>
            `<span class="${cc}">${esc(c)}</span>`
        ).join('')}</div>`;
    }

    /* ── Build contact parts array from personalInformation ─────────────
       Returns an array of HTML strings (links / spans).
       Callers join them with their own separator style.
    ──────────────────────────────────────────────────────────────────── */
    function buildContactParts(pi) {
        if (!pi) return [];
        const parts = [];

        if (v(pi.email)) {
            parts.push({ type: 'email', html: `<a class="rv-contact-link" href="mailto:${esc(pi.email)}">${esc(pi.email)}</a>` });
        }
        if (v(pi.phone)) {
            parts.push({ type: 'phone', html: `<span>${esc(pi.phone)}</span>` });
        }
        if (v(pi.address)) {
            parts.push({ type: 'address', html: `<span>${esc(pi.address)}</span>` });
        }
        if (v(pi.linkedin)) {
            const display = pi.linkedin.replace(/^https?:\/\/(www\.)?/i, '');
            parts.push({ type: 'linkedin', html: `<a class="rv-contact-link" href="${esc(pi.linkedin)}" target="_blank" rel="noopener">${esc(display)}</a>` });
        }
        if (v(pi.github)) {
            const display = pi.github.replace(/^https?:\/\/(www\.)?/i, '');
            parts.push({ type: 'github', html: `<a class="rv-contact-link" href="${esc(pi.github)}" target="_blank" rel="noopener">${esc(display)}</a>` });
        }
        if (v(pi.portfolio)) {
            const display = pi.portfolio.replace(/^https?:\/\/(www\.)?/i, '');
            parts.push({ type: 'portfolio', html: `<a class="rv-contact-link" href="${esc(pi.portfolio)}" target="_blank" rel="noopener">${esc(display)}</a>` });
        }

        return parts;
    }

    /* ── Filter helpers ────────────────────────────────────────────────── */
    function buildExperienceList(data) {
        return (data.experience || []).filter(e => v(e.company) || v(e.role));
    }

    function buildEducationList(data) {
        return (data.education || []).filter(e => v(e.college) || v(e.degree));
    }

    function buildProjectsList(data) {
        return (data.projects || []).filter(p => v(p.title));
    }

    function buildCertificationList(data) {
        return (data.certifications || []).filter(c => v(c.name));
    }

    function buildLanguageList(data) {
        return (data.languages || []).filter(l => v(l.language));
    }

    function buildSkillCategories(data) {
        const sk = data.skills || {};
        const CATS = [
            { key: 'technical', label: 'Technical' },
            { key: 'languages', label: 'Programming Languages' },
            { key: 'tools',     label: 'Tools & Technologies' },
            { key: 'soft',      label: 'Soft Skills' }
        ];
        return CATS
            .map(cat => ({
                key:   cat.key,
                label: cat.label,
                items: Array.isArray(sk[cat.key]) ? sk[cat.key].filter(Boolean) : []
            }))
            .filter(cat => cat.items.length > 0);
    }

    /* ── Check if resume has enough data to render ────────────────────── */
    function isEmpty(data) {
        if (!data) return true;
        const pi = data.personalInformation || {};
        return !v(pi.fullName);
    }

    return {
        esc,
        v,
        dateRange,
        bullets,
        chips,
        buildContactParts,
        buildExperienceList,
        buildEducationList,
        buildProjectsList,
        buildCertificationList,
        buildLanguageList,
        buildSkillCategories,
        isEmpty
    };

})();

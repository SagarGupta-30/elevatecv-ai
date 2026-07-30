/**
 * ElevateCV AI — PreviewRenderer (Sprint 2 Live Preview)
 *
 * Pure rendering component. No API calls. No DOM access outside targetEl.
 *
 * Public API:
 *   PreviewRenderer.render(resumeData, targetEl)  → one-shot render from any data object
 *   PreviewRenderer.attach(targetEl)              → subscribe to BuilderState, auto-render on change
 *   PreviewRenderer.detach()                      → unsubscribe (cleanup)
 *
 * Rendering rules enforced:
 *   - Empty sections are completely hidden (no headings for empty content)
 *   - isCurrent === true on experience → shows "Present" instead of end date
 *   - description arrays render as <ul> bullet lists
 *   - techStack arrays render as inline chips
 *   - skills object renders 4 categories with category labels + chips
 *   - All text is XSS-sanitized before insertion
 *   - No emojis — contact fields use CSS separator dots
 */

const PreviewRenderer = (() => {

    /* ── Internal state ──────────────────────────────────────────────── */
    let _intervalId = null;
    let _lastHash   = null;
    let _targetEl   = null;

    /* ──────────────────────────────────────────────────────────────────
       XSS-safe HTML entity escape
    ────────────────────────────────────────────────────────────────── */
    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ──────────────────────────────────────────────────────────────────
       Trim + truthy check (returns null if empty)
    ────────────────────────────────────────────────────────────────── */
    function v(str) {
        const t = (str || '').toString().trim();
        return t || null;
    }

    /* ──────────────────────────────────────────────────────────────────
       Section wrapper — completely hidden when content is empty
    ────────────────────────────────────────────────────────────────── */
    function section(title, content) {
        if (!content || !content.trim()) return '';
        return `<section class="rv-section">
            <h2 class="rv-section-title">${esc(title)}</h2>
            <div class="rv-section-body">${content}</div>
        </section>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Bullet list from string array
    ────────────────────────────────────────────────────────────────── */
    function bullets(arr) {
        if (!Array.isArray(arr)) return '';
        const items = arr.filter(Boolean);
        if (!items.length) return '';
        return `<ul class="rv-bullets">${items.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Inline chips from string array
    ────────────────────────────────────────────────────────────────── */
    function chips(arr, cls) {
        if (!Array.isArray(arr)) return '';
        const items = arr.filter(Boolean);
        if (!items.length) return '';
        const extraClass = cls ? ` rv-chip--${cls}` : '';
        return `<div class="rv-chips">${items.map(c =>
            `<span class="rv-chip${extraClass}">${esc(c)}</span>`
        ).join('')}</div>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Date range — handles isCurrent → "Present"
    ────────────────────────────────────────────────────────────────── */
    function dateRange(start, end, isCurrent) {
        const s = v(start);
        const e = isCurrent ? 'Present' : v(end);
        if (!s && !e) return '';
        if (!s) return e;
        if (!e) return s;
        return `${s} – ${e}`;
    }

    /* ══════════════════════════════════════════════════════════════════
       HEADER
    ══════════════════════════════════════════════════════════════════ */
    function renderHeader(data) {
        const pi = data.personalInformation || {};
        const name = v(pi.fullName);
        if (!name) return '';

        /* Contact items — only render non-empty */
        const contactParts = [];
        if (v(pi.email)) {
            contactParts.push(`<a class="rv-contact-link" href="mailto:${esc(pi.email)}">${esc(pi.email)}</a>`);
        }
        if (v(pi.phone)) {
            contactParts.push(`<span>${esc(pi.phone)}</span>`);
        }
        if (v(pi.address)) {
            contactParts.push(`<span>${esc(pi.address)}</span>`);
        }
        if (v(pi.linkedin)) {
            const display = pi.linkedin.replace(/^https?:\/\/(www\.)?/i, '');
            contactParts.push(`<a class="rv-contact-link" href="${esc(pi.linkedin)}" target="_blank" rel="noopener">${esc(display)}</a>`);
        }
        if (v(pi.github)) {
            const display = pi.github.replace(/^https?:\/\/(www\.)?/i, '');
            contactParts.push(`<a class="rv-contact-link" href="${esc(pi.github)}" target="_blank" rel="noopener">${esc(display)}</a>`);
        }
        if (v(pi.portfolio)) {
            const display = pi.portfolio.replace(/^https?:\/\/(www\.)?/i, '');
            contactParts.push(`<a class="rv-contact-link" href="${esc(pi.portfolio)}" target="_blank" rel="noopener">${esc(display)}</a>`);
        }

        const contactHtml = contactParts.length
            ? `<div class="rv-contact">${contactParts.join('<span class="rv-contact-sep" aria-hidden="true"></span>')}</div>`
            : '';

        return `<header class="rv-header">
            <h1 class="rv-name">${esc(name)}</h1>
            ${contactHtml}
        </header>`;
    }

    /* ══════════════════════════════════════════════════════════════════
       PROFESSIONAL SUMMARY
    ══════════════════════════════════════════════════════════════════ */
    function renderSummary(data) {
        const text = v(data.professionalSummary);
        if (!text) return '';
        return section('Professional Summary',
            `<p class="rv-summary-text">${esc(text)}</p>`);
    }

    /* ══════════════════════════════════════════════════════════════════
       EXPERIENCE
    ══════════════════════════════════════════════════════════════════ */
    function renderExperience(data) {
        const list = (data.experience || []).filter(e => v(e.company) || v(e.role));
        if (!list.length) return '';

        const inner = list.map(exp => {
            const role        = v(exp.role);
            const company     = v(exp.company);
            const location    = v(exp.location);
            const dates       = dateRange(exp.startDate, exp.endDate, exp.isCurrent);
            const companyLine = [company, location].filter(Boolean).join(', ');
            const desc        = bullets(exp.description);

            return `<div class="rv-item">
                <div class="rv-item-header">
                    <div class="rv-item-left">
                        ${role        ? `<div class="rv-item-title">${esc(role)}</div>` : ''}
                        ${companyLine ? `<div class="rv-item-subtitle">${esc(companyLine)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="rv-item-date">${esc(dates)}</div>` : ''}
                </div>
                ${desc}
            </div>`;
        }).join('');

        return section('Experience', inner);
    }

    /* ══════════════════════════════════════════════════════════════════
       EDUCATION
    ══════════════════════════════════════════════════════════════════ */
    function renderEducation(data) {
        const list = (data.education || []).filter(e => v(e.college) || v(e.degree));
        if (!list.length) return '';

        const inner = list.map(edu => {
            const college    = v(edu.college);
            const degree     = v(edu.degree);
            const branch     = v(edu.branch);
            const cgpa       = v(edu.cgpa);
            const dates      = dateRange(edu.startDate, edu.endDate, false);

            const degreeLine = [degree, branch ? `in ${branch}` : null].filter(Boolean).join(' ');
            const metaParts  = [];
            if (cgpa)  metaParts.push(`CGPA: ${cgpa}`);
            if (dates) metaParts.push(dates);
            const metaLine = metaParts.join('  ·  ');

            return `<div class="rv-item">
                <div class="rv-item-header">
                    <div class="rv-item-left">
                        ${college    ? `<div class="rv-item-title">${esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="rv-item-subtitle">${esc(degreeLine)}</div>` : ''}
                        ${metaLine   ? `<div class="rv-item-meta">${esc(metaLine)}</div>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

        return section('Education', inner);
    }

    /* ══════════════════════════════════════════════════════════════════
       PROJECTS
    ══════════════════════════════════════════════════════════════════ */
    function renderProjects(data) {
        const list = (data.projects || []).filter(p => v(p.title));
        if (!list.length) return '';

        const inner = list.map(proj => {
            const title    = v(proj.title);
            const github   = v(proj.github);
            const liveDemo = v(proj.liveDemo);
            const stack    = chips(proj.techStack, 'tech');
            const desc     = bullets(proj.description);

            const links = [];
            if (github)   links.push(`<a class="rv-link" href="${esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="rv-link" href="${esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.join('<span class="rv-link-sep">·</span>');

            return `<div class="rv-item">
                <div class="rv-item-header">
                    <div class="rv-item-left">
                        <div class="rv-item-title">
                            ${esc(title)}
                            ${linksHtml ? `<span class="rv-proj-links">${linksHtml}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${stack}
                ${desc}
            </div>`;
        }).join('');

        return section('Projects', inner);
    }

    /* ══════════════════════════════════════════════════════════════════
       SKILLS — 4 categories
    ══════════════════════════════════════════════════════════════════ */
    function renderSkills(data) {
        const sk = data.skills || {};

        const CATS = [
            { key: 'technical', label: 'Technical' },
            { key: 'languages', label: 'Programming Languages' },
            { key: 'tools',     label: 'Tools & Technologies' },
            { key: 'soft',      label: 'Soft Skills' }
        ];

        const rows = CATS.map(cat => {
            const arr = sk[cat.key];
            if (!Array.isArray(arr) || !arr.filter(Boolean).length) return '';
            return `<div class="rv-skill-row">
                <span class="rv-skill-label">${esc(cat.label)}</span>
                ${chips(arr)}
            </div>`;
        }).filter(Boolean).join('');

        return section('Skills', rows);
    }

    /* ══════════════════════════════════════════════════════════════════
       CERTIFICATIONS
    ══════════════════════════════════════════════════════════════════ */
    function renderCertifications(data) {
        const list = (data.certifications || []).filter(c => v(c.name));
        if (!list.length) return '';

        const inner = list.map(cert => {
            const name   = v(cert.name);
            const issuer = v(cert.issuer);
            const date   = v(cert.date);
            const url    = v(cert.credentialUrl);
            const meta   = [issuer, date].filter(Boolean).join('  ·  ');

            return `<div class="rv-item rv-item--compact">
                <div class="rv-item-title">
                    ${url
                        ? `<a class="rv-link rv-link--inherit" href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>`
                        : esc(name)}
                </div>
                ${meta ? `<div class="rv-item-meta">${esc(meta)}</div>` : ''}
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ══════════════════════════════════════════════════════════════════
       LANGUAGES
    ══════════════════════════════════════════════════════════════════ */
    function renderLanguages(data) {
        const list = (data.languages || []).filter(l => v(l.language));
        if (!list.length) return '';

        const inner = `<div class="rv-languages">${list.map(lang =>
            `<div class="rv-lang-item">
                <span class="rv-lang-name">${esc(lang.language)}</span>
                ${v(lang.proficiency)
                    ? `<span class="rv-lang-prof">${esc(lang.proficiency)}</span>`
                    : ''}
            </div>`
        ).join('')}</div>`;

        return section('Languages', inner);
    }

    /* ══════════════════════════════════════════════════════════════════
       Build full resume HTML from data object
    ══════════════════════════════════════════════════════════════════ */
    function _buildHtml(data) {
        if (!data) {
            return '<p class="rv-empty">Start filling in your resume to see a live preview.</p>';
        }

        const pi = data.personalInformation || {};
        if (!v(pi.fullName)) {
            return '<p class="rv-empty">Enter your full name to see the preview.</p>';
        }

        return [
            renderHeader(data),
            renderSummary(data),
            renderExperience(data),
            renderEducation(data),
            renderProjects(data),
            renderSkills(data),
            renderCertifications(data),
            renderLanguages(data)
        ].filter(Boolean).join('');
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: one-shot render into a DOM element
    ══════════════════════════════════════════════════════════════════ */
    function render(resumeData, targetEl) {
        if (!targetEl) return;
        targetEl.innerHTML = _buildHtml(resumeData);
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: attach to BuilderState for live updates
    ══════════════════════════════════════════════════════════════════ */
    function attach(targetEl) {
        if (!targetEl) return;
        _targetEl = targetEl;

        // Initial render immediately
        _tick();

        // BuilderState.set() doesn't emit events — use 250ms polling
        // with JSON-hash change detection to avoid unnecessary DOM writes.
        if (_intervalId) clearInterval(_intervalId);
        _intervalId = setInterval(_tick, 250);
    }

    function _tick() {
        if (!_targetEl || typeof BuilderState === 'undefined') return;
        const data = BuilderState.get();
        const hash = JSON.stringify(data);
        if (hash === _lastHash) return;   // nothing changed — skip render
        _lastHash = hash;
        _targetEl.innerHTML = _buildHtml(data);
    }

    /* ══════════════════════════════════════════════════════════════════
       PUBLIC: detach — stop live updates
    ══════════════════════════════════════════════════════════════════ */
    function detach() {
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
        _targetEl = null;
        _lastHash = null;
    }

    return { render, attach, detach };

})();

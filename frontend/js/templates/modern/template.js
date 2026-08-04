/**
 * ElevateCV AI — Modern Template (Sprint 3)
 *
 * Design:   Bold indigo full-bleed header band. Large name.
 *           Section titles with left colored border accent.
 *           Clean sans-serif, generous whitespace.
 *
 * Backend slug map: 'modern' → persisted as 'modern'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateModern = (() => {

    const H = TemplateHelpers;

    /* ── Header ───────────────────────────────────────────────────────── */
    function renderHeader(data) {
        const pi   = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi).map(p => p.html);
        const sep   = `<span class="mod-sep" aria-hidden="true">·</span>`;
        const contactHtml = parts.length
            ? `<div class="mod-contact">${parts.join(sep)}</div>`
            : '';

        const title = H.v(pi.jobTitle || '') || '';

        return `
        <header class="mod-header">
            <div class="mod-header-inner">
                <h1 class="mod-name">${H.esc(name)}</h1>
                ${title ? `<div class="mod-title">${H.esc(title)}</div>` : ''}
                ${contactHtml}
            </div>
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="mod-section">
            <h2 class="mod-section-title">${H.esc(title)}</h2>
            <div class="mod-section-body">${body}</div>
        </section>`;
    }

    /* ── Summary ──────────────────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('Summary', `<p class="mod-summary">${H.esc(text)}</p>`);
    }

    /* ── Experience ───────────────────────────────────────────────────── */
    function renderExperience(data) {
        const list = H.buildExperienceList(data);
        if (!list.length) return '';

        const inner = list.map(exp => {
            const role     = H.v(exp.role);
            const company  = H.v(exp.company);
            const location = H.v(exp.location);
            const dates    = H.dateRange(exp.startDate, exp.endDate, exp.isCurrent);
            const meta     = [company, location].filter(Boolean).join(' · ');
            const desc     = H.bullets(exp.description, 'mod-bullets');

            return `
            <div class="mod-item">
                <div class="mod-item-row">
                    <div class="mod-item-left">
                        ${role ? `<div class="mod-item-title">${H.esc(role)}</div>` : ''}
                        ${meta ? `<div class="mod-item-sub">${H.esc(meta)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="mod-item-date">${H.esc(dates)}</div>` : ''}
                </div>
                ${desc}
            </div>`;
        }).join('');

        return section('Experience', inner);
    }

    /* ── Education ────────────────────────────────────────────────────── */
    function renderEducation(data) {
        const list = H.buildEducationList(data);
        if (!list.length) return '';

        const inner = list.map(edu => {
            const college    = H.v(edu.college);
            const degree     = H.v(edu.degree);
            const branch     = H.v(edu.branch);
            const cgpa       = H.v(edu.cgpa);
            const dates      = H.dateRange(edu.startDate, edu.endDate, false);
            const degreeLine = [degree, branch ? `in ${branch}` : null].filter(Boolean).join(' ');
            const metaParts  = [];
            if (cgpa)  metaParts.push(`CGPA: ${cgpa}`);
            if (dates) metaParts.push(dates);

            return `
            <div class="mod-item">
                <div class="mod-item-row">
                    <div class="mod-item-left">
                        ${college    ? `<div class="mod-item-title">${H.esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="mod-item-sub">${H.esc(degreeLine)}</div>` : ''}
                    </div>
                    ${metaParts.length ? `<div class="mod-item-date">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        return section('Education', inner);
    }

    /* ── Projects ─────────────────────────────────────────────────────── */
    function renderProjects(data) {
        const list = H.buildProjectsList(data);
        if (!list.length) return '';

        const inner = list.map(proj => {
            const title    = H.v(proj.title);
            const github   = H.v(proj.github);
            const liveDemo = H.v(proj.liveDemo);
            const stack    = H.chips(proj.techStack, 'mod-chips', 'mod-chip');
            const desc     = H.bullets(proj.description, 'mod-bullets');

            const links = [];
            if (github)   links.push(`<a class="mod-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="mod-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.length ? `<span class="mod-proj-links">${links.join('<span class="mod-link-sep">·</span>')}</span>` : '';

            return `
            <div class="mod-item">
                <div class="mod-item-title">${H.esc(title)}${linksHtml}</div>
                ${stack}
                ${desc}
            </div>`;
        }).join('');

        return section('Projects', inner);
    }

    /* ── Skills ───────────────────────────────────────────────────────── */
    function renderSkills(data) {
        const cats = H.buildSkillCategories(data);
        if (!cats.length) return '';

        const rows = cats.map(cat => `
            <div class="mod-skill-row">
                <span class="mod-skill-label">${H.esc(cat.label)}</span>
                <div class="mod-chips">
                    ${cat.items.map(i => `<span class="mod-chip">${H.esc(i)}</span>`).join('')}
                </div>
            </div>`
        ).join('');

        return section('Skills', rows);
    }

    /* ── Certifications ───────────────────────────────────────────────── */
    function renderCertifications(data) {
        const list = H.buildCertificationList(data);
        if (!list.length) return '';

        const inner = list.map(cert => {
            const name   = H.v(cert.name);
            const issuer = H.v(cert.issuer);
            const date   = H.v(cert.date);
            const url    = H.v(cert.credentialUrl);
            const meta   = [issuer, date].filter(Boolean).join('  ·  ');

            return `
            <div class="mod-item mod-item--compact">
                <div class="mod-item-title">
                    ${url ? `<a class="mod-link mod-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                </div>
                ${meta ? `<div class="mod-item-meta">${H.esc(meta)}</div>` : ''}
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ── Languages ────────────────────────────────────────────────────── */
    function renderLanguages(data) {
        const list = H.buildLanguageList(data);
        if (!list.length) return '';

        const inner = `<div class="mod-languages">${list.map(lang => `
            <div class="mod-lang-item">
                <span class="mod-lang-name">${H.esc(lang.language)}</span>
                ${H.v(lang.proficiency) ? `<span class="mod-lang-prof">${H.esc(lang.proficiency)}</span>` : ''}
            </div>`
        ).join('')}</div>`;

        return section('Languages', inner);
    }

    /* ── Main render ──────────────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null;

        return `
        <div class="resume-paper tpl-modern">
            ${renderHeader(data)}
            <div class="mod-body">
                ${renderSummary(data)}
                ${renderExperience(data)}
                ${renderEducation(data)}
                ${renderProjects(data)}
                ${renderSkills(data)}
                ${renderCertifications(data)}
                ${renderLanguages(data)}
            </div>
        </div>`;
    }

    return { render };

})();

/**
 * ElevateCV AI — Creative Template (Sprint 3)
 *
 * Design:   Left accent strip (4pt teal bar).
 *           Name large and left-aligned. Bold section titles with teal accent.
 *           Vibrant teal/emerald color palette. Modern and expressive.
 *
 * Backend slug map: 'creative' → persisted as 'classic'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateCreative = (() => {

    const H = TemplateHelpers;

    /* ── Header ───────────────────────────────────────────────────────── */
    function renderHeader(data) {
        const pi   = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi).map(p => p.html);
        const sep   = `<span class="crt-sep" aria-hidden="true"></span>`;
        const contactHtml = parts.length
            ? `<div class="crt-contact">${parts.join(sep)}</div>`
            : '';

        return `
        <header class="crt-header">
            <h1 class="crt-name">${H.esc(name)}</h1>
            ${contactHtml}
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="crt-section">
            <h2 class="crt-section-title">
                <span class="crt-section-dot" aria-hidden="true"></span>
                ${H.esc(title)}
            </h2>
            <div class="crt-section-body">${body}</div>
        </section>`;
    }

    /* ── Summary ──────────────────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('About Me', `<p class="crt-summary">${H.esc(text)}</p>`);
    }

    /* ── Experience ───────────────────────────────────────────────────── */
    function renderExperience(data) {
        const list = H.buildExperienceList(data);
        if (!list.length) return '';

        const inner = list.map(exp => {
            const role    = H.v(exp.role);
            const company = H.v(exp.company);
            const loc     = H.v(exp.location);
            const dates   = H.dateRange(exp.startDate, exp.endDate, exp.isCurrent);
            const meta    = [company, loc].filter(Boolean).join(', ');
            const desc    = H.bullets(exp.description, 'crt-bullets');

            return `
            <div class="crt-item">
                <div class="crt-item-row">
                    <div class="crt-item-left">
                        ${role ? `<div class="crt-item-title">${H.esc(role)}</div>` : ''}
                        ${meta ? `<div class="crt-item-sub">${H.esc(meta)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="crt-item-date">${H.esc(dates)}</div>` : ''}
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
            <div class="crt-item">
                <div class="crt-item-row">
                    <div class="crt-item-left">
                        ${college    ? `<div class="crt-item-title">${H.esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="crt-item-sub">${H.esc(degreeLine)}</div>` : ''}
                    </div>
                    ${metaParts.length ? `<div class="crt-item-date">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
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
            const stack    = H.chips(proj.techStack, 'crt-chips', 'crt-chip');
            const desc     = H.bullets(proj.description, 'crt-bullets');

            const links = [];
            if (github)   links.push(`<a class="crt-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="crt-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.length ? `<span class="crt-proj-links">${links.join('<span class="crt-link-sep">·</span>')}</span>` : '';

            return `
            <div class="crt-item">
                <div class="crt-item-title">${H.esc(title)}${linksHtml}</div>
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
            <div class="crt-skill-row">
                <span class="crt-skill-label">${H.esc(cat.label)}</span>
                <div class="crt-chips">
                    ${cat.items.map(i => `<span class="crt-chip">${H.esc(i)}</span>`).join('')}
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
            <div class="crt-item crt-item--compact">
                <div class="crt-item-title">
                    ${url ? `<a class="crt-link crt-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                </div>
                ${meta ? `<div class="crt-item-meta">${H.esc(meta)}</div>` : ''}
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ── Languages ────────────────────────────────────────────────────── */
    function renderLanguages(data) {
        const list = H.buildLanguageList(data);
        if (!list.length) return '';

        const inner = `<div class="crt-languages">${list.map(lang => `
            <div class="crt-lang-item">
                <span class="crt-lang-name">${H.esc(lang.language)}</span>
                ${H.v(lang.proficiency) ? `<span class="crt-lang-prof">${H.esc(lang.proficiency)}</span>` : ''}
            </div>`
        ).join('')}</div>`;

        return section('Languages', inner);
    }

    /* ── Main render ──────────────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null;

        return `
        <div class="resume-paper tpl-creative">
            ${renderHeader(data)}
            ${renderSummary(data)}
            ${renderExperience(data)}
            ${renderEducation(data)}
            ${renderProjects(data)}
            ${renderSkills(data)}
            ${renderCertifications(data)}
            ${renderLanguages(data)}
        </div>`;
    }

    return { render };

})();

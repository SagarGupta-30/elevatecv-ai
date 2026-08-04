/**
 * ElevateCV AI — ATS Professional Template (Sprint 3)
 *
 * Design:   Classic single-column, zero color, maximum ATS parseability.
 *           Header centred with thick bottom rule.
 *           Section headings: ALL-CAPS + underline, no background.
 *           No icons, no gradients, no chip backgrounds.
 *
 * Backend slug map: 'ats-professional' → persisted as 'default'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateProfessional = (() => {

    const H = TemplateHelpers;

    /* ── Contact row ──────────────────────────────────────────────────── */
    function renderHeader(data) {
        const pi = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi).map(p => p.html);
        const sep   = `<span class="ats-sep" aria-hidden="true"></span>`;
        const contactHtml = parts.length
            ? `<div class="ats-contact">${parts.join(sep)}</div>`
            : '';

        return `
        <header class="ats-header">
            <h1 class="ats-name">${H.esc(name)}</h1>
            ${contactHtml}
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="ats-section">
            <h2 class="ats-section-title">${H.esc(title)}</h2>
            <div class="ats-section-body">${body}</div>
        </section>`;
    }

    /* ── Professional Summary ─────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('Professional Summary',
            `<p class="ats-summary">${H.esc(text)}</p>`);
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
            const meta     = [company, location].filter(Boolean).join(', ');
            const desc     = H.bullets(exp.description, 'ats-bullets');

            return `
            <div class="ats-item">
                <div class="ats-item-row">
                    <div class="ats-item-left">
                        ${role ? `<div class="ats-item-title">${H.esc(role)}</div>` : ''}
                        ${meta ? `<div class="ats-item-sub">${H.esc(meta)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="ats-item-date">${H.esc(dates)}</div>` : ''}
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
            <div class="ats-item">
                <div class="ats-item-row">
                    <div class="ats-item-left">
                        ${college    ? `<div class="ats-item-title">${H.esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="ats-item-sub">${H.esc(degreeLine)}</div>` : ''}
                        ${metaParts.length ? `<div class="ats-item-meta">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
                    </div>
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
            const stack    = H.chips(proj.techStack, 'ats-chips', 'ats-chip');
            const desc     = H.bullets(proj.description, 'ats-bullets');

            const links = [];
            if (github)   links.push(`<a class="ats-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="ats-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.length ? `<span class="ats-proj-links">${links.join('<span class="ats-link-sep">·</span>')}</span>` : '';

            return `
            <div class="ats-item">
                <div class="ats-item-title">${H.esc(title)}${linksHtml}</div>
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
            <div class="ats-skill-row">
                <span class="ats-skill-label">${H.esc(cat.label)}</span>
                <span class="ats-skill-items">${cat.items.map(H.esc).join(', ')}</span>
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
            <div class="ats-item ats-item--compact">
                <div class="ats-item-title">
                    ${url ? `<a class="ats-link ats-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                </div>
                ${meta ? `<div class="ats-item-meta">${H.esc(meta)}</div>` : ''}
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ── Languages ────────────────────────────────────────────────────── */
    function renderLanguages(data) {
        const list = H.buildLanguageList(data);
        if (!list.length) return '';

        const inner = `<div class="ats-languages">${list.map(lang => `
            <div class="ats-lang-item">
                <span class="ats-lang-name">${H.esc(lang.language)}</span>
                ${H.v(lang.proficiency) ? `<span class="ats-lang-prof">${H.esc(lang.proficiency)}</span>` : ''}
            </div>`
        ).join('')}</div>`;

        return section('Languages', inner);
    }

    /* ── Main render function ─────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null; // registry handles empty state

        return `
        <div class="resume-paper tpl-ats">
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

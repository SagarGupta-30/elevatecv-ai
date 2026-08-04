/**
 * ElevateCV AI — Executive Template (Sprint 3)
 *
 * Design:   Two-column header (name left, contact right).
 *           Section titles in slate pill background.
 *           Conservative, authoritative, business-grade.
 *           Roboto font.
 *
 * Backend slug map: 'executive' → persisted as 'executive'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateExecutive = (() => {

    const H = TemplateHelpers;

    /* ── Header — two-column layout ───────────────────────────────────── */
    function renderHeader(data) {
        const pi   = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi);
        const contactHtml = parts.length
            ? `<div class="exc-contact">${parts.map(p => `<div class="exc-contact-item">${p.html}</div>`).join('')}</div>`
            : '';

        return `
        <header class="exc-header">
            <div class="exc-header-left">
                <h1 class="exc-name">${H.esc(name)}</h1>
                <div class="exc-header-rule"></div>
            </div>
            ${contactHtml}
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="exc-section">
            <h2 class="exc-section-title">${H.esc(title)}</h2>
            <div class="exc-section-body">${body}</div>
        </section>`;
    }

    /* ── Summary ──────────────────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('Executive Summary',
            `<p class="exc-summary">${H.esc(text)}</p>`);
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
            const desc    = H.bullets(exp.description, 'exc-bullets');

            return `
            <div class="exc-item">
                <div class="exc-item-row">
                    <div class="exc-item-left">
                        ${role ? `<div class="exc-item-title">${H.esc(role)}</div>` : ''}
                        ${meta ? `<div class="exc-item-sub">${H.esc(meta)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="exc-item-date">${H.esc(dates)}</div>` : ''}
                </div>
                ${desc}
            </div>`;
        }).join('');

        return section('Professional Experience', inner);
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
            if (cgpa)  metaParts.push(`GPA: ${cgpa}`);
            if (dates) metaParts.push(dates);

            return `
            <div class="exc-item">
                <div class="exc-item-row">
                    <div class="exc-item-left">
                        ${college    ? `<div class="exc-item-title">${H.esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="exc-item-sub">${H.esc(degreeLine)}</div>` : ''}
                    </div>
                    ${metaParts.length ? `<div class="exc-item-date">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
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
            const stack    = H.chips(proj.techStack, 'exc-chips', 'exc-chip');
            const desc     = H.bullets(proj.description, 'exc-bullets');

            const links = [];
            if (github)   links.push(`<a class="exc-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="exc-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.length ? `<span class="exc-proj-links">${links.join(' · ')}</span>` : '';

            return `
            <div class="exc-item">
                <div class="exc-item-title">${H.esc(title)}${linksHtml}</div>
                ${stack}
                ${desc}
            </div>`;
        }).join('');

        return section('Key Projects', inner);
    }

    /* ── Skills ───────────────────────────────────────────────────────── */
    function renderSkills(data) {
        const cats = H.buildSkillCategories(data);
        if (!cats.length) return '';

        const rows = cats.map(cat => `
            <div class="exc-skill-row">
                <span class="exc-skill-label">${H.esc(cat.label)}</span>
                <div class="exc-chips">
                    ${cat.items.map(i => `<span class="exc-chip">${H.esc(i)}</span>`).join('')}
                </div>
            </div>`
        ).join('');

        return section('Core Competencies', rows);
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
            <div class="exc-item exc-item--compact">
                <div class="exc-item-title">
                    ${url ? `<a class="exc-link exc-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                </div>
                ${meta ? `<div class="exc-item-meta">${H.esc(meta)}</div>` : ''}
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ── Languages ────────────────────────────────────────────────────── */
    function renderLanguages(data) {
        const list = H.buildLanguageList(data);
        if (!list.length) return '';

        const inner = `<div class="exc-languages">${list.map(lang => `
            <div class="exc-lang-item">
                <span class="exc-lang-name">${H.esc(lang.language)}</span>
                ${H.v(lang.proficiency) ? `<span class="exc-lang-prof">${H.esc(lang.proficiency)}</span>` : ''}
            </div>`
        ).join('')}</div>`;

        return section('Languages', inner);
    }

    /* ── Main render ──────────────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null;

        return `
        <div class="resume-paper tpl-executive">
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

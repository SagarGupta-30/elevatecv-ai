/**
 * ElevateCV AI — Harvard Template (Sprint 3)
 *
 * Design:   Academic style. Name in small-caps. All-caps section labels.
 *           Thin horizontal rules. Georgia/serif font body.
 *           Left-aligned. Sparse decoration.
 *
 * Backend slug map: 'harvard' → persisted as 'classic'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateHarvard = (() => {

    const H = TemplateHelpers;

    /* ── Header ───────────────────────────────────────────────────────── */
    function renderHeader(data) {
        const pi   = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi).map(p => p.html);
        const sep   = `<span class="hvd-sep" aria-hidden="true">·</span>`;
        const contactHtml = parts.length
            ? `<div class="hvd-contact">${parts.join(sep)}</div>`
            : '';

        return `
        <header class="hvd-header">
            <h1 class="hvd-name">${H.esc(name)}</h1>
            ${contactHtml}
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="hvd-section">
            <h2 class="hvd-section-title">${H.esc(title)}</h2>
            <div class="hvd-section-body">${body}</div>
        </section>`;
    }

    /* ── Summary ──────────────────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('Summary', `<p class="hvd-summary">${H.esc(text)}</p>`);
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
            const desc    = H.bullets(exp.description, 'hvd-bullets');

            return `
            <div class="hvd-item">
                <div class="hvd-item-row">
                    <div class="hvd-item-left">
                        ${role ? `<span class="hvd-item-title">${H.esc(role)}</span>` : ''}
                        ${meta ? `<span class="hvd-item-sub">${H.esc(meta)}</span>` : ''}
                    </div>
                    ${dates ? `<div class="hvd-item-date">${H.esc(dates)}</div>` : ''}
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
            const degreeLine = [degree, branch ? `in ${branch}` : null].filter(Boolean).join(', ');
            const metaParts  = [];
            if (cgpa)  metaParts.push(`GPA: ${cgpa}`);
            if (dates) metaParts.push(dates);

            return `
            <div class="hvd-item">
                <div class="hvd-item-row">
                    <div class="hvd-item-left">
                        ${college    ? `<span class="hvd-item-title">${H.esc(college)}</span>` : ''}
                        ${degreeLine ? `<span class="hvd-item-sub">${H.esc(degreeLine)}</span>` : ''}
                    </div>
                    ${metaParts.length ? `<div class="hvd-item-date">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
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
            // Harvard: minimal chip styling — just bordered text
            const stack    = H.chips(proj.techStack, 'hvd-chips', 'hvd-chip');
            const desc     = H.bullets(proj.description, 'hvd-bullets');

            const links = [];
            if (github)   links.push(`<a class="hvd-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="hvd-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live Demo</a>`);
            const linksHtml = links.length ? `<span class="hvd-proj-links">${links.join(' | ')}</span>` : '';

            return `
            <div class="hvd-item">
                <div class="hvd-item-title">${H.esc(title)}${linksHtml}</div>
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
            <div class="hvd-skill-row">
                <span class="hvd-skill-label">${H.esc(cat.label)}:</span>
                <span class="hvd-skill-items">${cat.items.map(H.esc).join(', ')}</span>
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
            const meta   = [issuer, date].filter(Boolean).join(', ');

            return `
            <div class="hvd-item hvd-item--compact">
                <div class="hvd-item-title">
                    ${url ? `<a class="hvd-link hvd-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                    ${meta ? ` — <span class="hvd-item-meta">${H.esc(meta)}</span>` : ''}
                </div>
            </div>`;
        }).join('');

        return section('Certifications', inner);
    }

    /* ── Languages ────────────────────────────────────────────────────── */
    function renderLanguages(data) {
        const list = H.buildLanguageList(data);
        if (!list.length) return '';

        const text = list.map(l => {
            const lang = H.esc(l.language);
            const prof = H.v(l.proficiency) ? ` (${H.esc(l.proficiency)})` : '';
            return `${lang}${prof}`;
        }).join(', ');

        return section('Languages', `<p class="hvd-summary">${text}</p>`);
    }

    /* ── Main render ──────────────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null;

        return `
        <div class="resume-paper tpl-harvard">
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

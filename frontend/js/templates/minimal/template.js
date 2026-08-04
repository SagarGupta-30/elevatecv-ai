/**
 * ElevateCV AI — Minimal Template (Sprint 3)
 *
 * Design:   Maximum whitespace, lowercase name, thin hairline dividers.
 *           Monochrome — zero color — no chip backgrounds.
 *           Skills render as comma-separated plain text.
 *
 * Backend slug map: 'minimal' → persisted as 'minimal'
 *
 * Depends on: TemplateHelpers (window.TemplateHelpers)
 */

const TemplateMinimal = (() => {

    const H = TemplateHelpers;

    /* ── Header ───────────────────────────────────────────────────────── */
    function renderHeader(data) {
        const pi   = data.personalInformation || {};
        const name = H.v(pi.fullName);
        if (!name) return '';

        const parts = H.buildContactParts(pi).map(p => p.html);
        const sep   = `<span class="min-sep" aria-hidden="true">/</span>`;
        const contactHtml = parts.length
            ? `<div class="min-contact">${parts.join(sep)}</div>`
            : '';

        return `
        <header class="min-header">
            <h1 class="min-name">${H.esc(name)}</h1>
            ${contactHtml}
        </header>`;
    }

    /* ── Section wrapper ──────────────────────────────────────────────── */
    function section(title, body) {
        if (!body || !body.trim()) return '';
        return `
        <section class="min-section">
            <h2 class="min-section-title">${H.esc(title)}</h2>
            <div class="min-section-body">${body}</div>
        </section>`;
    }

    /* ── Summary ──────────────────────────────────────────────────────── */
    function renderSummary(data) {
        const text = H.v(data.professionalSummary);
        if (!text) return '';
        return section('About', `<p class="min-summary">${H.esc(text)}</p>`);
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
            const desc    = H.bullets(exp.description, 'min-bullets');

            return `
            <div class="min-item">
                <div class="min-item-row">
                    <div class="min-item-left">
                        ${role ? `<div class="min-item-title">${H.esc(role)}</div>` : ''}
                        ${meta ? `<div class="min-item-sub">${H.esc(meta)}</div>` : ''}
                    </div>
                    ${dates ? `<div class="min-item-date">${H.esc(dates)}</div>` : ''}
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
            <div class="min-item">
                <div class="min-item-row">
                    <div class="min-item-left">
                        ${college    ? `<div class="min-item-title">${H.esc(college)}</div>` : ''}
                        ${degreeLine ? `<div class="min-item-sub">${H.esc(degreeLine)}</div>` : ''}
                    </div>
                    ${metaParts.length ? `<div class="min-item-date">${H.esc(metaParts.join('  ·  '))}</div>` : ''}
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
            // Minimal: render stack as plain text, no chip backgrounds
            const stackItems = Array.isArray(proj.techStack) ? proj.techStack.filter(Boolean) : [];
            const stackHtml  = stackItems.length
                ? `<div class="min-stack">${stackItems.map(H.esc).join(' · ')}</div>`
                : '';
            const desc = H.bullets(proj.description, 'min-bullets');

            const links = [];
            if (github)   links.push(`<a class="min-link" href="${H.esc(github)}" target="_blank" rel="noopener">GitHub</a>`);
            if (liveDemo) links.push(`<a class="min-link" href="${H.esc(liveDemo)}" target="_blank" rel="noopener">Live</a>`);
            const linksHtml = links.length ? `<span class="min-proj-links">${links.join(' · ')}</span>` : '';

            return `
            <div class="min-item">
                <div class="min-item-title">${H.esc(title)}${linksHtml}</div>
                ${stackHtml}
                ${desc}
            </div>`;
        }).join('');

        return section('Projects', inner);
    }

    /* ── Skills — plain comma-separated ──────────────────────────────── */
    function renderSkills(data) {
        const cats = H.buildSkillCategories(data);
        if (!cats.length) return '';

        const rows = cats.map(cat => `
            <div class="min-skill-row">
                <span class="min-skill-label">${H.esc(cat.label)}</span>
                <span class="min-skill-items">${cat.items.map(H.esc).join(', ')}</span>
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
            <div class="min-item min-item--compact">
                <div class="min-item-title">
                    ${url ? `<a class="min-link min-link--inherit" href="${H.esc(url)}" target="_blank" rel="noopener">${H.esc(name)}</a>` : H.esc(name)}
                </div>
                ${meta ? `<div class="min-item-meta">${H.esc(meta)}</div>` : ''}
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
        }).join('  ·  ');

        return section('Languages', `<p class="min-summary">${text}</p>`);
    }

    /* ── Main render ──────────────────────────────────────────────────── */
    function render(data) {
        if (H.isEmpty(data)) return null;

        return `
        <div class="resume-paper tpl-minimal">
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

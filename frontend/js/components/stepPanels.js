/**
 * ElevateCV AI — Step Panel Renderers
 * One module per wizard step.
 *
 * Responsibilities:
 *   1. Renders HTML into panel elements with clean SVG iconography (no unicode emojis).
 *   2. Provides dynamic repeatable section cards (Education, Experience, Projects, Certifications, Languages)
 *      with Add, Remove (animated exit), Edit, Collapsible bodies, and live header summary updates.
 *   3. Instant BuilderState synchronization on input/change.
 *   4. Validation engine for required fields with visual highlighting (.is-invalid).
 */

/* ── SVG Icon Definitions (Clean & Modern) ────────────────────────────── */
const PANEL_ICONS = {
    personal: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    summary:  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    education:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    experience:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    projects: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/></svg>`,
    skills:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    certs:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
    languages:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    review:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    chevron:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
    trash:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
    plus:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`
};

/* ── Shared Helpers ─────────────────────────────────────────────────────── */

let _uid = 0;
function uid() { return ++_uid; }

function wrapCard(iconSvg, title, subtitle, bodyHtml) {
    return `
        <div class="wiz-card">
            <div class="wiz-card__head">
                <div class="wiz-card__icon">${iconSvg}</div>
                <div>
                    <div class="wiz-card__title">${title}</div>
                    <div class="wiz-card__subtitle">${subtitle}</div>
                </div>
            </div>
            <div class="wiz-card__body">${bodyHtml}</div>
        </div>
    `;
}

function esc(str) {
    return (str || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* ─────────────────────────────────────────────────────────────────────────
   STEP 1 — Personal Information
───────────────────────────────────────────────────────────────────────── */

const StepPersonal = (() => {

    function render(panelEl) {
        const data = BuilderState.get().personalInformation;

        panelEl.innerHTML = wrapCard(PANEL_ICONS.personal, 'Personal Information', 'Your contact details and professional links', `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label" for="pi-fullName">Full Name <span class="required">*</span></label>
                    <input id="pi-fullName" type="text" class="form-input" placeholder="Sagar Gupta" value="${esc(data.fullName)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="pi-email">Email <span class="required">*</span></label>
                    <input id="pi-email" type="email" class="form-input" placeholder="sagar@example.com" value="${esc(data.email)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="pi-phone">Phone</label>
                    <input id="pi-phone" type="tel" class="form-input" placeholder="+91 98765 43210" value="${esc(data.phone)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="pi-address">Address / Location</label>
                    <input id="pi-address" type="text" class="form-input" placeholder="Bengaluru, Karnataka" value="${esc(data.address)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="pi-linkedin">LinkedIn</label>
                    <input id="pi-linkedin" type="url" class="form-input" placeholder="linkedin.com/in/sagargupta" value="${esc(data.linkedin)}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="pi-github">GitHub</label>
                    <input id="pi-github" type="url" class="form-input" placeholder="github.com/sagargupta" value="${esc(data.github)}">
                </div>
                <div class="form-group form-group--full">
                    <label class="form-label" for="pi-portfolio">Portfolio Website</label>
                    <input id="pi-portfolio" type="url" class="form-input" placeholder="sagargupta.dev" value="${esc(data.portfolio)}">
                </div>
            </div>
            <div style="margin-top:var(--space-6);">
                ${wrapCard(PANEL_ICONS.summary, 'Professional Summary', 'A brief overview about yourself', `
                    <div class="form-group">
                        <textarea id="pi-summary" class="form-textarea" rows="5"
                            placeholder="Passionate software engineer with experience building scalable web applications…"
                        >${esc(BuilderState.get().professionalSummary)}</textarea>
                        <span class="form-hint">Tip: Keep it to 3–5 sentences focused on your key strengths and experience.</span>
                    </div>
                `)}
            </div>
        `);

        // Real-time synchronization listeners
        const inputs = panelEl.querySelectorAll('input, textarea');
        inputs.forEach(inp => {
            inp.addEventListener('input', () => {
                flush();
                // Clear validation highlight on typing
                if (inp.classList.contains('is-invalid')) {
                    inp.classList.remove('is-invalid');
                    const errHint = inp.parentNode.querySelector('.form-error-text');
                    if (errHint) errHint.remove();
                }
            });
        });
    }

    function flush() {
        BuilderState.set('personalInformation.fullName',  document.getElementById('pi-fullName')?.value.trim()  || '');
        BuilderState.set('personalInformation.email',     document.getElementById('pi-email')?.value.trim()     || '');
        BuilderState.set('personalInformation.phone',     document.getElementById('pi-phone')?.value.trim()     || '');
        BuilderState.set('personalInformation.address',   document.getElementById('pi-address')?.value.trim()   || '');
        BuilderState.set('personalInformation.linkedin',  document.getElementById('pi-linkedin')?.value.trim()  || '');
        BuilderState.set('personalInformation.github',    document.getElementById('pi-github')?.value.trim()    || '');
        BuilderState.set('personalInformation.portfolio', document.getElementById('pi-portfolio')?.value.trim() || '');
        BuilderState.set('professionalSummary',           document.getElementById('pi-summary')?.value.trim()   || '');
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 2 — Education (Dynamic Repeatable)
───────────────────────────────────────────────────────────────────────── */

const StepEducation = (() => {
    const LIST_ID = 'edu-entry-list';

    function createEntryHTML(edu = {}, idx = 0, isCollapsed = false) {
        const id = uid();
        return `
            <div class="entry-card ${isCollapsed ? 'is-collapsed' : ''}" data-entry="edu" data-uid="${id}">
                <div class="entry-card__header" role="button" tabindex="0">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label edu-label-title">${esc(edu.college) || 'New Education Entry'}</div>
                            <div class="entry-card__label-sub edu-label-sub">${esc(edu.degree) || 'Degree / Qualification'}</div>
                        </div>
                    </div>
                    <div class="entry-card__header-right">
                        <button type="button" class="btn-entry-toggle" aria-label="Toggle section">
                            ${PANEL_ICONS.chevron}
                        </button>
                        <button type="button" class="btn-entry-remove" aria-label="Remove education entry">
                            ${PANEL_ICONS.trash}
                        </button>
                    </div>
                </div>
                <div class="entry-card__body">
                    <div class="form-grid">
                        <div class="form-group form-group--full">
                            <label class="form-label">College / University</label>
                            <input type="text" class="form-input edu-college" placeholder="Indian Institute of Technology" value="${esc(edu.college)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Degree</label>
                            <input type="text" class="form-input edu-degree" placeholder="B.Tech / Bachelor of Science" value="${esc(edu.degree)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Branch / Field of Study</label>
                            <input type="text" class="form-input edu-branch" placeholder="Computer Science & Engineering" value="${esc(edu.branch)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Start Date</label>
                            <input type="text" class="form-input edu-startDate" placeholder="Aug 2020" value="${esc(edu.startDate)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">End Date</label>
                            <input type="text" class="form-input edu-endDate" placeholder="May 2024 / Present" value="${esc(edu.endDate)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">CGPA / Percentage</label>
                            <input type="text" class="form-input edu-cgpa" placeholder="9.1 / 10" value="${esc(edu.cgpa)}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function bindEntryEvents(entryEl) {
        const header = entryEl.querySelector('.entry-card__header');
        const toggleBtn = entryEl.querySelector('.btn-entry-toggle');
        const removeBtn = entryEl.querySelector('.btn-entry-remove');
        const collegeInp = entryEl.querySelector('.edu-college');
        const degreeInp  = entryEl.querySelector('.edu-degree');
        const labelTitle = entryEl.querySelector('.edu-label-title');
        const labelSub   = entryEl.querySelector('.edu-label-sub');

        // Collapse / Expand toggle
        const toggleCollapse = (e) => {
            if (e.target.closest('.btn-entry-remove')) return;
            entryEl.classList.toggle('is-collapsed');
        };

        header.addEventListener('click', toggleCollapse);
        header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(e); } });

        // Remove entry with exit animation
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            entryEl.classList.add('entry-card--anim-out');
            setTimeout(() => {
                entryEl.remove();
                renumberEntries();
                flush();
            }, 230);
        });

        // Real-time live header updates and instant BuilderState sync
        const onInput = () => {
            labelTitle.textContent = collegeInp.value.trim() || 'New Education Entry';
            labelSub.textContent   = degreeInp.value.trim()  || 'Degree / Qualification';
            flush();
        };

        entryEl.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onInput));
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const educationList = BuilderState.get().education || [];

        panelEl.innerHTML = wrapCard(PANEL_ICONS.education, 'Education', 'Academic background and qualifications', `
            <div class="entry-list" id="${LIST_ID}">
                ${educationList.length > 0
                    ? educationList.map((e, i) => createEntryHTML(e, i, i > 0)).join('')
                    : createEntryHTML({}, 0, false)}
            </div>
            <button type="button" class="btn-add-entry" id="edu-add-btn">
                ${PANEL_ICONS.plus}
                Add Education Entry
            </button>
        `);

        panelEl.querySelectorAll('[data-entry="edu"]').forEach(bindEntryEvents);

        panelEl.querySelector('#edu-add-btn').addEventListener('click', () => {
            const list = document.getElementById(LIST_ID);
            const count = list.querySelectorAll('[data-entry="edu"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count, false);
            const entryEl = tmp.firstElementChild;
            bindEntryEvents(entryEl);
            list.appendChild(entryEl);
            entryEl.querySelector('input')?.focus();
            flush();
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LIST_ID} [data-entry="edu"]`).forEach(el => {
            entries.push({
                college:   el.querySelector('.edu-college')?.value.trim()   || '',
                degree:    el.querySelector('.edu-degree')?.value.trim()    || '',
                branch:    el.querySelector('.edu-branch')?.value.trim()    || '',
                startDate: el.querySelector('.edu-startDate')?.value.trim() || '',
                endDate:   el.querySelector('.edu-endDate')?.value.trim()   || '',
                cgpa:      el.querySelector('.edu-cgpa')?.value.trim()      || ''
            });
        });
        BuilderState.set('education', entries);
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 3 — Experience (Dynamic Repeatable + Bullet Editor)
───────────────────────────────────────────────────────────────────────── */

const StepExperience = (() => {
    const LIST_ID = 'exp-entry-list';
    const bulletInstances = {};

    function createEntryEl(exp = {}, idx = 0, isCollapsed = false) {
        const id = uid();
        const wrapper = document.createElement('div');
        wrapper.className = `entry-card ${isCollapsed ? 'is-collapsed' : ''}`;
        wrapper.dataset.entry = 'exp';
        wrapper.dataset.uid = id;

        wrapper.innerHTML = `
            <div class="entry-card__header" role="button" tabindex="0">
                <div class="entry-card__header-left">
                    <div class="entry-card__num">${idx + 1}</div>
                    <div>
                        <div class="entry-card__label exp-label-title">${esc(exp.role) || 'New Experience Entry'}</div>
                        <div class="entry-card__label-sub exp-label-sub">${esc(exp.company) || 'Company'}</div>
                    </div>
                </div>
                <div class="entry-card__header-right">
                    <button type="button" class="btn-entry-toggle" aria-label="Toggle section">
                        ${PANEL_ICONS.chevron}
                    </button>
                    <button type="button" class="btn-entry-remove" aria-label="Remove experience">
                        ${PANEL_ICONS.trash}
                    </button>
                </div>
            </div>
            <div class="entry-card__body">
                <div class="form-grid" style="margin-bottom:var(--space-5);">
                    <div class="form-group">
                        <label class="form-label">Company</label>
                        <input type="text" class="form-input exp-company" placeholder="Google / Microsoft" value="${esc(exp.company)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role / Title</label>
                        <input type="text" class="form-input exp-role" placeholder="Software Engineer Intern" value="${esc(exp.role)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <input type="text" class="form-input exp-location" placeholder="Bengaluru / Remote" value="${esc(exp.location)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="text" class="form-input exp-startDate" placeholder="Jan 2023" value="${esc(exp.startDate)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="text" class="form-input exp-endDate" placeholder="Jun 2023 / Present" value="${esc(exp.endDate)}" ${exp.isCurrent ? 'disabled' : ''}>
                    </div>
                    <div class="form-group" style="justify-content:flex-end;padding-bottom:2px;">
                        <label class="form-check" style="margin-top:auto;">
                            <input type="checkbox" class="form-check__input exp-isCurrent" ${exp.isCurrent ? 'checked' : ''}>
                            <span class="form-check__label">Current Job</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Key Responsibilities & Achievements</label>
                    <div class="exp-bullets"></div>
                </div>
            </div>
        `;

        const header = wrapper.querySelector('.entry-card__header');
        const removeBtn = wrapper.querySelector('.btn-entry-remove');
        const roleInp = wrapper.querySelector('.exp-role');
        const companyInp = wrapper.querySelector('.exp-company');
        const labelTitle = wrapper.querySelector('.exp-label-title');
        const labelSub = wrapper.querySelector('.exp-label-sub');
        const cbCurrent = wrapper.querySelector('.exp-isCurrent');
        const endDateInp = wrapper.querySelector('.exp-endDate');

        // Toggle collapse
        const toggleCollapse = (e) => {
            if (e.target.closest('.btn-entry-remove')) return;
            wrapper.classList.toggle('is-collapsed');
        };
        header.addEventListener('click', toggleCollapse);

        // Current job checkbox
        cbCurrent.addEventListener('change', () => {
            endDateInp.disabled = cbCurrent.checked;
            if (cbCurrent.checked) endDateInp.value = '';
            flush();
        });

        // Remove button
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            delete bulletInstances[id];
            wrapper.classList.add('entry-card--anim-out');
            setTimeout(() => {
                wrapper.remove();
                renumberEntries();
                flush();
            }, 230);
        });

        // Live header text & sync
        const onInput = () => {
            labelTitle.textContent = roleInp.value.trim() || 'New Experience Entry';
            labelSub.textContent   = companyInp.value.trim() || 'Company';
            flush();
        };
        wrapper.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onInput));

        // Bullet editor initialization
        const bulletContainer = wrapper.querySelector('.exp-bullets');
        const be = BulletEditor.create(bulletContainer, {
            placeholder: 'Designed REST APIs that reduced latency by 40%…',
            onChange: () => flush()
        });
        be.setBullets(exp.description || []);
        bulletInstances[id] = be;

        return wrapper;
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        Object.keys(bulletInstances).forEach(k => delete bulletInstances[k]);

        const list = document.createElement('div');
        list.className = 'entry-list';
        list.id = LIST_ID;

        const expList = BuilderState.get().experience || [];
        (expList.length > 0 ? expList : [{}]).forEach((exp, i) => {
            list.appendChild(createEntryEl(exp, i, i > 0));
        });

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add-entry';
        addBtn.id = 'exp-add-btn';
        addBtn.innerHTML = `${PANEL_ICONS.plus} Add Work Experience`;
        addBtn.addEventListener('click', () => {
            const count = list.querySelectorAll('[data-entry="exp"]').length;
            const newEl = createEntryEl({}, count, false);
            list.appendChild(newEl);
            newEl.querySelector('input')?.focus();
            flush();
        });

        panelEl.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'wiz-card';
        card.innerHTML = `
            <div class="wiz-card__head">
                <div class="wiz-card__icon">${PANEL_ICONS.experience}</div>
                <div>
                    <div class="wiz-card__title">Work Experience</div>
                    <div class="wiz-card__subtitle">Internships, jobs, and freelance work</div>
                </div>
            </div>
        `;
        const body = document.createElement('div');
        body.className = 'wiz-card__body';
        body.appendChild(list);
        body.appendChild(addBtn);
        card.appendChild(body);
        panelEl.appendChild(card);
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LIST_ID} [data-entry="exp"]`).forEach(el => {
            const id = el.dataset.uid;
            const be = bulletInstances[id];
            entries.push({
                company:   el.querySelector('.exp-company')?.value.trim()   || '',
                role:      el.querySelector('.exp-role')?.value.trim()      || '',
                location:  el.querySelector('.exp-location')?.value.trim()  || '',
                startDate: el.querySelector('.exp-startDate')?.value.trim() || '',
                endDate:   el.querySelector('.exp-endDate')?.value.trim()   || '',
                isCurrent: el.querySelector('.exp-isCurrent')?.checked      || false,
                description: be ? be.getBullets() : []
            });
        });
        BuilderState.set('experience', entries);
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 4 — Projects (Dynamic Repeatable + Tech Stack Tags + Bullet Editor)
───────────────────────────────────────────────────────────────────────── */

const StepProjects = (() => {
    const LIST_ID = 'proj-entry-list';
    const bulletInstances = {};
    const tagInstances    = {};

    function createEntryEl(proj = {}, idx = 0, isCollapsed = false) {
        const id = uid();
        const wrapper = document.createElement('div');
        wrapper.className = `entry-card ${isCollapsed ? 'is-collapsed' : ''}`;
        wrapper.dataset.entry = 'proj';
        wrapper.dataset.uid = id;

        wrapper.innerHTML = `
            <div class="entry-card__header" role="button" tabindex="0">
                <div class="entry-card__header-left">
                    <div class="entry-card__num">${idx + 1}</div>
                    <div>
                        <div class="entry-card__label proj-label-title">${esc(proj.title) || 'New Project'}</div>
                        <div class="entry-card__label-sub proj-label-sub">${(proj.techStack || []).slice(0, 3).join(', ') || 'Tech Stack'}</div>
                    </div>
                </div>
                <div class="entry-card__header-right">
                    <button type="button" class="btn-entry-toggle" aria-label="Toggle section">
                        ${PANEL_ICONS.chevron}
                    </button>
                    <button type="button" class="btn-entry-remove" aria-label="Remove project">
                        ${PANEL_ICONS.trash}
                    </button>
                </div>
            </div>
            <div class="entry-card__body">
                <div class="form-grid" style="margin-bottom:var(--space-5);">
                    <div class="form-group form-group--full">
                        <label class="form-label">Project Title</label>
                        <input type="text" class="form-input proj-title" placeholder="ElevateCV AI — AI Resume Builder" value="${esc(proj.title)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">GitHub Repository</label>
                        <input type="url" class="form-input proj-github" placeholder="github.com/user/project" value="${esc(proj.github)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Live Demo URL</label>
                        <input type="url" class="form-input proj-liveDemo" placeholder="project.netlify.app" value="${esc(proj.liveDemo)}">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:var(--space-5);">
                    <label class="form-label">Tech Stack</label>
                    <div class="proj-techstack"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Project Description</label>
                    <div class="proj-bullets"></div>
                </div>
            </div>
        `;

        const header = wrapper.querySelector('.entry-card__header');
        const removeBtn = wrapper.querySelector('.btn-entry-remove');
        const titleInp = wrapper.querySelector('.proj-title');
        const labelTitle = wrapper.querySelector('.proj-label-title');
        const labelSub = wrapper.querySelector('.proj-label-sub');

        // Toggle collapse
        const toggleCollapse = (e) => {
            if (e.target.closest('.btn-entry-remove')) return;
            wrapper.classList.toggle('is-collapsed');
        };
        header.addEventListener('click', toggleCollapse);

        // Remove button
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            delete bulletInstances[id];
            delete tagInstances[id];
            wrapper.classList.add('entry-card--anim-out');
            setTimeout(() => {
                wrapper.remove();
                renumberEntries();
                flush();
            }, 230);
        });

        // Live title header update
        const onInput = () => {
            labelTitle.textContent = titleInp.value.trim() || 'New Project';
            flush();
        };
        wrapper.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onInput));

        // Tech stack tag input
        const techContainer = wrapper.querySelector('.proj-techstack');
        const ti = TagInput.create(techContainer, {
            placeholder: 'e.g. React, Node.js — press Enter',
            onChange: (tags) => {
                labelSub.textContent = tags.slice(0, 3).join(', ') || 'Tech Stack';
                flush();
            }
        });
        ti.setTags(proj.techStack || []);
        tagInstances[id] = ti;

        // Description bullet editor
        const bulletContainer = wrapper.querySelector('.proj-bullets');
        const be = BulletEditor.create(bulletContainer, {
            placeholder: 'Built authentication system using JWT and bcrypt…',
            onChange: () => flush()
        });
        be.setBullets(proj.description || []);
        bulletInstances[id] = be;

        return wrapper;
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        Object.keys(bulletInstances).forEach(k => delete bulletInstances[k]);
        Object.keys(tagInstances).forEach(k => delete tagInstances[k]);

        const list = document.createElement('div');
        list.className = 'entry-list';
        list.id = LIST_ID;

        const projList = BuilderState.get().projects || [];
        (projList.length > 0 ? projList : [{}]).forEach((p, i) => list.appendChild(createEntryEl(p, i, i > 0)));

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add-entry';
        addBtn.innerHTML = `${PANEL_ICONS.plus} Add Project`;
        addBtn.addEventListener('click', () => {
            const count = list.querySelectorAll('[data-entry="proj"]').length;
            const newEl = createEntryEl({}, count, false);
            list.appendChild(newEl);
            newEl.querySelector('input')?.focus();
            flush();
        });

        panelEl.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'wiz-card';
        card.innerHTML = `
            <div class="wiz-card__head">
                <div class="wiz-card__icon">${PANEL_ICONS.projects}</div>
                <div>
                    <div class="wiz-card__title">Projects</div>
                    <div class="wiz-card__subtitle">Personal, academic, and professional projects</div>
                </div>
            </div>
        `;
        const body = document.createElement('div');
        body.className = 'wiz-card__body';
        body.appendChild(list);
        body.appendChild(addBtn);
        card.appendChild(body);
        panelEl.appendChild(card);
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LIST_ID} [data-entry="proj"]`).forEach(el => {
            const id = el.dataset.uid;
            entries.push({
                title:       el.querySelector('.proj-title')?.value.trim()    || '',
                github:      el.querySelector('.proj-github')?.value.trim()   || '',
                liveDemo:    el.querySelector('.proj-liveDemo')?.value.trim() || '',
                techStack:   tagInstances[id]    ? tagInstances[id].getTags()    : [],
                description: bulletInstances[id] ? bulletInstances[id].getBullets() : []
            });
        });
        BuilderState.set('projects', entries);
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 5 — Skills (Modern Tag Inputs across 4 Categories)
───────────────────────────────────────────────────────────────────────── */

const StepSkills = (() => {

    let tiTechnical = null;
    let tiSoft      = null;
    let tiTools     = null;
    let tiLangs     = null;

    const CATEGORIES = [
        { key: 'technical', label: 'Technical Skills', dot: 'dot--technical', placeholder: 'React, Node.js, Express, MongoDB — press Enter' },
        { key: 'soft',      label: 'Soft Skills',      dot: 'dot--soft',      placeholder: 'Leadership, Problem Solving, Teamwork — press Enter' },
        { key: 'tools',     label: 'Tools & Tech',     dot: 'dot--tools',     placeholder: 'Git, Docker, VS Code, Figma, Postman — press Enter' },
        { key: 'languages', label: 'Programming Langs',dot: 'dot--languages', placeholder: 'JavaScript, Python, Java, C++, TypeScript — press Enter' }
    ];

    function render(panelEl) {
        const skills = BuilderState.get().skills || {};

        panelEl.innerHTML = wrapCard(PANEL_ICONS.skills, 'Skills', 'Technical skills, tools, and soft skills', `
            <div class="skills-categories">
                ${CATEGORIES.map(cat => `
                    <div class="skills-category">
                        <div class="skills-category__label">
                            <span class="skills-category__dot ${cat.dot}"></span>
                            ${cat.label}
                        </div>
                        <div id="skill-cat-${cat.key}"></div>
                    </div>
                `).join('')}
            </div>
        `);

        // Real-time state sync on tag change
        const onChange = () => flush();

        tiTechnical = TagInput.create(document.getElementById('skill-cat-technical'), { placeholder: CATEGORIES[0].placeholder, onChange });
        tiSoft      = TagInput.create(document.getElementById('skill-cat-soft'),      { placeholder: CATEGORIES[1].placeholder, onChange });
        tiTools     = TagInput.create(document.getElementById('skill-cat-tools'),     { placeholder: CATEGORIES[2].placeholder, onChange });
        tiLangs     = TagInput.create(document.getElementById('skill-cat-languages'), { placeholder: CATEGORIES[3].placeholder, onChange });

        tiTechnical.setTags(skills.technical || []);
        tiSoft.setTags(skills.soft      || []);
        tiTools.setTags(skills.tools    || []);
        tiLangs.setTags(skills.languages || []);
    }

    function flush() {
        BuilderState.set('skills', {
            technical: tiTechnical ? tiTechnical.getTags() : [],
            soft:      tiSoft      ? tiSoft.getTags()      : [],
            tools:     tiTools     ? tiTools.getTags()     : [],
            languages: tiLangs     ? tiLangs.getTags()     : []
        });
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 6 — Certifications (Dynamic Repeatable)
───────────────────────────────────────────────────────────────────────── */

const StepCertifications = (() => {
    const LIST_ID = 'cert-entry-list';

    function createEntryHTML(cert = {}, idx = 0, isCollapsed = false) {
        const id = uid();
        return `
            <div class="entry-card ${isCollapsed ? 'is-collapsed' : ''}" data-entry="cert" data-uid="${id}">
                <div class="entry-card__header" role="button" tabindex="0">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label cert-label-title">${esc(cert.name) || 'New Certification'}</div>
                            <div class="entry-card__label-sub cert-label-sub">${esc(cert.issuer) || 'Issuing Organization'}</div>
                        </div>
                    </div>
                    <div class="entry-card__header-right">
                        <button type="button" class="btn-entry-toggle" aria-label="Toggle section">
                            ${PANEL_ICONS.chevron}
                        </button>
                        <button type="button" class="btn-entry-remove" aria-label="Remove certification">
                            ${PANEL_ICONS.trash}
                        </button>
                    </div>
                </div>
                <div class="entry-card__body">
                    <div class="form-grid">
                        <div class="form-group form-group--full">
                            <label class="form-label">Certification Name</label>
                            <input type="text" class="form-input cert-name" placeholder="AWS Certified Solutions Architect" value="${esc(cert.name)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Issuing Organization</label>
                            <input type="text" class="form-input cert-issuer" placeholder="Amazon Web Services" value="${esc(cert.issuer)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Date Issued</label>
                            <input type="text" class="form-input cert-date" placeholder="June 2024" value="${esc(cert.date)}">
                        </div>
                        <div class="form-group form-group--full">
                            <label class="form-label">Credential URL</label>
                            <input type="url" class="form-input cert-url" placeholder="https://www.credly.com/badges/..." value="${esc(cert.credentialUrl)}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function bindEntryEvents(entryEl) {
        const header = entryEl.querySelector('.entry-card__header');
        const removeBtn = entryEl.querySelector('.btn-entry-remove');
        const nameInp = entryEl.querySelector('.cert-name');
        const issuerInp = entryEl.querySelector('.cert-issuer');
        const labelTitle = entryEl.querySelector('.cert-label-title');
        const labelSub = entryEl.querySelector('.cert-label-sub');

        // Toggle collapse
        header.addEventListener('click', (e) => {
            if (e.target.closest('.btn-entry-remove')) return;
            entryEl.classList.toggle('is-collapsed');
        });

        // Remove
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            entryEl.classList.add('entry-card--anim-out');
            setTimeout(() => {
                entryEl.remove();
                renumberEntries();
                flush();
            }, 230);
        });

        // Live header text & sync
        const onInput = () => {
            labelTitle.textContent = nameInp.value.trim() || 'New Certification';
            labelSub.textContent   = issuerInp.value.trim() || 'Issuing Organization';
            flush();
        };
        entryEl.querySelectorAll('input').forEach(inp => inp.addEventListener('input', onInput));
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const certs = BuilderState.get().certifications || [];

        panelEl.innerHTML = wrapCard(PANEL_ICONS.certs, 'Certifications', 'Professional certifications and credentials', `
            <div class="entry-list" id="${LIST_ID}">
                ${certs.length > 0
                    ? certs.map((c, i) => createEntryHTML(c, i, i > 0)).join('')
                    : createEntryHTML({}, 0, false)}
            </div>
            <button type="button" class="btn-add-entry" id="cert-add-btn">
                ${PANEL_ICONS.plus} Add Certification
            </button>
        `);

        panelEl.querySelectorAll('[data-entry="cert"]').forEach(bindEntryEvents);

        panelEl.querySelector('#cert-add-btn').addEventListener('click', () => {
            const list = document.getElementById(LIST_ID);
            const count = list.querySelectorAll('[data-entry="cert"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count, false);
            const entryEl = tmp.firstElementChild;
            bindEntryEvents(entryEl);
            list.appendChild(entryEl);
            entryEl.querySelector('input')?.focus();
            flush();
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LIST_ID} [data-entry="cert"]`).forEach(el => {
            entries.push({
                name:          el.querySelector('.cert-name')?.value.trim()   || '',
                issuer:        el.querySelector('.cert-issuer')?.value.trim() || '',
                date:          el.querySelector('.cert-date')?.value.trim()   || '',
                credentialUrl: el.querySelector('.cert-url')?.value.trim()    || ''
            });
        });
        BuilderState.set('certifications', entries);
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 7 — Spoken Languages (Dynamic Repeatable)
───────────────────────────────────────────────────────────────────────── */

const StepLanguages = (() => {
    const LIST_ID = 'lang-entry-list';

    const PROFICIENCY_LEVELS = [
        '', 'Beginner', 'Elementary', 'Intermediate',
        'Upper-Intermediate', 'Advanced', 'Native'
    ];

    function createEntryHTML(lang = {}, idx = 0, isCollapsed = false) {
        const id = uid();
        return `
            <div class="entry-card ${isCollapsed ? 'is-collapsed' : ''}" data-entry="lang" data-uid="${id}">
                <div class="entry-card__header" role="button" tabindex="0">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label lang-label-title">${esc(lang.language) || 'New Language'}</div>
                            <div class="entry-card__label-sub lang-label-sub">${esc(lang.proficiency) || 'Select proficiency'}</div>
                        </div>
                    </div>
                    <div class="entry-card__header-right">
                        <button type="button" class="btn-entry-toggle" aria-label="Toggle section">
                            ${PANEL_ICONS.chevron}
                        </button>
                        <button type="button" class="btn-entry-remove" aria-label="Remove language">
                            ${PANEL_ICONS.trash}
                        </button>
                    </div>
                </div>
                <div class="entry-card__body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Language</label>
                            <input type="text" class="form-input lang-language" placeholder="English / Hindi" value="${esc(lang.language)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Proficiency Level</label>
                            <select class="form-select lang-proficiency">
                                ${PROFICIENCY_LEVELS.map(l =>
                                    `<option value="${l}" ${lang.proficiency === l ? 'selected' : ''}>${l || '-- Select level --'}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function bindEntryEvents(entryEl) {
        const header = entryEl.querySelector('.entry-card__header');
        const removeBtn = entryEl.querySelector('.btn-entry-remove');
        const langInp = entryEl.querySelector('.lang-language');
        const profSel = entryEl.querySelector('.lang-proficiency');
        const labelTitle = entryEl.querySelector('.lang-label-title');
        const labelSub = entryEl.querySelector('.lang-label-sub');

        // Toggle collapse
        header.addEventListener('click', (e) => {
            if (e.target.closest('.btn-entry-remove')) return;
            entryEl.classList.toggle('is-collapsed');
        });

        // Remove
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            entryEl.classList.add('entry-card--anim-out');
            setTimeout(() => {
                entryEl.remove();
                renumberEntries();
                flush();
            }, 230);
        });

        // Live header text & sync
        const onInput = () => {
            labelTitle.textContent = langInp.value.trim() || 'New Language';
            labelSub.textContent   = profSel.value || 'Select proficiency';
            flush();
        };

        langInp.addEventListener('input', onInput);
        profSel.addEventListener('change', onInput);
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const langs = BuilderState.get().languages || [];

        panelEl.innerHTML = wrapCard(PANEL_ICONS.languages, 'Spoken Languages', 'Spoken and written language proficiency', `
            <div class="entry-list" id="${LIST_ID}">
                ${langs.length > 0
                    ? langs.map((l, i) => createEntryHTML(l, i, i > 0)).join('')
                    : createEntryHTML({ language: 'English', proficiency: 'Native' }, 0, false)}
            </div>
            <button type="button" class="btn-add-entry" id="lang-add-btn">
                ${PANEL_ICONS.plus} Add Language
            </button>
        `);

        panelEl.querySelectorAll('[data-entry="lang"]').forEach(bindEntryEvents);

        panelEl.querySelector('#lang-add-btn').addEventListener('click', () => {
            const list = document.getElementById(LIST_ID);
            const count = list.querySelectorAll('[data-entry="lang"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count, false);
            const entryEl = tmp.firstElementChild;
            bindEntryEvents(entryEl);
            list.appendChild(entryEl);
            entryEl.querySelector('input')?.focus();
            flush();
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LIST_ID} [data-entry="lang"]`).forEach(el => {
            entries.push({
                language:    el.querySelector('.lang-language')?.value.trim()    || '',
                proficiency: el.querySelector('.lang-proficiency')?.value        || ''
            });
        });
        BuilderState.set('languages', entries);
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 8 — Review Panel
───────────────────────────────────────────────────────────────────────── */

const StepReview = (() => {

    function val(v, fallback = '—') {
        return v ? `<span class="review-field__val">${esc(String(v))}</span>`
                 : `<span class="review-field__val review-field__val--empty">${fallback}</span>`;
    }

    function pills(arr) {
        if (!arr || arr.length === 0) return '<span class="review-field__val review-field__val--empty">—</span>';
        return `<div class="review-pill-list">${arr.map(t => `<span class="review-pill">${esc(t)}</span>`).join('')}</div>`;
    }

    function field(key, value) {
        return `<div class="review-field"><div class="review-field__key">${key}</div>${val(value)}</div>`;
    }

    function editBtn(step) {
        return `<button type="button" class="btn-review-edit" data-goto="${step}">Edit</button>`;
    }

    function render(panelEl) {
        const d = BuilderState.get();
        const pi = d.personalInformation || {};
        const skills = d.skills || {};

        panelEl.innerHTML = `
            <div class="wiz-card" style="margin-bottom:var(--space-5);">
                <div class="wiz-card__head">
                    <div class="wiz-card__icon">${PANEL_ICONS.review}</div>
                    <div>
                        <div class="wiz-card__title">Review Your Resume</div>
                        <div class="wiz-card__subtitle">Check everything before saving. Click Edit to adjust any section.</div>
                    </div>
                </div>
                <div class="wiz-card__body">
                    <div class="review-grid">

                        <!-- Personal -->
                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.personal} Personal Details</div>
                                ${editBtn(1)}
                            </div>
                            ${field('Full Name', pi.fullName)}
                            ${field('Email', pi.email)}
                            ${field('Phone', pi.phone)}
                            ${field('Address', pi.address)}
                            ${field('LinkedIn', pi.linkedin)}
                            ${field('GitHub', pi.github)}
                        </div>

                        <!-- Summary -->
                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.summary} Summary</div>
                                ${editBtn(1)}
                            </div>
                            ${val(d.professionalSummary)}
                        </div>

                        <!-- Education -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.education} Education (${(d.education || []).length})</div>
                                ${editBtn(2)}
                            </div>
                            ${(!d.education || d.education.length === 0)
                                ? '<span class="review-field__val review-field__val--empty">No entries added</span>'
                                : d.education.map(e => `
                                    <div class="review-field" style="margin-bottom:var(--space-3);padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-lg);">
                                        <div style="font-weight:600;color:var(--text-primary);font-size:var(--font-size-sm);">${esc(e.college) || '—'}</div>
                                        <div style="font-size:12px;color:var(--text-muted);">${esc(e.degree)} ${esc(e.branch) ? '· ' + esc(e.branch) : ''} ${e.cgpa ? '· CGPA: ' + esc(e.cgpa) : ''}</div>
                                        <div style="font-size:12px;color:var(--text-faint);">${esc(e.startDate)} ${e.endDate ? '– ' + esc(e.endDate) : ''}</div>
                                    </div>
                                `).join('')}
                        </div>

                        <!-- Experience -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.experience} Experience (${(d.experience || []).length})</div>
                                ${editBtn(3)}
                            </div>
                            ${(!d.experience || d.experience.length === 0)
                                ? '<span class="review-field__val review-field__val--empty">No entries added</span>'
                                : d.experience.map(e => `
                                    <div class="review-field" style="margin-bottom:var(--space-3);padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-lg);">
                                        <div style="font-weight:600;color:var(--text-primary);font-size:var(--font-size-sm);">${esc(e.role)} ${e.company ? '@ ' + esc(e.company) : ''}</div>
                                        <div style="font-size:12px;color:var(--text-muted);">${esc(e.location)} ${e.startDate ? '· ' + esc(e.startDate) : ''} ${e.endDate ? '– ' + esc(e.endDate) : (e.isCurrent ? '– Present' : '')}</div>
                                    </div>
                                `).join('')}
                        </div>

                        <!-- Projects -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.projects} Projects (${(d.projects || []).length})</div>
                                ${editBtn(4)}
                            </div>
                            ${(!d.projects || d.projects.length === 0)
                                ? '<span class="review-field__val review-field__val--empty">No entries added</span>'
                                : d.projects.map(p => `
                                    <div class="review-field" style="margin-bottom:var(--space-3);padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-lg);">
                                        <div style="font-weight:600;color:var(--text-primary);font-size:var(--font-size-sm);">${esc(p.title) || '—'}</div>
                                        <div style="margin-top:4px;">${pills(p.techStack)}</div>
                                    </div>
                                `).join('')}
                        </div>

                        <!-- Skills -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.skills} Skills</div>
                                ${editBtn(5)}
                            </div>
                            <div class="form-grid">
                                <div>
                                    <div class="review-field__key" style="margin-bottom:6px;">Technical</div>
                                    ${pills(skills.technical)}
                                </div>
                                <div>
                                    <div class="review-field__key" style="margin-bottom:6px;">Soft Skills</div>
                                    ${pills(skills.soft)}
                                </div>
                                <div>
                                    <div class="review-field__key" style="margin-bottom:6px;">Tools</div>
                                    ${pills(skills.tools)}
                                </div>
                                <div>
                                    <div class="review-field__key" style="margin-bottom:6px;">Programming Languages</div>
                                    ${pills(skills.languages)}
                                </div>
                            </div>
                        </div>

                        <!-- Certifications & Languages -->
                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.certs} Certifications (${(d.certifications || []).length})</div>
                                ${editBtn(6)}
                            </div>
                            ${(!d.certifications || d.certifications.length === 0)
                                ? '<span class="review-field__val review-field__val--empty">None added</span>'
                                : d.certifications.map(c => `
                                    <div class="review-field">
                                        <div style="font-size:var(--font-size-sm);color:var(--text-secondary);">${esc(c.name)}</div>
                                        <div style="font-size:12px;color:var(--text-muted);">${esc(c.issuer)} ${c.date ? '· ' + esc(c.date) : ''}</div>
                                    </div>
                                `).join('')}
                        </div>

                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">${PANEL_ICONS.languages} Languages (${(d.languages || []).length})</div>
                                ${editBtn(7)}
                            </div>
                            ${(!d.languages || d.languages.length === 0)
                                ? '<span class="review-field__val review-field__val--empty">None added</span>'
                                : d.languages.map(l => `
                                    <div class="review-field">
                                        <div style="font-size:var(--font-size-sm);color:var(--text-secondary);">${esc(l.language)} <span style="color:var(--text-muted);font-size:12px;">${esc(l.proficiency)}</span></div>
                                    </div>
                                `).join('')}
                        </div>

                    </div>
                </div>
            </div>
        `;

        panelEl.querySelectorAll('.btn-review-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.dataset.goto, 10);
                BuilderState.setStep(step);
            });
        });
    }

    function flush() {}

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   Validation Module
───────────────────────────────────────────────────────────────────────── */

const StepValidation = (() => {

    /**
     * Validate required fields across the resume.
     * Required:
     *   - personalInformation.fullName
     *   - personalInformation.email (valid email format)
     *
     * @returns {{ isValid: boolean, errorMsg: string|null, stepId: number|null, firstInvalidEl: HTMLElement|null }}
     */
    function validate() {
        // Ensure latest form values are flushed into BuilderState
        StepPersonal.flush();
        const data = BuilderState.get().personalInformation || {};

        const nameInp = document.getElementById('pi-fullName');
        const emailInp = document.getElementById('pi-email');

        let isValid = true;
        let errorMsg = null;
        let firstInvalidEl = null;

        // Reset previous validation errors
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.form-error-text').forEach(el => el.remove());

        // Validate Full Name
        if (!data.fullName || data.fullName.trim() === '') {
            isValid = false;
            errorMsg = 'Full Name is required';
            if (nameInp) {
                nameInp.classList.add('is-invalid');
                firstInvalidEl = firstInvalidEl || nameInp;
                showErrorHint(nameInp, 'Full Name is required');
            }
        }

        // Validate Email
        const emailPattern = /^\S+@\S+\.\S+$/;
        if (!data.email || !emailPattern.test(data.email.trim())) {
            isValid = false;
            errorMsg = errorMsg || 'A valid email address is required';
            if (emailInp) {
                emailInp.classList.add('is-invalid');
                firstInvalidEl = firstInvalidEl || emailInp;
                showErrorHint(emailInp, 'Please enter a valid email address');
            }
        }

        return {
            isValid,
            errorMsg: isValid ? null : (errorMsg || 'Please complete all required fields.'),
            stepId: isValid ? null : 1,
            firstInvalidEl
        };
    }

    function showErrorHint(inputEl, msg) {
        if (!inputEl || !inputEl.parentNode) return;
        const hint = document.createElement('span');
        hint.className = 'form-error-text';
        hint.textContent = msg;
        inputEl.parentNode.appendChild(hint);
    }

    return { validate };
})();

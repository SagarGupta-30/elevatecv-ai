/**
 * ElevateCV AI — Step Panel Renderers
 * One function per wizard step. Each function:
 *   1. Renders the HTML into its panel element.
 *   2. Pre-populates fields from BuilderState.
 *   3. Returns a flush() function that reads the DOM back into BuilderState.
 *
 * NO API calls. NO fetch. Pure DOM + state.
 */

/* ─────────────────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────────────────── */

/** Generate a unique ID suffix for elements inside dynamic entries */
let _uid = 0;
function uid() { return ++_uid; }

/** Safely get a value from a nested path in an object */
function deepGet(obj, ...keys) {
    return keys.reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
}

/** Create a section card wrapper */
function wrapCard(icon, title, subtitle, bodyHtml) {
    return `
        <div class="wiz-card">
            <div class="wiz-card__head">
                <div class="wiz-card__icon">${icon}</div>
                <div>
                    <div class="wiz-card__title">${title}</div>
                    <div class="wiz-card__subtitle">${subtitle}</div>
                </div>
            </div>
            <div class="wiz-card__body">${bodyHtml}</div>
        </div>
    `;
}

/** Escape HTML to prevent XSS in dynamic content */
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

        panelEl.innerHTML = wrapCard('👤', 'Personal Information', 'Your contact details and professional links', `
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
                ${wrapCard('📝', 'Professional Summary', 'A brief overview about yourself', `
                    <div class="form-group">
                        <textarea id="pi-summary" class="form-textarea" rows="5"
                            placeholder="Passionate software engineer with 3+ years of experience building scalable web applications…"
                        >${esc(BuilderState.get().professionalSummary)}</textarea>
                        <span class="form-hint">Tip: Keep it to 3–5 sentences focused on your most relevant experience.</span>
                    </div>
                `)}
            </div>
        `);
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
   STEP 2 — Education
───────────────────────────────────────────────────────────────────────── */

const StepEducation = (() => {

    const EDU_LIST_ID = 'edu-entry-list';

    function createEntryHTML(edu = {}, idx = 0) {
        const id = uid();
        return `
            <div class="entry-card" data-entry="edu">
                <div class="entry-card__header">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label">${esc(edu.college) || 'New Education Entry'}</div>
                            <div class="entry-card__label-sub">${esc(edu.degree) || 'Degree / Program'}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-entry-remove" aria-label="Remove education entry">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="entry-card__body">
                    <div class="form-grid">
                        <div class="form-group form-group--full">
                            <label class="form-label">College / University</label>
                            <input type="text" class="form-input edu-college" placeholder="Indian Institute of Technology, Delhi" value="${esc(edu.college)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Degree</label>
                            <input type="text" class="form-input edu-degree" placeholder="B.Tech" value="${esc(edu.degree)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Branch / Field</label>
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

    function bindEntry(entryEl) {
        const removeBtn = entryEl.querySelector('.btn-entry-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                entryEl.style.opacity = '0';
                entryEl.style.transform = 'translateY(-8px)';
                entryEl.style.transition = 'opacity 0.2s, transform 0.2s';
                setTimeout(() => {
                    entryEl.remove();
                    renumberEntries(EDU_LIST_ID);
                }, 200);
            });
        }
    }

    function renumberEntries(listId) {
        document.querySelectorAll(`#${listId} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const educationList = BuilderState.get().education;

        panelEl.innerHTML = wrapCard('🎓', 'Education', 'Academic background and qualifications', `
            <div class="entry-list" id="${EDU_LIST_ID}">
                ${educationList.length > 0
                    ? educationList.map((e, i) => createEntryHTML(e, i)).join('')
                    : createEntryHTML({}, 0)}
            </div>
            <button type="button" class="btn-add-entry" id="edu-add-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Education
            </button>
        `);

        // Bind existing entries
        panelEl.querySelectorAll('[data-entry="edu"]').forEach(bindEntry);

        // Add new entry
        panelEl.querySelector('#edu-add-btn').addEventListener('click', () => {
            const list = document.getElementById(EDU_LIST_ID);
            const count = list.querySelectorAll('[data-entry="edu"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count);
            const entryEl = tmp.firstElementChild;
            bindEntry(entryEl);
            list.appendChild(entryEl);
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${EDU_LIST_ID} [data-entry="edu"]`).forEach(el => {
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
   STEP 3 — Experience
───────────────────────────────────────────────────────────────────────── */

const StepExperience = (() => {

    const EXP_LIST_ID = 'exp-entry-list';
    const bulletEditorInstances = {};

    function createEntryEl(exp = {}, idx = 0) {
        const id = uid();
        const wrapper = document.createElement('div');
        wrapper.className = 'entry-card';
        wrapper.dataset.entry = 'exp';
        wrapper.dataset.uid = id;

        wrapper.innerHTML = `
            <div class="entry-card__header">
                <div class="entry-card__header-left">
                    <div class="entry-card__num">${idx + 1}</div>
                    <div>
                        <div class="entry-card__label">${esc(exp.role) || 'New Experience Entry'}</div>
                        <div class="entry-card__label-sub">${esc(exp.company) || 'Company'}</div>
                    </div>
                </div>
                <button type="button" class="btn-entry-remove" aria-label="Remove experience">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="entry-card__body">
                <div class="form-grid" style="margin-bottom:var(--space-5);">
                    <div class="form-group">
                        <label class="form-label">Company</label>
                        <input type="text" class="form-input exp-company" placeholder="Google" value="${esc(exp.company)}">
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

        // Current job checkbox toggles end date
        const cbCurrent  = wrapper.querySelector('.exp-isCurrent');
        const endDateInp = wrapper.querySelector('.exp-endDate');
        cbCurrent.addEventListener('change', () => {
            endDateInp.disabled = cbCurrent.checked;
            if (cbCurrent.checked) endDateInp.value = '';
        });

        // Remove button
        wrapper.querySelector('.btn-entry-remove').addEventListener('click', () => {
            delete bulletEditorInstances[id];
            wrapper.style.opacity = '0';
            wrapper.style.transform = 'translateY(-8px)';
            wrapper.style.transition = 'opacity 0.2s, transform 0.2s';
            setTimeout(() => {
                wrapper.remove();
                renumberEntries(EXP_LIST_ID);
            }, 200);
        });

        // Bullet editor
        const bulletContainer = wrapper.querySelector('.exp-bullets');
        const be = BulletEditor.create(bulletContainer, {
            placeholder: 'Designed REST APIs that reduced latency by 40%…'
        });
        be.setBullets(exp.description || []);
        bulletEditorInstances[id] = be;

        return wrapper;
    }

    function renumberEntries(listId) {
        document.querySelectorAll(`#${listId} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        // Clear old bullet instances
        Object.keys(bulletEditorInstances).forEach(k => delete bulletEditorInstances[k]);

        const list = document.createElement('div');
        list.className = 'entry-list';
        list.id = EXP_LIST_ID;

        const expList = BuilderState.get().experience;
        (expList.length > 0 ? expList : [{}]).forEach((exp, i) => {
            list.appendChild(createEntryEl(exp, i));
        });

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add-entry';
        addBtn.id = 'exp-add-btn';
        addBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Experience
        `;
        addBtn.addEventListener('click', () => {
            const count = list.querySelectorAll('[data-entry="exp"]').length;
            list.appendChild(createEntryEl({}, count));
        });

        panelEl.innerHTML = '';
        panelEl.appendChild(
            (() => {
                const card = document.createElement('div');
                card.className = 'wiz-card';
                card.innerHTML = `
                    <div class="wiz-card__head">
                        <div class="wiz-card__icon">💼</div>
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
                return card;
            })()
        );
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${EXP_LIST_ID} [data-entry="exp"]`).forEach(el => {
            const id = el.dataset.uid;
            const be = bulletEditorInstances[id];
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
   STEP 4 — Projects
───────────────────────────────────────────────────────────────────────── */

const StepProjects = (() => {

    const PROJ_LIST_ID = 'proj-entry-list';
    const bulletInstances = {};
    const tagInstances    = {};

    function createEntryEl(proj = {}, idx = 0) {
        const id = uid();
        const wrapper = document.createElement('div');
        wrapper.className = 'entry-card';
        wrapper.dataset.entry = 'proj';
        wrapper.dataset.uid = id;

        wrapper.innerHTML = `
            <div class="entry-card__header">
                <div class="entry-card__header-left">
                    <div class="entry-card__num">${idx + 1}</div>
                    <div>
                        <div class="entry-card__label">${esc(proj.title) || 'New Project'}</div>
                        <div class="entry-card__label-sub">${(proj.techStack || []).slice(0, 3).join(', ') || 'Tech Stack'}</div>
                    </div>
                </div>
                <button type="button" class="btn-entry-remove" aria-label="Remove project">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="entry-card__body">
                <div class="form-grid" style="margin-bottom:var(--space-5);">
                    <div class="form-group form-group--full">
                        <label class="form-label">Project Title</label>
                        <input type="text" class="form-input proj-title" placeholder="ElevateCV AI — AI-powered Resume Builder" value="${esc(proj.title)}">
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

        // Remove button
        wrapper.querySelector('.btn-entry-remove').addEventListener('click', () => {
            delete bulletInstances[id];
            delete tagInstances[id];
            wrapper.style.opacity = '0';
            wrapper.style.transform = 'translateY(-8px)';
            wrapper.style.transition = 'opacity 0.2s, transform 0.2s';
            setTimeout(() => {
                wrapper.remove();
                renumberEntries(PROJ_LIST_ID);
            }, 200);
        });

        // Tech stack tag input
        const techContainer = wrapper.querySelector('.proj-techstack');
        const ti = TagInput.create(techContainer, { placeholder: 'e.g. React — press Enter' });
        ti.setTags(proj.techStack || []);
        tagInstances[id] = ti;

        // Description bullet editor
        const bulletContainer = wrapper.querySelector('.proj-bullets');
        const be = BulletEditor.create(bulletContainer, {
            placeholder: 'Built authentication system using JWT and bcrypt…'
        });
        be.setBullets(proj.description || []);
        bulletInstances[id] = be;

        return wrapper;
    }

    function renumberEntries(listId) {
        document.querySelectorAll(`#${listId} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        Object.keys(bulletInstances).forEach(k => delete bulletInstances[k]);
        Object.keys(tagInstances).forEach(k => delete tagInstances[k]);

        const list = document.createElement('div');
        list.className = 'entry-list';
        list.id = PROJ_LIST_ID;

        const projList = BuilderState.get().projects;
        (projList.length > 0 ? projList : [{}]).forEach((p, i) => list.appendChild(createEntryEl(p, i)));

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add-entry';
        addBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Project
        `;
        addBtn.addEventListener('click', () => {
            const count = list.querySelectorAll('[data-entry="proj"]').length;
            list.appendChild(createEntryEl({}, count));
        });

        panelEl.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'wiz-card';
        card.innerHTML = `
            <div class="wiz-card__head">
                <div class="wiz-card__icon">🚀</div>
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
        document.querySelectorAll(`#${PROJ_LIST_ID} [data-entry="proj"]`).forEach(el => {
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
   STEP 5 — Skills
───────────────────────────────────────────────────────────────────────── */

const StepSkills = (() => {

    let tiTechnical = null;
    let tiSoft      = null;
    let tiTools     = null;
    let tiLangs     = null;

    const CATEGORIES = [
        {
            key: 'technical',
            label: 'Technical Skills',
            dot: 'dot--technical',
            placeholder: 'React, Node.js, MongoDB — press Enter',
            example: 'e.g. React, Express, PostgreSQL, Docker'
        },
        {
            key: 'soft',
            label: 'Soft Skills',
            dot: 'dot--soft',
            placeholder: 'Leadership, Communication — press Enter',
            example: 'e.g. Leadership, Problem Solving, Teamwork'
        },
        {
            key: 'tools',
            label: 'Tools & Technologies',
            dot: 'dot--tools',
            placeholder: 'Git, Figma, VS Code — press Enter',
            example: 'e.g. Git, Docker, Jira, Figma, Postman'
        },
        {
            key: 'languages',
            label: 'Programming Languages',
            dot: 'dot--languages',
            placeholder: 'JavaScript, Python, C++ — press Enter',
            example: 'e.g. JavaScript, Python, Java, C++'
        }
    ];

    function render(panelEl) {
        const skills = BuilderState.get().skills;

        panelEl.innerHTML = wrapCard('⚡', 'Skills', 'Technical skills, tools, and soft skills', `
            <div class="skills-categories">
                ${CATEGORIES.map(cat => `
                    <div class="skills-category">
                        <div class="skills-category__label">
                            <span class="skills-category__dot ${cat.dot}"></span>
                            ${cat.label}
                        </div>
                        <div id="skill-cat-${cat.key}"></div>
                        <span class="form-hint">${cat.example}</span>
                    </div>
                `).join('')}
            </div>
        `);

        // Create tag inputs for each category
        const s = skills || {};
        tiTechnical = TagInput.create(document.getElementById('skill-cat-technical'), { placeholder: CATEGORIES[0].placeholder });
        tiSoft      = TagInput.create(document.getElementById('skill-cat-soft'),      { placeholder: CATEGORIES[1].placeholder });
        tiTools     = TagInput.create(document.getElementById('skill-cat-tools'),     { placeholder: CATEGORIES[2].placeholder });
        tiLangs     = TagInput.create(document.getElementById('skill-cat-languages'), { placeholder: CATEGORIES[3].placeholder });

        tiTechnical.setTags(s.technical || []);
        tiSoft.setTags(s.soft      || []);
        tiTools.setTags(s.tools    || []);
        tiLangs.setTags(s.languages || []);
    }

    function flush() {
        BuilderState.set('skills', {
            technical: tiTechnical ? tiTechnical.getTags() : [],
            soft:      tiSoft      ? tiSoft.getTags()      : [],
            tools:     tiTools     ? tiTools.getTags()     : [],
            languages: tiLangs    ? tiLangs.getTags()     : []
        });
    }

    return { render, flush };
})();

/* ─────────────────────────────────────────────────────────────────────────
   STEP 6 — Certifications
───────────────────────────────────────────────────────────────────────── */

const StepCertifications = (() => {

    const CERT_LIST_ID = 'cert-entry-list';

    function createEntryHTML(cert = {}, idx = 0) {
        return `
            <div class="entry-card" data-entry="cert">
                <div class="entry-card__header">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label">${esc(cert.name) || 'New Certification'}</div>
                            <div class="entry-card__label-sub">${esc(cert.issuer) || 'Issuing Organization'}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-entry-remove" aria-label="Remove certification">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
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

    function bindRemoveButtons(panelEl) {
        panelEl.querySelectorAll(`#${CERT_LIST_ID} .btn-entry-remove`).forEach(btn => {
            btn.addEventListener('click', () => {
                const entry = btn.closest('[data-entry="cert"]');
                if (entry) {
                    entry.style.opacity = '0';
                    entry.style.transform = 'translateY(-8px)';
                    entry.style.transition = 'opacity 0.2s, transform 0.2s';
                    setTimeout(() => { entry.remove(); renumberEntries(); }, 200);
                }
            });
        });
    }

    function renumberEntries() {
        document.querySelectorAll(`#${CERT_LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const certs = BuilderState.get().certifications;

        panelEl.innerHTML = wrapCard('🏆', 'Certifications', 'Professional certifications and credentials', `
            <div class="entry-list" id="${CERT_LIST_ID}">
                ${certs.length > 0
                    ? certs.map((c, i) => createEntryHTML(c, i)).join('')
                    : createEntryHTML({}, 0)}
            </div>
            <button type="button" class="btn-add-entry" id="cert-add-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Certification
            </button>
        `);

        bindRemoveButtons(panelEl);

        panelEl.querySelector('#cert-add-btn').addEventListener('click', () => {
            const list = document.getElementById(CERT_LIST_ID);
            const count = list.querySelectorAll('[data-entry="cert"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count);
            const entry = tmp.firstElementChild;
            entry.querySelector('.btn-entry-remove').addEventListener('click', () => {
                entry.style.opacity = '0';
                entry.style.transform = 'translateY(-8px)';
                entry.style.transition = 'opacity 0.2s, transform 0.2s';
                setTimeout(() => { entry.remove(); renumberEntries(); }, 200);
            });
            list.appendChild(entry);
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${CERT_LIST_ID} [data-entry="cert"]`).forEach(el => {
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
   STEP 7 — Languages (Spoken)
───────────────────────────────────────────────────────────────────────── */

const StepLanguages = (() => {

    const LANG_LIST_ID = 'lang-entry-list';

    const PROFICIENCY_LEVELS = [
        '', 'Beginner', 'Elementary', 'Intermediate',
        'Upper-Intermediate', 'Advanced', 'Native'
    ];

    function createEntryHTML(lang = {}, idx = 0) {
        return `
            <div class="entry-card" data-entry="lang">
                <div class="entry-card__header">
                    <div class="entry-card__header-left">
                        <div class="entry-card__num">${idx + 1}</div>
                        <div>
                            <div class="entry-card__label">${esc(lang.language) || 'New Language'}</div>
                            <div class="entry-card__label-sub">${esc(lang.proficiency) || 'Select proficiency'}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-entry-remove" aria-label="Remove language">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="entry-card__body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Language</label>
                            <input type="text" class="form-input lang-language" placeholder="English" value="${esc(lang.language)}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Proficiency</label>
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

    function bindRemoveButtons(panelEl) {
        panelEl.querySelectorAll(`#${LANG_LIST_ID} .btn-entry-remove`).forEach(btn => {
            btn.addEventListener('click', () => {
                const entry = btn.closest('[data-entry="lang"]');
                if (entry) {
                    entry.style.opacity = '0'; entry.style.transform = 'translateY(-8px)';
                    entry.style.transition = 'opacity 0.2s, transform 0.2s';
                    setTimeout(() => { entry.remove(); renumberEntries(); }, 200);
                }
            });
        });
    }

    function renumberEntries() {
        document.querySelectorAll(`#${LANG_LIST_ID} .entry-card`).forEach((el, idx) => {
            const num = el.querySelector('.entry-card__num');
            if (num) num.textContent = idx + 1;
        });
    }

    function render(panelEl) {
        const langs = BuilderState.get().languages;

        panelEl.innerHTML = wrapCard('🌐', 'Languages', 'Spoken and written language proficiency', `
            <div class="entry-list" id="${LANG_LIST_ID}">
                ${langs.length > 0
                    ? langs.map((l, i) => createEntryHTML(l, i)).join('')
                    : createEntryHTML({ language: 'English', proficiency: 'Native' }, 0)}
            </div>
            <button type="button" class="btn-add-entry" id="lang-add-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Language
            </button>
        `);

        bindRemoveButtons(panelEl);

        panelEl.querySelector('#lang-add-btn').addEventListener('click', () => {
            const list = document.getElementById(LANG_LIST_ID);
            const count = list.querySelectorAll('[data-entry="lang"]').length;
            const tmp = document.createElement('div');
            tmp.innerHTML = createEntryHTML({}, count);
            const entry = tmp.firstElementChild;
            entry.querySelector('.btn-entry-remove').addEventListener('click', () => {
                entry.style.opacity = '0'; entry.style.transform = 'translateY(-8px)';
                entry.style.transition = 'opacity 0.2s, transform 0.2s';
                setTimeout(() => { entry.remove(); renumberEntries(); }, 200);
            });
            list.appendChild(entry);
        });
    }

    function flush() {
        const entries = [];
        document.querySelectorAll(`#${LANG_LIST_ID} [data-entry="lang"]`).forEach(el => {
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
   STEP 8 — Review
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
        const pi = d.personalInformation;
        const skills = d.skills || {};

        panelEl.innerHTML = `
            <div class="wiz-card" style="margin-bottom:var(--space-5);">
                <div class="wiz-card__head">
                    <div class="wiz-card__icon">✅</div>
                    <div>
                        <div class="wiz-card__title">Review Your Resume</div>
                        <div class="wiz-card__subtitle">Check everything before saving. Click Edit to go back.</div>
                    </div>
                </div>
                <div class="wiz-card__body">
                    <div class="review-grid">

                        <!-- Personal -->
                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">👤 Personal</div>
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
                                <div class="review-section__title">📝 Summary</div>
                                ${editBtn(1)}
                            </div>
                            ${val(d.professionalSummary)}
                        </div>

                        <!-- Education -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">🎓 Education (${d.education.length})</div>
                                ${editBtn(2)}
                            </div>
                            ${d.education.length === 0
                                ? '<span class="review-field__val review-field__val--empty">No entries added</span>'
                                : d.education.map(e => `
                                    <div class="review-field" style="margin-bottom:var(--space-3);padding:var(--space-3);background:rgba(255,255,255,0.02);border-radius:var(--radius-lg);">
                                        <div style="font-weight:600;color:var(--text-primary);font-size:var(--font-size-sm);">${esc(e.college) || '—'}</div>
                                        <div style="font-size:12px;color:var(--text-muted);">${esc(e.degree)} ${esc(e.branch) ? '· ' + esc(e.branch) : ''} ${e.cgpa ? '· ' + esc(e.cgpa) : ''}</div>
                                        <div style="font-size:12px;color:var(--text-faint);">${esc(e.startDate)} ${e.endDate ? '– ' + esc(e.endDate) : ''}</div>
                                    </div>
                                `).join('')}
                        </div>

                        <!-- Experience -->
                        <div class="review-section review-section--full">
                            <div class="review-section__head">
                                <div class="review-section__title">💼 Experience (${d.experience.length})</div>
                                ${editBtn(3)}
                            </div>
                            ${d.experience.length === 0
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
                                <div class="review-section__title">🚀 Projects (${d.projects.length})</div>
                                ${editBtn(4)}
                            </div>
                            ${d.projects.length === 0
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
                                <div class="review-section__title">⚡ Skills</div>
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

                        <!-- Certifications + Languages -->
                        <div class="review-section">
                            <div class="review-section__head">
                                <div class="review-section__title">🏆 Certifications (${d.certifications.length})</div>
                                ${editBtn(6)}
                            </div>
                            ${d.certifications.length === 0
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
                                <div class="review-section__title">🌐 Languages (${d.languages.length})</div>
                                ${editBtn(7)}
                            </div>
                            ${d.languages.length === 0
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

        // Bind "Edit" buttons — navigate back to the correct step
        panelEl.querySelectorAll('.btn-review-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const step = parseInt(btn.dataset.goto, 10);
                BuilderState.setStep(step);
            });
        });
    }

    function flush() { /* Review step has no form inputs */ }

    return { render, flush };
})();

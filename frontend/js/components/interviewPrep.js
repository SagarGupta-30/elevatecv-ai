/**
 * ElevateCV AI — Interview Preparation Assistant Component (Sprint 3)
 *
 * Standalone modal component for generating, searching, and studying
 * AI-powered technical, HR, and project-specific interview prep Q&A.
 *
 * Does not modify BuilderState.
 * Session Cache: Reuses generated Q&A kits for identical resume + role inputs.
 */

const InterviewPrep = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl    = null;
    let _modalEl      = null;
    let _bodyEl       = null;
    let _lastFocused  = null;
    let _isGenerating = false;

    // Form & Request State
    let _resumeData  = null;
    let _targetRole  = '';
    let _company     = '';
    let _jobDesc     = '';
    let _lastKit     = null;
    let _activeTab   = 'all';
    let _searchQuery = '';

    // Session cache: Map<hash, prepKit>
    const _sessionCache = new Map();

    /* ──────────────────────────────────────────────────────────────────
       Inject Modal DOM into body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('ip-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'ip-modal-overlay';
        overlay.id = 'ip-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'ip-modal';
        modal.id = 'ip-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'AI Interview Preparation Assistant');

        modal.innerHTML = `
            <header class="ip-modal__header">
                <div class="ip-modal__title-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    <div>
                        <h2 class="ip-modal__title">AI Interview Preparation Assistant</h2>
                        <p class="ip-modal__subtitle">Tailored technical, HR & project Q&A based on your resume</p>
                    </div>
                </div>
                <button class="ip-modal__close" id="ip-modal-close" aria-label="Close modal" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <div class="ip-toolbar" id="ip-modal-toolbar" style="display:none;">
                <div class="ip-search-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" id="ip-search-input" class="ip-search-input" placeholder="Search questions or technologies…">
                </div>
                <div class="ip-tabs" id="ip-category-tabs">
                    <button type="button" class="ip-tab is-active" data-tab="all">All (0)</button>
                    <button type="button" class="ip-tab" data-tab="technical">Technical</button>
                    <button type="button" class="ip-tab" data-tab="hr">HR & Behavioral</button>
                    <button type="button" class="ip-tab" data-tab="project">Projects</button>
                    <button type="button" class="ip-tab" data-tab="tips">Strategic Tips</button>
                </div>
            </div>

            <div class="ip-modal__body" id="ip-modal-body">
                <!-- Injected dynamically -->
            </div>

            <footer class="ip-modal__footer" id="ip-modal-footer">
                <!-- Footer actions injected dynamically -->
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;
        _bodyEl    = document.getElementById('ip-modal-body');

        document.getElementById('ip-modal-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // ESC key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _overlayEl && _overlayEl.classList.contains('is-open')) {
                close();
            }
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Open & Close Handlers
    ────────────────────────────────────────────────────────────────── */
    function open(resumeData = null, options = {}) {
        _injectDOM();
        _lastFocused = document.activeElement;

        if (resumeData) {
            _resumeData = resumeData;
        } else if (typeof BuilderState !== 'undefined') {
            _resumeData = BuilderState.get();
        } else {
            _resumeData = {};
        }

        _targetRole = options.targetRole || _targetRole || '';
        _company    = options.company    || _company    || '';
        _jobDesc    = options.jobDesc    || _jobDesc    || '';

        _overlayEl.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        _renderForm();
    }

    function close() {
        if (_overlayEl) _overlayEl.classList.remove('is-open');
        document.body.style.overflow = '';
        if (_lastFocused && typeof _lastFocused.focus === 'function') {
            _lastFocused.focus();
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Form Input
    ────────────────────────────────────────────────────────────────── */
    function _renderForm() {
        if (!_bodyEl) return;

        const toolbarEl = document.getElementById('ip-modal-toolbar');
        if (toolbarEl) toolbarEl.style.display = 'none';

        const footerEl = document.getElementById('ip-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="ip-footer__left">
                    <button type="button" class="btn--ip-secondary" id="ip-btn-cancel-form">Cancel</button>
                </div>
                <div class="ip-footer__right">
                    <button type="button" class="btn--ip-primary" id="ip-btn-generate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Generate Interview Prep Kit
                    </button>
                </div>
            `;

            document.getElementById('ip-btn-cancel-form').addEventListener('click', close);
            document.getElementById('ip-btn-generate').addEventListener('click', _handleGenerate);
        }

        _bodyEl.innerHTML = `
            <div class="cl-form-grid">
                <div class="form-group cl-form-group--full">
                    <label class="cl-label" for="ip-input-role">Target Job Title / Role <span style="color:#f87171;">*</span></label>
                    <input type="text" id="ip-input-role" class="cl-input" placeholder="e.g. Senior Full Stack Engineer / Product Manager" value="${_esc(_targetRole)}">
                </div>
                <div class="form-group">
                    <label class="cl-label" for="ip-input-company">Company Name <span style="font-size:11px;color:#94a3b8;">(Optional)</span></label>
                    <input type="text" id="ip-input-company" class="cl-input" placeholder="e.g. Google / Amazon / Startup" value="${_esc(_company)}">
                </div>
                <div class="form-group cl-form-group--full">
                    <label class="cl-label" for="ip-textarea-desc">Job Description <span style="font-size:11px;color:#94a3b8;">(Optional)</span></label>
                    <textarea id="ip-textarea-desc" class="cl-textarea" placeholder="Paste target job description to tailor technical questions…" rows="4">${_esc(_jobDesc)}</textarea>
                </div>
            </div>
            ${!footerEl ? `
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                <button type="button" class="btn--ip-primary" id="ip-btn-generate-inline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Generate Interview Prep Kit
                </button>
            </div>
            ` : ''}
        `;

        if (!footerEl) {
            const inlineBtn = document.getElementById('ip-btn-generate-inline');
            if (inlineBtn) inlineBtn.addEventListener('click', _handleGenerate);
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Skeleton Loading
    ────────────────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        if (!_bodyEl) return;

        const toolbarEl = document.getElementById('ip-modal-toolbar');
        if (toolbarEl) toolbarEl.style.display = 'none';

        const footerEl = document.getElementById('ip-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="ip-footer__left">
                    <button type="button" class="btn--ip-secondary" disabled>Cancel</button>
                </div>
                <div class="ip-footer__right">
                    <button type="button" class="btn--ip-primary" disabled>
                        <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                            <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                        </svg>
                        Generating Prep Kit…
                    </button>
                </div>
            `;
        }

        _bodyEl.innerHTML = `
            <div style="text-align:center;padding:10px 0;color:#fbbf24;font-size:13px;font-weight:600;">
                Analyzing resume skills & projects to formulate realistic interview Q&A…
            </div>
            <div class="ip-skeleton ip-skeleton--card"></div>
            <div class="ip-skeleton ip-skeleton--card"></div>
            <div class="ip-skeleton ip-skeleton--card"></div>
            <div class="ip-skeleton ip-skeleton--card"></div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Generated Prep Kit Results
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(prepKit) {
        if (!_bodyEl) return;

        _lastKit = prepKit;

        const toolbarEl = document.getElementById('ip-modal-toolbar');
        if (toolbarEl) {
            toolbarEl.style.display = 'flex';
            const searchInput = document.getElementById('ip-search-input');
            if (searchInput) {
                searchInput.value = _searchQuery;
                searchInput.oninput = (e) => {
                    _searchQuery = e.target.value.toLowerCase().trim();
                    _filterCards();
                };
            }

            // Tab listeners
            document.querySelectorAll('#ip-category-tabs .ip-tab').forEach(tab => {
                tab.onclick = () => {
                    document.querySelectorAll('#ip-category-tabs .ip-tab').forEach(t => t.classList.remove('is-active'));
                    tab.classList.add('is-active');
                    _activeTab = tab.dataset.tab;
                    _filterCards();
                };
            });
        }

        const footerEl = document.getElementById('ip-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="ip-footer__left">
                    <button type="button" class="btn--ip-secondary" id="ip-btn-back">Edit Role</button>
                    <button type="button" class="btn--ip-secondary" id="ip-btn-regen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Regenerate
                    </button>
                </div>
                <div class="ip-footer__right">
                    <button type="button" class="btn--ip-secondary" id="ip-btn-toggle-all">Expand / Collapse All</button>
                </div>
            `;

            document.getElementById('ip-btn-back').onclick = _renderForm;
            document.getElementById('ip-btn-regen').onclick = () => _fetchInterviewPrep(true);
            document.getElementById('ip-btn-toggle-all').onclick = _toggleAllCards;
        }

        _renderCards();
    }

    /* ── Render & Filter Q&A Cards ───────────────────────────────────── */
    function _renderCards() {
        if (!_bodyEl || !_lastKit) return;

        const techList = Array.isArray(_lastKit.technicalQuestions) ? _lastKit.technicalQuestions : [];
        const hrList   = Array.isArray(_lastKit.hrQuestions) ? _lastKit.hrQuestions : [];
        const projList = Array.isArray(_lastKit.projectQuestions) ? _lastKit.projectQuestions : [];
        const tipsList = Array.isArray(_lastKit.overallPreparationTips) ? _lastKit.overallPreparationTips : [];

        // Update tab counts
        const totalCount = techList.length + hrList.length + projList.length;
        const allTab = document.querySelector('#ip-category-tabs [data-tab="all"]');
        if (allTab) allTab.textContent = `All (${totalCount})`;

        let cardsHtml = '';

        // Technical Questions
        if (_activeTab === 'all' || _activeTab === 'technical') {
            techList.forEach((q, idx) => {
                const question = q.question || q.questionText || q.title || '';
                const modelAnswer = q.modelAnswer || q.answer || q.model_answer || '';
                const tips = q.tips || q.tip || '';
                const difficulty = q.difficulty || 'Medium';

                if (question && modelAnswer && _matchesSearch(question, modelAnswer, tips)) {
                    cardsHtml += _buildQuestionCard({
                        category: 'Technical',
                        question,
                        modelAnswer,
                        tips,
                        difficulty,
                        id: `tech-${idx}`
                    });
                }
            });
        }

        // HR / Behavioral Questions
        if (_activeTab === 'all' || _activeTab === 'hr') {
            hrList.forEach((q, idx) => {
                const question = q.question || q.questionText || q.title || '';
                const modelAnswer = q.modelAnswer || q.answer || q.model_answer || '';
                const tips = q.tips || q.tip || '';

                if (question && modelAnswer && _matchesSearch(question, modelAnswer, tips)) {
                    cardsHtml += _buildQuestionCard({
                        category: 'HR & Behavioral',
                        question,
                        modelAnswer,
                        tips,
                        id: `hr-${idx}`
                    });
                }
            });
        }

        // Project Questions
        if (_activeTab === 'all' || _activeTab === 'project') {
            projList.forEach((q, idx) => {
                const question = q.question || q.questionText || q.title || '';
                const modelAnswer = q.modelAnswer || q.answer || q.model_answer || '';
                const project = q.project || q.projectName || '';

                if (question && modelAnswer && _matchesSearch(question, modelAnswer, project)) {
                    cardsHtml += _buildQuestionCard({
                        category: 'Project Deep Dive',
                        question,
                        modelAnswer,
                        tips: project ? `Focuses on project: ${project}` : '',
                        id: `proj-${idx}`
                    });
                }
            });
        }

        // Strategic Tips
        if (_activeTab === 'all' || _activeTab === 'tips') {
            if (tipsList.length > 0) {
                cardsHtml += `
                    <div class="ip-card is-open">
                        <div class="ip-card__header">
                            <div class="ip-card__question">
                                <span>Strategic Interview Preparation Tips</span>
                                <div class="ip-card__tags">
                                    <span class="ip-badge ip-badge--cat">Advice</span>
                                </div>
                            </div>
                        </div>
                        <div class="ip-card__body">
                            <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:13px;line-height:1.6;">
                                ${tipsList.map(t => `<li style="margin-bottom:8px;">${_esc(typeof t === 'string' ? t : (t?.tip || ''))}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }
        }

        if (!cardsHtml) {
            cardsHtml = `
                <div style="text-align:center;padding:30px 0;color:#94a3b8;font-size:13px;">
                    No questions found matching "${_esc(_searchQuery)}".
                </div>
            `;
        }

        _bodyEl.innerHTML = cardsHtml;

        // Bind toggle handlers for question cards
        _bodyEl.querySelectorAll('.ip-card').forEach(card => {
            const toggleBtn = card.querySelector('.btn-toggle-answer');
            const header = card.querySelector('.ip-card__header');
            const copyBtn = card.querySelector('.btn-copy-qa');

            if (toggleBtn && header) {
                const handler = (e) => {
                    if (e.target.closest('.btn-copy-qa')) return;
                    card.classList.toggle('is-open');
                    const isOpen = card.classList.contains('is-open');
                    toggleBtn.innerHTML = isOpen
                        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg> Hide Answer`
                        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg> Reveal Answer`;
                };
                header.onclick = handler;
            }

            if (copyBtn) {
                copyBtn.onclick = (e) => {
                    e.stopPropagation();
                    const qText = card.querySelector('.ip-q-text')?.textContent || '';
                    const aText = card.querySelector('.ip-answer-box__text')?.textContent || '';
                    const fullText = `Q: ${qText}\n\nA: ${aText}`;
                    navigator.clipboard.writeText(fullText).then(() => {
                        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                            Helpers.showToast('Question & Model Answer copied!', 'success');
                        }
                    });
                };
            }
        });
    }

    function _filterCards() {
        _renderCards();
    }

    function _toggleAllCards() {
        if (!_bodyEl) return;
        const cards = _bodyEl.querySelectorAll('.ip-card');
        const anyClosed = Array.from(cards).some(c => !c.classList.contains('is-open'));
        cards.forEach(card => {
            const toggleBtn = card.querySelector('.btn-toggle-answer');
            if (anyClosed) {
                card.classList.add('is-open');
                if (toggleBtn) toggleBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg> Hide Answer`;
            } else {
                card.classList.remove('is-open');
                if (toggleBtn) toggleBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg> Reveal Answer`;
            }
        });
    }

    function _matchesSearch(q, a, t) {
        if (!_searchQuery) return true;
        const str = `${q || ''} ${a || ''} ${t || ''}`.toLowerCase();
        return str.includes(_searchQuery);
    }

    function _buildQuestionCard({ category, question, modelAnswer, tips, difficulty, id }) {
        let diffBadgeClass = 'ip-badge--medium';
        if ((difficulty || '').toLowerCase() === 'easy') diffBadgeClass = 'ip-badge--easy';
        if ((difficulty || '').toLowerCase() === 'hard') diffBadgeClass = 'ip-badge--hard';

        return `
            <div class="ip-card is-open" id="card-${id}">
                <div class="ip-card__header">
                    <div class="ip-card__question">
                        <span class="ip-q-text">${_esc(question)}</span>
                        <div class="ip-card__tags">
                            <span class="ip-badge ip-badge--cat">${_esc(category)}</span>
                            ${difficulty ? `<span class="ip-badge ${diffBadgeClass}">${_esc(difficulty)}</span>` : ''}
                        </div>
                    </div>
                    <div class="ip-card__actions">
                        <button type="button" class="btn-copy-qa" title="Copy Q&A" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                        <button type="button" class="btn-toggle-answer">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 15l-6-6-6 6"/>
                            </svg>
                            Hide Answer
                        </button>
                    </div>
                </div>
                <div class="ip-card__body">
                    <div class="ip-answer-box">
                        <div class="ip-answer-box__label">Model Answer</div>
                        <div class="ip-answer-box__text">${_esc(modelAnswer)}</div>
                    </div>
                    ${tips ? `
                        <div class="ip-tips-box">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span>${_esc(tips)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Generate Button Click Handler
    ────────────────────────────────────────────────────────────────── */
    function _handleGenerate() {
        const roleInp    = document.getElementById('ip-input-role');
        const companyInp = document.getElementById('ip-input-company');
        const jobDescInp = document.getElementById('ip-textarea-desc');

        _targetRole = roleInp    ? roleInp.value.trim()    : '';
        _company    = companyInp ? companyInp.value.trim() : '';
        _jobDesc    = jobDescInp ? jobDescInp.value.trim() : '';

        if (!_targetRole) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please enter a target job title or role.', 'warning');
            }
            return;
        }

        _fetchInterviewPrep(false);
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Q&A Kit from API with Session Cache
    ────────────────────────────────────────────────────────────────── */
    async function _fetchInterviewPrep(forceRegen = false) {
        if (_isGenerating) return;

        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Session expired. Please log in again.', 'error');
            }
            close();
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        // Cache key hash
        const cacheKey = `${_targetRole}|${_company}|${_jobDesc}`;
        if (!forceRegen && _sessionCache.has(cacheKey)) {
            const cachedResult = _sessionCache.get(cacheKey);
            _renderResults(cachedResult);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Loaded Interview Prep Kit from session cache.', 'info', 2000);
            }
            return;
        }

        _isGenerating = true;
        _renderSkeleton();

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resumeData: _resumeData || {},
                    targetRole: _targetRole,
                    company: _company,
                    jobDescription: _jobDesc
                })
            });

            if (!response.ok) {
                let errMsg = 'Interview prep generation failed.';
                try {
                    const errData = await response.json();
                    errMsg = errData.message || errMsg;
                } catch { /* ignore */ }

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                        Helpers.showToast('Session expired. Redirecting to login…', 'error');
                    }
                    close();
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    return;
                }

                throw new Error(errMsg);
            }

            const data = await response.json();
            if (!data.success || !data.prepKit) {
                throw new Error(data.message || 'Invalid response from server.');
            }

            _sessionCache.set(cacheKey, data.prepKit);
            _renderResults(data.prepKit);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Interview Prep Kit generated successfully!', 'success');
            }

        } catch (err) {
            console.error('[InterviewPrep] Generation error:', err);

            if (_bodyEl) {
                _bodyEl.innerHTML = `
                    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;text-align:center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="margin-bottom:10px;">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3 style="font-size:15px;font-weight:700;color:#ffffff;margin:0 0 6px;">Generation Failed</h3>
                        <p style="font-size:12px;color:#cbd5e1;line-height:1.4;margin:0 0 14px;">${_esc(err.message)}</p>
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.InterviewPrep.retry()">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to generate interview prep kit.', 'error');
            }
        } finally {
            _isGenerating = false;
        }
    }

    function _esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return {
        open,
        close,
        retry: () => _fetchInterviewPrep(true),
        renderWorkspace: function(targetEl, resumeData) {
            _bodyEl = targetEl;
            if (resumeData) _resumeData = resumeData;
            else if (typeof BuilderState !== 'undefined') _resumeData = BuilderState.get();
            _renderForm();
        }
    };

})();

/* Expose globally for event handlers */
window.InterviewPrep = InterviewPrep;

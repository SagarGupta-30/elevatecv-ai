/**
 * ElevateCV AI — Skill Gap Analyzer Component (Sprint 3.5)
 *
 * Standalone modal component for evaluating candidate resume skills against
 * target job roles and generating personalized 4-week learning roadmaps.
 *
 * Does not modify BuilderState.
 * Session Cache: Reuses generated reports for identical resume + role inputs.
 */

const SkillGapAnalyzer = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl   = null;
    let _modalEl     = null;
    let _bodyEl      = null;
    let _lastFocused = null;
    let _isAnalyzing = false;

    // Form & Request state
    let _resumeData  = null;
    let _targetRole  = 'Full Stack Developer';
    let _lastReport  = null;

    // Target Role Preset Options
    const ROLE_PRESETS = [
        'Backend Developer',
        'Frontend Developer',
        'Full Stack Developer',
        'Java Developer',
        'Python Developer',
        'AI Engineer',
        'ML Engineer',
        'DevOps Engineer',
        'Data Analyst',
        'Software Engineer'
    ];

    // Session cache: Map<hash, gapReport>
    const _sessionCache = new Map();

    /* ──────────────────────────────────────────────────────────────────
       Inject Modal DOM into body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('sg-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'sg-modal-overlay';
        overlay.id = 'sg-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'sg-modal';
        modal.id = 'sg-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'AI Skill Gap Analyzer & Learning Roadmap');

        modal.innerHTML = `
            <header class="sg-modal__header">
                <div class="sg-modal__title-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div>
                        <h2 class="sg-modal__title">AI Skill Gap Analyzer & Roadmap</h2>
                        <p class="sg-modal__subtitle">Identify skill gaps for target roles & generate a 4-week learning plan</p>
                    </div>
                </div>
                <button class="sg-modal__close" id="sg-modal-close" aria-label="Close modal" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <div class="sg-modal__body" id="sg-modal-body">
                <!-- Injected dynamically -->
            </div>

            <footer class="sg-modal__footer" id="sg-modal-footer">
                <!-- Injected dynamically -->
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;
        _bodyEl    = document.getElementById('sg-modal-body');

        document.getElementById('sg-modal-close').addEventListener('click', close);
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

        _targetRole = options.targetRole || _targetRole || 'Full Stack Developer';

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
       Render Form Input View
    ────────────────────────────────────────────────────────────────── */
    function _renderForm() {
        if (!_bodyEl) return;

        const footerEl = document.getElementById('sg-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="sg-footer__left">
                    <button type="button" class="btn--sg-secondary" id="sg-btn-cancel-form">Cancel</button>
                </div>
                <div class="sg-footer__right">
                    <button type="button" class="btn--sg-primary" id="sg-btn-run-analysis">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Generate Skill Gap Analysis
                    </button>
                </div>
            `;

            document.getElementById('sg-btn-cancel-form').addEventListener('click', close);
            document.getElementById('sg-btn-run-analysis').addEventListener('click', _handleAnalyze);
        }

        _bodyEl.innerHTML = `
            <div class="form-group cl-form-group--full">
                <label class="cl-label" for="sg-input-role">Target Job Role <span style="color:#f87171;">*</span></label>
                <input type="text" id="sg-input-role" class="cl-input" placeholder="Select a preset below or type a custom role…" value="${_esc(_targetRole)}">
            </div>

            <div class="form-group cl-form-group--full">
                <label class="cl-label">Popular Target Roles</label>
                <div class="sg-role-presets" id="sg-role-presets-container">
                    ${ROLE_PRESETS.map(role => `
                        <button type="button" class="sg-role-chip ${role === _targetRole ? 'is-active' : ''}" data-role="${_esc(role)}">
                            ${_esc(role)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Preset chip listeners
        document.querySelectorAll('#sg-role-presets-container .sg-role-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#sg-role-presets-container .sg-role-chip').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                _targetRole = btn.dataset.role;
                const roleInp = document.getElementById('sg-input-role');
                if (roleInp) roleInp.value = _targetRole;
            });
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Skeleton Loading
    ────────────────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        if (!_bodyEl) return;

        const footerEl = document.getElementById('sg-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="sg-footer__left">
                    <button type="button" class="btn--sg-secondary" disabled>Cancel</button>
                </div>
                <div class="sg-footer__right">
                    <button type="button" class="btn--sg-primary" disabled>
                        <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                            <path d="M12 2 a 10 10 0 1 10 10" stroke-linecap="round"/>
                        </svg>
                        Evaluating Skill Gap & Drafting Roadmap…
                    </button>
                </div>
            `;
        }

        _bodyEl.innerHTML = `
            <div style="text-align:center;padding:10px 0;color:#f472b6;font-size:13px;font-weight:600;">
                Comparing resume skills against industry standards for ${_esc(_targetRole)}…
            </div>
            <div class="sg-skeleton sg-skeleton--card"></div>
            <div class="sg-skeleton sg-skeleton--card"></div>
            <div class="sg-skeleton sg-skeleton--card"></div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Report Results
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(report) {
        if (!_bodyEl) return;

        _lastReport = report;
        const currentReadiness = Math.min(100, Math.max(0, report.overallReadiness || 0));
        const futureReadiness  = Math.min(100, Math.max(0, report.estimatedReadinessAfterRoadmap || 0));

        const currentSkills  = Array.isArray(report.currentSkills) ? report.currentSkills : [];
        const missingSkills  = Array.isArray(report.missingSkills) ? report.missingSkills : [];
        const prioritySkills = Array.isArray(report.prioritySkills) ? report.prioritySkills : [];
        const roadmap        = Array.isArray(report.learningRoadmap) ? report.learningRoadmap : [];
        const projects       = Array.isArray(report.recommendedProjects) ? report.recommendedProjects : [];
        const certs          = Array.isArray(report.certifications) ? report.certifications : [];

        const footerEl = document.getElementById('sg-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="sg-footer__left">
                    <button type="button" class="btn--sg-secondary" id="sg-btn-back">Change Role</button>
                    <button type="button" class="btn--sg-secondary" id="sg-btn-regen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Regenerate
                    </button>
                </div>
                <div class="sg-footer__right">
                    <button type="button" class="btn--sg-secondary" id="sg-btn-copy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy Roadmap
                    </button>
                </div>
            `;

            document.getElementById('sg-btn-back').onclick = _renderForm;
            document.getElementById('sg-btn-regen').onclick = () => _fetchSkillGap(true);
            document.getElementById('sg-btn-copy').onclick = _copyRoadmap;
        }

        // SVG Circle dash calculation
        const circumference = 2 * Math.PI * 42; // ~263.8
        const strokeOffset = circumference - (currentReadiness / 100) * circumference;

        _bodyEl.innerHTML = `
            <!-- SVG Defs for Gauge Gradient -->
            <svg style="width:0;height:0;position:absolute;">
                <defs>
                    <linearGradient id="sgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ec4899"/>
                        <stop offset="100%" stop-color="#8b5cf6"/>
                    </linearGradient>
                </defs>
            </svg>

            <!-- Score Header & Gauge -->
            <div class="sg-score-header">
                <div class="sg-gauge-wrap">
                    <svg class="sg-gauge-svg" viewBox="0 0 95 95">
                        <circle class="sg-gauge-bg" cx="47.5" cy="47.5" r="42"/>
                        <circle class="sg-gauge-fill" id="sg-gauge-fill-circle" cx="47.5" cy="47.5" r="42" style="stroke-dashoffset:${strokeOffset};"/>
                    </svg>
                    <div class="sg-gauge-val">${currentReadiness}%</div>
                </div>

                <div class="sg-metrics-grid">
                    <div class="sg-metric-card">
                        <div class="sg-metric-val" style="color:#f472b6;">${currentReadiness}%</div>
                        <div class="sg-metric-label">Current Readiness</div>
                    </div>
                    <div class="sg-metric-card">
                        <div class="sg-metric-val" style="color:#34d399;">${futureReadiness}%</div>
                        <div class="sg-metric-label">After Roadmap</div>
                    </div>
                    <div class="sg-metric-card">
                        <div class="sg-metric-val" style="color:#c084fc;">${prioritySkills.length}</div>
                        <div class="sg-metric-label">Priority Gaps</div>
                    </div>
                </div>
            </div>

            <!-- Current vs Missing vs Priority Skills -->
            <div class="sg-skills-grid">
                <!-- Current Skills -->
                <div class="sg-skills-box">
                    <div class="sg-skills-box__title sg-skills-box__title--current">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Current Skills (${currentSkills.length})
                    </div>
                    <div class="jm-chips-list">
                        ${currentSkills.length > 0 ? currentSkills.map(sk => `
                            <span class="jm-kw-chip sg-kw-chip--current">${_esc(sk)}</span>
                        `).join('') : '<span style="font-size:12px;color:#94a3b8;">None listed</span>'}
                    </div>
                </div>

                <!-- Missing Skills -->
                <div class="sg-skills-box">
                    <div class="sg-skills-box__title sg-skills-box__title--missing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Missing Skills (${missingSkills.length})
                    </div>
                    <div class="jm-chips-list">
                        ${missingSkills.length > 0 ? missingSkills.map(sk => `
                            <span class="jm-kw-chip sg-kw-chip--missing">${_esc(sk)}</span>
                        `).join('') : '<span style="font-size:12px;color:#34d399;">None — Complete skill coverage!</span>'}
                    </div>
                </div>

                <!-- Priority Focus Skills -->
                <div class="sg-skills-box">
                    <div class="sg-skills-box__title sg-skills-box__title--priority">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Priority Focus (${prioritySkills.length})
                    </div>
                    <div class="jm-chips-list">
                        ${prioritySkills.length > 0 ? prioritySkills.map(sk => `
                            <span class="jm-kw-chip sg-kw-chip--priority">${_esc(sk)}</span>
                        `).join('') : '<span style="font-size:12px;color:#94a3b8;">None</span>'}
                    </div>
                </div>
            </div>

            <!-- 4-Week Learning Roadmap Timeline -->
            <div class="sg-roadmap-section">
                <div class="sg-roadmap-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Personalized 4-Week Action Plan
                </div>
                <div class="sg-timeline">
                    ${roadmap.map(step => `
                        <div class="sg-timeline-card">
                            <div class="sg-timeline-card__head">
                                <span class="sg-week-badge">Week ${step.week || 1}</span>
                            </div>
                            <div class="sg-timeline-card__title">${_esc(step.title)}</div>
                            ${Array.isArray(step.topics) && step.topics.length > 0 ? `
                                <ul class="sg-timeline-card__topics" style="margin-top:8px;">
                                    ${step.topics.map(tp => `<li>${_esc(tp)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Recommended Projects & Certifications -->
            <div class="sg-extras-grid">
                <!-- Project Recommendations -->
                <div class="sg-extra-box">
                    <div class="sg-extra-box__title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        Recommended Portfolio Projects
                    </div>
                    <ul class="sg-extra-list">
                        ${projects.map(p => `<li>${_esc(p)}</li>`).join('')}
                    </ul>
                </div>

                <!-- Certification Suggestions -->
                <div class="sg-extra-box">
                    <div class="sg-extra-box__title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        Suggested Certifications
                    </div>
                    <ul class="sg-extra-list">
                        ${certs.map(c => `<li>${_esc(c)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Analyze Action Handler
    ────────────────────────────────────────────────────────────────── */
    function _handleAnalyze() {
        const roleInp = document.getElementById('sg-input-role');
        _targetRole = roleInp ? roleInp.value.trim() : '';

        if (!_targetRole) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please specify a target job role.', 'warning');
            }
            return;
        }

        _fetchSkillGap(false);
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Skill Gap from API with Session Cache
    ────────────────────────────────────────────────────────────────── */
    async function _fetchSkillGap(forceRegen = false) {
        if (_isAnalyzing) return;

        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Session expired. Please log in again.', 'error');
            }
            close();
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        const cacheKey = `${_targetRole}`;
        if (!forceRegen && _sessionCache.has(cacheKey)) {
            const cachedReport = _sessionCache.get(cacheKey);
            _renderResults(cachedReport);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Loaded Skill Gap Analysis from session cache.', 'info', 2000);
            }
            return;
        }

        _isAnalyzing = true;
        _renderSkeleton();

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/skill-gap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resumeData: _resumeData || {},
                    targetRole: _targetRole
                })
            });

            if (!response.ok) {
                let errMsg = 'Skill gap analysis failed.';
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
            if (!data.success || !data.gapReport) {
                throw new Error(data.message || 'Invalid response from server.');
            }

            _sessionCache.set(cacheKey, data.gapReport);
            _renderResults(data.gapReport);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Skill Gap Analysis complete!', 'success');
            }

        } catch (err) {
            console.error('[SkillGapAnalyzer] Error fetching report:', err);

            if (_bodyEl) {
                _bodyEl.innerHTML = `
                    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;text-align:center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="margin-bottom:10px;">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3 style="font-size:15px;font-weight:700;color:#ffffff;margin:0 0 6px;">Analysis Failed</h3>
                        <p style="font-size:12px;color:#cbd5e1;line-height:1.4;margin:0 0 14px;">${_esc(err.message)}</p>
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.SkillGapAnalyzer.retry()">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to analyze skill gap.', 'error');
            }
        } finally {
            _isAnalyzing = false;
        }
    }

    function _copyRoadmap() {
        if (!_lastReport) return;

        const roadmapStr = (_lastReport.learningRoadmap || []).map(m => `Week ${m.week}: ${m.title}\n${(m.topics || []).map(t => '  - ' + t).join('\n')}`).join('\n\n');
        const text = `ElevateCV AI Skill Gap & Learning Roadmap for ${_targetRole}
Current Readiness: ${_lastReport.overallReadiness}%
Estimated Readiness Post-Roadmap: ${_lastReport.estimatedReadinessAfterRoadmap}%

Missing Skills: ${(_lastReport.missingSkills || []).join(', ')}
Priority Skills: ${(_lastReport.prioritySkills || []).join(', ')}

4-WEEK ROADMAP:
${roadmapStr}
`;

        navigator.clipboard.writeText(text).then(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Learning roadmap copied to clipboard!', 'success');
            }
        });
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
        retry: () => _fetchSkillGap(true)
    };

})();

/* Expose globally for inline event handlers */
window.SkillGapAnalyzer = SkillGapAnalyzer;

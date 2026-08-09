/**
 * ElevateCV AI — ATS Job Match Analyzer Component (Sprint 3.5)
 *
 * Standalone modal component for evaluating candidate resume data against
 * a target Job Description and presenting an ATS compatibility report.
 *
 * Does not modify BuilderState.
 * Session Cache: Reuses generated reports for identical resume + job description inputs.
 */

const JobMatchAnalyzer = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl   = null;
    let _modalEl     = null;
    let _bodyEl      = null;
    let _lastFocused = null;
    let _isAnalyzing = false;

    // Form & Request state
    let _resumeData = null;
    let _jobDesc    = '';
    let _jobTitle   = '';
    let _company    = '';
    let _lastReport = null;

    // Session cache: Map<hash, matchReport>
    const _sessionCache = new Map();

    /* ──────────────────────────────────────────────────────────────────
       Inject Modal DOM into body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('jm-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'jm-modal-overlay';
        overlay.id = 'jm-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'jm-modal';
        modal.id = 'jm-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'AI ATS Job Match Analyzer');

        modal.innerHTML = `
            <header class="jm-modal__header">
                <div class="jm-modal__title-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <div>
                        <h2 class="jm-modal__title">ATS Job Match Analyzer</h2>
                        <p class="jm-modal__subtitle">Compare your resume against a target job description for ATS fit</p>
                    </div>
                </div>
                <button class="jm-modal__close" id="jm-modal-close" aria-label="Close modal" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <div class="jm-modal__body" id="jm-modal-body">
                <!-- Injected dynamically -->
            </div>

            <footer class="jm-modal__footer" id="jm-modal-footer">
                <!-- Injected dynamically -->
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;
        _bodyEl    = document.getElementById('jm-modal-body');

        document.getElementById('jm-modal-close').addEventListener('click', close);
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

        _jobDesc  = options.jobDesc  || _jobDesc  || '';
        _jobTitle = options.jobTitle || _jobTitle || '';
        _company  = options.company  || _company  || '';

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

        const pi = (_resumeData && _resumeData.personalInformation) || {};
        const exp = Array.isArray(_resumeData.experience) ? _resumeData.experience : [];
        const skillsObj = _resumeData.skills || {};
        const techSkills = Array.isArray(skillsObj.technical) ? skillsObj.technical.join(', ') : '';

        const footerEl = document.getElementById('jm-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="jm-footer__left">
                    <button type="button" class="btn--jm-secondary" id="jm-btn-cancel-form">Cancel</button>
                </div>
                <div class="jm-footer__right">
                    <button type="button" class="btn--jm-primary" id="jm-btn-run-match">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Run Job Match Analysis
                    </button>
                </div>
            `;

            document.getElementById('jm-btn-cancel-form').addEventListener('click', close);
            document.getElementById('jm-btn-run-match').addEventListener('click', _handleAnalyze);
        }

        _bodyEl.innerHTML = `
            <div class="jm-form-split">
                <!-- Left: Resume Summary Overview -->
                <div class="jm-resume-overview">
                    <div class="jm-overview-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Loaded Resume Overview
                    </div>
                    <div class="jm-overview-item">
                        <strong>Candidate:</strong> ${_esc(pi.fullName || 'Untitled Candidate')}
                    </div>
                    <div class="jm-overview-item">
                        <strong>Recent Role:</strong> ${_esc(exp[0]?.role || 'N/A')} at ${_esc(exp[0]?.company || 'N/A')}
                    </div>
                    <div class="jm-overview-item">
                        <strong>Technical Skills:</strong> ${_esc(techSkills || 'None specified')}
                    </div>
                    <div style="margin-top:auto;padding-top:10px;font-size:11.5px;color:#94a3b8;">
                        Target Job Description will be evaluated against this resume content.
                    </div>
                </div>

                <!-- Right: Job Details Input -->
                <div style="display:flex;flex-direction:column;gap:12px;">
                    <div class="form-group">
                        <label class="cl-label" for="jm-textarea-desc">Target Job Description <span style="color:#f87171;">*</span></label>
                        <textarea id="jm-textarea-desc" class="cl-textarea" placeholder="Paste the complete job description text here…" rows="7">${_esc(_jobDesc)}</textarea>
                    </div>
                    <div class="cl-form-grid" style="grid-template-columns:1fr 1fr;">
                        <div class="form-group">
                            <label class="cl-label" for="jm-input-jobtitle">Job Title <span style="font-size:11px;color:#94a3b8;">(Optional)</span></label>
                            <input type="text" id="jm-input-jobtitle" class="cl-input" placeholder="e.g. Senior Frontend Engineer" value="${_esc(_jobTitle)}">
                        </div>
                        <div class="form-group">
                            <label class="cl-label" for="jm-input-company">Company <span style="font-size:11px;color:#94a3b8;">(Optional)</span></label>
                            <input type="text" id="jm-input-company" class="cl-input" placeholder="e.g. Stripe / Meta" value="${_esc(_company)}">
                        </div>
                    </div>
                </div>
            </div>
            ${!footerEl ? `
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                <button type="button" class="btn--jm-primary" id="jm-btn-run-match-inline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Run Job Match Analysis
                </button>
            </div>
            ` : ''}
        `;

        if (!footerEl) {
            const inlineBtn = document.getElementById('jm-btn-run-match-inline');
            if (inlineBtn) inlineBtn.addEventListener('click', _handleAnalyze);
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Skeleton Loading
    ────────────────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        if (!_bodyEl) return;

        const footerEl = document.getElementById('jm-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="jm-footer__left">
                    <button type="button" class="btn--jm-secondary" disabled>Cancel</button>
                </div>
                <div class="jm-footer__right">
                    <button type="button" class="btn--jm-primary" disabled>
                        <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                            <path d="M12 2 a 10 10 0 1 10 10" stroke-linecap="round"/>
                        </svg>
                        Evaluating ATS Compatibility…
                    </button>
                </div>
            `;
        }

        _bodyEl.innerHTML = `
            <div style="text-align:center;padding:10px 0;color:#34d399;font-size:13px;font-weight:600;">
                Auditing resume keywords against target job description…
            </div>
            <div class="jm-skeleton jm-skeleton--card"></div>
            <div class="jm-skeleton jm-skeleton--card"></div>
            <div class="jm-skeleton jm-skeleton--card"></div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Report Results
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(report) {
        if (!_bodyEl) return;

        _lastReport = report;
        const overallScore = Math.min(100, Math.max(0, report.overallMatch || 0));
        const atsScore     = Math.min(100, Math.max(0, report.atsCompatibility || 0));
        const kwScore      = Math.min(100, Math.max(0, report.keywordCoverage || 0));

        const matchedKws = Array.isArray(report.matchedKeywords) ? report.matchedKeywords : [];
        const missingKws = Array.isArray(report.missingKeywords) ? report.missingKeywords : [];
        const strengths  = Array.isArray(report.strengths) ? report.strengths : [];
        const weaknesses = Array.isArray(report.weaknesses) ? report.weaknesses : [];
        const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];
        const sectionScores = report.sectionScores || {};

        const footerEl = document.getElementById('jm-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="jm-footer__left">
                    <button type="button" class="btn--jm-secondary" id="jm-btn-back">Edit Job Description</button>
                    <button type="button" class="btn--jm-secondary" id="jm-btn-regen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Regenerate
                    </button>
                </div>
                <div class="jm-footer__right">
                    <button type="button" class="btn--jm-secondary" id="jm-btn-copy-report">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy Report
                    </button>
                </div>
            `;

            document.getElementById('jm-btn-back').onclick = _renderForm;
            document.getElementById('jm-btn-regen').onclick = () => _fetchJobMatch(true);
            document.getElementById('jm-btn-copy-report').onclick = _copyReport;
        }

        // SVG Circle dash calculation
        const circumference = 2 * Math.PI * 40; // ~251.2
        const strokeOffset = circumference - (overallScore / 100) * circumference;

        _bodyEl.innerHTML = `
            <!-- SVG Defs for Gauge Gradient -->
            <svg style="width:0;height:0;position:absolute;">
                <defs>
                    <linearGradient id="jmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#10b981"/>
                        <stop offset="100%" stop-color="#3b82f6"/>
                    </linearGradient>
                </defs>
            </svg>

            <!-- Score Header & Gauge -->
            <div class="jm-score-header">
                <div class="jm-gauge-wrap">
                    <svg class="jm-gauge-svg" viewBox="0 0 90 90">
                        <circle class="jm-gauge-bg" cx="45" cy="45" r="40"/>
                        <circle class="jm-gauge-fill" id="jm-gauge-fill-circle" cx="45" cy="45" r="40" style="stroke-dashoffset:${strokeOffset};"/>
                    </svg>
                    <div class="jm-gauge-val">${overallScore}%</div>
                </div>

                <div class="jm-metrics-grid">
                    <div class="jm-metric-card">
                        <div class="jm-metric-val" style="color:#34d399;">${overallScore}%</div>
                        <div class="jm-metric-label">Overall Match</div>
                    </div>
                    <div class="jm-metric-card">
                        <div class="jm-metric-val" style="color:#60a5fa;">${atsScore}%</div>
                        <div class="jm-metric-label">ATS Compatibility</div>
                    </div>
                    <div class="jm-metric-card">
                        <div class="jm-metric-val" style="color:#a78bfa;">${kwScore}%</div>
                        <div class="jm-metric-label">Keyword Coverage</div>
                    </div>
                </div>
            </div>

            <!-- Matched vs Missing Keywords -->
            <div class="jm-keywords-container">
                <!-- Matched Keywords -->
                <div class="jm-keyword-box">
                    <div class="jm-keyword-box__title jm-keyword-box__title--matched">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Matched Keywords (${matchedKws.length})
                    </div>
                    <div class="jm-chips-list">
                        ${matchedKws.length > 0 ? matchedKws.map(kw => `
                            <span class="jm-kw-chip jm-kw-chip--matched">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                ${_esc(kw)}
                            </span>
                        `).join('') : '<span style="font-size:12px;color:#94a3b8;">None detected</span>'}
                    </div>
                </div>

                <!-- Missing Keywords -->
                <div class="jm-keyword-box">
                    <div class="jm-keyword-box__title jm-keyword-box__title--missing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Missing Keywords (${missingKws.length})
                    </div>
                    <div class="jm-chips-list">
                        ${missingKws.length > 0 ? missingKws.map(kw => `
                            <span class="jm-kw-chip jm-kw-chip--missing">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                ${_esc(kw)}
                            </span>
                        `).join('') : '<span style="font-size:12px;color:#34d399;">None — Full keyword match!</span>'}
                    </div>
                </div>
            </div>

            <!-- Strengths, Weaknesses, Recommendations -->
            <div class="ip-card is-open">
                <div class="ip-card__header">
                    <div class="ip-card__question">
                        <span>Analysis Breakdown & Recommendations</span>
                    </div>
                </div>
                <div class="ip-card__body">
                    ${strengths.length > 0 ? `
                        <div style="margin-bottom:14px;">
                            <div style="font-size:12px;font-weight:700;color:#34d399;margin-bottom:6px;text-transform:uppercase;">Strengths</div>
                            <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12.5px;line-height:1.5;">
                                ${strengths.map(s => `<li>${_esc(s)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${weaknesses.length > 0 ? `
                        <div style="margin-bottom:14px;">
                            <div style="font-size:12px;font-weight:700;color:#f87171;margin-bottom:6px;text-transform:uppercase;">Gaps & Weaknesses</div>
                            <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12.5px;line-height:1.5;">
                                ${weaknesses.map(w => `<li>${_esc(w)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${recommendations.length > 0 ? `
                        <div>
                            <div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:6px;text-transform:uppercase;">Actionable Recommendations</div>
                            <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12.5px;line-height:1.5;">
                                ${recommendations.map(r => `<li>${_esc(r)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Section Scores Progress Bars -->
            <div class="jm-section-scores">
                <div class="jm-section-scores__title">Section Compatibility Scores</div>
                ${['summary', 'experience', 'projects', 'skills', 'education'].map(sec => {
                    const score = Math.min(100, Math.max(0, sectionScores[sec] || 0));
                    return `
                        <div class="jm-score-row">
                            <div class="jm-score-row__head">
                                <span style="text-transform:capitalize;">${sec} Section</span>
                                <span style="font-weight:700;color:#ffffff;">${score}%</span>
                            </div>
                            <div class="jm-score-bar-bg">
                                <div class="jm-score-bar-fill" style="width:${score}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Analyze Action Handler
    ────────────────────────────────────────────────────────────────── */
    function _handleAnalyze() {
        const descInp  = document.getElementById('jm-textarea-desc');
        const titleInp = document.getElementById('jm-input-jobtitle');
        const compInp  = document.getElementById('jm-input-company');

        _jobDesc  = descInp  ? descInp.value.trim()  : '';
        _jobTitle = titleInp ? titleInp.value.trim() : '';
        _company  = compInp  ? compInp.value.trim()  : '';

        if (!_jobDesc) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please paste a target Job Description to run match analysis.', 'warning');
            }
            return;
        }

        _fetchJobMatch(false);
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Match Report from API with Session Cache
    ────────────────────────────────────────────────────────────────── */
    async function _fetchJobMatch(forceRegen = false) {
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

        const cacheKey = `${_jobDesc}|${_company}|${_jobTitle}`;
        if (!forceRegen && _sessionCache.has(cacheKey)) {
            const cachedReport = _sessionCache.get(cacheKey);
            _renderResults(cachedReport);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Loaded ATS Job Match report from session cache.', 'info', 2000);
            }
            return;
        }

        _isAnalyzing = true;
        _renderSkeleton();

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/job-match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resumeData: _resumeData || {},
                    jobDescription: _jobDesc,
                    company: _company,
                    jobTitle: _jobTitle
                })
            });

            if (!response.ok) {
                let errMsg = 'Job match analysis failed.';
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
            if (!data.success || !data.matchReport) {
                throw new Error(data.message || 'Invalid response from server.');
            }

            _sessionCache.set(cacheKey, data.matchReport);
            _renderResults(data.matchReport);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('ATS Job Match Analysis complete!', 'success');
            }

        } catch (err) {
            console.error('[JobMatchAnalyzer] Error fetching report:', err);

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
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.JobMatchAnalyzer.retry()">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to analyze job match.', 'error');
            }
        } finally {
            _isAnalyzing = false;
        }
    }

    function _copyReport() {
        if (!_lastReport) return;

        const summary = `ElevateCV AI ATS Job Match Report
Overall Match: ${_lastReport.overallMatch}%
ATS Compatibility: ${_lastReport.atsCompatibility}%
Keyword Coverage: ${_lastReport.keywordCoverage}%

Matched Keywords: ${(_lastReport.matchedKeywords || []).join(', ')}
Missing Keywords: ${(_lastReport.missingKeywords || []).join(', ')}

Recommendations:
${(_lastReport.recommendations || []).map(r => '- ' + r).join('\n')}
`;

        navigator.clipboard.writeText(summary).then(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Match report copied to clipboard!', 'success');
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
        retry: () => _fetchJobMatch(true),
        renderWorkspace: function(targetEl, resumeData) {
            _bodyEl = targetEl;
            if (resumeData) _resumeData = resumeData;
            else if (typeof BuilderState !== 'undefined') _resumeData = BuilderState.get();
            _renderForm();
        }
    };

})();

/* Expose globally for inline event handlers */
window.JobMatchAnalyzer = JobMatchAnalyzer;

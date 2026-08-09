/**
 * ElevateCV AI — Resume Analyzer Component (Sprint 3 AI Resume Analysis Engine)
 *
 * Provides an accessibility-compliant, responsive slide-over side drawer UI
 * for running AI analysis on the BuilderState JSON using Google Gemini via POST /api/ai/analyze.
 *
 * Guaranteed Backend Response Schema:
 * {
 *   "success": true,
 *   "analysis": {
 *     "overallScore": 88,
 *     "atsScore": 91,
 *     "grammarScore": 94,
 *     "formattingScore": 90,
 *     "recruiterScore": 89,
 *     "grade": "A",
 *     "strengths": [ ... ],
 *     "weaknesses": [ ... ],
 *     "missingKeywords": [ ... ],
 *     "grammarIssues": [ ... ],
 *     "sectionScores": {
 *        "summary": { "score": 85, "feedback": "...", "suggestions": [...] },
 *        "experience": { "score": 80, "feedback": "...", "suggestions": [...] },
 *        "projects": { "score": 80, "feedback": "...", "suggestions": [...] },
 *        "education": { "score": 90, "feedback": "...", "suggestions": [...] },
 *        "skills": { "score": 90, "feedback": "...", "suggestions": [...] }
 *     },
 *     "recommendations": [ ... ],
 *     "generatedAt": "...",
 *     "model": "gemini-2.5-flash"
 *   }
 * }
 *
 * AI is READ-ONLY: Never modifies BuilderState.
 *
 * Production improvements (post-audit):
 *   - Analysis cache: reuses last successful result if resume content is unchanged.
 *     Cache is invalidated automatically when the serialised content hash changes.
 *   - Friendly, status-code-aware error messages for 401/429/503/504/400/500.
 *
 * Depends on: Config.API_BASE, Helpers
 */

const ResumeAnalyzer = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _drawerEl          = null;
    let _overlayEl         = null;
    let _bodyEl            = null;
    let _isAnalyzing       = false;
    let _lastAnalysis      = null;  // kept for backward-compat
    let _lastFocused       = null;

    /* ── Analysis Cache ──────────────────────────────────────────────── */
    /**
     * _cachedAnalysis      — the most recent successful analysis object.
     * _cachedContentHash   — cheap string hash of the serialised resume that
     *                        produced _cachedAnalysis.  A mismatch means the
     *                        resume has changed and the cache must be ignored.
     */
    let _cachedAnalysis     = null;
    let _cachedContentHash  = null;

    /* ──────────────────────────────────────────────────────────────────
       Inject Drawer DOM elements into document.body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('analysis-drawer-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'analysis-drawer-overlay';
        overlay.id = 'analysis-drawer-overlay';

        const drawer = document.createElement('aside');
        drawer.className = 'analysis-drawer';
        drawer.id = 'analysis-drawer-root';
        drawer.setAttribute('aria-label', 'AI Resume Analysis Panel');
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');

        drawer.innerHTML = `
            <header class="analysis-drawer__header">
                <div class="analysis-drawer__header-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#a78bfa;">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                    </svg>
                    <div>
                        <h2>AI Resume Analysis</h2>
                        <p>Powered by Google Gemini AI</p>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span class="analysis-drawer__badge-ai">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Read Only
                    </span>
                    <button class="analysis-drawer__close" id="analysis-drawer-close" aria-label="Close analysis drawer" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </header>
            <div class="analysis-drawer__body" id="analysis-drawer-body">
                <!-- Content injected dynamically -->
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        _overlayEl = overlay;
        _drawerEl  = drawer;
        _bodyEl    = document.getElementById('analysis-drawer-body');

        // Setup event listeners for closing
        document.getElementById('analysis-drawer-close').addEventListener('click', close);
        overlay.addEventListener('click', close);

        // Accessibility: ESC key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _drawerEl.classList.contains('is-open')) {
                close();
            }
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Open & Close Drawer Handlers
    ────────────────────────────────────────────────────────────────── */
    function open() {
        _injectDOM();
        _lastFocused = document.activeElement;
        if (_overlayEl) _overlayEl.classList.add('is-open');
        if (_drawerEl)  _drawerEl.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        // Focus close button for accessibility
        const closeBtn = document.getElementById('analysis-drawer-close');
        if (closeBtn) closeBtn.focus();
    }

    function close() {
        if (_overlayEl) _overlayEl.classList.remove('is-open');
        if (_drawerEl)  _drawerEl.classList.remove('is-open');
        document.body.style.overflow = '';

        if (_lastFocused && typeof _lastFocused.focus === 'function') {
            _lastFocused.focus();
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Skeleton Loading State
    ────────────────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        if (!_bodyEl) return;

        _bodyEl.innerHTML = `
            <div style="text-align:center;padding:12px 0 6px;">
                <div style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:#a78bfa;font-weight:600;">
                    <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                        <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                    Evaluating content, grammar, ATS parseability & keyword density…
                </div>
            </div>
            <div class="analyzer-skeleton-wrap">
                <div class="analyzer-skeleton analyzer-skeleton--hero"></div>
                <div class="analyzer-skeleton analyzer-skeleton--card"></div>
                <div class="analyzer-skeleton analyzer-skeleton--card"></div>
                <div class="analyzer-skeleton analyzer-skeleton--card"></div>
                <div class="analyzer-skeleton analyzer-skeleton--card"></div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Analysis Results into Drawer Body
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(analysis) {
        if (!_bodyEl) return;

        const score       = typeof analysis.overallScore === 'number' ? analysis.overallScore : 80;
        const atsScore    = typeof analysis.atsScore === 'number' ? analysis.atsScore : 85;
        const gramScore   = typeof analysis.grammarScore === 'number' ? analysis.grammarScore : 90;
        const fmtScore    = typeof analysis.formattingScore === 'number' ? analysis.formattingScore : 88;
        const recScore    = typeof analysis.recruiterScore === 'number' ? analysis.recruiterScore : 82;
        const grade       = analysis.grade || 'A';
        const modelName   = analysis.model || 'gemini-2.0-flash';

        // Determine score ring color
        let scoreColor = '#4ade80'; // green
        if (score < 60)      scoreColor = '#f87171'; // red
        else if (score < 80) scoreColor = '#fbbf24'; // amber

        // Stroke dashoffset calculation for 88px ring (r=38, circumference ≈ 238)
        const offset = Math.round(238 - (238 * (score / 100)));

        const strengths       = Array.isArray(analysis.strengths) ? analysis.strengths : [];
        const weaknesses      = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
        const missingKeywords = Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [];
        const grammarIssues   = Array.isArray(analysis.grammarIssues) ? analysis.grammarIssues : [];
        const recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
        const sectionScores   = analysis.sectionScores || {};

        _bodyEl.innerHTML = `
            <!-- 1. Hero Score Card -->
            <div class="analyzer-hero-card">
                <div class="analyzer-hero-row">
                    <div class="analyzer-hero-score">
                        <div class="analyzer-score-ring">
                            <svg width="88" height="88" viewBox="0 0 88 88">
                                <circle class="analyzer-score-ring__bg" cx="44" cy="44" r="38"/>
                                <circle class="analyzer-score-ring__fill" id="score-ring-fill" cx="44" cy="44" r="38" style="stroke: ${scoreColor}; stroke-dashoffset: 238;"/>
                            </svg>
                            <div class="analyzer-score-ring__value">
                                <span>${score}</span>
                                <span class="analyzer-score-ring__label">Overall</span>
                            </div>
                        </div>
                        <div class="analyzer-hero-meta">
                            <div class="analyzer-hero-meta__title">
                                Overall Quality
                                <span class="analyzer-grade-badge">Grade ${grade}</span>
                            </div>
                            <div class="analyzer-hero-meta__desc">
                                ${score >= 85 ? 'Exceptional resume! High ATS match and strong action phrasing.' :
                                  score >= 70 ? 'Solid draft. Recommended improvements below will boost recruiter impact.' :
                                  'Needs enhancement. Follow recommendations below to improve ATS & recruiter match.'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Metrics Grid -->
                <div class="analyzer-metrics-grid">
                    <div class="analyzer-metric-item">
                        <div class="analyzer-metric-item__val">${atsScore}%</div>
                        <div class="analyzer-metric-item__lbl">ATS Match</div>
                    </div>
                    <div class="analyzer-metric-item">
                        <div class="analyzer-metric-item__val">${gramScore}%</div>
                        <div class="analyzer-metric-item__lbl">Grammar</div>
                    </div>
                    <div class="analyzer-metric-item">
                        <div class="analyzer-metric-item__val">${fmtScore}%</div>
                        <div class="analyzer-metric-item__lbl">Format</div>
                    </div>
                    <div class="analyzer-metric-item">
                        <div class="analyzer-metric-item__val">${recScore}%</div>
                        <div class="analyzer-metric-item__lbl">Recruiter</div>
                    </div>
                </div>
            </div>

            <!-- 2. Strengths Accordion -->
            <div class="analyzer-card is-expanded" id="card-strengths">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-strengths')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--strengths">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </div>
                        Strengths (${strengths.length})
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    <ul class="analyzer-list">
                        ${strengths.map(s => `
                            <li class="analyzer-list__item">
                                <svg class="analyzer-list__bullet-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span>${_esc(s)}</span>
                            </li>
                        `).join('') || '<li class="analyzer-list__item">No specific strengths highlighted.</li>'}
                    </ul>
                </div>
            </div>

            <!-- 3. Weaknesses Accordion -->
            <div class="analyzer-card is-expanded" id="card-weaknesses">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-weaknesses')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--weaknesses">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        Areas for Improvement (${weaknesses.length})
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    <ul class="analyzer-list">
                        ${weaknesses.map(w => `
                            <li class="analyzer-list__item">
                                <svg class="analyzer-list__bullet-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>${_esc(w)}</span>
                            </li>
                        `).join('') || '<li class="analyzer-list__item">No major areas for improvement detected.</li>'}
                    </ul>
                </div>
            </div>

            <!-- 4. Missing Keywords Accordion -->
            <div class="analyzer-card is-expanded" id="card-keywords">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-keywords')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--keywords">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                        </div>
                        Recommended Industry Keywords (${missingKeywords.length})
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    <div class="analyzer-chips">
                        ${missingKeywords.map(k => `
                            <span class="analyzer-chip">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                ${_esc(k)}
                            </span>
                        `).join('') || '<span style="font-size:12px;color:#94a3b8;">No missing keywords identified.</span>'}
                    </div>
                </div>
            </div>

            <!-- 5. Grammar & Tone Accordion -->
            <div class="analyzer-card" id="card-grammar">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-grammar')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--grammar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        Grammar & Formatting (${grammarIssues.length})
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    <ul class="analyzer-list">
                        ${grammarIssues.map(g => `
                            <li class="analyzer-list__item">
                                <svg class="analyzer-list__bullet-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                                    <polyline points="9 11 12 14 22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                </svg>
                                <span>${_esc(g)}</span>
                            </li>
                        `).join('') || '<li class="analyzer-list__item">Grammar and punctuation look great!</li>'}
                    </ul>
                </div>
            </div>

            <!-- 6. Section Breakdown Accordion -->
            <div class="analyzer-card is-expanded" id="card-sections">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-sections')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--sections">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <path d="M3 9h18M9 21V9"/>
                            </svg>
                        </div>
                        Section-by-Section Scores
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    ${_renderSectionBreakdown(sectionScores)}
                </div>
            </div>

            <!-- 7. Strategic Recommendations Accordion -->
            <div class="analyzer-card is-expanded" id="card-recs">
                <button class="analyzer-card__header" type="button" onclick="ResumeAnalyzer.toggleCard('card-recs')">
                    <div class="analyzer-card__title">
                        <div class="analyzer-card__icon analyzer-card__icon--recs">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </div>
                        Strategic Recommendations (${recommendations.length})
                    </div>
                    <svg class="analyzer-card__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
                <div class="analyzer-card__body">
                    <ul class="analyzer-list">
                        ${recommendations.map((r, idx) => `
                            <li class="analyzer-list__item">
                                <span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(52,211,153,0.2);color:#34d399;font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px;">${idx + 1}</span>
                                <span>${_esc(r)}</span>
                            </li>
                        `).join('') || '<li class="analyzer-list__item">No additional recommendations.</li>'}
                    </ul>
                </div>
            </div>

            <div style="text-align:center;padding-top:6px;font-size:10px;color:#64748b;">
                Evaluated by ${modelName} · Read-only feedback
            </div>
        `;

        // Animate score ring fill
        requestAnimationFrame(() => {
            setTimeout(() => {
                const fillEl = document.getElementById('score-ring-fill');
                if (fillEl) fillEl.style.strokeDashoffset = offset;
            }, 100);
        });
    }

    /* ── Render section items for breakdown ──────────────────────────── */
    function _renderSectionBreakdown(sections) {
        if (!sections) return '<p style="font-size:12px;color:#94a3b8;">No section data available.</p>';

        const keys = ['summary', 'experience', 'projects', 'education', 'skills'];
        return keys.map(k => {
            const sec = sections[k];
            if (!sec) return '';

            const secScore = typeof sec.score === 'number' ? sec.score : 75;
            let badgeClass = 'score-badge--high';
            if (secScore < 60)      badgeClass = 'score-badge--low';
            else if (secScore < 80) badgeClass = 'score-badge--mid';

            return `
                <div class="analyzer-section-item">
                    <div class="analyzer-section-item__header">
                        <span class="analyzer-section-item__name">${k}</span>
                        <span class="analyzer-section-item__score ${badgeClass}">${secScore}%</span>
                    </div>
                    ${sec.feedback ? `<div class="analyzer-section-item__feedback">${_esc(sec.feedback)}</div>` : ''}
                    ${Array.isArray(sec.suggestions) && sec.suggestions.length ? `
                        <ul style="margin:4px 0 0;padding-left:14px;font-size:11px;color:#94a3b8;line-height:1.4;">
                            ${sec.suggestions.map(s => `<li>${_esc(s)}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /* ── Helper: Escape HTML string ──────────────────────────────────── */
    function _esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    /* ── Toggle Accordion Cards ──────────────────────────────────────── */
    function toggleCard(cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.toggle('is-expanded');
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Cache helper: lightweight content hash for invalidation
    ────────────────────────────────────────────────────────────────── */

    /**
     * Returns a cheap, stable hash string of the resume payload.
     * Uses djb2 over the JSON string — fast enough for in-browser use.
     * We only hash the fields that affect the analysis result.
     * @param {Object} resumeData
     * @returns {string}
     */
    function _hashContent(resumeData) {
        if (!resumeData) return '';
        // Omit runtime-only fields (title, status, template) that don't
        // affect the AI analysis output, so renaming a draft never
        // invalidates a perfectly good cached result.
        const payload = {
            personalInformation: resumeData.personalInformation,
            professionalSummary: resumeData.professionalSummary,
            summary:             resumeData.summary,
            education:           resumeData.education,
            experience:          resumeData.experience,
            projects:            resumeData.projects,
            skills:              resumeData.skills,
            certifications:      resumeData.certifications,
            achievements:        resumeData.achievements
        };
        const str = JSON.stringify(payload);
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
            hash |= 0; // keep as 32-bit signed int
        }
        return String(hash >>> 0); // unsigned
    }

    /* ──────────────────────────────────────────────────────────────────
       Error helper: maps HTTP status code → user-friendly message
    ────────────────────────────────────────────────────────────────── */

    /**
     * Returns a human-friendly error string for a given HTTP status
     * and optional server message.
     * @param {number}  status
     * @param {string}  serverMessage
     * @returns {string}
     */
    function _friendlyErrorMessage(status, serverMessage) {
        switch (status) {
            case 401:
                return 'Your session has expired. Please log in again.';
            case 400:
                return serverMessage ||
                    'Please fill in your name or at least one resume section before analyzing.';
            case 429:
                return 'AI analysis is temporarily unavailable because the usage limit has been reached. ' +
                    'Please wait a few minutes and try again.';
            case 503:
                return 'AI service is not configured on the server. Please contact support.';
            case 504:
                return 'Analysis is taking longer than expected. Please try again.';
            default:
                return serverMessage || 'AI Resume Analysis failed. Please try again.';
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Main Public Action: Run AI Resume Analysis
    ────────────────────────────────────────────────────────────────── */
    async function analyze(resumeData, triggerBtn = null) {
        if (_isAnalyzing) return;

        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Session expired. Please log in to perform AI analysis.', 'error');
            }
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        // Validate content availability
        const pi = (resumeData && resumeData.personalInformation) || {};
        const hasName = (pi.fullName || '').trim().length > 0;
        const hasExp  = Array.isArray(resumeData.experience) && resumeData.experience.some(e => e.company || e.role);
        const hasEdu  = Array.isArray(resumeData.education) && resumeData.education.some(e => e.college || e.degree);
        const hasProj = Array.isArray(resumeData.projects) && resumeData.projects.some(p => p.title);
        const hasSk   = resumeData.skills && Object.values(resumeData.skills).some(arr => Array.isArray(arr) && arr.length > 0);

        if (!hasName && !hasExp && !hasEdu && !hasProj && !hasSk) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please fill in your name or at least one section before analyzing.', 'warning');
            }
            return;
        }

        // ── Cache hit: resume content unchanged since last successful analysis ──
        const contentHash = _hashContent(resumeData);
        if (_cachedAnalysis && _cachedContentHash === contentHash) {
            open();
            _renderResults(_cachedAnalysis);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Showing your last AI analysis.', 'info', 2000);
            }
            return;
        }

        _isAnalyzing = true;

        // Button loading state
        let origBtnHtml = '';
        if (triggerBtn) {
            origBtnHtml = triggerBtn.innerHTML;
            triggerBtn.disabled = true;
            triggerBtn.classList.add('btn--loading');
            triggerBtn.innerHTML = `
                <svg class="pdf-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                <span>Analyzing…</span>
            `;
        }

        // Open drawer & show skeleton loading
        open();
        _renderSkeleton();

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Analyzing resume with Gemini AI...', 'info', 2500);
        }

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resumeData)
            });

            // ── Friendly, status-code-aware error handling ──
            if (!response.ok) {
                let serverMessage = '';
                try {
                    const errData = await response.json();
                    serverMessage = errData.message || '';
                } catch { /* ignore parse errors on error bodies */ }

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                        Helpers.showToast(_friendlyErrorMessage(401), 'error');
                    }
                    close();
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    return;
                }

                const friendlyMsg = _friendlyErrorMessage(response.status, serverMessage);
                throw Object.assign(new Error(friendlyMsg), { httpStatus: response.status });
            }

            const data = await response.json();

            if (!data.success || !data.analysis) {
                throw new Error(data.message || 'AI analysis request failed.');
            }

            // ── Store to cache ──
            _lastAnalysis       = data.analysis;
            _cachedAnalysis     = data.analysis;
            _cachedContentHash  = contentHash;

            _renderResults(_lastAnalysis);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('AI Resume Analysis complete!', 'success');
            }

        } catch (err) {
            console.error('[ResumeAnalyzer] Analysis failed:', err);

            // Invalidate cache on any failure so the next attempt is always fresh
            _cachedAnalysis    = null;
            _cachedContentHash = null;

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
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.ResumeAnalyzer.analyze(typeof BuilderState !== 'undefined' ? BuilderState.get() : null)">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'AI Resume Analysis failed.', 'error');
            }
        } finally {
            _isAnalyzing = false;
            if (triggerBtn) {
                triggerBtn.disabled = false;
                triggerBtn.classList.remove('btn--loading');
                triggerBtn.innerHTML = origBtnHtml;
            }
        }
    }

    return {
        open,
        close,
        analyze,
        toggleCard,
        renderWorkspace: function(targetEl, resumeData) {
            _bodyEl = targetEl;
            analyze(resumeData);
        }
    };
})();

/* ── Expose to global scope so inline onclick handlers always resolve ─────── */
window.ResumeAnalyzer = ResumeAnalyzer;

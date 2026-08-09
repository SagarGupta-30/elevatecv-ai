/**
 * ElevateCV AI — AI Resume Improver Component (Rewrite Suggestions)
 *
 * Provides a reusable modal UI for generating and accepting AI rewrite suggestions.
 * NEVER modifies resume content automatically — requires explicit user action.
 *
 * Usage:
 *   AIImprover.open({
 *       section: 'summary',
 *       text: 'Passionate software engineer...',
 *       targetInput: textareaEl, // optional: auto-populates & dispatches input event
 *       onAccept: (improvedText) => { ... } // optional callback
 *   });
 */

const AIImprover = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl   = null;
    let _modalEl     = null;
    let _bodyEl      = null;
    let _lastFocused = null;
    let _isLoading   = false;

    // Current request context
    let _currentSection = 'general';
    let _originalText   = '';
    let _improvedText   = '';
    let _targetInput    = null;
    let _onAcceptCb     = null;

    /* ──────────────────────────────────────────────────────────────────
       Inject Modal DOM into body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('improver-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'improver-modal-overlay';
        overlay.id = 'improver-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'improver-modal';
        modal.id = 'improver-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'AI Resume Content Improver');

        modal.innerHTML = `
            <header class="improver-modal__header">
                <div class="improver-modal__title-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                    </svg>
                    <div>
                        <h2 class="improver-modal__title">AI Content Improver</h2>
                        <p class="improver-modal__subtitle">AI-powered wording, ATS optimization & active verb suggestions</p>
                    </div>
                </div>
                <button class="improver-modal__close" id="improver-modal-close" aria-label="Close modal" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>
            <div class="improver-modal__body" id="improver-modal-body">
                <!-- Injected dynamically -->
            </div>
            <footer class="improver-modal__footer">
                <div class="improver-footer__left">
                    <button type="button" class="btn--improver-cancel" id="improver-btn-cancel">Cancel</button>
                    <button type="button" class="btn--improver-regen" id="improver-btn-regen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Regenerate
                    </button>
                </div>
                <div class="improver-footer__right">
                    <button type="button" class="btn--improver-copy" id="improver-btn-copy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                    <button type="button" class="btn--improver-accept" id="improver-btn-accept">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Accept Suggestion
                    </button>
                </div>
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;
        _bodyEl    = document.getElementById('improver-modal-body');

        // Bind static footer buttons
        document.getElementById('improver-modal-close').addEventListener('click', close);
        document.getElementById('improver-btn-cancel').addEventListener('click', close);
        document.getElementById('improver-btn-regen').addEventListener('click', () => _fetchImprovement());
        document.getElementById('improver-btn-copy').addEventListener('click', _copyToClipboard);
        document.getElementById('improver-btn-accept').addEventListener('click', _acceptSuggestion);

        // Backdrop click to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // ESC key handler for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _overlayEl.classList.contains('is-open')) {
                close();
            }
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Open & Close Handlers
    ────────────────────────────────────────────────────────────────── */
    function open(options = {}) {
        const { section = 'general', text = '', targetInput = null, onAccept = null } = options;

        if (!text || text.trim().length === 0) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please enter some text in the field before improving with AI.', 'warning');
            }
            return;
        }

        _injectDOM();
        _lastFocused    = document.activeElement;
        _currentSection = section;
        _originalText   = text.trim();
        _improvedText   = '';
        _targetInput    = targetInput;
        _onAcceptCb     = onAccept;

        _overlayEl.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        _fetchImprovement();
    }

    function close() {
        if (_overlayEl) _overlayEl.classList.remove('is-open');
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

        const regenBtn  = document.getElementById('improver-btn-regen');
        const acceptBtn = document.getElementById('improver-btn-accept');
        const copyBtn   = document.getElementById('improver-btn-copy');

        if (regenBtn)  regenBtn.disabled  = true;
        if (acceptBtn) acceptBtn.disabled = true;
        if (copyBtn)   copyBtn.disabled   = true;

        _bodyEl.innerHTML = `
            <div class="improver-comparison">
                <!-- Original Text Card -->
                <div class="improver-card improver-card--original">
                    <div class="improver-card__header improver-card__header--original">
                        <span>Original Text</span>
                    </div>
                    <div class="improver-card__content">${_esc(_originalText)}</div>
                </div>

                <!-- AI Improved Skeleton Card -->
                <div class="improver-card improver-card--ai">
                    <div class="improver-card__header improver-card__header--ai">
                        <span style="display:flex;align-items:center;gap:6px;">
                            <svg class="pdf-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                                <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                            </svg>
                            AI Generating Rewrite…
                        </span>
                    </div>
                    <div style="padding:10px 0;">
                        <div class="improver-skeleton improver-skeleton--line" style="width:90%;"></div>
                        <div class="improver-skeleton improver-skeleton--line" style="width:75%;"></div>
                        <div class="improver-skeleton improver-skeleton--line" style="width:50%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Results
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(data) {
        if (!_bodyEl) return;

        _improvedText = data.improvedText || _originalText;
        const explanation = data.explanation || 'Enhanced active phrasing and ATS keyword alignment.';
        const improvements = Array.isArray(data.improvements) ? data.improvements : [];

        const regenBtn  = document.getElementById('improver-btn-regen');
        const acceptBtn = document.getElementById('improver-btn-accept');
        const copyBtn   = document.getElementById('improver-btn-copy');

        if (regenBtn)  regenBtn.disabled  = false;
        if (acceptBtn) acceptBtn.disabled = false;
        if (copyBtn)   copyBtn.disabled   = false;

        _bodyEl.innerHTML = `
            <div class="improver-comparison">
                <!-- Original Text Card -->
                <div class="improver-card improver-card--original">
                    <div class="improver-card__header improver-card__header--original">
                        <span>Original Text</span>
                    </div>
                    <div class="improver-card__content">${_esc(_originalText)}</div>
                </div>

                <!-- AI Improved Text Card -->
                <div class="improver-card improver-card--ai">
                    <div class="improver-card__header improver-card__header--ai">
                        <span style="display:flex;align-items:center;gap:6px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                            </svg>
                            AI Suggested Version
                        </span>
                    </div>
                    <div class="improver-card__content" style="color:#ffffff;font-weight:500;">${_esc(_improvedText)}</div>
                </div>

                <!-- Why this is better -->
                <div class="improver-why">
                    <div class="improver-why__title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Why this is better
                    </div>
                    <div class="improver-why__desc">${_esc(explanation)}</div>
                    ${improvements.length > 0 ? `
                        <ul class="improver-why__bullets">
                            ${improvements.map(imp => `
                                <li class="improver-why__item">
                                    <svg class="improver-why__item-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    <span>${_esc(imp)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Improvement from API
    ────────────────────────────────────────────────────────────────── */
    async function _fetchImprovement() {
        if (_isLoading) return;

        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Session expired. Please log in again.', 'error');
            }
            close();
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            return;
        }

        _isLoading = true;
        _renderSkeleton();

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/improve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    section: _currentSection,
                    text: _originalText
                })
            });

            if (!response.ok) {
                let errMsg = 'AI Improvement request failed.';
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
            if (!data.success || !data.improvement) {
                throw new Error(data.message || 'Invalid AI response schema.');
            }

            _renderResults(data.improvement);

        } catch (err) {
            console.error('[AIImprover] Error fetching improvement:', err);

            if (_bodyEl) {
                _bodyEl.innerHTML = `
                    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:20px;text-align:center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" style="margin-bottom:10px;">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3 style="font-size:15px;font-weight:700;color:#ffffff;margin:0 0 6px;">Improvement Failed</h3>
                        <p style="font-size:12px;color:#cbd5e1;line-height:1.4;margin:0 0 14px;">${_esc(err.message)}</p>
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.AIImprover.retry()">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to generate AI rewrite.', 'error');
            }
        } finally {
            _isLoading = false;
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Actions: Copy & Accept
    ────────────────────────────────────────────────────────────────── */
    function _copyToClipboard() {
        if (!_improvedText) return;

        navigator.clipboard.writeText(_improvedText).then(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Improved text copied to clipboard!', 'success');
            }
        }).catch(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Could not copy text automatically.', 'error');
            }
        });
    }

    function _acceptSuggestion() {
        if (!_improvedText) return;

        if (typeof _onAcceptCb === 'function') {
            _onAcceptCb(_improvedText);
        } else if (_targetInput) {
            _targetInput.value = _improvedText;
            // Dispatch input and change events so BuilderState syncs & Live Preview updates immediately
            _targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            _targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Suggestion applied to resume!', 'success');
        }

        close();
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
        retry: _fetchImprovement
    };

})();

/* Expose to window scope for inline event handlers */
window.AIImprover = AIImprover;

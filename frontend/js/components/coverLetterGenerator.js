/**
 * ElevateCV AI — Cover Letter Generator Component (Sprint 3)
 *
 * Standalone modal component for generating, previewing, and downloading
 * AI-powered, ATS-friendly cover letters tailored to target job descriptions.
 *
 * Never modifies resume data.
 * Session Cache: Reuses generated cover letters for identical resume + job description inputs.
 * Exports: PDF & DOCX formats.
 */

const CoverLetterGenerator = (() => {

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl   = null;
    let _modalEl     = null;
    let _bodyEl      = null;
    let _lastFocused = null;
    let _isGenerating = false;

    // Current state
    let _resumeData  = null;
    let _company     = '';
    let _jobTitle    = '';
    let _jobDesc     = '';
    let _tone        = 'professional';
    let _length      = 'medium';
    let _lastResult  = null;

    // Session cache: Map<hash, result>
    const _sessionCache = new Map();

    /* ──────────────────────────────────────────────────────────────────
       Inject Modal DOM into body
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('cl-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'cl-modal-overlay';
        overlay.id = 'cl-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'cl-modal';
        modal.id = 'cl-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'AI Cover Letter Generator');

        modal.innerHTML = `
            <header class="cl-modal__header">
                <div class="cl-modal__title-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <div>
                        <h2 class="cl-modal__title">AI Cover Letter Generator</h2>
                        <p class="cl-modal__subtitle">Tailored, recruiter-ready cover letters from your resume & target job</p>
                    </div>
                </div>
                <button class="cl-modal__close" id="cl-modal-close" aria-label="Close modal" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <div class="cl-modal__body" id="cl-modal-body">
                <!-- Form & Results injected dynamically -->
            </div>

            <footer class="cl-modal__footer" id="cl-modal-footer">
                <!-- Footer buttons injected dynamically based on state -->
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;
        _bodyEl    = document.getElementById('cl-modal-body');

        document.getElementById('cl-modal-close').addEventListener('click', close);
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

        // Use provided resumeData or fallback to BuilderState
        if (resumeData) {
            _resumeData = resumeData;
        } else if (typeof BuilderState !== 'undefined') {
            _resumeData = BuilderState.get();
        } else {
            _resumeData = {};
        }

        _company    = options.company  || _company  || '';
        _jobTitle   = options.jobTitle || _jobTitle || '';
        _jobDesc    = options.jobDesc  || _jobDesc  || '';

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
       Render Input Form
    ────────────────────────────────────────────────────────────────── */
    function _renderForm() {
        if (!_bodyEl) return;

        const footerEl = document.getElementById('cl-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="cl-footer__left">
                    <button type="button" class="btn--cl-secondary" id="cl-btn-cancel-form">Cancel</button>
                </div>
                <div class="cl-footer__right">
                    <button type="button" class="btn--cl-primary" id="cl-btn-generate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                        </svg>
                        Generate Cover Letter
                    </button>
                </div>
            `;

            document.getElementById('cl-btn-cancel-form').addEventListener('click', close);
            document.getElementById('cl-btn-generate').addEventListener('click', _handleGenerate);
        }

        _bodyEl.innerHTML = `
            <div class="cl-form-grid">
                <div class="form-group">
                    <label class="cl-label" for="cl-input-company">Company Name <span style="color:#f87171;">*</span></label>
                    <input type="text" id="cl-input-company" class="cl-input" placeholder="Google / Microsoft" value="${_esc(_company)}">
                </div>
                <div class="form-group">
                    <label class="cl-label" for="cl-input-jobtitle">Job Title <span style="color:#f87171;">*</span></label>
                    <input type="text" id="cl-input-jobtitle" class="cl-input" placeholder="Senior Full Stack Engineer" value="${_esc(_jobTitle)}">
                </div>
                <div class="form-group cl-form-group--full">
                    <label class="cl-label" for="cl-textarea-desc">Job Description <span style="color:#f87171;">*</span></label>
                    <textarea id="cl-textarea-desc" class="cl-textarea" placeholder="Paste the target job description here…" rows="5">${_esc(_jobDesc)}</textarea>
                </div>
                <div class="form-group cl-form-group--full">
                    <label class="cl-label">Tone</label>
                    <div class="cl-chips-group" id="cl-tone-chips">
                        <button type="button" class="cl-chip ${_tone === 'professional' ? 'is-active' : ''}" data-tone="professional">Professional</button>
                        <button type="button" class="cl-chip ${_tone === 'formal' ? 'is-active' : ''}" data-tone="formal">Formal</button>
                        <button type="button" class="cl-chip ${_tone === 'friendly' ? 'is-active' : ''}" data-tone="friendly">Friendly</button>
                        <button type="button" class="cl-chip ${_tone === 'confident' ? 'is-active' : ''}" data-tone="confident">Confident</button>
                    </div>
                </div>
                <div class="form-group cl-form-group--full">
                    <label class="cl-label">Length</label>
                    <div class="cl-chips-group" id="cl-length-chips">
                        <button type="button" class="cl-chip ${_length === 'short' ? 'is-active' : ''}" data-length="short">Short (~200w)</button>
                        <button type="button" class="cl-chip ${_length === 'medium' ? 'is-active' : ''}" data-length="medium">Medium (~350w)</button>
                        <button type="button" class="cl-chip ${_length === 'long' ? 'is-active' : ''}" data-length="long">Long (~500w)</button>
                    </div>
                </div>
            </div>
            ${!footerEl ? `
            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
                <button type="button" class="btn--cl-primary" id="cl-btn-generate-inline">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
                    </svg>
                    Generate Cover Letter
                </button>
            </div>
            ` : ''}
        `;

        if (!footerEl) {
            const inlineBtn = document.getElementById('cl-btn-generate-inline');
            if (inlineBtn) inlineBtn.addEventListener('click', _handleGenerate);
        }

        // Tone & Length chip select event listeners
        document.querySelectorAll('#cl-tone-chips .cl-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#cl-tone-chips .cl-chip').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                _tone = btn.dataset.tone;
            });
        });

        document.querySelectorAll('#cl-length-chips .cl-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#cl-length-chips .cl-chip').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                _length = btn.dataset.length;
            });
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Skeleton Loading
    ────────────────────────────────────────────────────────────────── */
    function _renderSkeleton() {
        if (!_bodyEl) return;

        const footerEl = document.getElementById('cl-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="cl-footer__left">
                    <button type="button" class="btn--cl-secondary" disabled>Cancel</button>
                </div>
                <div class="cl-footer__right">
                    <button type="button" class="btn--cl-primary" disabled>
                        <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                            <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                        </svg>
                        Generating Cover Letter…
                    </button>
                </div>
            `;
        }

        _bodyEl.innerHTML = `
            <div class="cl-paper">
                <div class="cl-paper__header">
                    <span class="cl-paper__title">Drafting Cover Letter for ${_esc(_jobTitle)} at ${_esc(_company)}…</span>
                    <span class="cl-badge">AI Writing</span>
                </div>
                <div style="padding:10px 0;">
                    <div class="cl-skeleton cl-skeleton--line" style="width:100%;"></div>
                    <div class="cl-skeleton cl-skeleton--line" style="width:95%;"></div>
                    <div class="cl-skeleton cl-skeleton--line" style="width:90%;"></div>
                    <div class="cl-skeleton cl-skeleton--line" style="width:98%;"></div>
                    <div class="cl-skeleton cl-skeleton--line" style="width:85%;"></div>
                    <div class="cl-skeleton cl-skeleton--line" style="width:60%;"></div>
                </div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Render Generated Result
    ────────────────────────────────────────────────────────────────── */
    function _renderResults(coverLetterObj) {
        if (!_bodyEl) return;

        _lastResult = coverLetterObj;
        const text  = coverLetterObj.coverLetter || '';
        const title = coverLetterObj.title || `Cover Letter - ${_jobTitle} at ${_company}`;
        const wordCount = coverLetterObj.wordCount || (text.trim() ? text.trim().split(/\s+/).length : 0);

        const footerEl = document.getElementById('cl-modal-footer');
        if (footerEl) {
            footerEl.innerHTML = `
                <div class="cl-footer__left">
                    <button type="button" class="btn--cl-secondary" id="cl-btn-back">Edit Form</button>
                    <button type="button" class="btn--cl-secondary" id="cl-btn-regen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                        </svg>
                        Regenerate
                    </button>
                </div>
                <div class="cl-footer__right">
                    <button type="button" class="btn--cl-secondary" id="cl-btn-copy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                    <button type="button" class="btn--cl-secondary" id="cl-btn-pdf">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        PDF
                    </button>
                    <button type="button" class="btn--cl-primary" id="cl-btn-docx">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download DOCX
                    </button>
                </div>
            `;

            document.getElementById('cl-btn-back').addEventListener('click', _renderForm);
            document.getElementById('cl-btn-regen').addEventListener('click', () => _fetchCoverLetter(true));
            document.getElementById('cl-btn-copy').addEventListener('click', _copyText);
            document.getElementById('cl-btn-pdf').addEventListener('click', _downloadPDF);
            document.getElementById('cl-btn-docx').addEventListener('click', _downloadDOCX);
        }

        _bodyEl.innerHTML = `
            <div class="cl-paper" id="cl-paper-canvas">
                <div class="cl-paper__header">
                    <span class="cl-paper__title">${_esc(title)}</span>
                    <div class="cl-paper__meta">
                        <span class="cl-badge">${wordCount} words</span>
                        <span class="cl-badge" style="background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.3);color:#c4b5fd;text-transform:capitalize;">${_tone}</span>
                    </div>
                </div>
                <div class="cl-paper__content" id="cl-paper-text">${_esc(text)}</div>
            </div>
        `;
    }

    /* ──────────────────────────────────────────────────────────────────
       Generate Button Click Handler
    ────────────────────────────────────────────────────────────────── */
    function _handleGenerate() {
        const companyInp  = document.getElementById('cl-input-company');
        const jobTitleInp = document.getElementById('cl-input-jobtitle');
        const jobDescInp  = document.getElementById('cl-textarea-desc');

        _company  = companyInp  ? companyInp.value.trim()  : '';
        _jobTitle = jobTitleInp ? jobTitleInp.value.trim() : '';
        _jobDesc  = jobDescInp  ? jobDescInp.value.trim()  : '';

        if (!_company || !_jobTitle || !_jobDesc) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please fill in Company Name, Job Title, and Job Description.', 'warning');
            }
            return;
        }

        _fetchCoverLetter(false);
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Cover Letter from API with Session Cache
    ────────────────────────────────────────────────────────────────── */
    async function _fetchCoverLetter(forceRegen = false) {
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
        const cacheKey = `${_company}|${_jobTitle}|${_jobDesc}|${_tone}|${_length}`;
        if (!forceRegen && _sessionCache.has(cacheKey)) {
            const cachedResult = _sessionCache.get(cacheKey);
            _renderResults(cachedResult);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Loaded cover letter from session cache.', 'info', 2000);
            }
            return;
        }

        _isGenerating = true;
        _renderSkeleton();

        try {
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE)
                ? Config.API_BASE
                : 'http://localhost:5001/api';

            const response = await fetch(`${apiBase}/ai/cover-letter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    resumeData: _resumeData || {},
                    company: _company,
                    jobTitle: _jobTitle,
                    jobDescription: _jobDesc,
                    tone: _tone,
                    length: _length
                })
            });

            if (!response.ok) {
                let errMsg = 'Cover letter generation failed.';
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
            if (!data.success || !data.coverLetter) {
                throw new Error(data.message || 'Invalid response from server.');
            }

            _sessionCache.set(cacheKey, data.coverLetter);
            _renderResults(data.coverLetter);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Cover letter generated successfully!', 'success');
            }

        } catch (err) {
            console.error('[CoverLetterGenerator] Generation error:', err);

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
                        <button class="btn btn--primary" type="button" style="font-size:12px;padding:6px 14px;" onclick="window.CoverLetterGenerator.retry()">
                            Try Again
                        </button>
                    </div>
                `;
            }

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to generate cover letter.', 'error');
            }
        } finally {
            _isGenerating = false;
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Actions: Copy, PDF, DOCX Downloads
    ────────────────────────────────────────────────────────────────── */
    function _copyText() {
        if (!_lastResult || !_lastResult.coverLetter) return;

        navigator.clipboard.writeText(_lastResult.coverLetter).then(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Cover letter copied to clipboard!', 'success');
            }
        }).catch(() => {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Could not copy text automatically.', 'error');
            }
        });
    }

    function _downloadPDF() {
        if (!_lastResult || !_lastResult.coverLetter) return;

        const cleanTitle = (_jobTitle || 'Role').replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCompany = (_company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Cover_Letter_${cleanTitle}_${cleanCompany}.pdf`;

        // Check if jsPDF is loaded
        if (window.jspdf && window.jspdf.jsPDF) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'pt', format: 'letter' });

            const margin = 40;
            const maxLineWidth = 530;

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);

            const lines = doc.splitTextToSize(_lastResult.coverLetter, maxLineWidth);
            doc.text(lines, margin, margin + 10);
            doc.save(filename);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Cover letter PDF downloaded!', 'success');
            }
        } else {
            // Fallback print/download
            window.print();
        }
    }

    function _downloadDOCX() {
        if (!_lastResult || !_lastResult.coverLetter) return;

        const cleanTitle = (_jobTitle || 'Role').replace(/[^a-zA-Z0-9]/g, '_');
        const cleanCompany = (_company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Cover_Letter_${cleanTitle}_${cleanCompany}.docx`;

        const headerHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${_esc(_lastResult.title)}</title>
                <style>
                    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 1in; }
                    p { margin-bottom: 12pt; }
                </style>
            </head>
            <body>
                ${_lastResult.coverLetter.split('\n\n').map(p => `<p>${_esc(p)}</p>`).join('')}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + headerHtml], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Cover letter DOCX downloaded!', 'success');
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
        retry: () => _fetchCoverLetter(true),
        renderWorkspace: function(targetEl, resumeData) {
            _bodyEl = targetEl;
            if (resumeData) _resumeData = resumeData;
            else if (typeof BuilderState !== 'undefined') _resumeData = BuilderState.get();
            _renderForm();
        }
    };

})();

/* Expose globally for event handlers */
window.CoverLetterGenerator = CoverLetterGenerator;

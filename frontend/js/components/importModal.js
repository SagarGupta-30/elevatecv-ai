/**
 * ElevateCV AI — Resume Import & Smart Parsing Review Modal
 * Handles Drag & Drop, File Upload (.pdf, .docx, .doc <= 10MB),
 * Progress state, Smart Parsing Field Review, AI Auto-Improvement,
 * and seamless saving & launching of ATS Analysis.
 */

const ImportModal = (() => {
    let _overlayEl = null;
    let _modalEl = null;
    let _parsedData = null;
    let _rawFile = null;

    function _injectDOM() {
        if (document.getElementById('import-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'modal-backdrop';
        overlay.id = 'import-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Import Existing Resume');

        overlay.innerHTML = `
            <div class="modal-container" style="max-width: 640px; padding: 0; overflow: hidden;" id="import-modal-root">
                <header class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(99,102,241,0.15); color: #a78bfa; display: flex; align-items: center; justify-content: center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 700; color: #fff;">Import Existing Resume</h3>
                            <p style="margin: 2px 0 0 0; font-size: 13px; color: #94a3b8;">Upload your PDF or DOCX resume to auto-populate ElevateCV AI</p>
                        </div>
                    </div>
                    <button type="button" class="analysis-drawer__close" id="btn-close-import-modal" aria-label="Close modal">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </header>

                <div class="modal-body" id="import-modal-body" style="padding: 24px;">
                    <!-- Injected dynamically -->
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        _overlayEl = overlay;
        _modalEl = document.getElementById('import-modal-root');

        document.getElementById('btn-close-import-modal').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    function open() {
        _injectDOM();
        _overlayEl.classList.add('is-active');
        document.body.style.overflow = 'hidden';
        _renderUploadView();
    }

    function close() {
        if (_overlayEl) _overlayEl.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    /* ── Render Upload View ────────────────────────────────────────── */
    function _renderUploadView() {
        const body = document.getElementById('import-modal-body');
        if (!body) return;

        body.innerHTML = `
            <div id="import-dropzone" style="border: 2px dashed rgba(99,102,241,0.4); border-radius: 12px; padding: 36px 20px; text-align: center; background: rgba(15,23,42,0.6); cursor: pointer; transition: all 0.2s ease;">
                <input type="file" id="import-file-input" accept=".pdf,.docx,.doc,.txt" style="display: none;">
                <div style="width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center; color: #a78bfa;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <path d="M12 18v-6m-3 3l3-3 3 3"/>
                    </svg>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0 0 6px;">Drag & Drop your resume here</h4>
                <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px;">Supports <strong>PDF, DOCX, DOC, TXT</strong> up to 10 MB</p>
                <button type="button" class="btn btn--primary" id="btn-browse-file" style="font-size: 13px; padding: 8px 20px;">
                    Browse Files
                </button>
            </div>
            <div style="margin-top: 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b;">
                <span>🔒 Powered by AI text extraction</span>
                <span>Max File Size: 10 MB</span>
            </div>
        `;

        const dropzone = document.getElementById('import-dropzone');
        const fileInput = document.getElementById('import-file-input');
        const browseBtn = document.getElementById('btn-browse-file');

        browseBtn.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('click', (e) => {
            if (e.target !== browseBtn) fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                _handleFileUpload(e.target.files[0]);
            }
        });

        // Drag & Drop
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = '#6366f1';
                dropzone.style.background = 'rgba(99,102,241,0.15)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = 'rgba(99,102,241,0.4)';
                dropzone.style.background = 'rgba(15,23,42,0.6)';
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files[0]) {
                _handleFileUpload(files[0]);
            }
        });
    }

    /* ── Render Progress View ────────────────────────────────────────── */
    function _renderProgressView(fileName) {
        const body = document.getElementById('import-modal-body');
        if (!body) return;

        body.innerHTML = `
            <div style="padding: 24px 12px; text-align: center;">
                <div style="width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; color: #818cf8;">
                    <svg class="pdf-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                        <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0 0 6px;">Importing & Parsing Resume</h4>
                <p style="font-size: 13px; color: #94a3b8; margin: 0 0 20px;">Analyzing <strong>${_esc(fileName)}</strong> with AI text extraction…</p>

                <div style="background: rgba(255,255,255,0.08); border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 12px; width: 100%;">
                    <div id="import-progress-bar" style="height: 100%; width: 35%; background: linear-gradient(90deg, #6366f1, #a78bfa); transition: width 0.4s ease;"></div>
                </div>

                <div id="import-status-text" style="font-size: 12px; color: #cbd5e1; font-weight: 500;">
                    Extracting text and identifying fields…
                </div>
            </div>
        `;
    }

    /* ── Render Smart Parsing Review View ────────────────────────────── */
    function _renderReviewView(result) {
        const body = document.getElementById('import-modal-body');
        if (!body) return;

        const resume = result.resume || {};
        const pi = resume.personalInformation || {};
        const expCount = (resume.experience || []).length;
        const eduCount = (resume.education || []).length;
        const projCount = (resume.projects || []).length;
        const skillCount = (resume.skills?.technical || []).length + (resume.skills?.tools || []).length;

        const parsedFields = [];
        const missingFields = [];

        if (pi.fullName) parsedFields.push('Full Name');
        if (pi.email) parsedFields.push('Email Address');
        if (pi.phone) parsedFields.push('Phone Number'); else missingFields.push('Phone Number');
        if (pi.linkedin) parsedFields.push('LinkedIn Profile'); else missingFields.push('LinkedIn Profile');
        if (expCount > 0) parsedFields.push(`Work Experience (${expCount})`); else missingFields.push('Work Experience');
        if (eduCount > 0) parsedFields.push(`Education (${eduCount})`); else missingFields.push('Education');
        if (skillCount > 0) parsedFields.push(`Skills (${skillCount})`); else missingFields.push('Skills');
        if (projCount > 0) parsedFields.push(`Projects (${projCount})`); else missingFields.push('Projects');

        body.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <div>
                            <div style="font-size: 14px; font-weight: 700; color: #ffffff;">Parsing Complete!</div>
                            <div style="font-size: 12px; color: #94a3b8;">Review extracted details before populating Builder</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 18px; font-weight: 800; color: #34d399;">${result.resume.parseAnalysis?.qualityScore || 85}%</div>
                        <div style="font-size: 11px; color: #94a3b8;">Match Score</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <!-- Successfully Parsed Fields -->
                    <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
                        <h5 style="font-size: 13px; font-weight: 700; color: #34d399; margin: 0 0 10px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Parsed Fields (${parsedFields.length})
                        </h5>
                        <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;">
                            ${parsedFields.map(f => `<li style="font-size: 12px; color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><span style="color: #34d399;">✓</span> ${_esc(f)}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Missing Fields -->
                    <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px;">
                        <h5 style="font-size: 13px; font-weight: 700; color: #fbbf24; margin: 0 0 10px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Missing / Optional (${missingFields.length})
                        </h5>
                        <ul style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;">
                            ${missingFields.length > 0 ? missingFields.map(f => `<li style="font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px;"><span style="color: #fbbf24;">!</span> ${_esc(f)}</li>`).join('') : '<li style="font-size: 12px; color: #34d399;">All core fields present!</li>'}
                        </ul>
                    </div>
                </div>

                <!-- Action Footer -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08);">
                    <button type="button" class="btn btn--secondary" id="btn-import-builder" style="font-size: 13px;">
                        Edit in Builder
                    </button>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn--secondary" id="btn-import-improve" style="font-size: 13px; border-color: rgba(167,139,250,0.4); color: #a78bfa;">
                            ✨ Improve with AI
                        </button>
                        <button type="button" class="btn btn--primary" id="btn-import-ats" style="font-size: 13px;">
                            Save & Run ATS Analysis
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-import-builder').addEventListener('click', async () => {
            console.log('[IMPORT_TRACE] STEP 1: Edit in Builder clicked. resume =', resume);
            try {
                console.log('[IMPORT_TRACE] STEP 2: Calling _saveImportedResume...');
                const saved = await _saveImportedResume(resume);
                console.log('[IMPORT_TRACE] STEP 3: _saveImportedResume returned:', saved);
                console.log('[IMPORT_TRACE] STEP 4: saved?._id =', saved?._id);
                if (saved && saved._id) {
                    console.log('[IMPORT_TRACE] STEP 5: Closing modal and navigating to builder.html?resumeId=' + saved._id);
                    close();
                    window.location.href = `builder.html?resumeId=${saved._id}`;
                } else {
                    console.error('[IMPORT_TRACE] FAILED AT STEP 4: saved or saved._id is falsy!', saved);
                }
            } catch (err) {
                console.error('[IMPORT_TRACE] EXCEPTION IN BUILDER CLICK LISTENER:', err);
            }
        });

        document.getElementById('btn-import-improve').addEventListener('click', async () => {
            console.log('[IMPORT_TRACE] STEP 1: Improve with AI clicked. resume =', resume);
            try {
                console.log('[IMPORT_TRACE] STEP 2: Calling _saveImportedResume...');
                const saved = await _saveImportedResume(resume);
                console.log('[IMPORT_TRACE] STEP 3: _saveImportedResume returned:', saved);
                console.log('[IMPORT_TRACE] STEP 4: saved?._id =', saved?._id);
                if (saved) {
                    console.log('[IMPORT_TRACE] STEP 5: Closing modal and opening AIImprover/navigating...');
                    close();
                    if (typeof AIImprover !== 'undefined' && typeof AIImprover.open === 'function') {
                        console.log('[IMPORT_TRACE] STEP 6: Opening AIImprover.open(saved)...');
                        AIImprover.open(saved);
                    } else if (typeof Helpers !== 'undefined') {
                        console.log('[IMPORT_TRACE] STEP 6: Navigating to builder.html?resumeId=' + saved._id);
                        Helpers.showToast('Resume saved! Opening Builder...', 'success');
                        window.location.href = `builder.html?resumeId=${saved._id}`;
                    }
                } else {
                    console.error('[IMPORT_TRACE] FAILED AT STEP 4: saved is falsy!', saved);
                }
            } catch (err) {
                console.error('[IMPORT_TRACE] EXCEPTION IN IMPROVE CLICK LISTENER:', err);
            }
        });

        document.getElementById('btn-import-ats').addEventListener('click', async () => {
            console.log('[IMPORT_TRACE] STEP 1: Save & Run ATS Analysis clicked. resume =', resume);
            try {
                console.log('[IMPORT_TRACE] STEP 2: Calling _saveImportedResume...');
                const saved = await _saveImportedResume(resume);
                console.log('[IMPORT_TRACE] STEP 3: _saveImportedResume returned:', saved);
                console.log('[IMPORT_TRACE] STEP 4: saved?._id =', saved?._id);
                if (saved) {
                    console.log('[IMPORT_TRACE] STEP 5: Closing modal and navigating to ATS...');
                    close();
                    if (typeof SpaRouter !== 'undefined') {
                        console.log('[IMPORT_TRACE] STEP 6: Calling SpaRouter.navigate("ats-analysis")...');
                        SpaRouter.navigate('ats-analysis');
                    } else {
                        console.log('[IMPORT_TRACE] STEP 6: Navigating via window.location.href...');
                        window.location.href = 'dashboard.html#ats-analysis';
                    }
                } else {
                    console.error('[IMPORT_TRACE] FAILED AT STEP 4: saved is falsy!', saved);
                }
            } catch (err) {
                console.error('[IMPORT_TRACE] EXCEPTION IN ATS CLICK LISTENER:', err);
            }
        });
    }

    /* ── API Upload Dispatch ─────────────────────────────────────────── */
    async function _handleFileUpload(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
            if (typeof Helpers !== 'undefined') {
                Helpers.showToast('Please upload a PDF, DOCX, DOC, or TXT file.', 'error');
            }
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            if (typeof Helpers !== 'undefined') {
                Helpers.showToast('File size exceeds maximum limit of 10 MB.', 'error');
            }
            return;
        }

        _rawFile = file;
        _renderProgressView(file.name);

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('resumeFile', file);

        try {
            const progressBar = document.getElementById('import-progress-bar');
            const statusText = document.getElementById('import-status-text');

            if (progressBar) progressBar.style.width = '65%';
            if (statusText) statusText.textContent = 'Parsing sections with AI…';

            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE) ? Config.API_BASE : 'http://localhost:5001/api';
            const response = await fetch(`${apiBase}/resumes/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (progressBar) progressBar.style.width = '100%';

            const resData = await response.json();

            if (!response.ok || !resData.success) {
                throw new Error(resData.message || 'Failed to parse uploaded file.');
            }

            _parsedData = resData.data;

            if (typeof Helpers !== 'undefined') {
                Helpers.showToast('Resume extracted successfully!', 'success');
            }

            _renderReviewView(_parsedData);

        } catch (err) {
            console.error('[ImportModal] Upload error:', err);
            const body = document.getElementById('import-modal-body');
            if (body) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%; background: rgba(239,68,68,0.15); color: #ef4444; display: flex; align-items: center; justify-content: center;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h4 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0 0 6px;">Import Failed</h4>
                        <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px;">${_esc(err.message)}</p>
                        <button type="button" class="btn btn--primary" id="btn-import-retry">Try Again</button>
                    </div>
                `;
                document.getElementById('btn-import-retry').addEventListener('click', _renderUploadView);
            }
        }
    }

    async function _saveImportedResume(resumeData) {
        console.log('[IMPORT_TRACE] Inside _saveImportedResume. resumeData =', resumeData);
        console.log('[IMPORT_TRACE] typeof ResumeService =', typeof ResumeService);
        if (typeof ResumeService === 'undefined') {
            console.error('[IMPORT_TRACE] [ImportModal] ResumeService is not defined!');
            if (typeof Helpers !== 'undefined') Helpers.showToast('Resume service unavailable. Please refresh the page.', 'error');
            return null;
        }
        try {
            console.log('[IMPORT_TRACE] About to call ResumeService.createResume...');
            if (typeof Helpers !== 'undefined') Helpers.showToast('Saving imported resume...', 'info');
            const saved = await ResumeService.createResume(resumeData);
            console.log('[IMPORT_TRACE] ResumeService.createResume returned:', saved);
            if (typeof Helpers !== 'undefined') Helpers.showToast('Imported resume saved successfully!', 'success');
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.loadResumes === 'function') {
                console.log('[IMPORT_TRACE] Calling Dashboard.loadResumes(true)...');
                Dashboard.loadResumes(true);
            }
            return saved;
        } catch (e) {
            console.error('[IMPORT_TRACE] [ImportModal] Save error in _saveImportedResume:', e);
            if (typeof Helpers !== 'undefined') Helpers.showToast(e.message || 'Failed to save imported resume', 'error');
            return null;
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
        close
    };
})();

window.ImportModal = ImportModal;

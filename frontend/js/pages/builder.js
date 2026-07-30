/**
 * ElevateCV AI — Resume Builder v2 (Sprint 2)
 * Orchestrator: wires together all wizard components.
 *
 * Architecture:
 *   BuilderState   → Single source of truth (state/builderState.js)
 *   WIZARD_STEPS   → Step config (components/wizardSteps.js)
 *   ProgressBar    → Progress bar UI (components/progressBar.js)
 *   WizardNav      → Back/Next/Save navigation (components/wizardNav.js)
 *   Step*          → Per-step panel renderers (components/stepPanels.js)
 *   TagInput       → Tag chip input (components/tagInput.js)
 *   BulletEditor   → Bullet list input (components/bulletEditor.js)
 *
 * This file contains NO API calls. All data stays in BuilderState.
 * Dashboard.js (Sprint 1) handles auth, sidebar, and profile dropdown — untouched.
 */

const ResumeBuilderV2 = (() => {

    /* ── Map step ID → panel renderer module ───────────────────────── */
    const STEP_RENDERERS = {
        1: StepPersonal,
        2: StepEducation,
        3: StepExperience,
        4: StepProjects,
        5: StepSkills,
        6: StepCertifications,
        7: StepLanguages,
        8: StepReview
    };

    /* ── Track which panels have been rendered (cache) ─────────────── */
    const renderedPanels = new Set();

    /* ── DOM refs ───────────────────────────────────────────────────── */
    let panelsContainer = null;
    let progressEl      = null;
    let navEl           = null;

    /* ─────────────────────────────────────────────────────────────── */
    /*  Build the static shell into .builder-container                 */
    /* ─────────────────────────────────────────────────────────────── */
    function buildShell() {
        const container = document.querySelector('.builder-container');
        if (!container) return;

        container.innerHTML = `
            <!-- SVG defs for ring gradient (hidden) -->
            <svg width="0" height="0" style="position:absolute">
                <defs>
                    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stop-color="#7C3AED"/>
                        <stop offset="100%" stop-color="#3B82F6"/>
                    </linearGradient>
                </defs>
            </svg>

            <!-- Wizard Header -->
            <div class="wizard-header" id="wizard-header">
                <div class="wizard-meta">
                    <div class="wizard-title-area">
                        <span class="wizard-resume-title" id="wiz-title" title="Click to rename" role="button" tabindex="0">Untitled Resume</span>
                        <span class="wizard-status-badge wizard-status-badge--draft" id="wiz-status-badge">Draft</span>
                    </div>
                    <div class="wizard-actions">
                        <div class="completion-ring-wrap" id="completion-ring-wrap">
                            <div class="completion-ring" id="completion-ring">
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                    <circle class="completion-ring__track" cx="24" cy="24" r="18"/>
                                    <circle class="completion-ring__fill" id="ring-fill" cx="24" cy="24" r="18"/>
                                </svg>
                                <div class="completion-ring__pct" id="ring-pct">0%</div>
                            </div>
                            <div class="completion-ring-label">
                                <div class="completion-ring-label__title">Completion</div>
                                <div class="completion-ring-label__sub" id="ring-label-sub">Getting started</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="wizard-progress" id="wizard-progress"></div>

            <!-- Step Panels -->
            <div class="wizard-panels" id="wizard-panels">
                ${WIZARD_STEPS.map(s => `
                    <div class="wizard-panel" id="panel-step-${s.id}" data-step="${s.id}" role="tabpanel" aria-label="${s.title}"></div>
                `).join('')}
            </div>

            <!-- Navigation -->
            <div id="wizard-nav"></div>
        `;

        progressEl      = document.getElementById('wizard-progress');
        panelsContainer = document.getElementById('wizard-panels');
        navEl           = document.getElementById('wizard-nav');
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Render + show a specific panel                                 */
    /* ─────────────────────────────────────────────────────────────── */
    function showPanel(stepId) {
        // Hide all panels
        document.querySelectorAll('.wizard-panel').forEach(el => el.classList.remove('is-active'));

        const panelEl = document.getElementById(`panel-step-${stepId}`);
        if (!panelEl) return;

        // Render panel if not already rendered (or always re-render Review)
        const renderer = STEP_RENDERERS[stepId];
        if (renderer && (!renderedPanels.has(stepId) || stepId === 8)) {
            renderer.render(panelEl);
            renderedPanels.add(stepId);
        }

        panelEl.classList.add('is-active');
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Flush form data into state for the given step                  */
    /* ─────────────────────────────────────────────────────────────── */
    function flushStep(stepId) {
        const renderer = STEP_RENDERERS[stepId];
        if (renderer && typeof renderer.flush === 'function') {
            renderer.flush();
        }
        updateCompletionRing();
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Completion ring — visual only, no calculation logic            */
    /* ─────────────────────────────────────────────────────────────── */
    function updateCompletionRing() {
        // Visual-only: approximates based on which sections have data
        const d = BuilderState.get();
        let filled = 0;
        const total = 7; // 7 content steps (not counting Review)

        if (d.personalInformation.fullName) filled++;
        if (d.education.length > 0) filled++;
        if (d.experience.length > 0) filled++;
        if (d.projects.length > 0) filled++;
        const hasSkills = Object.values(d.skills || {}).some(arr => arr.length > 0);
        if (hasSkills) filled++;
        if (d.certifications.length > 0) filled++;
        if (d.languages.length > 0) filled++;

        const pct = Math.round((filled / total) * 100);
        const circumference = 113;
        const offset = circumference - (circumference * pct / 100);

        const ringFill  = document.getElementById('ring-fill');
        const ringPct   = document.getElementById('ring-pct');
        const ringSub   = document.getElementById('ring-label-sub');

        if (ringFill)  ringFill.style.strokeDashoffset = offset;
        if (ringPct)   ringPct.textContent = `${pct}%`;
        if (ringSub) {
            if (pct === 0)        ringSub.textContent = 'Getting started';
            else if (pct < 40)    ringSub.textContent = 'Keep going!';
            else if (pct < 70)    ringSub.textContent = 'Looking good!';
            else if (pct < 100)   ringSub.textContent = 'Almost done!';
            else                  ringSub.textContent = 'Complete! 🎉';
        }
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Inline title editing                                           */
    /* ─────────────────────────────────────────────────────────────── */
    function initTitleEdit() {
        const titleEl = document.getElementById('wiz-title');
        if (!titleEl) return;

        function startEdit() {
            const current = BuilderState.get().title || 'Untitled Resume';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'wizard-resume-title-input';
            input.value = current;
            input.maxLength = 60;
            titleEl.replaceWith(input);
            input.focus();
            input.select();

            function commitEdit() {
                const newTitle = input.value.trim() || 'Untitled Resume';
                BuilderState.set('title', newTitle);
                const newSpan = document.createElement('span');
                newSpan.id = 'wiz-title';
                newSpan.className = 'wizard-resume-title';
                newSpan.title = 'Click to rename';
                newSpan.role = 'button';
                newSpan.tabIndex = 0;
                newSpan.textContent = newTitle;
                input.replaceWith(newSpan);
                newSpan.addEventListener('click', startEdit);
                newSpan.addEventListener('keydown', e => { if (e.key === 'Enter') startEdit(); });
            }

            input.addEventListener('blur', commitEdit);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { input.value = BuilderState.get().title; commitEdit(); }
            });
        }

        titleEl.addEventListener('click', startEdit);
        titleEl.addEventListener('keydown', e => { if (e.key === 'Enter') startEdit(); });
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Load resume from URL parameter if present                     */
    /* ─────────────────────────────────────────────────────────────── */
    async function initLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const resumeId = urlParams.get('resumeId');

        if (!resumeId) {
            BuilderState.reset();
            return;
        }

        try {
            showToast('Loading resume...', 'info');
            const serverResume = await ResumeService.getById(resumeId);
            if (serverResume) {
                BuilderState.hydrate(serverResume);
                showPanel(BuilderState.getStep());
                updateCompletionRing();
                showToast('Resume loaded successfully', 'success');
            }
        } catch (err) {
            console.error('[ElevateCV] Error loading resume:', err);
            showToast(err.message || 'Failed to load resume. Initialized new draft.', 'error');
            BuilderState.reset();
        }
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Save handler — notified via wizard:save custom event           */
    /* ─────────────────────────────────────────────────────────────── */
    function initSaveHandler() {
        document.addEventListener('wizard:save', async (e) => {
            const saveBtn = document.getElementById('wiz-btn-save');
            const originalBtnHtml = saveBtn ? saveBtn.innerHTML : 'Save Resume';

            if (BuilderState.isSavingNow()) return;

            try {
                // Set loading indicator on button
                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = `
                        <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                        </svg>
                        Saving...
                    `;
                }

                BuilderState.setSaving(true);
                const currentStep = BuilderState.getStep();
                flushStep(currentStep);

                // Validation check
                if (typeof StepValidation !== 'undefined') {
                    const valResult = StepValidation.validate();
                    if (!valResult.isValid) {
                        if (valResult.stepId) {
                            BuilderState.setStep(valResult.stepId);
                        }
                        if (valResult.firstInvalidEl) {
                            setTimeout(() => valResult.firstInvalidEl.focus(), 150);
                        }
                        showToast(valResult.errorMsg || 'Please complete all required fields.', 'error');
                        return;
                    }
                }

                const data = BuilderState.get();
                const existingId = BuilderState.getId();
                let savedResume;

                if (existingId) {
                    savedResume = await ResumeService.update(existingId, data);
                } else {
                    savedResume = await ResumeService.createResume(data);
                }

                if (savedResume && savedResume._id) {
                    BuilderState.setId(savedResume._id);

                    // Update URL silently without full reload
                    const newUrl = `${window.location.pathname}?resumeId=${savedResume._id}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);

                    // Update visual status badge
                    const badge = document.getElementById('wiz-status-badge');
                    if (badge) {
                        badge.textContent = 'Saved';
                        badge.classList.remove('wizard-status-badge--draft');
                        badge.classList.add('wizard-status-badge--saved');
                        setTimeout(() => {
                            badge.textContent = 'Draft';
                            badge.classList.add('wizard-status-badge--draft');
                            badge.classList.remove('wizard-status-badge--saved');
                        }, 4000);
                    }

                    showToast('Resume saved successfully!', 'success');
                }
            } catch (err) {
                console.error('[ElevateCV] Save error:', err);
                showToast(err.message || 'Failed to save resume. Local edits preserved.', 'error');
            } finally {
                BuilderState.setSaving(false);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Toast notification                                             */
    /* ─────────────────────────────────────────────────────────────── */
    function showToast(message, type = 'success') {
        Helpers.showToast(message, type);
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Bootstrap                                                       */
    /* ─────────────────────────────────────────────────────────────── */
    async function init() {
        buildShell();

        // Progress bar component
        ProgressBar.init(progressEl);

        // Navigation component
        WizardNav.init(navEl, {
            onFlush:  (step) => flushStep(step),
            onReview: () => showPanel(8)
        });

        // Show initial panel (Step 1)
        showPanel(BuilderState.getStep());

        // Re-render panel on every step change
        BuilderState.subscribe(step => {
            showPanel(step);
            updateCompletionRing();
        });

        // Inline title editor
        initTitleEdit();

        // Save handler
        initSaveHandler();

        // Load resume if URL contains resumeId
        await initLoad();

        // Initial ring state
        updateCompletionRing();

        // ── Live Preview: attach PreviewRenderer to the right-side panel ──
        const liveCanvas = document.getElementById('live-preview-canvas');
        if (liveCanvas && typeof PreviewRenderer !== 'undefined') {
            PreviewRenderer.attach(liveCanvas);
        }
    }

    return { init };
})();

/* ── Boot on DOM ready ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    ResumeBuilderV2.init();
});


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
    /*  Save handler — notified via wizard:save custom event           */
    /*  (No API call yet — Sprint 3 will hook the actual POST/PUT)     */
    /* ─────────────────────────────────────────────────────────────── */
    function initSaveHandler() {
        document.addEventListener('wizard:save', (e) => {
            const data = e.detail.resumeData;
            console.log('[ElevateCV] Resume data ready for save:', data);

            // Visual feedback
            const badge = document.getElementById('wiz-status-badge');
            if (badge) {
                badge.textContent = 'Saved (local)';
                badge.classList.remove('wizard-status-badge--draft');
                badge.classList.add('wizard-status-badge--saved');
                setTimeout(() => {
                    badge.textContent = 'Draft';
                    badge.classList.add('wizard-status-badge--draft');
                    badge.classList.remove('wizard-status-badge--saved');
                }, 3000);
            }

            // Dispatch a toast notification
            showToast('Resume data captured! API integration coming in Sprint 3.', 'success');
        });
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Toast notification                                             */
    /* ─────────────────────────────────────────────────────────────── */
    function showToast(message, type = 'success') {
        const existing = document.getElementById('wiz-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'wiz-toast';
        toast.textContent = message;

        const isSuccess = type === 'success';
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: isSuccess
                ? 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'
                : 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            padding: '14px 22px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(12px)',
            transition: 'opacity 0.3s, transform 0.3s',
            maxWidth: '340px',
            lineHeight: '1.4'
        });

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(() => toast.remove(), 350);
        }, 4000);
    }

    /* ─────────────────────────────────────────────────────────────── */
    /*  Bootstrap                                                       */
    /* ─────────────────────────────────────────────────────────────── */
    function init() {
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

        // Initial ring state
        updateCompletionRing();
    }

    return { init };
})();

/* ── Boot on DOM ready ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    ResumeBuilderV2.init();
});

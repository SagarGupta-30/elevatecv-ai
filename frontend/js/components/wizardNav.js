/**
 * ElevateCV AI — Wizard Navigation Component
 * Renders the Back / Next / Save bar and drives step transitions.
 * All data flushing (reading form → state) happens on "Next" click.
 */

const WizardNav = (() => {

    let containerEl   = null;
    let onFlush       = null; // callback: (currentStep) → void; reads form into state
    let onReview      = null; // callback: () → void; trigger review render

    /**
     * @param {HTMLElement} el
     * @param {Object} opts
     * @param {Function} opts.onFlush   - Called with current step before advancing; must flush form → state.
     * @param {Function} opts.onReview  - Called when reaching the Review step.
     */
    function init(el, opts = {}) {
        containerEl = el;
        onFlush     = opts.onFlush   || (() => {});
        onReview    = opts.onReview  || (() => {});

        render(BuilderState.getStep());
        BuilderState.subscribe(step => render(step));
    }

    function render(currentStep) {
        if (!containerEl) return;

        const total    = WIZARD_STEPS.length;
        const step     = WIZARD_STEPS.find(s => s.id === currentStep);
        const isFirst  = currentStep === 1;
        const isLast   = currentStep === total;
        const isReview = isLast;

        containerEl.innerHTML = `
            <div class="wizard-nav">
                <div class="wizard-nav__left">
                    ${!isFirst ? `
                        <button type="button" class="btn btn--outline" id="wiz-btn-back">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 5l-7 7 7 7"/>
                            </svg>
                            Back
                        </button>
                    ` : ''}
                </div>

                <div class="wizard-nav__step-info">
                    <strong>${step ? step.title : ''}</strong>
                    Step ${currentStep} of ${total}
                </div>

                <div class="wizard-nav__right">
                    ${isReview ? `
                        <button type="button" class="btn btn--primary" id="wiz-btn-save">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Save Resume
                        </button>
                    ` : `
                        <button type="button" class="btn btn--ghost btn--sm" id="wiz-btn-skip">
                            Skip
                        </button>
                        <button type="button" class="btn btn--primary" id="wiz-btn-next">
                            Next
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    `}
                </div>
            </div>
        `;

        // Bind buttons
        const backBtn = containerEl.querySelector('#wiz-btn-back');
        const nextBtn = containerEl.querySelector('#wiz-btn-next');
        const skipBtn = containerEl.querySelector('#wiz-btn-skip');
        const saveBtn = containerEl.querySelector('#wiz-btn-save');

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (currentStep > 1) BuilderState.setStep(currentStep - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                onFlush(currentStep);
                const nextStep = currentStep + 1;
                BuilderState.setStep(nextStep);
                if (nextStep === total && onReview) onReview();
                // Scroll to top of builder container
                const builderEl = document.querySelector('.builder-container');
                if (builderEl) builderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                const nextStep = currentStep + 1;
                BuilderState.setStep(nextStep);
                if (nextStep === total && onReview) onReview();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Flush final state then dispatch a custom event — builder.js listens for it
                onFlush(currentStep);
                document.dispatchEvent(new CustomEvent('wizard:save', {
                    detail: { resumeData: BuilderState.get() }
                }));
            });
        }
    }

    return { init };
})();

/**
 * ElevateCV AI — Progress Bar Component
 * Renders and updates the wizard progress bar + step bubbles.
 * Reads from WIZARD_STEPS config — no hardcoded step count.
 */

const ProgressBar = (() => {

    let containerEl = null;

    /**
     * @param {HTMLElement} el - The .wizard-progress container element.
     */
    function init(el) {
        containerEl = el;
        render(BuilderState.getStep());

        // Re-render whenever the step changes
        BuilderState.subscribe(step => render(step));
    }

    function render(currentStep) {
        if (!containerEl) return;

        const total = WIZARD_STEPS.length;
        const pct   = Math.round(((currentStep - 1) / (total - 1)) * 100);

        containerEl.innerHTML = `
            <div class="wizard-progress__bar-wrap" role="progressbar" 
                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
                 aria-label="Resume builder progress">
                <div class="wizard-progress__bar" style="width: ${pct}%"></div>
            </div>
            <div class="wizard-steps" role="tablist" aria-label="Wizard steps">
                ${WIZARD_STEPS.map(step => renderStep(step, currentStep)).join('')}
            </div>
        `;

        // Attach click listeners to navigate (only completed or current steps)
        containerEl.querySelectorAll('.wizard-step').forEach(el => {
            const targetStep = parseInt(el.dataset.step, 10);
            el.addEventListener('click', () => {
                // Allow clicking back to any completed step, or forward one step at a time
                if (targetStep <= currentStep) {
                    BuilderState.setStep(targetStep);
                }
            });
        });
    }

    function renderStep(step, currentStep) {
        const isDone   = step.id < currentStep;
        const isActive = step.id === currentStep;
        const classes  = ['wizard-step', isDone ? 'is-done' : '', isActive ? 'is-active' : ''].filter(Boolean).join(' ');
        const checkmark = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>`;

        return `
            <div class="${classes}" data-step="${step.id}" role="tab"
                 aria-selected="${isActive}" aria-label="Step ${step.id}: ${step.label}"
                 title="${step.title}" style="cursor:${step.id <= currentStep ? 'pointer' : 'default'}">
                <div class="wizard-step__bubble">
                    ${isDone ? checkmark : step.id}
                </div>
                <span class="wizard-step__label">${step.label}</span>
            </div>
        `;
    }

    return { init };
})();

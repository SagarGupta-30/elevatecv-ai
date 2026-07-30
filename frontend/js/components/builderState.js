/**
 * ElevateCV AI — Builder State Manager
 * Single source of truth for all resume data in the wizard.
 * No API calls. Pure in-memory state.
 */

const BuilderState = (() => {

    /** @type {Object} resumeData — mirrors the Sprint 2 Mongoose schema exactly */
    let resumeData = createEmptyResume();

    /** @type {number} currentStep — 1-indexed, matches the STEPS array */
    let currentStep = 1;

    /** @type {Array<Function>} listeners — step-change subscribers */
    const listeners = [];

    function createEmptyResume() {
        return {
            title: 'Untitled Resume',
            status: 'draft',
            template: 'default',
            completionPercentage: 0,
            personalInformation: {
                fullName: '', email: '', phone: '',
                address: '', linkedin: '', github: '', portfolio: ''
            },
            professionalSummary: '',
            education: [],
            experience: [],
            projects: [],
            skills: { technical: [], soft: [], tools: [], languages: [] },
            certifications: [],
            achievements: [],
            languages: [],
            interests: []
        };
    }

    function get() {
        return resumeData;
    }

    function set(path, value) {
        // Support dot-notation paths like 'personalInformation.fullName'
        const keys = path.split('.');
        let obj = resumeData;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    }

    function getStep() {
        return currentStep;
    }

    function setStep(n) {
        currentStep = n;
        listeners.forEach(fn => fn(n));
    }

    function subscribe(fn) {
        listeners.push(fn);
    }

    function reset() {
        resumeData = createEmptyResume();
        currentStep = 1;
    }

    return { get, set, getStep, setStep, subscribe, reset, createEmptyResume };
})();

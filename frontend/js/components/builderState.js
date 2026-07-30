/**
 * ElevateCV AI — Builder State Manager (Sprint 2 Step 3 extended)
 * Single source of truth for all resume data in the wizard.
 * No API calls. Pure in-memory state.
 *
 * Sprint 2 Step 3 additions (no existing code removed):
 *   _id          — MongoDB document ID; null until first successful save
 *   hydrate()    — safely merge a server resume document into state
 *   getId()      — return the current _id (or null)
 *   setId()      — store _id after a successful create/update
 *   setSaving()  — lock/unlock the in-flight create guard
 *   isSavingNow()— check if a create request is already in flight
 */

const BuilderState = (() => {

    /** @type {Object} resumeData — mirrors the Sprint 2 Mongoose schema exactly */
    let resumeData = createEmptyResume();

    /** @type {number} currentStep — 1-indexed, matches the STEPS array */
    let currentStep = 1;

    /** @type {Array<Function>} listeners — step-change subscribers */
    const listeners = [];

    /**
     * @type {string|null} _id
     * MongoDB ObjectId of the saved resume document.
     * null = not yet persisted to the database.
     * Set by BuilderController after a successful POST or used on load from URL.
     */
    let _id = null;

    /**
     * @type {boolean} _saving
     * True while a create request is in-flight.
     * Prevents duplicate POST requests on rapid double-clicks.
     */
    let _saving = false;

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
        _id     = null;
        _saving = false;
    }

    /* ── Sprint 2 Step 3 additions ──────────────────────────────────── */

    /** Return the MongoDB _id of the persisted document, or null. */
    function getId() {
        return _id;
    }

    /** Store the MongoDB _id returned by the server after a successful save. */
    function setId(newId) {
        _id = newId || null;
    }

    /**
     * Lock or unlock the in-flight create guard.
     * Call setSaving(true) before a POST, setSaving(false) in the finally block.
     * @param {boolean} value
     */
    function setSaving(value) {
        _saving = Boolean(value);
    }

    /** Returns true if a create request is already in-flight. */
    function isSavingNow() {
        return _saving;
    }

    /**
     * Hydrate the builder state from a server resume document.
     * Safe merge: only copies defined, non-null values so that local
     * unsaved edits are never silently overwritten with undefined.
     *
     * @param {Object} serverResume — document returned by GET /api/resumes/:id
     */
    function hydrate(serverResume) {
        if (!serverResume || typeof serverResume !== 'object') return;

        // Store the server _id
        _id = serverResume._id || null;

        // Safe top-level scalar fields
        const scalars = ['title', 'status', 'template', 'professionalSummary', 'completionPercentage'];
        scalars.forEach(field => {
            if (serverResume[field] !== undefined && serverResume[field] !== null) {
                resumeData[field] = serverResume[field];
            }
        });

        // personalInformation — merge individual sub-fields
        if (serverResume.personalInformation && typeof serverResume.personalInformation === 'object') {
            const pi = serverResume.personalInformation;
            const fields = ['fullName', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio'];
            fields.forEach(f => {
                if (pi[f] !== undefined && pi[f] !== null) {
                    resumeData.personalInformation[f] = pi[f];
                }
            });
        }

        // Array sections — replace only when server returns a non-empty array
        const arraySections = ['education', 'experience', 'projects', 'certifications', 'achievements', 'languages', 'interests'];
        arraySections.forEach(section => {
            if (Array.isArray(serverResume[section]) && serverResume[section].length > 0) {
                resumeData[section] = serverResume[section];
            }
        });

        // skills — nested object of arrays
        if (serverResume.skills && typeof serverResume.skills === 'object') {
            const skillGroups = ['technical', 'soft', 'tools', 'languages'];
            skillGroups.forEach(g => {
                if (Array.isArray(serverResume.skills[g]) && serverResume.skills[g].length > 0) {
                    resumeData.skills[g] = serverResume.skills[g];
                }
            });
        }

        // Update the visible wizard title if the shell has already been built
        const titleEl = document.getElementById('wiz-title');
        if (titleEl && resumeData.title) {
            titleEl.textContent = resumeData.title;
        }
    }

    return { get, set, getStep, setStep, subscribe, reset, createEmptyResume,
             getId, setId, setSaving, isSavingNow, hydrate };
})();

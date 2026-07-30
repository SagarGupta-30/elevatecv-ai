/**
 * ElevateCV AI — Resume Service (Sprint 2 Step 3)
 *
 * Pure API client module. NO UI code, NO DOM access, NO fetch() in components.
 *
 * Responsibilities:
 *   - createResume(data)   → POST   /api/resumes
 *   - getById(id)          → GET    /api/resumes/:id
 *   - list()               → GET    /api/resumes
 *   - update(id, data)     → PUT    /api/resumes/:id
 *   - remove(id)           → DELETE /api/resumes/:id
 *
 * Every method:
 *   ✓ Uses Config.API_BASE (centralised, dev/prod auto-switch)
 *   ✓ Auto-attaches Authorization: Bearer <token> from localStorage
 *   ✓ Handles expired / missing token → clears session, redirects to login
 *   ✓ Uses async/await
 *   ✓ Throws a standardised ApiError object on failure
 *   ✓ Never overwrites defined server fields with undefined
 *
 * NOT in scope (later sprints):
 *   ✗ ATS analysis  (Sprint 4)
 *   ✗ PDF export    (Sprint 5)
 *   ✗ Auto-save     (not in Sprint 3)
 */

const ResumeService = (() => {

    /* ── Standardised error class ───────────────────────────────────── */
    class ApiError extends Error {
        /**
         * @param {string} message  — human-readable description
         * @param {number} status   — HTTP status code
         * @param {string} code     — machine-readable code (e.g. 'NotFound')
         */
        constructor(message, status = 0, code = 'ApiError') {
            super(message);
            this.name    = 'ApiError';
            this.status  = status;
            this.code    = code;
        }
    }

    /* ── In-flight create guard (prevent duplicate POST on double-click) */
    let _creating = false;

    /* ── Private helpers ────────────────────────────────────────────── */

    /**
     * Build request headers — always includes JSON Content-Type and
     * Bearer token if one exists in localStorage.
     * @returns {Object}
     */
    function _headers() {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    /**
     * Handle a 401 Unauthorized response.
     * Clears the stored session and redirects to login after a short delay
     * so that the calling code can still show a toast before the redirect.
     */
    function _handleUnauthorized() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Small delay allows any toast already queued to render
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1800);
    }

    /**
     * Core fetch wrapper.
     * Parses the JSON envelope { success, message, data, error } used
     * throughout the ElevateCV backend and throws ApiError on failures.
     *
     * @param {string} path     — e.g. '/resumes' or '/resumes/abc123'
     * @param {Object} options  — standard fetch options
     * @returns {Promise<any>}  — resolves to response.data on success
     */
    async function _request(path, options = {}) {
        const url = `${Config.API_BASE}${path}`;

        let response;
        try {
            response = await fetch(url, {
                ...options,
                headers: { ..._headers(), ...(options.headers || {}) }
            });
        } catch (networkErr) {
            // fetch() itself threw — network down, DNS failure, etc.
            throw new ApiError(
                'Network error — please check your connection and try again.',
                0,
                'NetworkError'
            );
        }

        /* ── Session expired or invalid token ─── */
        if (response.status === 401) {
            _handleUnauthorized();
            throw new ApiError(
                'Your session has expired. Redirecting to login…',
                401,
                'Unauthorized'
            );
        }

        /* ── Parse JSON body ─── */
        let body;
        try {
            body = await response.json();
        } catch (_) {
            throw new ApiError(
                `Server returned an unreadable response (HTTP ${response.status}).`,
                response.status,
                'ParseError'
            );
        }

        /* ── Handle API-level failures ─── */
        if (!response.ok || body.success === false) {
            throw new ApiError(
                body.message || `Request failed with status ${response.status}.`,
                response.status,
                body.error || 'ApiError'
            );
        }

        return body.data;
    }

    /* ── Public API ─────────────────────────────────────────────────── */

    /**
     * Create a new resume document.
     * Guarded against duplicate in-flight requests (e.g. double-click save).
     *
     * @param {Object} resumeData — full resume payload matching the Mongoose schema
     * @returns {Promise<Object>} — the created resume document (includes _id)
     * @throws {ApiError}
     */
    async function createResume(resumeData) {
        if (_creating) {
            throw new ApiError('A save is already in progress.', 0, 'DuplicateRequest');
        }
        _creating = true;
        try {
            const created = await _request('/resumes', {
                method: 'POST',
                body: JSON.stringify(resumeData)
            });
            return created;
        } finally {
            _creating = false;
        }
    }

    /**
     * Fetch a single resume by its MongoDB _id.
     *
     * @param {string} id — MongoDB ObjectId string
     * @returns {Promise<Object>} — the resume document
     * @throws {ApiError}
     */
    async function getById(id) {
        if (!id) throw new ApiError('Resume ID is required.', 0, 'InvalidArgument');
        return _request(`/resumes/${id}`);
    }

    /**
     * Fetch all resumes belonging to the authenticated user.
     *
     * @returns {Promise<Object[]>} — array of resume documents
     * @throws {ApiError}
     */
    async function list() {
        return _request('/resumes');
    }

    /**
     * Update an existing resume.
     * Strips undefined values so local unsaved fields are never erased.
     *
     * @param {string} id         — MongoDB ObjectId string of the resume to update
     * @param {Object} resumeData — partial or full resume payload
     * @returns {Promise<Object>} — the updated resume document
     * @throws {ApiError}
     */
    async function update(id, resumeData) {
        if (!id) throw new ApiError('Resume ID is required for update.', 0, 'InvalidArgument');

        // Strip undefined top-level fields so the server never receives them
        const payload = Object.fromEntries(
            Object.entries(resumeData).filter(([, v]) => v !== undefined)
        );

        return _request(`/resumes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    /**
     * Delete a resume by ID.
     *
     * @param {string} id — MongoDB ObjectId string
     * @returns {Promise<null>}
     * @throws {ApiError}
     */
    async function remove(id) {
        if (!id) throw new ApiError('Resume ID is required for deletion.', 0, 'InvalidArgument');
        return _request(`/resumes/${id}`, { method: 'DELETE' });
    }

    /* ── Public surface ─────────────────────────────────────────────── */
    return {
        createResume,
        getById,
        list,
        update,
        remove,
        ApiError
    };

})();

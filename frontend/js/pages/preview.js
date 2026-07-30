/**
 * ElevateCV AI — Resume Preview Page Controller (Sprint 2 refactor)
 *
 * Responsibilities:
 *   - Load the user's saved resume list from the API
 *   - Populate the resume selector dropdown
 *   - Load a specific resume on selection
 *   - Delegate ALL rendering to PreviewRenderer (no inline HTML templates)
 *   - Handle print action
 *
 * No rendering logic lives here.
 * No emojis. No template switching.
 * All HTML output is produced by PreviewRenderer.
 *
 * Preserved from Sprint 1:
 *   - apiCall() wrapper with JWT auth
 *   - fetchResumes(), updateResumeSelector(), loadResume()
 *   - handlePrint() using window.print()
 *   - Sidebar toggle / profile dropdown (handled by dashboard.js)
 *   - Auth guard (handled by dashboard.js)
 */

const ResumePreview = (() => {
    const API_BASE = Config.API_BASE + '/resumes';

    /* ── State ──────────────────────────────────────────────────────── */
    let resumesList   = [];
    let currentResume = null;

    /* ── DOM refs ───────────────────────────────────────────────────── */
    const resumeSelector  = Helpers.$('#resume-selector');
    const previewCanvas   = Helpers.$('#preview-canvas');
    const btnPrint        = Helpers.$('#btn-print');

    /* ──────────────────────────────────────────────────────────────────
       API fetch wrapper — attaches JWT, handles 401
    ────────────────────────────────────────────────────────────────── */
    async function apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            throw new Error('Session expired. Redirecting to login…');
        }

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'API request failed');
        }

        return data.data;
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch all resumes for the current user
    ────────────────────────────────────────────────────────────────── */
    async function fetchResumes() {
        try {
            resumesList = await apiCall('');
            updateResumeSelector();

            // If there's a resumeId in the URL, auto-select it
            const urlParams = new URLSearchParams(window.location.search);
            const resumeId  = urlParams.get('resumeId');
            if (resumeId && resumeSelector) {
                resumeSelector.value = resumeId;
                await loadResume();
            }
        } catch (err) {
            console.error('[ElevateCV Preview] Failed to fetch resumes:', err);
            _showError('Failed to load your resumes. Please try refreshing.');
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Populate the selector dropdown
    ────────────────────────────────────────────────────────────────── */
    function updateResumeSelector() {
        if (!resumeSelector) return;

        resumeSelector.innerHTML = '<option value="">-- Select Resume --</option>';

        resumesList.forEach(resume => {
            const option  = document.createElement('option');
            option.value  = resume._id;

            const name    = resume.personalInformation?.fullName;
            const date    = resume.updatedAt
                ? new Date(resume.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
            option.textContent = name ? `${name}  (${date})` : `Resume — ${date}`;
            resumeSelector.appendChild(option);
        });
    }

    /* ──────────────────────────────────────────────────────────────────
       Load and render the selected resume
    ────────────────────────────────────────────────────────────────── */
    async function loadResume() {
        const id = resumeSelector ? resumeSelector.value : null;

        if (!id) {
            currentResume = null;
            if (previewCanvas) {
                previewCanvas.innerHTML = '<p class="rv-empty">Select a resume above to preview it here.</p>';
            }
            return;
        }

        // Show loading state
        if (previewCanvas) {
            previewCanvas.innerHTML = '<p class="rv-empty" style="color:#94a3b8;">Loading resume…</p>';
        }

        try {
            currentResume = await apiCall(`/${id}`);

            // Update URL without reload (nice-to-have for direct linking)
            const newUrl = `${window.location.pathname}?resumeId=${id}`;
            window.history.replaceState({ resumeId: id }, '', newUrl);

            // Render via PreviewRenderer
            if (previewCanvas && typeof PreviewRenderer !== 'undefined') {
                PreviewRenderer.render(currentResume, previewCanvas);
            }

        } catch (err) {
            console.error('[ElevateCV Preview] Failed to load resume:', err);
            _showError(`Failed to load resume: ${err.message}`);
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Print handler
    ────────────────────────────────────────────────────────────────── */
    function handlePrint() {
        if (!currentResume) {
            alert('Please select a resume before printing.');
            return;
        }
        window.print();
    }

    /* ──────────────────────────────────────────────────────────────────
       Internal: display error in preview area
    ────────────────────────────────────────────────────────────────── */
    function _showError(message) {
        if (!previewCanvas) return;
        previewCanvas.innerHTML = `<p class="rv-empty" style="color:#ef4444;">${message}</p>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Init
    ────────────────────────────────────────────────────────────────── */
    function init() {
        if (resumeSelector) {
            resumeSelector.addEventListener('change', loadResume);
        }

        if (btnPrint) {
            btnPrint.addEventListener('click', handlePrint);
        }

        // Fetch resume list on page load
        fetchResumes();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    // Note: dashboard.js also runs, handling auth guard and global UI.
    ResumePreview.init();
});

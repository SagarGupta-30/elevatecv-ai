/**
 * ElevateCV AI — Standalone Cover Letter Workspace Page Renderer
 */

const CoverLetterWorkspace = (() => {
    function render(container, resumeData) {
        document.title = 'Cover Letter Workspace — ElevateCV AI';

        if (!resumeData) {
            container.innerHTML = `
                <div class="workspace-page">
                    <div class="workspace-header">
                        <div class="workspace-header__top">
                            <div class="workspace-breadcrumb">
                                <a href="dashboard.html">Dashboard</a>
                                <span class="workspace-breadcrumb__sep">/</span>
                                <span class="workspace-breadcrumb__current">Cover Letter</span>
                            </div>
                            <button type="button" class="workspace-back-btn" onclick="SpaRouter.navigate('dashboard')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Back to Dashboard
                            </button>
                        </div>
                        <div class="workspace-header__main">
                            <div class="workspace-header__icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                            </div>
                            <div>
                                <h1 class="workspace-header__title">AI Cover Letter Generator</h1>
                                <p class="workspace-header__subtitle">Generate tailored, recruiter-ready cover letters.</p>
                            </div>
                        </div>
                    </div>
                    <div class="workspace-body">
                        <div class="workspace-empty">
                            <div class="workspace-empty__icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                </svg>
                            </div>
                            <h3 class="workspace-empty__title">No Resume Selected</h3>
                            <p class="workspace-empty__text">Create a resume in the Resume Builder first to generate cover letters.</p>
                            <a href="builder.html" class="btn btn--primary">Create Resume</a>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="workspace-page">
                <div class="workspace-header">
                    <div class="workspace-header__top">
                        <div class="workspace-breadcrumb">
                            <a href="dashboard.html">Dashboard</a>
                            <span class="workspace-breadcrumb__sep">/</span>
                            <span class="workspace-breadcrumb__current">Cover Letter</span>
                        </div>
                        <button type="button" class="workspace-back-btn" onclick="SpaRouter.navigate('dashboard')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>
                    <div class="workspace-header__main">
                        <div class="workspace-header__icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <div>
                            <h1 class="workspace-header__title">AI Cover Letter Generator</h1>
                            <p class="workspace-header__subtitle">Active Resume: <strong>${_esc(resumeData.title || resumeData.personalInformation?.fullName || 'Untitled Resume')}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="workspace-body" id="coverletter-workspace-content">
                    <!-- Form & Generated Cover Letter rendered here -->
                </div>
            </div>
        `;

        const contentEl = document.getElementById('coverletter-workspace-content');
        if (typeof CoverLetterGenerator !== 'undefined' && typeof CoverLetterGenerator.renderWorkspace === 'function') {
            CoverLetterGenerator.renderWorkspace(contentEl, resumeData);
        }
    }

    function _esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { render };
})();

window.CoverLetterWorkspace = CoverLetterWorkspace;

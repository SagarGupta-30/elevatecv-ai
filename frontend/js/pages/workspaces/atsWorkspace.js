/**
 * ElevateCV AI — Standalone ATS Analysis Workspace Page Renderer
 */

const AtsWorkspace = (() => {
    function render(container, resumeData) {
        document.title = 'ATS Analysis Workspace — ElevateCV AI';

        if (!resumeData) {
            container.innerHTML = `
                <div class="workspace-page">
                    <div class="workspace-header">
                        <div class="workspace-header__top">
                            <div class="workspace-breadcrumb">
                                <a href="dashboard.html">Dashboard</a>
                                <span class="workspace-breadcrumb__sep">/</span>
                                <span class="workspace-breadcrumb__current">ATS Analysis</span>
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
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>
                            <div>
                                <h1 class="workspace-header__title">ATS Resume Analysis Workspace</h1>
                                <p class="workspace-header__subtitle">Evaluate keyword optimization, section scores, and formatting parseability.</p>
                            </div>
                        </div>
                    </div>
                    <div class="workspace-body">
                        <div class="workspace-empty">
                            <div class="workspace-empty__icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                            </div>
                            <h3 class="workspace-empty__title">No Resume Selected</h3>
                            <p class="workspace-empty__text">Create a resume in the Resume Builder first to run AI ATS Analysis.</p>
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
                            <span class="workspace-breadcrumb__current">ATS Analysis</span>
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
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                        </div>
                        <div>
                            <h1 class="workspace-header__title">ATS Resume Analysis Workspace</h1>
                            <p class="workspace-header__subtitle">Active Resume: <strong>${_esc(resumeData.title || resumeData.personalInformation?.fullName || 'Untitled Resume')}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="workspace-body" id="ats-workspace-content">
                    <!-- Results rendered here -->
                </div>
            </div>
        `;

        const contentEl = document.getElementById('ats-workspace-content');
        if (typeof ResumeAnalyzer !== 'undefined' && typeof ResumeAnalyzer.renderWorkspace === 'function') {
            ResumeAnalyzer.renderWorkspace(contentEl, resumeData);
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

window.AtsWorkspace = AtsWorkspace;

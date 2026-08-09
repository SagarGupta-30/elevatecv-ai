/**
 * ElevateCV AI — Standalone Interview Prep Workspace Page Renderer
 */

const InterviewWorkspace = (() => {
    function render(container, resumeData) {
        document.title = 'Interview Prep Workspace — ElevateCV AI';

        if (!resumeData) {
            container.innerHTML = `
                <div class="workspace-page">
                    <div class="workspace-header">
                        <div class="workspace-header__top">
                            <div class="workspace-breadcrumb">
                                <a href="dashboard.html">Dashboard</a>
                                <span class="workspace-breadcrumb__sep">/</span>
                                <span class="workspace-breadcrumb__current">Interview Prep</span>
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
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 class="workspace-header__title">AI Interview Prep Assistant</h1>
                                <p class="workspace-header__subtitle">Generate customized technical, HR, and project Q&A kits based on your resume.</p>
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
                            <p class="workspace-empty__text">Create a resume in the Resume Builder first to generate interview questions.</p>
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
                            <span class="workspace-breadcrumb__current">Interview Prep</span>
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
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div>
                            <h1 class="workspace-header__title">AI Interview Prep Assistant</h1>
                            <p class="workspace-header__subtitle">Active Resume: <strong>${_esc(resumeData.title || resumeData.personalInformation?.fullName || 'Untitled Resume')}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="workspace-body" id="interview-workspace-content">
                    <!-- Form & Q&A Kits rendered here -->
                </div>
            </div>
        `;

        const contentEl = document.getElementById('interview-workspace-content');
        if (typeof InterviewPrep !== 'undefined' && typeof InterviewPrep.renderWorkspace === 'function') {
            InterviewPrep.renderWorkspace(contentEl, resumeData);
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

window.InterviewWorkspace = InterviewWorkspace;

/**
 * ElevateCV AI - Resume Preview Page
 * Handles fetching, rendering, and template switching for resumes.
 */

const ResumePreview = (() => {
    const API_BASE = 'http://localhost:5000/api/resumes';
    
    // State
    let resumesList = [];
    let currentResume = null;
    let currentTheme = 'theme-professional';

    // DOM Elements
    const resumeSelector = Helpers.$('#resume-selector');
    const previewContainer = Helpers.$('#preview-container');
    const templateBtns = Helpers.$$('.template-btn');
    const btnPrint = Helpers.$('#btn-print');

    /**
     * API Fetch Wrapper with Auth
     */
    async function apiCall(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'API request failed');
        }

        return data.data;
    }

    /**
     * Fetch all resumes for the current user
     */
    async function fetchResumes() {
        try {
            resumesList = await apiCall('');
            updateResumeSelector();
        } catch (error) {
            console.error('Failed to fetch resumes:', error);
            previewContainer.innerHTML = `<div class="preview-empty-state"><p style="color:var(--color-error)">Failed to load resumes.</p></div>`;
        }
    }

    /**
     * Update the Select Dropdown
     */
    function updateResumeSelector() {
        if (!resumeSelector) return;
        
        resumeSelector.innerHTML = '<option value="">-- Select Resume --</option>';
        
        resumesList.forEach(resume => {
            const option = document.createElement('option');
            option.value = resume._id;
            const title = resume.personalInformation?.fullName 
                ? `${resume.personalInformation.fullName} - ${new Date(resume.updatedAt).toLocaleDateString()}` 
                : `Resume (${new Date(resume.updatedAt).toLocaleDateString()})`;
            option.textContent = title;
            resumeSelector.appendChild(option);
        });
    }

    /**
     * Load a specific resume
     */
    async function loadResume() {
        const id = resumeSelector.value;
        if (!id) {
            currentResume = null;
            previewContainer.innerHTML = `<div class="preview-empty-state"><p>Please select a resume to preview.</p></div>`;
            return;
        }

        try {
            previewContainer.innerHTML = `<div class="preview-empty-state"><p>Loading...</p></div>`;
            currentResume = await apiCall(`/${id}`);
            renderResume();
        } catch (error) {
            console.error('Failed to load resume:', error);
            previewContainer.innerHTML = `<div class="preview-empty-state"><p style="color:var(--color-error)">Failed to load resume.</p></div>`;
        }
    }

    /**
     * Generate HTML for a section
     */
    function generateSection(title, items, renderItem) {
        if (!items || items.length === 0) return '';
        
        const itemsHtml = items.map(renderItem).join('');
        return `
            <div class="cv-section">
                <h3 class="cv-section-title">${title}</h3>
                <div class="cv-section-content">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render the Resume into the DOM
     */
    function renderResume() {
        if (!currentResume) return;

        const info = currentResume.personalInformation || {};
        
        // Build Contact Links
        const contactHtml = [
            info.email ? `<div class="cv-contact-item"><span>📧</span> ${info.email}</div>` : '',
            info.phone ? `<div class="cv-contact-item"><span>📱</span> ${info.phone}</div>` : '',
            info.location ? `<div class="cv-contact-item"><span>📍</span> ${info.location}</div>` : '',
            info.linkedin ? `<div class="cv-contact-item"><span>💼</span> ${info.linkedin}</div>` : '',
            info.github ? `<div class="cv-contact-item"><span>💻</span> ${info.github}</div>` : '',
            info.portfolio ? `<div class="cv-contact-item"><span>🌐</span> ${info.portfolio}</div>` : ''
        ].filter(Boolean).join('');

        // Build Skills
        const skillsHtml = currentResume.skills && currentResume.skills.length > 0
            ? `<div class="cv-section">
                 <h3 class="cv-section-title">Skills</h3>
                 <div class="cv-skills-list">
                    ${currentResume.skills.map(skill => `<span class="cv-skill-tag">${skill}</span>`).join('')}
                 </div>
               </div>`
            : '';

        // Build Education
        const eduHtml = generateSection('Education', currentResume.education, edu => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <span class="cv-item-title">${edu.college || ''}</span>
                    <span class="cv-item-date">${edu.startYear || ''} - ${edu.endYear || 'Present'}</span>
                </div>
                <div class="cv-item-subtitle">${edu.degree || ''} ${edu.branch ? 'in ' + edu.branch : ''} ${edu.cgpa ? '| CGPA: ' + edu.cgpa : ''}</div>
            </div>
        `);

        // Build Experience
        const expHtml = generateSection('Experience', currentResume.experience, exp => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <span class="cv-item-title">${exp.role || ''}</span>
                    <span class="cv-item-date">${exp.duration || ''}</span>
                </div>
                <div class="cv-item-subtitle">${exp.company || ''}</div>
                ${exp.responsibilities ? `<div class="cv-item-desc" style="white-space: pre-wrap;">${exp.responsibilities}</div>` : ''}
            </div>
        `);

        // Build Projects
        const projHtml = generateSection('Projects', currentResume.projects, proj => `
            <div class="cv-item">
                <div class="cv-item-header">
                    <span class="cv-item-title">${proj.title || ''}</span>
                    <span class="cv-item-date">
                        ${proj.githubLink ? `<a href="${proj.githubLink}" target="_blank">GitHub</a>` : ''}
                        ${proj.githubLink && proj.liveDemo ? ' | ' : ''}
                        ${proj.liveDemo ? `<a href="${proj.liveDemo}" target="_blank">Live Demo</a>` : ''}
                    </span>
                </div>
                <div class="cv-item-subtitle">${proj.technologies ? 'Tech: ' + proj.technologies : ''}</div>
                ${proj.description ? `<div class="cv-item-desc" style="white-space: pre-wrap;">${proj.description}</div>` : ''}
            </div>
        `);

        // Build Certifications
        const certHtml = generateSection('Certifications', currentResume.certifications, cert => `
            <div class="cv-item">
                <span class="cv-item-title">${cert.name || ''}</span>
            </div>
        `);

        // Build Achievements
        const achHtml = generateSection('Achievements', currentResume.achievements, ach => `
            <div class="cv-item">
                <span class="cv-item-title">${ach.description || ''}</span>
            </div>
        `);

        const summaryHtml = currentResume.summary
            ? `<div class="cv-section cv-summary">
                 <h3 class="cv-section-title">Summary</h3>
                 <div style="white-space: pre-wrap;">${currentResume.summary}</div>
               </div>`
            : '';

        // Assemble Final HTML
        previewContainer.innerHTML = `
            <div class="cv-header">
                <h1 class="cv-name">${info.fullName || 'Anonymous User'}</h1>
                <div class="cv-contact">
                    ${contactHtml}
                </div>
            </div>
            ${summaryHtml}
            ${skillsHtml}
            ${expHtml}
            ${eduHtml}
            ${projHtml}
            ${certHtml}
            ${achHtml}
        `;
    }

    /**
     * Handle Template Switch
     */
    function handleThemeSwitch(e) {
        if (!e.target.classList.contains('template-btn')) return;
        
        // Update active class on buttons
        templateBtns.forEach(btn => btn.classList.remove('is-active'));
        e.target.classList.add('is-active');

        // Update container theme
        const newTheme = e.target.getAttribute('data-theme');
        previewContainer.className = `preview-container ${newTheme}`;
        currentTheme = newTheme;
    }

    /**
     * Handle Print
     */
    function handlePrint() {
        if (!currentResume) {
            alert('Please select a resume to print.');
            return;
        }
        
        // The CSS @media print handles the hiding of UI elements automatically
        window.print();
    }

    /**
     * Initialize Preview Page
     */
    function init() {
        if (resumeSelector) {
            resumeSelector.addEventListener('change', loadResume);
        }
        
        const switcher = Helpers.$('.template-switcher');
        if (switcher) {
            switcher.addEventListener('click', handleThemeSwitch);
        }

        if (btnPrint) {
            btnPrint.addEventListener('click', handlePrint);
        }

        // Fetch initial list
        fetchResumes();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    // Note: Dashboard JS is also running, handling auth and global UI
    ResumePreview.init();
});

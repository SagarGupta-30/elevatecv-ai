/**
 * ElevateCV AI - Resume Builder
 * Handles dynamic form interactions: expand/collapse, adding/removing entries, and skills management.
 * Integrates with Resume CRUD backend.
 */

const ResumeBuilder = (() => {
    const API_BASE = Config.API_BASE + '/resumes';
    
    // State
    let skills = [];
    let currentResumeId = null;
    let resumesList = [];

    // DOM Elements
    const resumeSelector = Helpers.$('#resume-selector');
    const btnLoad = Helpers.$('#btn-load-resume');
    const btnSave = Helpers.$('#btn-save-resume');
    const btnDelete = Helpers.$('#btn-delete-resume');
    const statusText = Helpers.$('#builder-status');

    /**
     * Set UI Status Notification
     */
    function setStatus(message, isError = false) {
        if (!statusText) return;
        statusText.style.display = 'inline-block';
        statusText.style.color = isError ? 'var(--color-error)' : 'var(--color-neutral-500)';
        statusText.textContent = message;
        
        if (!isError && message !== 'Saving...') {
            setTimeout(() => {
                statusText.style.display = 'none';
            }, 3000);
        }
    }

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
        if (!response.ok) {
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
            setStatus('Failed to load resumes', true);
        }
    }

    /**
     * Update the Select Dropdown
     */
    function updateResumeSelector() {
        if (!resumeSelector) return;
        
        // Keep the first option
        resumeSelector.innerHTML = '<option value="">-- Create New Resume --</option>';
        
        resumesList.forEach(resume => {
            const option = document.createElement('option');
            option.value = resume._id;
            // Use name or created date as label
            const title = resume.personalInformation?.fullName 
                ? `${resume.personalInformation.fullName} - ${new Date(resume.updatedAt).toLocaleDateString()}` 
                : `Resume (${new Date(resume.updatedAt).toLocaleDateString()})`;
            option.textContent = title;
            resumeSelector.appendChild(option);
        });

        if (currentResumeId) {
            resumeSelector.value = currentResumeId;
        }
    }

    /**
     * Load a specific resume into the form
     */
    async function loadResume() {
        const id = resumeSelector.value;
        if (!id) {
            // Clear form
            document.getElementById('resume-form').reset();
            currentResumeId = null;
            skills = [];
            renderSkills();
            btnDelete.style.display = 'none';
            // Clear dynamic lists
            ['education-list', 'projects-list', 'experience-list', 'certifications-list', 'achievements-list'].forEach(listId => {
                const list = Helpers.$(`#${listId}`);
                if (list) list.innerHTML = '';
            });
            // Re-add one empty item each
            initDynamicLists(true);
            return;
        }

        try {
            setStatus('Loading...');
            const resume = await apiCall(`/${id}`);
            currentResumeId = resume._id;
            populateForm(resume);
            btnDelete.style.display = 'inline-block';
            setStatus('Resume loaded');
        } catch (error) {
            console.error('Failed to load resume:', error);
            setStatus('Failed to load resume', true);
        }
    }

    /**
     * Populate the form with resume data
     */
    function populateForm(data) {
        // Clear current dynamic lists
        ['education-list', 'projects-list', 'experience-list', 'certifications-list', 'achievements-list'].forEach(listId => {
            const list = Helpers.$(`#${listId}`);
            if (list) list.innerHTML = '';
        });

        const form = document.getElementById('resume-form');
        if (!form) return;

        // Personal Info
        if (data.personalInformation) {
            form.querySelector('[name="fullName"]').value = data.personalInformation.fullName || '';
            form.querySelector('[name="email"]').value = data.personalInformation.email || '';
            form.querySelector('[name="phone"]').value = data.personalInformation.phone || '';
            form.querySelector('[name="location"]').value = data.personalInformation.location || '';
            form.querySelector('[name="linkedin"]').value = data.personalInformation.linkedin || '';
            form.querySelector('[name="github"]').value = data.personalInformation.github || '';
            form.querySelector('[name="portfolio"]').value = data.personalInformation.portfolio || '';
        }

        // Summary
        form.querySelector('[name="summary"]').value = data.summary || '';

        // Education
        if (data.education && data.education.length > 0) {
            data.education.forEach(edu => {
                const node = addDynamicItem('tpl-education', 'education-list');
                if (node) {
                    node.querySelector('[name="edu_college"]').value = edu.college || '';
                    node.querySelector('[name="edu_degree"]').value = edu.degree || '';
                    node.querySelector('[name="edu_branch"]').value = edu.branch || '';
                    node.querySelector('[name="edu_start"]').value = edu.startYear || '';
                    node.querySelector('[name="edu_end"]').value = edu.endYear || '';
                    node.querySelector('[name="edu_cgpa"]').value = edu.cgpa || '';
                }
            });
        }

        // Skills
        skills = data.skills || [];
        renderSkills();

        // Projects
        if (data.projects && data.projects.length > 0) {
            data.projects.forEach(proj => {
                const node = addDynamicItem('tpl-project', 'projects-list');
                if (node) {
                    node.querySelector('[name="proj_title"]').value = proj.title || '';
                    node.querySelector('[name="proj_desc"]').value = proj.description || '';
                    node.querySelector('[name="proj_tech"]').value = proj.technologies || '';
                    node.querySelector('[name="proj_github"]').value = proj.githubLink || '';
                    node.querySelector('[name="proj_live"]').value = proj.liveDemo || '';
                }
            });
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            data.experience.forEach(exp => {
                const node = addDynamicItem('tpl-experience', 'experience-list');
                if (node) {
                    node.querySelector('[name="exp_company"]').value = exp.company || '';
                    node.querySelector('[name="exp_role"]').value = exp.role || '';
                    node.querySelector('[name="exp_duration"]').value = exp.duration || '';
                    node.querySelector('[name="exp_resp"]').value = exp.responsibilities || '';
                }
            });
        }

        // Certifications
        if (data.certifications && data.certifications.length > 0) {
            data.certifications.forEach(cert => {
                const node = addDynamicItem('tpl-certification', 'certifications-list');
                if (node) {
                    node.querySelector('[name="cert_name"]').value = cert.name || '';
                }
            });
        }

        // Achievements
        if (data.achievements && data.achievements.length > 0) {
            data.achievements.forEach(ach => {
                const node = addDynamicItem('tpl-achievement', 'achievements-list');
                if (node) {
                    node.querySelector('[name="achieve_desc"]').value = ach.description || '';
                }
            });
        }
    }

    /**
     * Gather Form Data
     */
    function getFormData() {
        const form = document.getElementById('resume-form');
        if (!form) return null;

        const data = {
            personalInformation: {
                fullName: form.querySelector('[name="fullName"]').value.trim(),
                email: form.querySelector('[name="email"]').value.trim(),
                phone: form.querySelector('[name="phone"]').value.trim(),
                location: form.querySelector('[name="location"]').value.trim(),
                linkedin: form.querySelector('[name="linkedin"]').value.trim(),
                github: form.querySelector('[name="github"]').value.trim(),
                portfolio: form.querySelector('[name="portfolio"]').value.trim()
            },
            summary: form.querySelector('[name="summary"]').value.trim(),
            skills: [...skills],
            education: [],
            projects: [],
            experience: [],
            certifications: [],
            achievements: []
        };

        // Extract dynamic lists
        Helpers.$$('#education-list .dynamic-item').forEach(item => {
            const college = item.querySelector('[name="edu_college"]').value.trim();
            const degree = item.querySelector('[name="edu_degree"]').value.trim();
            const branch = item.querySelector('[name="edu_branch"]').value.trim();
            const startYear = item.querySelector('[name="edu_start"]').value.trim();
            const endYear = item.querySelector('[name="edu_end"]').value.trim();
            const cgpa = item.querySelector('[name="edu_cgpa"]').value.trim();
            if (college || degree || branch || startYear || endYear || cgpa) {
                data.education.push({ college, degree, branch, startYear, endYear, cgpa });
            }
        });

        Helpers.$$('#projects-list .dynamic-item').forEach(item => {
            const title = item.querySelector('[name="proj_title"]').value.trim();
            const description = item.querySelector('[name="proj_desc"]').value.trim();
            const technologies = item.querySelector('[name="proj_tech"]').value.trim();
            const githubLink = item.querySelector('[name="proj_github"]').value.trim();
            const liveDemo = item.querySelector('[name="proj_live"]').value.trim();
            if (title || description || technologies || githubLink || liveDemo) {
                data.projects.push({ title, description, technologies, githubLink, liveDemo });
            }
        });

        Helpers.$$('#experience-list .dynamic-item').forEach(item => {
            const company = item.querySelector('[name="exp_company"]').value.trim();
            const role = item.querySelector('[name="exp_role"]').value.trim();
            const duration = item.querySelector('[name="exp_duration"]').value.trim();
            const responsibilities = item.querySelector('[name="exp_resp"]').value.trim();
            if (company || role || duration || responsibilities) {
                data.experience.push({ company, role, duration, responsibilities });
            }
        });

        Helpers.$$('#certifications-list .dynamic-item').forEach(item => {
            const name = item.querySelector('[name="cert_name"]').value.trim();
            if (name) data.certifications.push({ name });
        });

        Helpers.$$('#achievements-list .dynamic-item').forEach(item => {
            const desc = item.querySelector('[name="achieve_desc"]').value.trim();
            if (desc) data.achievements.push({ description: desc });
        });

        return data;
    }

    /**
     * Save Resume
     */
    async function saveResume() {
        const data = getFormData();
        if (!data) return;

        if (!data.personalInformation.fullName || !data.personalInformation.email) {
            setStatus('Full Name and Email are required', true);
            return;
        }
        if (data.education.length === 0) {
            setStatus('At least one Education entry is required', true);
            return;
        }

        try {
            setStatus('Saving...');
            let resume;
            if (currentResumeId) {
                // Update
                resume = await apiCall(`/${currentResumeId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                setStatus('Resume updated successfully');
            } else {
                // Create
                resume = await apiCall('', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                currentResumeId = resume._id;
                btnDelete.style.display = 'inline-block';
                setStatus('Resume created successfully');
            }
            await fetchResumes(); // Refresh dropdown
        } catch (error) {
            console.error('Failed to save resume:', error);
            setStatus(error.message || 'Failed to save resume', true);
        }
    }

    /**
     * Delete Resume
     */
    async function deleteResume() {
        if (!currentResumeId) return;

        if (!confirm('Are you sure you want to delete this resume?')) return;

        try {
            setStatus('Deleting...');
            await apiCall(`/${currentResumeId}`, { method: 'DELETE' });
            setStatus('Resume deleted successfully');
            currentResumeId = null;
            resumeSelector.value = '';
            loadResume(); // This will clear the form
            await fetchResumes(); // Refresh dropdown
        } catch (error) {
            console.error('Failed to delete resume:', error);
            setStatus('Failed to delete resume', true);
        }
    }

    /**
     * Initialize Section Accordions
     */
    function initAccordions() {
        const headers = Helpers.$$('.builder-section__header');
        
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && !e.target.closest('.builder-section__toggle')) return;

                const targetId = header.getAttribute('data-toggle');
                const body = Helpers.$(`#${targetId}`);
                
                const isExpanded = header.classList.contains('is-expanded');
                
                if (!isExpanded) {
                    header.classList.add('is-expanded');
                    if (body) body.classList.add('is-visible');
                } else {
                    header.classList.remove('is-expanded');
                    if (body) body.classList.remove('is-visible');
                }
            });
        });

        const personalInfoHeader = Helpers.$('[data-toggle="personal-info"]');
        if (personalInfoHeader) {
            personalInfoHeader.click();
        }
    }

    /**
     * Helper to Add Dynamic Items from Template
     */
    function addDynamicItem(templateId, listId) {
        const template = Helpers.$(`#${templateId}`);
        const list = Helpers.$(`#${listId}`);
        
        if (!template || !list) return null;

        const clone = template.content.cloneNode(true);
        const itemNode = clone.querySelector('.dynamic-item');
        
        const removeBtn = itemNode.querySelector('.remove-item');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                itemNode.remove();
            });
        }

        list.appendChild(itemNode);
        return itemNode;
    }

    /**
     * Initialize Dynamic Lists
     */
    function initDynamicLists(forceClear = false) {
        const config = [
            { btnId: 'add-education', tplId: 'tpl-education', listId: 'education-list' },
            { btnId: 'add-project', tplId: 'tpl-project', listId: 'projects-list' },
            { btnId: 'add-experience', tplId: 'tpl-experience', listId: 'experience-list' },
            { btnId: 'add-certification', tplId: 'tpl-certification', listId: 'certifications-list' },
            { btnId: 'add-achievement', tplId: 'tpl-achievement', listId: 'achievements-list' }
        ];

        config.forEach(({ btnId, tplId, listId }) => {
            if (forceClear) {
                // If resetting, just add the initial empty item without re-binding button listener
                addDynamicItem(tplId, listId);
                return;
            }

            const btn = Helpers.$(`#${btnId}`);
            if (btn) {
                btn.addEventListener('click', () => addDynamicItem(tplId, listId));
                addDynamicItem(tplId, listId);
            }
        });
    }

    /**
     * Render Skills
     */
    function renderSkills() {
        const skillsContainer = Helpers.$('#skills-container');
        if (!skillsContainer) return;

        skillsContainer.innerHTML = '';
        skills.forEach((skill, index) => {
            const tag = document.createElement('div');
            tag.className = 'skill-tag';
            
            const text = document.createElement('span');
            text.textContent = skill;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'skill-tag__remove';
            removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            removeBtn.setAttribute('aria-label', 'Remove skill');
            removeBtn.type = 'button';
            
            removeBtn.addEventListener('click', () => {
                skills.splice(index, 1);
                renderSkills();
            });

            tag.appendChild(text);
            tag.appendChild(removeBtn);
            skillsContainer.appendChild(tag);
        });
    }

    /**
     * Initialize Skills Manager
     */
    function initSkills() {
        const skillInput = Helpers.$('#skill-input');
        const addSkillBtn = Helpers.$('#add-skill');

        if (!skillInput || !addSkillBtn) return;

        function addSkill() {
            const val = skillInput.value.trim();
            if (val && !skills.includes(val)) {
                skills.push(val);
                skillInput.value = '';
                renderSkills();
            }
        }

        addSkillBtn.addEventListener('click', addSkill);

        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }

    /**
     * Initialize Builder API binds
     */
    function initAPI() {
        if (resumeSelector) resumeSelector.addEventListener('change', loadResume);
        if (btnLoad) btnLoad.addEventListener('click', loadResume);
        if (btnSave) btnSave.addEventListener('click', saveResume);
        if (btnDelete) btnDelete.addEventListener('click', deleteResume);

        // Initial fetch
        fetchResumes();
    }

    /**
     * Initialize Builder
     */
    function init() {
        initAccordions();
        initDynamicLists();
        initSkills();
        initAPI();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    ResumeBuilder.init();
});

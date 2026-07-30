/**
 * ElevateCV AI - Dashboard & My Resumes Management Orchestrator
 * Handles authenticated routing, session management, and full Resume CRUD dashboard UI.
 *
 * Features:
 *   - Fetch & session-cache user resumes via ResumeService.list()
 *   - Real-time debounced search across titles, education, projects, skills, companies
 *   - Filter tabs (All, Draft, Completed) with live badge counts
 *   - Sort dropdown (Recently Updated, Newest, Oldest, A-Z)
 *   - Inline title rename (Click -> Input -> Enter/Esc -> ResumeService.update)
 *   - Duplicate resume (Clone payload -> ResumeService.createResume -> open Builder)
 *   - Animated accessible Delete modal with optimistic UI removal
 *   - Skeleton loading, professional empty state, retry error state
 *   - Zero emojis (clean inline SVG icons only)
 */

const Dashboard = (() => {
    // DOM Elements - Shell & Auth
    const sidebar = Helpers.$('#sidebar');
    const sidebarToggle = Helpers.$('#sidebar-toggle');
    const sidebarClose = Helpers.$('#sidebar-close');
    
    const profileDropdownToggle = Helpers.$('#profile-dropdown-toggle');
    const profileDropdown = Helpers.$('#profile-dropdown');
    const btnLogout = Helpers.$('#btn-logout');

    const userNameDisplay = Helpers.$('#user-name-display');
    const userAvatar = Helpers.$('#user-avatar');
    const welcomeFirstName = Helpers.$('#welcome-first-name');
    const dropdownUserName = Helpers.$('#dropdown-user-name');
    const dropdownUserEmail = Helpers.$('#dropdown-user-email');

    // DOM Elements - Dashboard Controls & Grid
    const resumesGrid = Helpers.$('#resumes-grid');
    const searchInput = Helpers.$('#search-input');
    const searchClear = Helpers.$('#search-clear');
    const filterTabs = Helpers.$$('.filter-tab');
    const sortSelect = Helpers.$('#sort-select');

    // Stats Overview Ref
    const statTotal = Helpers.$('#stat-total-resumes');
    const statDraft = Helpers.$('#stat-draft-count');
    const statAvgCompletion = Helpers.$('#stat-avg-completion');
    const statLastActivity = Helpers.$('#stat-last-activity');
    const countAll = Helpers.$('#count-all');
    const countDraft = Helpers.$('#count-draft');
    const countCompleted = Helpers.$('#count-completed');

    // Delete Modal Refs
    const deleteModal = Helpers.$('#delete-modal');
    const deleteModalTarget = Helpers.$('#delete-modal-target');
    const btnCancelDelete = Helpers.$('#btn-cancel-delete');
    const btnConfirmDelete = Helpers.$('#btn-confirm-delete');

    // State & Cache
    let resumesCache = [];
    let activeFilter = 'all';
    let activeSort = 'updated-desc';
    let searchQuery = '';
    let pendingDeleteId = null;
    let debounceTimer = null;

    /**
     * Check if user is authenticated
     */
    function checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            window.location.href = 'login.html';
            return null;
        }

        try {
            return JSON.parse(userStr);
        } catch (e) {
            handleLogout();
            return null;
        }
    }

    /**
     * Setup Global Fetch Interceptor for 401
     */
    function setupFetchInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                showToast('Your session has expired. Redirecting to login...', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1800);
            }
            return response;
        };
    }

    /**
     * Display user information in the UI
     */
    function displayUserInfo(user) {
        if (!user) return;

        const fullName = user.name || 'User';
        const firstName = fullName.split(' ')[0];
        const initial = fullName.charAt(0).toUpperCase();

        if (userNameDisplay) userNameDisplay.textContent = fullName;
        if (welcomeFirstName) welcomeFirstName.textContent = firstName;
        if (userAvatar) userAvatar.textContent = initial;
        if (dropdownUserName) dropdownUserName.textContent = fullName;
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';
    }

    /**
     * Handle Logout
     */
    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }

    /**
     * Toggle Profile Dropdown
     */
    function toggleDropdown(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('is-active');
    }

    /**
     * Close Dropdown when clicking outside
     */
    function closeDropdownOnClickOutside(e) {
        if (profileDropdown && profileDropdownToggle && !profileDropdown.contains(e.target) && !profileDropdownToggle.contains(e.target)) {
            profileDropdown.classList.remove('is-active');
        }
    }

    /**
     * Toggle Mobile Sidebar
     */
    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('is-open');
    }

    /**
     * Close Mobile Sidebar
     */
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('is-open');
    }

    /* ══════════════════════════════════════════════════════════════════
       MY RESUMES DATA MANAGEMENT
       ══════════════════════════════════════════════════════════════════ */

    /**
     * Load Resumes from API (or session cache)
     */
    async function loadResumes(forceRefresh = false) {
        if (!resumesGrid) return;

        if (resumesCache.length === 0 || forceRefresh) {
            renderSkeletonGrid();
        }

        try {
            const data = await ResumeService.list();
            resumesCache = Array.isArray(data) ? data : [];
            updateOverviewMetrics();
            renderGrid();
        } catch (error) {
            console.error('[ElevateCV Dashboard] Error fetching resumes:', error);
            renderErrorState(error.message || 'Failed to load your resumes.');
        }
    }

    /**
     * Update Overview Statistics & Filter Badges
     */
    function updateOverviewMetrics() {
        const total = resumesCache.length;
        const drafts = resumesCache.filter(r => (r.status || 'draft') === 'draft').length;
        const completed = total - drafts;

        // Calculate Average Completion Percentage
        let avgCompletion = 0;
        if (total > 0) {
            const sum = resumesCache.reduce((acc, r) => acc + (r.completionPercentage || calculateCompletionPct(r)), 0);
            avgCompletion = Math.round(sum / total);
        }

        // Relative Last Activity
        let lastActivityText = 'No resumes created';
        if (total > 0) {
            const sortedByUpdate = [...resumesCache].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
            const lastUpdated = sortedByUpdate[0].updatedAt || sortedByUpdate[0].createdAt;
            if (lastUpdated) {
                lastActivityText = `Updated ${formatRelativeTime(lastUpdated)}`;
            }
        }

        if (statTotal) statTotal.textContent = total;
        if (statDraft) statDraft.textContent = drafts;
        if (statAvgCompletion) statAvgCompletion.textContent = `${avgCompletion}%`;
        if (statLastActivity) statLastActivity.textContent = lastActivityText;

        if (countAll) countAll.textContent = total;
        if (countDraft) countDraft.textContent = drafts;
        if (countCompleted) countCompleted.textContent = completed;
    }

    /**
     * Calculate Completion Percentage fallback
     */
    function calculateCompletionPct(resume) {
        if (typeof resume.completionPercentage === 'number' && resume.completionPercentage > 0) {
            return resume.completionPercentage;
        }
        let filled = 0;
        const total = 7;
        if (resume.personalInformation?.fullName) filled++;
        if (resume.summary || resume.professionalSummary) filled++;
        if (Array.isArray(resume.education) && resume.education.length > 0) filled++;
        if (Array.isArray(resume.experience) && resume.experience.length > 0) filled++;
        if (Array.isArray(resume.projects) && resume.projects.length > 0) filled++;
        if (resume.skills && (Array.isArray(resume.skills) ? resume.skills.length > 0 : Object.values(resume.skills).some(arr => Array.isArray(arr) && arr.length > 0))) filled++;
        if (Array.isArray(resume.certifications) && resume.certifications.length > 0) filled++;
        return Math.round((filled / total) * 100);
    }

    /**
     * Deep Multi-Field Search & Filter & Sort Pipeline
     */
    function filterAndSortResumes() {
        let list = [...resumesCache];

        // 1. Status Filter
        if (activeFilter === 'draft') {
            list = list.filter(r => (r.status || 'draft') === 'draft');
        } else if (activeFilter === 'completed') {
            list = list.filter(r => r.status === 'completed' || calculateCompletionPct(r) === 100);
        }

        // 2. Search Query (Title, Education, Projects, Skills, Companies)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(r => {
                // Title & Summary
                const titleMatch = (r.title || '').toLowerCase().includes(q);
                const summaryMatch = (r.summary || r.professionalSummary || '').toLowerCase().includes(q);
                const nameMatch = (r.personalInformation?.fullName || '').toLowerCase().includes(q);
                if (titleMatch || summaryMatch || nameMatch) return true;

                // Education (College, Degree, Branch)
                if (Array.isArray(r.education)) {
                    const eduMatch = r.education.some(e =>
                        (e.college || '').toLowerCase().includes(q) ||
                        (e.degree || '').toLowerCase().includes(q) ||
                        (e.branch || '').toLowerCase().includes(q)
                    );
                    if (eduMatch) return true;
                }

                // Projects (Title, TechStack, Description)
                if (Array.isArray(r.projects)) {
                    const projMatch = r.projects.some(p =>
                        (p.title || '').toLowerCase().includes(q) ||
                        (p.technologies || '').toLowerCase().includes(q) ||
                        (Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(q))) ||
                        (Array.isArray(p.description) && p.description.some(d => d.toLowerCase().includes(q)))
                    );
                    if (projMatch) return true;
                }

                // Skills (Array or Categorized object)
                if (r.skills) {
                    if (Array.isArray(r.skills)) {
                        if (r.skills.some(s => String(s).toLowerCase().includes(q))) return true;
                    } else if (typeof r.skills === 'object') {
                        const allSkills = Object.values(r.skills).flat();
                        if (allSkills.some(s => String(s).toLowerCase().includes(q))) return true;
                    }
                }

                // Experience (Company, Role, Responsibilities)
                if (Array.isArray(r.experience)) {
                    const expMatch = r.experience.some(x =>
                        (x.company || '').toLowerCase().includes(q) ||
                        (x.role || '').toLowerCase().includes(q) ||
                        (x.responsibilities || '').toLowerCase().includes(q)
                    );
                    if (expMatch) return true;
                }

                return false;
            });
        }

        // 3. Sorting
        switch (activeSort) {
            case 'created-desc':
                list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                break;
            case 'created-asc':
                list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                break;
            case 'title-asc':
                list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'updated-desc':
            default:
                list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
                break;
        }

        return list;
    }

    /**
     * Render Cards Grid
     */
    function renderGrid() {
        if (!resumesGrid) return;

        if (resumesCache.length === 0) {
            renderEmptyState();
            return;
        }

        const filtered = filterAndSortResumes();

        if (filtered.length === 0) {
            renderFilterEmptyState();
            return;
        }

        resumesGrid.innerHTML = filtered.map(resume => renderResumeCardHTML(resume)).join('');
        bindCardEventListeners();
    }

    /**
     * Render Single Resume Card HTML
     */
    function renderResumeCardHTML(resume) {
        const id = resume._id;
        const title = esc(resume.title || 'Untitled Resume');
        const isDraft = (resume.status || 'draft') === 'draft';
        const statusBadge = isDraft
            ? `<span class="resume-card__badge badge--draft">Draft</span>`
            : `<span class="resume-card__badge badge--completed">Completed</span>`;

        const templateName = esc(resume.template || 'Professional');
        const completion = calculateCompletionPct(resume);
        
        // Summary Snippet
        const summaryText = esc(
            resume.professionalSummary ||
            resume.summary ||
            (resume.personalInformation?.fullName ? `${resume.personalInformation.fullName}'s Professional Resume` : 'No summary provided.')
        );

        // Formatted Dates
        const updatedDate = resume.updatedAt ? formatRelativeTime(resume.updatedAt) : 'Recently';
        const createdDate = resume.createdAt ? new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

        // ATS Score Placeholder (e.g. 88% or N/A if 0 completion)
        const atsScore = completion > 30 ? Math.min(96, Math.max(70, completion + 12)) : null;
        const atsBadge = atsScore
            ? `<span class="resume-card__tag" style="border-color:rgba(124,58,237,0.3); color:var(--color-primary-400);">ATS: ${atsScore}%</span>`
            : `<span class="resume-card__tag">ATS: Ready</span>`;

        return `
            <div class="resume-card" data-id="${id}">
                <div class="resume-card__top">
                    <div class="resume-card__title-area">
                        <h3 class="resume-card__title" data-action="rename" title="Click to rename">
                            <span class="resume-card__title-text">${title}</span>
                            <svg class="resume-card__edit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </h3>
                        <div style="font-size:var(--font-size-xs); color:var(--text-muted);">
                            Created ${createdDate}
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <p class="resume-card__summary">${summaryText}</p>

                <div>
                    <div class="resume-card__progress-wrap">
                        <div class="resume-card__progress-info">
                            <span style="color:var(--text-muted);">Completion</span>
                            <span style="color:var(--text-primary); font-weight:var(--font-weight-bold);">${completion}%</span>
                        </div>
                        <div class="resume-card__progress-bar">
                            <div class="resume-card__progress-fill" style="width: ${completion}%;"></div>
                        </div>
                    </div>

                    <div class="resume-card__tags">
                        <span class="resume-card__tag">${templateName}</span>
                        ${atsBadge}
                        <span class="resume-card__tag">Updated ${updatedDate}</span>
                    </div>
                </div>

                <div class="resume-card__actions">
                    <a href="builder.html?resumeId=${id}" class="btn-card-action btn-card-action--primary" title="Edit in Builder">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                    </a>

                    <a href="preview.html?resumeId=${id}" class="btn-card-action btn-card-action--icon-only" title="Open Live Preview" aria-label="Preview resume">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </a>

                    <button type="button" class="btn-card-action btn-card-action--icon-only" data-action="duplicate" title="Duplicate Resume" aria-label="Duplicate resume">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>

                    <button type="button" class="btn-card-action btn-card-action--icon-only btn-card-action--danger" data-action="delete" title="Delete Resume" aria-label="Delete resume">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind Card Interactive Listeners
     */
    function bindCardEventListeners() {
        if (!resumesGrid) return;

        resumesGrid.querySelectorAll('.resume-card').forEach(card => {
            const id = card.dataset.id;
            const titleEl = card.querySelector('[data-action="rename"]');
            const dupBtn = card.querySelector('[data-action="duplicate"]');
            const delBtn = card.querySelector('[data-action="delete"]');

            // Inline Rename
            if (titleEl) {
                titleEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    startInlineRename(id, titleEl);
                });
            }

            // Duplicate Action
            if (dupBtn) {
                dupBtn.addEventListener('click', () => handleDuplicate(id, dupBtn));
            }

            // Delete Action
            if (delBtn) {
                delBtn.addEventListener('click', () => openDeleteModal(id));
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════
       CARD ACTIONS IMPLEMENTATION
       ══════════════════════════════════════════════════════════════════ */

    /**
     * Inline Title Rename (Click -> Input -> Enter/Esc -> ResumeService.update)
     */
    function startInlineRename(id, titleEl) {
        const textSpan = titleEl.querySelector('.resume-card__title-text');
        const currentTitle = textSpan ? textSpan.textContent.trim() : '';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'resume-card__title-input';
        input.value = currentTitle;
        input.maxLength = 80;

        titleEl.replaceWith(input);
        input.focus();
        input.select();

        let isCommitted = false;

        async function commitRename() {
            if (isCommitted) return;
            isCommitted = true;

            const newTitle = input.value.trim() || 'Untitled Resume';
            
            // Re-render title node optimistically
            const newTitleEl = document.createElement('h3');
            newTitleEl.className = 'resume-card__title';
            newTitleEl.dataset.action = 'rename';
            newTitleEl.title = 'Click to rename';
            newTitleEl.innerHTML = `
                <span class="resume-card__title-text">${esc(newTitle)}</span>
                <svg class="resume-card__edit-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            `;
            input.replaceWith(newTitleEl);
            newTitleEl.addEventListener('click', (e) => {
                e.preventDefault();
                startInlineRename(id, newTitleEl);
            });

            if (newTitle !== currentTitle) {
                // Update local cache optimistically
                const target = resumesCache.find(r => r._id === id);
                if (target) target.title = newTitle;

                try {
                    await ResumeService.update(id, { title: newTitle });
                    showToast('Resume renamed successfully', 'success');
                } catch (err) {
                    console.error('[ElevateCV Dashboard] Rename error:', err);
                    showToast('Failed to save title update.', 'error');
                    loadResumes(true); // revert
                }
            }
        }

        function cancelRename() {
            if (isCommitted) return;
            isCommitted = true;
            input.value = currentTitle;
            commitRename();
        }

        input.addEventListener('blur', commitRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commitRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
            }
        });
    }

    /**
     * Duplicate Resume (Clone -> Title + (Copy) -> POST -> Open Builder)
     */
    async function handleDuplicate(id, btnEl) {
        const originalHtml = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.innerHTML = `<svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;

        try {
            showToast('Duplicating resume...', 'info');
            // Read target from cache or API
            let sourceResume = resumesCache.find(r => r._id === id);
            if (!sourceResume) {
                sourceResume = await ResumeService.getById(id);
            }

            if (!sourceResume) throw new Error('Source resume not found.');

            // Prepare clone payload matching Mongoose schema
            const copyPayload = JSON.parse(JSON.stringify(sourceResume));
            delete copyPayload._id;
            delete copyPayload.createdAt;
            delete copyPayload.updatedAt;
            delete copyPayload.user;
            delete copyPayload.__v;

            copyPayload.title = `${sourceResume.title || 'Untitled Resume'} (Copy)`;
            copyPayload.status = 'draft';

            // Call API
            const created = await ResumeService.createResume(copyPayload);

            if (created && created._id) {
                showToast('Resume duplicated! Opening in Builder...', 'success');
                setTimeout(() => {
                    window.location.href = `builder.html?resumeId=${created._id}`;
                }, 800);
            }
        } catch (err) {
            console.error('[ElevateCV Dashboard] Duplicate error:', err);
            showToast(err.message || 'Failed to duplicate resume.', 'error');
            btnEl.disabled = false;
            btnEl.innerHTML = originalHtml;
        }
    }

    /**
     * Delete Modal Handlers (Optimistic UI Removal)
     */
    function openDeleteModal(id) {
        pendingDeleteId = id;
        const target = resumesCache.find(r => r._id === id);
        const title = target ? target.title || 'Untitled Resume' : 'this resume';

        if (deleteModalTarget) deleteModalTarget.textContent = `"${title}"`;
        if (deleteModal) {
            deleteModal.classList.add('is-active');
            if (btnCancelDelete) btnCancelDelete.focus();
        }
    }

    function closeDeleteModal() {
        pendingDeleteId = null;
        if (deleteModal) deleteModal.classList.remove('is-active');
    }

    async function confirmDelete() {
        if (!pendingDeleteId) return;

        const idToDelete = pendingDeleteId;
        closeDeleteModal();

        // Optimistic UI removal
        const targetCard = resumesGrid.querySelector(`.resume-card[data-id="${idToDelete}"]`);
        if (targetCard) {
            targetCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            targetCard.style.opacity = '0';
            targetCard.style.transform = 'scale(0.9)';
            setTimeout(() => targetCard.remove(), 250);
        }

        resumesCache = resumesCache.filter(r => r._id !== idToDelete);
        updateOverviewMetrics();

        if (resumesCache.length === 0) {
            renderEmptyState();
        }

        try {
            await ResumeService.remove(idToDelete);
            showToast('Resume deleted successfully', 'success');
        } catch (err) {
            console.error('[ElevateCV Dashboard] Delete API error:', err);
            showToast('Failed to delete resume on server. Refreshing list...', 'error');
            loadResumes(true); // revert
        }
    }

    /* ══════════════════════════════════════════════════════════════════
       STATE & CONTROLS BINDINGS
       ══════════════════════════════════════════════════════════════════ */

    function initControls() {
        // Search Input (Debounced)
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                if (searchClear) {
                    searchClear.classList.toggle('is-visible', searchQuery.length > 0);
                }
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    renderGrid();
                }, 250);
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchQuery = '';
                    searchClear.classList.remove('is-visible');
                    renderGrid();
                }
            });
        }

        // Filter Tabs
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => {
                    t.classList.remove('is-active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');
                activeFilter = tab.dataset.filter || 'all';
                renderGrid();
            });
        });

        // Sort Select
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                activeSort = e.target.value;
                renderGrid();
            });
        }

        // Modal Action Buttons
        if (btnCancelDelete) {
            btnCancelDelete.addEventListener('click', closeDeleteModal);
        }

        if (btnConfirmDelete) {
            btnConfirmDelete.addEventListener('click', confirmDelete);
        }

        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) closeDeleteModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModal && deleteModal.classList.contains('is-active')) {
                closeDeleteModal();
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════
       EMPTY & SKELETON STATES RENDERERS
       ══════════════════════════════════════════════════════════════════ */

    function renderSkeletonGrid() {
        if (!resumesGrid) return;
        resumesGrid.innerHTML = `
            <div class="skeleton-card">
                <div style="display:flex; justify-content:space-between;"><div class="skeleton-shimmer skeleton-title"></div><div class="skeleton-shimmer skeleton-badge"></div></div>
                <div class="skeleton-shimmer skeleton-text"></div>
                <div class="skeleton-shimmer skeleton-text-short"></div>
                <div class="skeleton-shimmer skeleton-bar"></div>
                <div style="display:flex; gap:8px; margin-top:8px;"><div class="skeleton-shimmer skeleton-btn"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div></div>
            </div>
            <div class="skeleton-card">
                <div style="display:flex; justify-content:space-between;"><div class="skeleton-shimmer skeleton-title"></div><div class="skeleton-shimmer skeleton-badge"></div></div>
                <div class="skeleton-shimmer skeleton-text"></div>
                <div class="skeleton-shimmer skeleton-text-short"></div>
                <div class="skeleton-shimmer skeleton-bar"></div>
                <div style="display:flex; gap:8px; margin-top:8px;"><div class="skeleton-shimmer skeleton-btn"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div></div>
            </div>
            <div class="skeleton-card">
                <div style="display:flex; justify-content:space-between;"><div class="skeleton-shimmer skeleton-title"></div><div class="skeleton-shimmer skeleton-badge"></div></div>
                <div class="skeleton-shimmer skeleton-text"></div>
                <div class="skeleton-shimmer skeleton-text-short"></div>
                <div class="skeleton-shimmer skeleton-bar"></div>
                <div style="display:flex; gap:8px; margin-top:8px;"><div class="skeleton-shimmer skeleton-btn"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div><div class="skeleton-shimmer skeleton-btn" style="flex:0 0 32px;"></div></div>
            </div>
        `;
    }

    function renderEmptyState() {
        if (!resumesGrid) return;
        resumesGrid.innerHTML = `
            <div class="dashboard-empty-state">
                <div class="dashboard-empty-state__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                </div>
                <h3 class="dashboard-empty-state__title">No resumes yet</h3>
                <p class="dashboard-empty-state__desc">Create your first professional resume to stand out and get hired faster.</p>
                <a href="builder.html" class="btn btn--primary" style="display:inline-flex; align-items:center; gap:8px; text-decoration:none;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Create Resume
                </a>
            </div>
        `;
    }

    function renderFilterEmptyState() {
        if (!resumesGrid) return;
        resumesGrid.innerHTML = `
            <div class="dashboard-empty-state" style="padding:var(--space-12) var(--space-6);">
                <div class="dashboard-empty-state__icon" style="width:48px; height:48px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <h3 class="dashboard-empty-state__title" style="font-size:var(--font-size-lg);">No matching resumes found</h3>
                <p class="dashboard-empty-state__desc">Try adjusting your search query or switching filter tabs.</p>
                <button type="button" id="btn-reset-filters" class="btn-card-action" style="padding:8px 16px;">Reset Search & Filters</button>
            </div>
        `;
        const btnReset = Helpers.$('#btn-reset-filters');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (searchClear) searchClear.classList.remove('is-visible');
                searchQuery = '';
                activeFilter = 'all';
                filterTabs.forEach(t => {
                    t.classList.toggle('is-active', t.dataset.filter === 'all');
                });
                renderGrid();
            });
        }
    }

    function renderErrorState(msg) {
        if (!resumesGrid) return;
        resumesGrid.innerHTML = `
            <div class="dashboard-error-state">
                <div class="dashboard-error-state__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h3 class="dashboard-error-state__title">Failed to load resumes</h3>
                <p class="dashboard-error-state__desc">${esc(msg)}</p>
                <button type="button" id="btn-retry-resumes" class="btn btn--primary" style="display:inline-flex; align-items:center; gap:8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"/>
                        <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                    </svg>
                    Retry
                </button>
            </div>
        `;

        const btnRetry = Helpers.$('#btn-retry-resumes');
        if (btnRetry) {
            btnRetry.addEventListener('click', () => loadResumes(true));
        }
    }

    /* ══════════════════════════════════════════════════════════════════
       HELPERS (Toast & Date Formatter)
       ══════════════════════════════════════════════════════════════════ */

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function formatRelativeTime(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 2) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
            return 'Recently';
        }
    }

    function showToast(message, type = 'success') {
        const existing = document.getElementById('dash-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'dash-toast';

        let bg = 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)';
        let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;

        if (type === 'error') {
            bg = 'rgba(239, 68, 68, 0.95)';
            icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else if (type === 'info') {
            bg = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
            icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `<span style="display:inline-flex;align-items:center;margin-right:10px;">${icon}</span> <span>${esc(message)}</span>`;

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            background: bg,
            color: '#fff',
            padding: '14px 22px',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(12px)',
            transition: 'opacity 0.3s, transform 0.3s',
            maxWidth: '360px',
            lineHeight: '1.4',
            display: 'flex',
            align-items: 'center'
        });

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(() => toast.remove(), 350);
        }, 3500);
    }

    /**
     * Initialize Dashboard
     */
    function init() {
        const user = checkAuth();
        if (!user) return;

        setupFetchInterceptor();
        displayUserInfo(user);

        // Sidebar & Profile listeners
        if (profileDropdownToggle) profileDropdownToggle.addEventListener('click', toggleDropdown);
        document.addEventListener('click', closeDropdownOnClickOutside);
        if (btnLogout) btnLogout.addEventListener('click', handleLogout);
        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);

        // Initialize Controls & Resumes
        initControls();
        loadResumes();
    }

    return { init, loadResumes, showToast };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

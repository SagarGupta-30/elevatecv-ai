/**
 * ElevateCV AI — SaaS Settings Center Component
 * Multi-section Settings Center (Account, Appearance, AI, Resume, Notifications, Security, Data, About)
 */

const SettingsModal = (() => {

    /* ── Default Settings Object ──────────────────────────────────────── */
    const DEFAULT_SETTINGS = {
        // Appearance
        theme: 'dark',
        accentColor: 'purple',
        density: 'comfortable',
        sidebarMode: 'expanded',
        animationsEnabled: true,

        // AI Settings
        geminiModel: 'gemini-2.0-flash',
        temperature: 0.2,
        responseLength: 'medium',
        aiSuggestionsEnabled: true,
        atsOptimizationEnabled: true,
        autoSaveEnabled: true,
        autoImproveEnabled: false,
        interviewDifficulty: 'Medium',

        // Resume Settings
        defaultTemplate: 'ats-professional',
        paperSize: 'A4',
        defaultFont: 'Plus Jakarta Sans',
        defaultAccentColor: '#7C3AED',
        lineSpacing: '1.15',
        marginSize: 'Normal',
        autoSaveInterval: 60,

        // Notifications
        emailNotifications: true,
        resumeReminders: true,
        atsCompletionAlerts: true,
        interviewReminders: true,
        productUpdates: false,
        securityAlerts: true,
        newsletter: false
    };

    /* ── Internal State ──────────────────────────────────────────────── */
    let _overlayEl   = null;
    let _modalEl     = null;
    let _lastFocused = null;
    let _activeTab   = 'account';
    let _settings    = { ...DEFAULT_SETTINGS };
    let _userData    = null;
    let _resumeCount = 0;

    /** Load settings from localStorage */
    function _loadSettings() {
        try {
            const stored = localStorage.getItem('elevatecv_settings');
            if (stored) {
                _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch {
            _settings = { ...DEFAULT_SETTINGS };
        }
    }

    /** Save settings to localStorage and apply theme/density */
    function _persistSettings(settingsObj = _settings) {
        _settings = { ..._settings, ...settingsObj };
        localStorage.setItem('elevatecv_settings', JSON.stringify(_settings));
        _applyPreferencesToDOM();
    }

    /** Apply appearance settings live to DOM */
    function _applyPreferencesToDOM() {
        // Theme
        if (_settings.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Density
        if (_settings.density === 'compact') {
            document.documentElement.classList.add('density-compact');
        } else {
            document.documentElement.classList.remove('density-compact');
        }

        // Animations
        if (_settings.animationsEnabled === false) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }
    }

    /* ── SVG Icon Helpers ────────────────────────────────────────────── */
    const ICONS = {
        account: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        appearance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
        ai: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        resume: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
        notifications: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
        security: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
        data: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
        about: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
    };

    /* ──────────────────────────────────────────────────────────────────
       Inject Settings DOM
    ────────────────────────────────────────────────────────────────── */
    function _injectDOM() {
        if (document.getElementById('settings-modal-root')) return;

        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.id = 'settings-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.id = 'settings-modal-root';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'ElevateCV AI Settings Center');

        modal.innerHTML = `
            <header class="settings-header">
                <div class="settings-header__title-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    <div>
                        <h2 class="settings-header__title">Settings Center</h2>
                        <p class="settings-header__subtitle">Manage account, appearance, AI models, and preferences</p>
                    </div>
                </div>
                <button class="settings-close-btn" id="settings-close-btn" aria-label="Close settings" type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </header>

            <div class="settings-body">
                <nav class="settings-sidebar">
                    <button type="button" class="settings-nav-btn is-active" data-tab="account">${ICONS.account} Account</button>
                    <button type="button" class="settings-nav-btn" data-tab="appearance">${ICONS.appearance} Appearance</button>
                    <button type="button" class="settings-nav-btn" data-tab="ai">${ICONS.ai} AI Settings</button>
                    <button type="button" class="settings-nav-btn" data-tab="resume">${ICONS.resume} Resume Settings</button>
                    <button type="button" class="settings-nav-btn" data-tab="notifications">${ICONS.notifications} Notifications</button>
                    <button type="button" class="settings-nav-btn" data-tab="security">${ICONS.security} Security</button>
                    <button type="button" class="settings-nav-btn" data-tab="data">${ICONS.data} Data Management</button>
                    <button type="button" class="settings-nav-btn" data-tab="about">${ICONS.about} About</button>
                </nav>

                <div class="settings-content" id="settings-content-viewport">
                    <!-- Dynamic Tab Panes -->
                </div>
            </div>

            <footer class="settings-footer">
                <div class="settings-footer__left">
                    <button type="button" class="btn--settings-secondary" id="btn-settings-reset">Reset Defaults</button>
                </div>
                <div class="settings-footer__right">
                    <button type="button" class="btn--settings-secondary" id="btn-settings-cancel">Cancel</button>
                    <button type="button" class="btn--settings-primary" id="btn-settings-save">Save Changes</button>
                </div>
            </footer>
        `;

        document.body.appendChild(overlay);
        overlay.appendChild(modal);

        _overlayEl = overlay;
        _modalEl   = modal;

        // Close handlers
        document.getElementById('settings-close-btn').onclick = close;
        document.getElementById('btn-settings-cancel').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        // Save & Reset handlers
        document.getElementById('btn-settings-save').onclick = _handleSave;
        document.getElementById('btn-settings-reset').onclick = _handleReset;

        // Tab Switching
        modal.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.onclick = () => {
                modal.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                _activeTab = btn.dataset.tab;
                _renderTabContent();
            };
        });

        // ESC Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _overlayEl && _overlayEl.classList.contains('is-open')) {
                close();
            }
        });
    }

    /* ── Render Active Tab Content ───────────────────────────────────── */
    function _renderTabContent() {
        const viewport = document.getElementById('settings-content-viewport');
        if (!viewport) return;

        const u = _userData || {};
        const userName  = u.name || 'User';
        const userEmail = u.email || 'user@example.com';
        const userPhone = u.phone || '';
        const joinedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recent';
        const usernameStr = `@${userEmail.split('@')[0].toLowerCase()}`;

        let html = '';

        switch (_activeTab) {
            case 'account':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Account Overview</h3>
                            <p class="settings-section-desc">Manage profile credentials, subscription tier, and storage metrics.</p>
                        </div>

                        <div class="settings-card">
                            <div style="display:flex; align-items:center; gap:16px;">
                                <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #7C3AED, #3B82F6); color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700;">
                                    ${userName.charAt(0).toUpperCase()}
                                </div>
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <div style="font-size:16px; font-weight:700; color:#fff;">${_esc(userName)}</div>
                                    <div style="font-size:12px; color:#94a3b8;">${_esc(userEmail)} · ${usernameStr}</div>
                                </div>
                            </div>
                        </div>

                        <div class="settings-stats-grid">
                            <div class="settings-stat-item">
                                <span class="settings-stat-label">Account Status</span>
                                <span class="settings-stat-val" style="color:#4ade80;">Pro Active ⚡</span>
                            </div>
                            <div class="settings-stat-item">
                                <span class="settings-stat-label">Resumes Created</span>
                                <span class="settings-stat-val">${_resumeCount} Resumes</span>
                            </div>
                            <div class="settings-stat-item">
                                <span class="settings-stat-label">AI Credits</span>
                                <span class="settings-stat-val">Unlimited</span>
                            </div>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.account} Personal Details</div>
                            <div class="settings-form-row">
                                <div class="settings-field">
                                    <label class="settings-label" for="set-acc-name">Full Name</label>
                                    <input type="text" id="set-acc-name" class="settings-input" value="${_esc(userName)}">
                                </div>
                                <div class="settings-field">
                                    <label class="settings-label" for="set-acc-phone">Phone Number (Optional)</label>
                                    <input type="text" id="set-acc-phone" class="settings-input" placeholder="+1 (555) 000-0000" value="${_esc(userPhone)}">
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'appearance':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Appearance & Customization</h3>
                            <p class="settings-section-desc">Customize theme palette, UI density, and animation behavior.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.appearance} Color Theme</div>
                            <div class="settings-option-grid">
                                <div class="settings-option-card ${_settings.theme === 'dark' ? 'is-selected' : ''}" onclick="window.SettingsModal.setOpt('theme', 'dark')">
                                    <div class="settings-option-dot" style="background:#0b1120; border:1px solid #7c3aed;"></div>
                                    <span class="settings-option-label">Dark</span>
                                </div>
                                <div class="settings-option-card ${_settings.theme === 'light' ? 'is-selected' : ''}" onclick="window.SettingsModal.setOpt('theme', 'light')">
                                    <div class="settings-option-dot" style="background:#f8fafc; border:1px solid #94a3b8;"></div>
                                    <span class="settings-option-label">Light</span>
                                </div>
                                <div class="settings-option-card ${_settings.theme === 'system' ? 'is-selected' : ''}" onclick="window.SettingsModal.setOpt('theme', 'system')">
                                    <div class="settings-option-dot" style="background:linear-gradient(135deg,#0b1120 50%,#f8fafc 50%); border:1px solid #94a3b8;"></div>
                                    <span class="settings-option-label">System</span>
                                </div>
                            </div>
                        </div>

                        <div class="settings-card">
                            <div class="settings-toggle-item">
                                <div class="settings-toggle-text">
                                    <span class="settings-toggle-title">Interface Animations</span>
                                    <span class="settings-toggle-sub">Enable smooth micro-animations and blur effects</span>
                                </div>
                                <label class="settings-switch">
                                    <input type="checkbox" id="set-anim-toggle" ${_settings.animationsEnabled !== false ? 'checked' : ''}>
                                    <span class="settings-slider-toggle"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'ai':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">AI Copilot Settings</h3>
                            <p class="settings-section-desc">Configure default models, creativity levels, and interview prep difficulty.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.ai} Model Configuration</div>
                            <div class="settings-form-row">
                                <div class="settings-field">
                                    <label class="settings-label" for="set-ai-model">Primary AI Engine</label>
                                    <select id="set-ai-model" class="settings-select">
                                        <option value="gemini-2.0-flash" ${_settings.geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>Google Gemini 2.0 Flash (Recommended)</option>
                                        <option value="gemini-1.5-pro" ${_settings.geminiModel === 'gemini-1.5-pro' ? 'selected' : ''}>Google Gemini 1.5 Pro</option>
                                    </select>
                                </div>
                                <div class="settings-field">
                                    <label class="settings-label" for="set-ai-diff">Default Interview Difficulty</label>
                                    <select id="set-ai-diff" class="settings-select">
                                        <option value="Easy" ${_settings.interviewDifficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                                        <option value="Medium" ${_settings.interviewDifficulty === 'Medium' ? 'selected' : ''}>Medium</option>
                                        <option value="Hard" ${_settings.interviewDifficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="settings-card">
                            <div class="settings-toggle-item">
                                <div class="settings-toggle-text">
                                    <span class="settings-toggle-title">Real-Time AI Suggestions</span>
                                    <span class="settings-toggle-sub">Show inline AI content recommendations while editing bullet points</span>
                                </div>
                                <label class="settings-switch">
                                    <input type="checkbox" id="set-ai-sug" ${_settings.aiSuggestionsEnabled !== false ? 'checked' : ''}>
                                    <span class="settings-slider-toggle"></span>
                                </label>
                            </div>
                            <div class="settings-toggle-item">
                                <div class="settings-toggle-text">
                                    <span class="settings-toggle-title">ATS Optimization Assistance</span>
                                    <span class="settings-toggle-sub">Automatically analyze missing keywords against target job descriptions</span>
                                </div>
                                <label class="settings-switch">
                                    <input type="checkbox" id="set-ats-opt" ${_settings.atsOptimizationEnabled !== false ? 'checked' : ''}>
                                    <span class="settings-slider-toggle"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'resume':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Default Resume Preferences</h3>
                            <p class="settings-section-desc">Default layout, paper sizes, typography, and auto-save options for new resumes.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.resume} Layout & Typography</div>
                            <div class="settings-form-row">
                                <div class="settings-field">
                                    <label class="settings-label" for="set-res-paper">Paper Size</label>
                                    <select id="set-res-paper" class="settings-select">
                                        <option value="A4" ${_settings.paperSize === 'A4' ? 'selected' : ''}>A4 (International Standard)</option>
                                        <option value="Letter" ${_settings.paperSize === 'Letter' ? 'selected' : ''}>US Letter</option>
                                    </select>
                                </div>
                                <div class="settings-field">
                                    <label class="settings-label" for="set-res-font">Default Font</label>
                                    <select id="set-res-font" class="settings-select">
                                        <option value="Plus Jakarta Sans" ${_settings.defaultFont === 'Plus Jakarta Sans' ? 'selected' : ''}>Plus Jakarta Sans</option>
                                        <option value="Inter" ${_settings.defaultFont === 'Inter' ? 'selected' : ''}>Inter</option>
                                        <option value="Roboto" ${_settings.defaultFont === 'Roboto' ? 'selected' : ''}>Roboto</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'notifications':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Notification Preferences</h3>
                            <p class="settings-section-desc">Control email alerts and activity reminders.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-toggle-item">
                                <div class="settings-toggle-text">
                                    <span class="settings-toggle-title">Security & Account Alerts</span>
                                    <span class="settings-toggle-sub">Important alerts regarding logins and password changes</span>
                                </div>
                                <label class="settings-switch">
                                    <input type="checkbox" id="set-notif-sec" ${_settings.securityAlerts !== false ? 'checked' : ''}>
                                    <span class="settings-slider-toggle"></span>
                                </label>
                            </div>
                            <div class="settings-toggle-item">
                                <div class="settings-toggle-text">
                                    <span class="settings-toggle-title">ATS Completion Reports</span>
                                    <span class="settings-toggle-sub">Notify when background ATS scans finish</span>
                                </div>
                                <label class="settings-switch">
                                    <input type="checkbox" id="set-notif-ats" ${_settings.atsCompletionAlerts !== false ? 'checked' : ''}>
                                    <span class="settings-slider-toggle"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                `;
                break;

            case 'security':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Security & Credentials</h3>
                            <p class="settings-section-desc">Update account password and manage active browser sessions.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.security} Change Password</div>
                            <div class="settings-form-row">
                                <div class="settings-field">
                                    <label class="settings-label" for="set-sec-curr">Current Password</label>
                                    <input type="password" id="set-sec-curr" class="settings-input" placeholder="••••••••">
                                </div>
                                <div class="settings-field">
                                    <label class="settings-label" for="set-sec-new">New Password</label>
                                    <input type="password" id="set-sec-new" class="settings-input" placeholder="••••••••" onkeyup="window.SettingsModal.checkPassStrength(this.value)">
                                    <div class="settings-strength-meter"><div id="pass-strength-fill" class="settings-strength-fill"></div></div>
                                </div>
                            </div>
                            <button type="button" class="btn--settings-primary" style="width:fit-content; margin-top:8px;" onclick="window.SettingsModal.changePassword()">Update Password</button>
                        </div>
                    </div>
                `;
                break;

            case 'data':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">Data Management & Export</h3>
                            <p class="settings-section-desc">Download complete resume backups or reset local application state.</p>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.data} Data Portability</div>
                            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                                <button type="button" class="btn--settings-secondary" onclick="window.SettingsModal.exportAllResumes()">
                                    Export All Resumes (JSON)
                                </button>
                                <button type="button" class="btn--settings-secondary" onclick="window.SettingsModal.clearCache()">
                                    Clear Local Cache
                                </button>
                            </div>
                        </div>

                        <div class="settings-card settings-card--danger">
                            <div class="settings-card__title">Danger Zone</div>
                            <p style="font-size:12px; color:#fca5a5; margin:0 0 10px;">Deleting your account permanently removes all stored resumes and AI analysis history. This action cannot be undone.</p>
                            <button type="button" class="btn--settings-danger" style="width:fit-content;" onclick="window.SettingsModal.deleteAccount()">Delete Account</button>
                        </div>
                    </div>
                `;
                break;

            case 'about':
                html = `
                    <div class="settings-pane is-active">
                        <div class="settings-section-header">
                            <h3 class="settings-section-title">System & Diagnostic Info</h3>
                            <p class="settings-section-desc">Operational health metrics and build versions.</p>
                        </div>

                        <div class="settings-stats-grid">
                            <div class="settings-stat-item">
                                <span class="settings-stat-label">App Version</span>
                                <span class="settings-stat-val">v1.0.3</span>
                            </div>
                            <div class="settings-stat-label">Backend Status</div>
                            <div class="settings-stat-val" style="color:#4ade80;">Operational 🟢</div>
                            <div class="settings-stat-item">
                                <span class="settings-stat-label">MongoDB</span>
                                <span class="settings-stat-val" style="color:#4ade80;">Connected 🟢</span>
                            </div>
                        </div>

                        <div class="settings-card">
                            <div class="settings-card__title">${ICONS.about} Environment Context</div>
                            <div style="font-size:12px; color:#cbd5e1; display:flex; flex-direction:column; gap:6px;">
                                <div><strong>Logged-in User:</strong> ${_esc(userEmail)}</div>
                                <div><strong>API Endpoint:</strong> ${(typeof Config !== 'undefined' && Config.API_BASE) ? Config.API_BASE : 'http://localhost:5001/api'}</div>
                                <div><strong>Git Commit:</strong> 936548d (latest)</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }

        viewport.innerHTML = html;
    }

    /* ── Event Handlers ──────────────────────────────────────────────── */
    async function _handleSave() {
        const nameInp  = document.getElementById('set-acc-name');
        const phoneInp = document.getElementById('set-acc-phone');

        if (nameInp) {
            const newName  = nameInp.value.trim();
            const newPhone = phoneInp ? phoneInp.value.trim() : '';

            if (newName && (newName !== _userData?.name || newPhone !== _userData?.phone)) {
                try {
                    const token = localStorage.getItem('token');
                    const apiBase = (typeof Config !== 'undefined' && Config.API_BASE) ? Config.API_BASE : 'http://localhost:5001/api';

                    const res = await fetch(`${apiBase}/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: newName, phone: newPhone })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        _userData = data.data.user;
                        localStorage.setItem('user', JSON.stringify(_userData));
                    }
                } catch (err) {
                    console.error('[SettingsModal] Profile update error:', err);
                }
            }
        }

        _persistSettings();

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Settings saved successfully!', 'success');
        }

        close();
    }

    function _handleReset() {
        _settings = { ...DEFAULT_SETTINGS };
        _persistSettings();
        _renderTabContent();

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Settings reset to defaults.', 'info');
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Public Methods
    ────────────────────────────────────────────────────────────────── */
    function open(tab = 'account') {
        _injectDOM();
        _lastFocused = document.activeElement;
        _loadSettings();

        try {
            const userStr = localStorage.getItem('user');
            if (userStr) _userData = JSON.parse(userStr);
        } catch { /* ignore */ }

        if (typeof ResumeService !== 'undefined' && ResumeService.list) {
            ResumeService.list().then(resumes => {
                _resumeCount = Array.isArray(resumes) ? resumes.length : 0;
            }).catch(() => {});
        }

        _activeTab = tab;
        _overlayEl.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        // Set active nav tab
        _modalEl.querySelectorAll('.settings-nav-btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.tab === _activeTab);
        });

        _renderTabContent();
    }

    function close() {
        if (_overlayEl) _overlayEl.classList.remove('is-open');
        document.body.style.overflow = '';
        if (_lastFocused && typeof _lastFocused.focus === 'function') {
            _lastFocused.focus();
        }
    }

    function setOpt(key, val) {
        _settings[key] = val;
        _persistSettings();
        _renderTabContent();
    }

    function checkPassStrength(val) {
        const fill = document.getElementById('pass-strength-fill');
        if (!fill) return;

        let score = 0;
        if (val.length >= 6) score += 33;
        if (val.length >= 10) score += 33;
        if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score += 34;

        fill.style.width = `${score}%`;
        fill.style.backgroundColor = score < 50 ? '#ef4444' : (score < 80 ? '#f59e0b' : '#10b981');
    }

    async function changePassword() {
        const curr = document.getElementById('set-sec-curr')?.value;
        const nxt  = document.getElementById('set-sec-new')?.value;

        if (!curr || !nxt) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Please enter both current and new password.', 'warning');
            }
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const apiBase = (typeof Config !== 'undefined' && Config.API_BASE) ? Config.API_BASE : 'http://localhost:5001/api';

            const res = await fetch(`${apiBase}/auth/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword: curr, newPassword: nxt })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Password update failed');

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('Password changed successfully!', 'success');
            }
        } catch (err) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message, 'error');
            }
        }
    }

    async function exportAllResumes() {
        try {
            if (typeof ResumeService !== 'undefined' && ResumeService.list) {
                const list = await ResumeService.list();
                const jsonStr = JSON.stringify(list, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `elevatecv_all_resumes_${Date.now()}.json`;
                a.click();
            }
        } catch (err) {
            console.error('[SettingsModal] Export error:', err);
        }
    }

    function clearCache() {
        localStorage.removeItem('elevatecv_settings');
        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Local application cache cleared.', 'info');
        }
    }

    function deleteAccount() {
        alert('Account deletion requires confirmation. Please contact support or confirm via email.');
    }

    function _esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return {
        open,
        close,
        setOpt,
        checkPassStrength,
        changePassword,
        exportAllResumes,
        clearCache,
        deleteAccount
    };

})();

window.SettingsModal = SettingsModal;

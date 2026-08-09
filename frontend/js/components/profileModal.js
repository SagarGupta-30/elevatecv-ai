/**
 * ElevateCV AI — Profile Center Component
 * Premium multi-section Account Center modal.
 *
 * Sections:
 *  1. Overview   — Hero header, quick stats, recent activity
 *  2. Personal   — Full editable personal info form with chips
 *  3. Career     — Live career statistics from resume data
 *  4. Achievements — Badges + profile completion ring
 *  5. Security   — Password change, session info
 */

/* ════════════════════════════════════════════════════════════════════
   MODULE
════════════════════════════════════════════════════════════════════ */
const ProfileModal = (() => {
    /* ── State ─────────────────────────────────────────── */
    let _open   = false;
    let _profile = null;      // full profile object from API
    let _stats  = null;       // career stats from API
    let _saving = false;

    /* ── Config ─────────────────────────────────────────── */
    const API_BASE = (typeof Config !== 'undefined' && Config.API_BASE)
        ? Config.API_BASE
        : 'https://elevatecv-backend.onrender.com/api';

    /* ── DOM refs (set when modal is injected) ────────────── */
    let overlay, modal, toastEl;

    /* ════════════════════════════════════════════════════════
       TEMPLATE
    ════════════════════════════════════════════════════════ */
    function buildHTML() {
        return `
<div class="profile-overlay" id="profileOverlay" role="dialog" aria-modal="true" aria-label="Profile Center">
    <div class="profile-modal" id="profileModal">

        <!-- Header -->
        <div class="profile-modal-header">
            <div class="profile-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile Center
            </div>
            <button class="profile-modal-close" id="profileModalClose" aria-label="Close Profile">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Tabs -->
        <div class="profile-tabs" role="tablist">
            <button class="profile-tab active" data-panel="overview" role="tab" aria-selected="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                Overview
            </button>
            <button class="profile-tab" data-panel="personal" role="tab" aria-selected="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Personal Info
            </button>
            <button class="profile-tab" data-panel="career" role="tab" aria-selected="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Career Stats
            </button>
            <button class="profile-tab" data-panel="achievements" role="tab" aria-selected="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
                Achievements
            </button>
            <button class="profile-tab" data-panel="security" role="tab" aria-selected="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Security
            </button>
        </div>

        <!-- Body -->
        <div class="profile-modal-body">

            <!-- ─── OVERVIEW PANEL ─── -->
            <div class="profile-panel active" id="panel-overview">
                <div id="overview-skeleton">
                    <div class="profile-hero" style="gap:20px">
                        <div class="skeleton skeleton-avatar"></div>
                        <div style="flex:1;display:flex;flex-direction:column;gap:10px">
                            <div class="skeleton skeleton-text" style="width:55%"></div>
                            <div class="skeleton skeleton-text-sm" style="width:40%"></div>
                            <div class="skeleton skeleton-text-sm" style="width:65%"></div>
                        </div>
                    </div>
                    <div class="profile-quick-stats">
                        ${[1,2,3,4].map(() => `<div class="profile-stat-card"><div class="skeleton" style="height:40px;border-radius:8px;margin-bottom:8px"></div><div class="skeleton skeleton-text-sm" style="width:60%;margin:0 auto"></div></div>`).join('')}
                    </div>
                </div>
                <div id="overview-content" style="display:none">
                    <!-- Hero filled by JS -->
                </div>
            </div>

            <!-- ─── PERSONAL INFO PANEL ─── -->
            <div class="profile-panel" id="panel-personal">
                <div class="profile-form" id="personal-form">
                    <!-- Filled by JS -->
                    <div class="skeleton" style="height:200px;border-radius:12px"></div>
                </div>
            </div>

            <!-- ─── CAREER STATS PANEL ─── -->
            <div class="profile-panel" id="panel-career">
                <div id="career-content">
                    <div class="skeleton" style="height:180px;border-radius:12px;margin-bottom:14px"></div>
                    <div class="career-stats-grid">
                        ${[1,2,3,4,5,6].map(() => `<div class="skeleton" style="height:120px;border-radius:12px"></div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- ─── ACHIEVEMENTS PANEL ─── -->
            <div class="profile-panel" id="panel-achievements">
                <div id="achievements-content">
                    <div class="skeleton" style="height:140px;border-radius:12px;margin-bottom:24px"></div>
                    <div class="achievements-grid">
                        ${[1,2,3,4,5,6].map(() => `<div class="skeleton" style="height:140px;border-radius:12px"></div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- ─── SECURITY PANEL ─── -->
            <div class="profile-panel" id="panel-security">
                <div id="security-content">
                    <div class="skeleton" style="height:320px;border-radius:12px"></div>
                </div>
            </div>

        </div><!-- /body -->
    </div><!-- /modal -->
</div><!-- /overlay -->

<!-- Toast -->
<div class="profile-toast" id="profileToast">
    <span class="profile-toast-icon" id="profileToastIcon"></span>
    <span id="profileToastMsg"></span>
</div>

<!-- SVG gradient defs for ring chart -->
<svg width="0" height="0" style="position:absolute">
    <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
    </defs>
</svg>
        `;
    }

    /* ════════════════════════════════════════════════════════
       INJECT & OPEN
    ════════════════════════════════════════════════════════ */
    function inject() {
        if (document.getElementById('profileOverlay')) return;
        const container = document.createElement('div');
        container.innerHTML = buildHTML();
        while (container.firstChild) {
            document.body.appendChild(container.firstChild);
        }

        overlay = document.getElementById('profileOverlay');
        modal   = document.getElementById('profileModal');
        toastEl = document.getElementById('profileToast');

        bindShell();
        bindTabs();
    }

    function open() {
        inject();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        _open = true;
        loadProfile();
    }

    function close() {
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        _open = false;
    }

    /* ════════════════════════════════════════════════════════
       SHELL BINDINGS
    ════════════════════════════════════════════════════════ */
    function bindShell() {
        document.getElementById('profileModalClose').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && _open) close();
        }, { passive: true });
    }

    function bindTabs() {
        const tabs = document.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));
                const target = document.getElementById('panel-' + tab.dataset.panel);
                if (target) target.classList.add('active');
            });
        });
    }

    /* ════════════════════════════════════════════════════════
       API HELPERS
    ════════════════════════════════════════════════════════ */
    function getToken() {
        try {
            const u = JSON.parse(localStorage.getItem('elevatecv_user') || '{}');
            return u.token || localStorage.getItem('elevatecv_token') || '';
        } catch { return ''; }
    }

    async function apiFetch(path, opts = {}) {
        const token = getToken();
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            ...opts
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
    }

    /* ════════════════════════════════════════════════════════
       LOAD PROFILE
    ════════════════════════════════════════════════════════ */
    async function loadProfile() {
        try {
            const res = await apiFetch('/users/profile');
            _profile = res.data.user;
            _stats   = res.data.stats;
        } catch (err) {
            // Fallback to /auth/me if profile endpoint not yet live
            try {
                const res2 = await apiFetch('/auth/me');
                _profile = res2.data.user;
                _stats   = { totalResumes: 0, completed: 0, draft: 0 };
            } catch (err2) {
                showToast('Failed to load profile', 'error');
                return;
            }
        }

        renderOverview();
        renderPersonalForm();
        renderCareerStats();
        renderAchievements();
        renderSecurity();
    }

    /* ════════════════════════════════════════════════════════
       HELPERS
    ════════════════════════════════════════════════════════ */
    function initials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    function timeAgo(dateStr) {
        if (!dateStr) return 'Never';
        const diff = Date.now() - new Date(dateStr).getTime();
        const s = Math.floor(diff / 1000);
        if (s < 60) return 'Just now';
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        if (d < 30) return `${d}d ago`;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    function friendlyDate(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    /* ════════════════════════════════════════════════════════
       RENDER — OVERVIEW
    ════════════════════════════════════════════════════════ */
    function renderOverview() {
        const skel = document.getElementById('overview-skeleton');
        const cont = document.getElementById('overview-content');
        if (!skel || !cont) return;

        const p = _profile || {};
        const s = _stats   || {};

        const avatarHtml = p.avatarUrl
            ? `<img src="${p.avatarUrl}" alt="Avatar" id="hero-avatar-img">`
            : `<span id="hero-initials">${initials(p.name)}</span>`;

        const joinedDate = friendlyDate(p.createdAt);
        const lastLogin  = timeAgo(p.lastLoginAt || p.updatedAt);

        const activities = buildActivities(p, s);

        cont.innerHTML = `
        <!-- Hero -->
        <div class="profile-hero">
            <div class="avatar-wrapper">
                <div class="avatar-ring avatar-ring-lg">
                    <div class="avatar-inner" id="hero-avatar-inner">
                        ${avatarHtml}
                    </div>
                </div>
                <label class="avatar-upload-btn" for="avatarFileInput" title="Change photo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <input type="file" id="avatarFileInput" class="avatar-upload-input" accept="image/*">
                </label>
            </div>

            <div class="profile-hero-info">
                <div class="profile-hero-name">${p.name || 'Your Name'}</div>
                <div class="profile-hero-role">${p.preferredRole || 'Software Professional'}</div>
                <div class="profile-hero-email">${p.email || ''}</div>
                <div class="profile-hero-badges">
                    <span class="profile-badge green">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Active Account
                    </span>
                    ${p.location ? `<span class="profile-badge blue">📍 ${p.location}</span>` : ''}
                    ${p.college  ? `<span class="profile-badge purple">🎓 ${p.college}</span>` : ''}
                    <span class="profile-badge cyan">Joined ${joinedDate}</span>
                </div>
            </div>

            <div class="profile-hero-actions">
                <button class="btn-profile-secondary btn-profile-sm" onclick="ProfileModal._switchTab('personal')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Profile
                </button>
                <button class="btn-profile-secondary btn-profile-sm" onclick="ProfileModal._switchTab('security')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Security
                </button>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="profile-quick-stats">
            <div class="profile-stat-card">
                <div class="profile-stat-value">${s.totalResumes || 0}</div>
                <div class="profile-stat-label">Resumes</div>
            </div>
            <div class="profile-stat-card">
                <div class="profile-stat-value">${s.completed || 0}</div>
                <div class="profile-stat-label">Completed</div>
            </div>
            <div class="profile-stat-card">
                <div class="profile-stat-value">${s.draft || 0}</div>
                <div class="profile-stat-label">Drafts</div>
            </div>
            <div class="profile-stat-card">
                <div class="profile-stat-value">${lastLogin}</div>
                <div class="profile-stat-label">Last Active</div>
            </div>
        </div>

        <!-- Social Links -->
        ${buildSocialRow(p)}

        <!-- Recent Activity -->
        <div class="profile-section-heading">
            <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Recent Activity
            </h3>
        </div>
        <div class="activity-timeline">
            ${activities.length ? activities.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${a.color}">${a.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${a.title}</div>
                    <div class="activity-time">${a.time}</div>
                </div>
            </div>`).join('') : `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-title" style="color:var(--profile-text-dim)">No recent activity yet. Start by creating a resume!</div>
                </div>
            </div>`}
        </div>
        `;

        skel.style.display = 'none';
        cont.style.display  = 'block';

        // Avatar file input
        const fileInput = document.getElementById('avatarFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleAvatarUpload);
        }
    }

    function buildSocialRow(p) {
        const links = [
            { key: 'linkedin',  label: 'LinkedIn',  icon: '🔗', prefix: 'linkedin.com/in/' },
            { key: 'github',    label: 'GitHub',    icon: '⚡', prefix: 'github.com/' },
            { key: 'portfolio', label: 'Portfolio', icon: '🌐', prefix: '' },
            { key: 'twitter',   label: 'Twitter',   icon: '🐦', prefix: 'x.com/' },
        ];

        const hasAny = links.some(l => p[l.key]);
        if (!hasAny) return '';

        return `
        <div class="profile-section-heading" style="margin-bottom:12px;margin-top:4px">
            <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                Social Links
            </h3>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px">
            ${links.filter(l => p[l.key]).map(l => `
            <a href="${l.prefix ? 'https://' + l.prefix + p[l.key] : p[l.key]}"
               target="_blank" rel="noopener noreferrer"
               class="profile-badge blue" style="text-decoration:none;padding:6px 14px">
                ${l.icon} ${l.label}
            </a>`).join('')}
        </div>`;
    }

    function buildActivities(p, s) {
        const acts = [];
        if (p.updatedAt) {
            acts.push({ icon: '👤', color: 'blue', title: 'Profile last updated', time: timeAgo(p.updatedAt) });
        }
        if (p.createdAt) {
            acts.push({ icon: '🚀', color: 'purple', title: 'Account created', time: timeAgo(p.createdAt) });
        }
        if (s && s.totalResumes > 0) {
            acts.push({ icon: '📄', color: 'cyan', title: `${s.totalResumes} resume${s.totalResumes !== 1 ? 's' : ''} in workspace`, time: 'All time' });
        }
        return acts.slice(0, 5);
    }

    /* ════════════════════════════════════════════════════════
       AVATAR UPLOAD
    ════════════════════════════════════════════════════════ */
    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const dataUrl = ev.target.result;

            // Update UI instantly
            const inner = document.getElementById('hero-avatar-inner');
            if (inner) inner.innerHTML = `<img src="${dataUrl}" alt="Avatar" id="hero-avatar-img">`;

            // Update topbar avatar too
            const topbarAvatar = document.getElementById('user-avatar');
            if (topbarAvatar) {
                topbarAvatar.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;
            }

            // Save to server
            try {
                await apiFetch('/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify({ avatarUrl: dataUrl })
                });
                if (_profile) _profile.avatarUrl = dataUrl;

                // Persist in localStorage for topbar across pages
                try {
                    const u = JSON.parse(localStorage.getItem('elevatecv_user') || '{}');
                    if (u.user) u.user.avatarUrl = dataUrl;
                    localStorage.setItem('elevatecv_user', JSON.stringify(u));
                } catch (_) {}

                showToast('Photo updated!', 'success');
            } catch (err) {
                showToast('Could not save photo: ' + err.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    }

    /* ════════════════════════════════════════════════════════
       RENDER — PERSONAL INFO FORM
    ════════════════════════════════════════════════════════ */
    function renderPersonalForm() {
        const formEl = document.getElementById('personal-form');
        if (!formEl) return;

        const p = _profile || {};
        const skills    = Array.isArray(p.skills)    ? p.skills    : [];
        const languages = Array.isArray(p.languages) ? p.languages : [];

        formEl.innerHTML = `
        <!-- Avatar section (compact) -->
        <div style="display:flex;align-items:center;gap:16px;background:var(--profile-glass);border:1px solid var(--profile-border);border-radius:var(--profile-radius);padding:20px;margin-bottom:4px">
            <div class="avatar-ring" style="width:64px;height:64px">
                <div class="avatar-inner" style="font-size:1.4rem" id="form-avatar-inner">
                    ${p.avatarUrl ? `<img src="${p.avatarUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(p.name)}
                </div>
            </div>
            <div>
                <div style="font-size:0.9rem;font-weight:600;color:var(--profile-text);margin-bottom:4px">${p.name || 'Your Name'}</div>
                <div style="font-size:0.78rem;color:var(--profile-text-muted)">${p.email || ''}</div>
            </div>
        </div>

        <div class="profile-form-grid">

            <!-- Name -->
            <div class="profile-form-group">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Full Name
                </label>
                <input type="text" class="profile-input" id="pf-name" value="${p.name || ''}" placeholder="Your full name">
            </div>

            <!-- Phone -->
            <div class="profile-form-group">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    Phone
                </label>
                <input type="tel" class="profile-input" id="pf-phone" value="${p.phone || ''}" placeholder="+1 (555) 000-0000">
            </div>

            <!-- Location -->
            <div class="profile-form-group">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Location
                </label>
                <input type="text" class="profile-input" id="pf-location" value="${p.location || ''}" placeholder="City, Country">
            </div>

            <!-- Preferred Role -->
            <div class="profile-form-group">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                    Preferred Role
                </label>
                <input type="text" class="profile-input" id="pf-role" value="${p.preferredRole || ''}" placeholder="e.g. Senior Full-Stack Engineer">
            </div>

            <!-- LinkedIn -->
            <div class="profile-form-group">
                <label class="profile-form-label">LinkedIn Username</label>
                <div class="profile-input-wrap">
                    <span class="profile-input-prefix" style="font-size:0.72rem">linkedin.com/in/</span>
                    <input type="text" class="profile-input" id="pf-linkedin" style="padding-left:110px" value="${p.linkedin || ''}" placeholder="yourname">
                </div>
            </div>

            <!-- GitHub -->
            <div class="profile-form-group">
                <label class="profile-form-label">GitHub Username</label>
                <div class="profile-input-wrap">
                    <span class="profile-input-prefix" style="font-size:0.72rem">github.com/</span>
                    <input type="text" class="profile-input" id="pf-github" style="padding-left:85px" value="${p.github || ''}" placeholder="yourhandle">
                </div>
            </div>

            <!-- Portfolio -->
            <div class="profile-form-group">
                <label class="profile-form-label">Portfolio URL</label>
                <input type="url" class="profile-input" id="pf-portfolio" value="${p.portfolio || ''}" placeholder="https://yoursite.dev">
            </div>

            <!-- Twitter -->
            <div class="profile-form-group">
                <label class="profile-form-label">Twitter / X Handle</label>
                <div class="profile-input-wrap">
                    <span class="profile-input-prefix">@</span>
                    <input type="text" class="profile-input" id="pf-twitter" value="${p.twitter || ''}" placeholder="handle">
                </div>
            </div>

            <!-- College -->
            <div class="profile-form-group">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    College / University
                </label>
                <input type="text" class="profile-input" id="pf-college" value="${p.college || ''}" placeholder="MIT, IIT, etc.">
            </div>

            <!-- Degree -->
            <div class="profile-form-group">
                <label class="profile-form-label">Degree</label>
                <input type="text" class="profile-input" id="pf-degree" value="${p.degree || ''}" placeholder="B.Tech CSE, MBA, etc.">
            </div>

            <!-- Graduation Year -->
            <div class="profile-form-group">
                <label class="profile-form-label">Graduation Year</label>
                <select class="profile-select" id="pf-gradyear">
                    <option value="">Select year</option>
                    ${Array.from({length: 15}, (_, i) => 2030 - i).map(y =>
                        `<option value="${y}" ${p.graduationYear == y ? 'selected' : ''}>${y}</option>`
                    ).join('')}
                    ${Array.from({length: 10}, (_, i) => 2015 - i).map(y =>
                        `<option value="${y}" ${p.graduationYear == y ? 'selected' : ''}>${y}</option>`
                    ).join('')}
                </select>
            </div>

            <!-- Bio -->
            <div class="profile-form-group full-width">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Bio
                </label>
                <textarea class="profile-textarea" id="pf-bio" maxlength="500" placeholder="Write a short professional bio about yourself...">${p.bio || ''}</textarea>
                <div style="font-size:0.72rem;color:var(--profile-text-dim);text-align:right" id="bio-char-count">${(p.bio || '').length}/500</div>
            </div>

            <!-- Skills -->
            <div class="profile-form-group full-width">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Skills
                </label>
                <div class="chips-wrap" id="skills-chips-wrap">
                    ${skills.map(s => chipHtml(s, 'skill')).join('')}
                    <input type="text" class="chip-input" id="skills-chip-input" placeholder="${skills.length ? 'Add skill…' : 'Add skills (press Enter)…'}">
                </div>
            </div>

            <!-- Languages -->
            <div class="profile-form-group full-width">
                <label class="profile-form-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/></svg>
                    Languages
                </label>
                <div class="chips-wrap" id="langs-chips-wrap">
                    ${languages.map(l => chipHtml(l, 'lang')).join('')}
                    <input type="text" class="chip-input" id="langs-chip-input" placeholder="${languages.length ? 'Add language…' : 'Add languages (press Enter)…'}">
                </div>
            </div>

        </div><!-- /grid -->

        <!-- Save bar -->
        <div class="profile-save-bar">
            <span class="profile-save-hint">Changes are saved to your account</span>
            <button class="btn-profile-primary" id="btn-save-personal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
            </button>
        </div>
        `;

        bindChips('skills-chips-wrap', 'skills-chip-input');
        bindChips('langs-chips-wrap',  'langs-chip-input');
        bindBioCounter();
        bindSavePersonal();
    }

    function chipHtml(value, type) {
        return `<span class="chip" data-type="${type}" data-value="${value}">${value}<button class="chip-remove" aria-label="Remove">&times;</button></span>`;
    }

    function bindChips(wrapId, inputId) {
        const wrap  = document.getElementById(wrapId);
        const input = document.getElementById(inputId);
        if (!wrap || !input) return;

        // Remove chip on click
        wrap.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip-remove');
            if (btn) {
                btn.closest('.chip').remove();
            }
        });

        // Add chip on Enter or comma
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const val = input.value.replace(/,$/, '').trim();
                if (!val) return;
                const chip = document.createElement('span');
                chip.innerHTML = chipHtml(val, wrapId.includes('skills') ? 'skill' : 'lang');
                wrap.insertBefore(chip.firstElementChild, input);
                input.value = '';
            }
        });

        // Focus wrap → focus input
        wrap.addEventListener('click', (e) => {
            if (!e.target.closest('.chip')) input.focus();
        });
    }

    function bindBioCounter() {
        const bio   = document.getElementById('pf-bio');
        const count = document.getElementById('bio-char-count');
        if (!bio || !count) return;
        bio.addEventListener('input', () => {
            count.textContent = bio.value.length + '/500';
        });
    }

    function getChipValues(wrapId) {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return [];
        return [...wrap.querySelectorAll('.chip')].map(c => c.dataset.value || c.textContent.replace('×', '').trim());
    }

    function bindSavePersonal() {
        const btn = document.getElementById('btn-save-personal');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            if (_saving) return;
            _saving = true;

            const origText = btn.innerHTML;
            btn.innerHTML = `<svg class="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving…`;
            btn.disabled = true;

            const payload = {
                name:           (document.getElementById('pf-name')?.value   || '').trim(),
                phone:          (document.getElementById('pf-phone')?.value  || '').trim(),
                location:       (document.getElementById('pf-location')?.value || '').trim(),
                preferredRole:  (document.getElementById('pf-role')?.value   || '').trim(),
                linkedin:       (document.getElementById('pf-linkedin')?.value || '').trim(),
                github:         (document.getElementById('pf-github')?.value  || '').trim(),
                portfolio:      (document.getElementById('pf-portfolio')?.value || '').trim(),
                twitter:        (document.getElementById('pf-twitter')?.value  || '').trim(),
                college:        (document.getElementById('pf-college')?.value  || '').trim(),
                degree:         (document.getElementById('pf-degree')?.value   || '').trim(),
                graduationYear: (document.getElementById('pf-gradyear')?.value || ''),
                bio:            (document.getElementById('pf-bio')?.value      || '').trim(),
                skills:         getChipValues('skills-chips-wrap'),
                languages:      getChipValues('langs-chips-wrap'),
            };

            try {
                const res = await apiFetch('/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                _profile = { ..._profile, ...payload };

                // Update localStorage with new name
                try {
                    const stored = JSON.parse(localStorage.getItem('elevatecv_user') || '{}');
                    if (stored.user) { stored.user.name = payload.name; }
                    else if (stored.name) { stored.name = payload.name; }
                    localStorage.setItem('elevatecv_user', JSON.stringify(stored));
                } catch (_) {}

                // Update topbar name
                const nameEl = document.getElementById('user-name-display');
                if (nameEl) nameEl.textContent = payload.name.split(' ')[0];

                // Re-render hero if on overview
                const herName = document.querySelector('.profile-hero-name');
                if (herName) herName.textContent = payload.name;
                const herRole = document.querySelector('.profile-hero-role');
                if (herRole) herRole.textContent = payload.preferredRole || 'Software Professional';

                showToast('Profile saved successfully!', 'success');
            } catch (err) {
                showToast('Save failed: ' + err.message, 'error');
            } finally {
                _saving = false;
                btn.innerHTML = origText;
                btn.disabled  = false;
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       RENDER — CAREER STATS
    ════════════════════════════════════════════════════════ */
    function renderCareerStats() {
        const el = document.getElementById('career-content');
        if (!el) return;

        const s = _stats || {};
        const p = _profile || {};
        const total = s.totalResumes || 0;

        // AI usage estimation from localStorage
        const aiUsage = (() => {
            try { return parseInt(localStorage.getItem('elevatecv_ai_count') || '0', 10); }
            catch { return 0; }
        })();

        const cards = [
            {
                label: 'Total Resumes',
                value: total,
                max: 20,
                icon: '📄',
                color: 'rgba(99,102,241,0.15)',
                textColor: '#6366f1',
                barColor: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
            },
            {
                label: 'Completed',
                value: s.completed || 0,
                max: Math.max(total, 1),
                icon: '✅',
                color: 'rgba(16,185,129,0.15)',
                textColor: '#10b981',
                barColor: 'linear-gradient(90deg, #10b981, #06b6d4)'
            },
            {
                label: 'Drafts Active',
                value: s.draft || 0,
                max: Math.max(total, 1),
                icon: '📝',
                color: 'rgba(245,158,11,0.15)',
                textColor: '#f59e0b',
                barColor: 'linear-gradient(90deg, #f59e0b, #ef4444)'
            },
            {
                label: 'AI Analyses',
                value: aiUsage,
                max: 50,
                icon: '🤖',
                color: 'rgba(139,92,246,0.15)',
                textColor: '#8b5cf6',
                barColor: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
            },
            {
                label: 'Skills Tagged',
                value: (p.skills || []).length,
                max: 30,
                icon: '⚡',
                color: 'rgba(6,182,212,0.15)',
                textColor: '#06b6d4',
                barColor: 'linear-gradient(90deg, #06b6d4, #6366f1)'
            },
            {
                label: 'Languages Known',
                value: (p.languages || []).length,
                max: 10,
                icon: '🌍',
                color: 'rgba(236,72,153,0.15)',
                textColor: '#ec4899',
                barColor: 'linear-gradient(90deg, #ec4899, #f59e0b)'
            },
        ];

        el.innerHTML = `
        <div style="margin-bottom:24px;padding:20px;background:var(--profile-glass);border:1px solid var(--profile-border);border-radius:var(--profile-radius);display:flex;align-items:center;gap:16px">
            <div style="flex:1">
                <div style="font-size:1rem;font-weight:600;color:var(--profile-text);margin-bottom:4px">Career Progress Overview</div>
                <div style="font-size:0.82rem;color:var(--profile-text-muted)">
                    You have created <strong style="color:var(--profile-accent)">${total}</strong> resume${total !== 1 ? 's' : ''}.
                    ${s.completed ? `<strong style="color:var(--profile-success)">${s.completed}</strong> completed.` : ''}
                    Keep building to unlock all achievements!
                </div>
            </div>
            <div style="font-size:2.5rem;flex-shrink:0">📊</div>
        </div>
        <div class="career-stats-grid">
            ${cards.map((c, i) => `
            <div class="career-stat-card">
                <div class="career-stat-icon" style="background:${c.color}">
                    <span style="font-size:1.2rem">${c.icon}</span>
                </div>
                <div class="career-stat-number" style="background:${c.barColor};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
                    ${c.value}
                </div>
                <div class="career-stat-name">${c.label}</div>
                <div class="career-stat-bar">
                    <div class="career-stat-bar-fill"
                         id="bar-fill-${i}"
                         style="width:0%;background:${c.barColor}">
                    </div>
                </div>
            </div>`).join('')}
        </div>`;

        // Animate bars
        requestAnimationFrame(() => {
            cards.forEach((c, i) => {
                const fill = document.getElementById(`bar-fill-${i}`);
                if (fill) {
                    const pct = c.max > 0 ? Math.min(100, (c.value / c.max) * 100) : 0;
                    setTimeout(() => { fill.style.width = pct + '%'; }, 100 + i * 60);
                }
            });
        });
    }

    /* ════════════════════════════════════════════════════════
       RENDER — ACHIEVEMENTS
    ════════════════════════════════════════════════════════ */
    function renderAchievements() {
        const el = document.getElementById('achievements-content');
        if (!el) return;

        const p = _profile || {};
        const s = _stats   || {};
        const total     = s.totalResumes  || 0;
        const completed = s.completed     || 0;
        const skills    = (p.skills || []).length;
        const hasLinked = !!(p.linkedin || p.github || p.portfolio);
        const hasBio    = !!(p.bio && p.bio.length > 20);

        // Completion steps
        const steps = [
            { label: 'Account created',       done: true },
            { label: 'Profile photo added',   done: !!p.avatarUrl },
            { label: 'Bio written',           done: hasBio },
            { label: 'Skills added (5+)',     done: skills >= 5 },
            { label: 'Social links added',    done: hasLinked },
            { label: 'First resume created',  done: total >= 1 },
            { label: 'Resume completed',      done: completed >= 1 },
        ];

        const doneCount = steps.filter(s => s.done).length;
        const pct       = Math.round((doneCount / steps.length) * 100);
        const dashOffset = 251.2 - (251.2 * pct / 100);

        const badges = [
            {
                emoji:   '🚀',
                name:    'First Launch',
                desc:    'Created your ElevateCV account',
                unlocked: true
            },
            {
                emoji:   '📄',
                name:    'Resume Creator',
                desc:    'Created your first resume',
                unlocked: total >= 1
            },
            {
                emoji:   '✨',
                name:    'Completionist',
                desc:    'Completed a resume 100%',
                unlocked: completed >= 1
            },
            {
                emoji:   '🤖',
                name:    'AI Explorer',
                desc:    'Used AI analysis at least once',
                unlocked: !!(localStorage.getItem('elevatecv_ai_count'))
            },
            {
                emoji:   '⚡',
                name:    'Skill Master',
                desc:    'Added 5+ skills to profile',
                unlocked: skills >= 5
            },
            {
                emoji:   '🔗',
                name:    'Well Connected',
                desc:    'Added social links to profile',
                unlocked: hasLinked
            },
            {
                emoji:   '📸',
                name:    'Profile Star',
                desc:    'Uploaded a profile photo',
                unlocked: !!p.avatarUrl
            },
            {
                emoji:   '💬',
                name:    'Storyteller',
                desc:    'Wrote a professional bio',
                unlocked: hasBio
            },
            {
                emoji:   '🏆',
                name:    'Power User',
                desc:    'Created 5+ resumes',
                unlocked: total >= 5
            },
        ];

        el.innerHTML = `
        <!-- Completion Ring -->
        <div class="profile-complete-ring">
            <div class="ring-container">
                <svg class="ring-svg" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#6366f1"/>
                            <stop offset="100%" stop-color="#06b6d4"/>
                        </linearGradient>
                    </defs>
                    <circle class="ring-bg" cx="50" cy="50" r="40"/>
                    <circle class="ring-fill" id="ringFill" cx="50" cy="50" r="40" stroke="url(#ringGradient2)"
                            style="stroke-dashoffset:${dashOffset}"/>
                </svg>
                <div class="ring-label">
                    ${pct}%<br><span>complete</span>
                </div>
            </div>
            <div class="profile-complete-info">
                <h4>Profile Completeness</h4>
                <p>${pct < 100
                    ? `You're ${100 - pct}% away from a perfect profile. Complete the steps below to unlock all achievements.`
                    : '🎉 Your profile is 100% complete! You\'ve unlocked all achievements.'}</p>
                <div class="complete-steps">
                    ${steps.map(s => `
                    <div class="complete-step ${s.done ? 'done' : ''}">
                        <div class="complete-step-dot">
                            ${s.done ? '✓' : '○'}
                        </div>
                        ${s.label}
                    </div>`).join('')}
                </div>
            </div>
        </div>

        <!-- Badges Grid -->
        <div class="profile-section-heading">
            <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
                Achievements (${badges.filter(b => b.unlocked).length}/${badges.length} unlocked)
            </h3>
        </div>
        <div class="achievements-grid">
            ${badges.map(b => `
            <div class="achievement-card ${b.unlocked ? 'unlocked' : 'locked'}">
                ${b.unlocked ? '<div class="achievement-unlocked-badge">✓</div>' : ''}
                <span class="achievement-emoji">${b.emoji}</span>
                <div class="achievement-name">${b.name}</div>
                <div class="achievement-desc">${b.desc}</div>
            </div>`).join('')}
        </div>
        `;

        // Animate ring
        requestAnimationFrame(() => {
            const ring = document.getElementById('ringFill');
            if (ring) {
                ring.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                ring.style.strokeDashoffset = dashOffset;
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       RENDER — SECURITY
    ════════════════════════════════════════════════════════ */
    function renderSecurity() {
        const el = document.getElementById('security-content');
        if (!el) return;

        const p  = _profile || {};
        const joinedDate = friendlyDate(p.createdAt);
        const pwdChanged = p.passwordChangedAt ? friendlyDate(p.passwordChangedAt) : 'Never changed';

        el.innerHTML = `
        <div class="security-section">

            <!-- Email -->
            <div class="security-card">
                <div class="security-icon" style="background:rgba(99,102,241,0.15)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </div>
                <div class="security-info">
                    <div class="security-title">Email Address</div>
                    <div class="security-subtitle">${p.email || '—'} &nbsp;
                        <span class="profile-badge green" style="font-size:0.65rem;padding:2px 8px">Verified</span>
                    </div>
                </div>
            </div>

            <!-- Account Created -->
            <div class="security-card">
                <div class="security-icon" style="background:rgba(16,185,129,0.15)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <div class="security-info">
                    <div class="security-title">Member Since</div>
                    <div class="security-subtitle">${joinedDate}</div>
                </div>
            </div>

            <!-- Password -->
            <div class="security-card">
                <div class="security-icon" style="background:rgba(245,158,11,0.15)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                </div>
                <div class="security-info">
                    <div class="security-title">Password</div>
                    <div class="security-subtitle">Last changed: ${pwdChanged}</div>
                </div>
                <div class="security-action">
                    <button class="btn-profile-secondary btn-profile-sm" id="btn-toggle-pwd-form">Change</button>
                </div>
            </div>

            <!-- Change Password Form -->
            <div class="password-form" id="pwd-form">
                <div style="font-size:0.88rem;font-weight:600;color:var(--profile-text);margin-bottom:4px">Change Password</div>

                <div class="profile-form-group">
                    <label class="profile-form-label">Current Password</label>
                    <input type="password" class="profile-input" id="pwd-current" placeholder="Enter current password">
                </div>
                <div class="profile-form-group">
                    <label class="profile-form-label">New Password</label>
                    <input type="password" class="profile-input" id="pwd-new" placeholder="At least 8 characters">
                </div>
                <div class="profile-form-group">
                    <label class="profile-form-label">Confirm New Password</label>
                    <input type="password" class="profile-input" id="pwd-confirm" placeholder="Repeat new password">
                </div>

                <div style="display:flex;gap:10px;margin-top:4px">
                    <button class="btn-profile-primary" id="btn-save-password">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Update Password
                    </button>
                    <button class="btn-profile-secondary" id="btn-cancel-pwd">Cancel</button>
                </div>
            </div>

            <!-- Active Session -->
            <div class="security-card">
                <div class="security-icon" style="background:rgba(139,92,246,0.15)">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                </div>
                <div class="security-info">
                    <div class="security-title">Current Session</div>
                    <div class="security-subtitle">Active on this browser &nbsp;
                        <span class="profile-badge green" style="font-size:0.65rem;padding:2px 8px">Current</span>
                    </div>
                </div>
            </div>

            <!-- Danger Zone -->
            <div style="padding:20px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:var(--profile-radius)">
                <div style="font-size:0.88rem;font-weight:600;color:var(--profile-danger);margin-bottom:6px">Danger Zone</div>
                <div style="font-size:0.8rem;color:var(--profile-text-muted);margin-bottom:16px">
                    Logging out will clear your local session. Your data is safely stored in the cloud.
                </div>
                <button class="btn-profile-danger" id="btn-security-logout">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                </button>
            </div>

        </div>
        `;

        bindSecurityActions();
    }

    function bindSecurityActions() {
        const toggleBtn  = document.getElementById('btn-toggle-pwd-form');
        const cancelBtn  = document.getElementById('btn-cancel-pwd');
        const saveBtn    = document.getElementById('btn-save-password');
        const logoutBtn  = document.getElementById('btn-security-logout');
        const pwdForm    = document.getElementById('pwd-form');

        if (toggleBtn) toggleBtn.addEventListener('click', () => {
            pwdForm.classList.toggle('visible');
            toggleBtn.textContent = pwdForm.classList.contains('visible') ? 'Hide' : 'Change';
        });

        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            pwdForm.classList.remove('visible');
            if (toggleBtn) toggleBtn.textContent = 'Change';
        });

        if (saveBtn) saveBtn.addEventListener('click', async () => {
            const cur     = document.getElementById('pwd-current')?.value || '';
            const nw      = document.getElementById('pwd-new')?.value || '';
            const confirm = document.getElementById('pwd-confirm')?.value || '';

            if (!cur || !nw || !confirm) {
                showToast('Please fill all password fields', 'error'); return;
            }
            if (nw !== confirm) {
                showToast('New passwords do not match', 'error'); return;
            }
            if (nw.length < 6) {
                showToast('New password must be at least 6 characters', 'error'); return;
            }

            saveBtn.textContent = 'Updating…';
            saveBtn.disabled = true;

            try {
                await apiFetch('/auth/password', {
                    method: 'PUT',
                    body: JSON.stringify({ currentPassword: cur, newPassword: nw })
                });
                if (_profile) _profile.passwordChangedAt = new Date().toISOString();

                document.getElementById('pwd-current').value = '';
                document.getElementById('pwd-new').value = '';
                document.getElementById('pwd-confirm').value = '';
                pwdForm.classList.remove('visible');
                if (toggleBtn) toggleBtn.textContent = 'Change';

                showToast('Password updated successfully!', 'success');
            } catch (err) {
                showToast('Failed: ' + err.message, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Update Password`;
            }
        });

        if (logoutBtn) logoutBtn.addEventListener('click', () => {
            close();
            // Delegate to page-level logout handler if present
            const pageLogout = document.getElementById('btn-logout');
            if (pageLogout) {
                pageLogout.click();
            } else {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       TOAST
    ════════════════════════════════════════════════════════ */
    function showToast(msg, type = 'success') {
        const t    = document.getElementById('profileToast');
        const msgEl = document.getElementById('profileToastMsg');
        const iconEl = document.getElementById('profileToastIcon');
        if (!t) return;

        t.className = `profile-toast ${type}`;
        if (msgEl)  msgEl.textContent  = msg;
        if (iconEl) iconEl.textContent = type === 'success' ? '✓' : '✕';

        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3500);
    }

    /* ════════════════════════════════════════════════════════
       PUBLIC HELPERS
    ════════════════════════════════════════════════════════ */
    function _switchTab(name) {
        const tabs   = document.querySelectorAll('.profile-tab');
        const panels = document.querySelectorAll('.profile-panel');
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => p.classList.remove('active'));

        const tab   = document.querySelector(`.profile-tab[data-panel="${name}"]`);
        const panel = document.getElementById(`panel-${name}`);
        if (tab)   { tab.classList.add('active');   tab.setAttribute('aria-selected', 'true'); }
        if (panel) panel.classList.add('active');
    }

    /* ════════════════════════════════════════════════════════
       SPIN KEYFRAME
    ════════════════════════════════════════════════════════ */
    (function injectSpinStyle() {
        if (!document.getElementById('profile-spin-style')) {
            const s = document.createElement('style');
            s.id = 'profile-spin-style';
            s.textContent = `
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 0.9s linear infinite; }
            `;
            document.head.appendChild(s);
        }
    })();

    /* ════════════════════════════════════════════════════════
       PUBLIC API
    ════════════════════════════════════════════════════════ */
    return { open, close, _switchTab };

})();

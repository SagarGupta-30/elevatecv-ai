/**
 * ElevateCV AI — Lightweight Client-Side SPA Router
 * Enables switching between Dashboard Home and Independent AI Workspaces
 * without page reloads while preserving browser history & refresh state.
 */

const SpaRouter = (() => {
    const _routes = new Map();
    let _defaultRoute = 'dashboard';
    let _mainContainer = null;
    let _dashboardViewHTML = null;

    /**
     * Register a route handler
     * @param {string} name - e.g. 'dashboard', 'ats-analysis', 'job-match'
     * @param {Function} handler - function(container, resumeData)
     */
    function register(name, handler) {
        _routes.set(name.toLowerCase(), handler);
    }

    /**
     * Get current route from window.location.hash
     */
    function getCurrentRoute() {
        const hash = window.location.hash.replace('#', '').trim();
        return hash ? hash.toLowerCase() : _defaultRoute;
    }

    /**
     * Navigate to a route programmatically
     */
    function navigate(route) {
        const routeName = route.replace('#', '').trim();
        window.location.hash = `#${routeName}`;
    }

    /**
     * Highlights active link in sidebar and topbar title
     */
    function _updateSidebarActiveState(route) {
        const links = document.querySelectorAll('.sidebar__link');
        links.forEach(link => {
            link.classList.remove('sidebar__link--active');
        });

        let targetId = '';
        switch (route) {
            case 'dashboard':
                const dashLink = document.querySelector('a[href="dashboard.html"]');
                if (dashLink) dashLink.classList.add('sidebar__link--active');
                return;
            case 'ats-analysis':
                targetId = 'sidebar-nav-ats';
                break;
            case 'job-match':
                targetId = 'sidebar-nav-jobmatch';
                break;
            case 'skill-gap':
                targetId = 'sidebar-nav-skillgap';
                break;
            case 'interview-prep':
                targetId = 'sidebar-nav-interview';
                break;
            case 'cover-letter':
                targetId = 'sidebar-nav-coverletter';
                break;
        }

        if (targetId) {
            const btn = document.getElementById(targetId);
            if (btn) btn.classList.add('sidebar__link--active');
        }
    }

    /**
     * Core route dispatch
     */
    function dispatch(resumeData = null) {
        if (!_mainContainer) {
            _mainContainer = document.querySelector('.dashboard-content');
        }
        if (!_mainContainer) return;

        // Cache default dashboard view HTML on first run
        if (!_dashboardViewHTML) {
            _dashboardViewHTML = _mainContainer.innerHTML;
        }

        const route = getCurrentRoute();
        _updateSidebarActiveState(route);

        if (route === 'dashboard' || !_routes.has(route)) {
            // Restore default Dashboard HTML
            _mainContainer.innerHTML = _dashboardViewHTML;
            document.title = 'Dashboard — ElevateCV AI';
            // Re-render dashboard stats / resumes if Dashboard module available
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.loadResumes === 'function') {
                Dashboard.loadResumes();
            }
            return;
        }

        const handler = _routes.get(route);
        if (typeof handler === 'function') {
            _mainContainer.innerHTML = '';
            handler(_mainContainer, resumeData);
        }
    }

    /**
     * Initialize router listener
     */
    function init(containerSelector = '.dashboard-content', getResumeDataFn = null) {
        _mainContainer = document.querySelector(containerSelector);

        window.addEventListener('hashchange', () => {
            const resumeData = typeof getResumeDataFn === 'function' ? getResumeDataFn() : null;
            dispatch(resumeData);
        });
    }

    return {
        register,
        navigate,
        getCurrentRoute,
        dispatch,
        init
    };
})();

window.SpaRouter = SpaRouter;

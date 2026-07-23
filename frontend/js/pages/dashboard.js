/**
 * ElevateCV AI - Dashboard
 * Handles authenticated routing, session management, and dashboard interactions.
 */

const Dashboard = (() => {
    // DOM Elements
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

    /**
     * Check if user is authenticated
     */
    function checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return null;
        }

        try {
            return JSON.parse(userStr);
        } catch (e) {
            // Invalid data in localstorage
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
                // Clear session
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Show toast
                const toast = document.createElement('div');
                toast.textContent = 'Your session has expired. Please login again.';
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.right = '20px';
                toast.style.backgroundColor = 'var(--color-error)';
                toast.style.color = '#ffffff';
                toast.style.padding = '1rem 1.5rem';
                toast.style.borderRadius = 'var(--radius-md)';
                toast.style.boxShadow = 'var(--shadow-lg)';
                toast.style.zIndex = '9999';
                toast.style.fontFamily = 'var(--font-family)';
                document.body.appendChild(toast);
                
                // Redirect after small delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
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
        // Clear session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to landing page
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
        if (!profileDropdown.contains(e.target) && !profileDropdownToggle.contains(e.target)) {
            profileDropdown.classList.remove('is-active');
        }
    }

    /**
     * Toggle Mobile Sidebar
     */
    function toggleSidebar() {
        sidebar.classList.toggle('is-open');
    }

    /**
     * Close Mobile Sidebar
     */
    function closeSidebar() {
        sidebar.classList.remove('is-open');
    }

    /**
     * Initialize Dashboard
     */
    function init() {
        // Route protection
        const user = checkAuth();
        if (!user) return; // Will redirect

        // Set up global fetch interceptor
        setupFetchInterceptor();

        // Populate UI
        displayUserInfo(user);

        // Event Listeners
        if (profileDropdownToggle) {
            profileDropdownToggle.addEventListener('click', toggleDropdown);
        }
        
        document.addEventListener('click', closeDropdownOnClickOutside);

        if (btnLogout) {
            btnLogout.addEventListener('click', handleLogout);
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
        }
    }

    return { init };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

/**
 * ElevateCV AI — Login Page
 * Client-side validation and API integration for user login.
 */

const LoginPage = (() => {
    const API_BASE = 'http://localhost:5001/api/auth';

    const form        = Helpers.$('#login-form');
    const emailInput  = Helpers.$('#login-email');
    const passInput   = Helpers.$('#login-password');
    const submitBtn   = Helpers.$('#login-submit');
    const togglePass  = Helpers.$('#login-toggle-password');
    const alertError  = Helpers.$('#login-alert-error');
    const alertSuccess= Helpers.$('#login-alert-success');
    const errorText   = Helpers.$('#login-error-text');
    const successText = Helpers.$('#login-success-text');

    /** Show field-level error */
    function showFieldError(inputEl, errorEl, message) {
        inputEl.classList.add('form-group__input--error');
        errorEl.textContent = message;
        errorEl.classList.add('form-group__error--visible');
    }

    /** Clear field-level error */
    function clearFieldError(inputEl, errorEl) {
        inputEl.classList.remove('form-group__input--error');
        errorEl.textContent = '';
        errorEl.classList.remove('form-group__error--visible');
    }

    /** Show alert message */
    function showAlert(type, message) {
        hideAlerts();
        if (type === 'error') {
            errorText.textContent = message;
            alertError.classList.add('auth__alert--visible');
        } else {
            successText.textContent = message;
            alertSuccess.classList.add('auth__alert--visible');
        }
    }

    /** Hide all alerts */
    function hideAlerts() {
        alertError.classList.remove('auth__alert--visible');
        alertSuccess.classList.remove('auth__alert--visible');
    }

    /** Set loading state */
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle('auth__submit--loading', isLoading);
    }

    /** Validate form fields */
    function validate() {
        let valid = true;
        const emailErr = Helpers.$('#login-email-error');
        const passErr  = Helpers.$('#login-password-error');

        clearFieldError(emailInput, emailErr);
        clearFieldError(passInput, passErr);

        const email = emailInput.value.trim();
        const password = passInput.value;

        if (!email) {
            showFieldError(emailInput, emailErr, 'Email is required');
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError(emailInput, emailErr, 'Please enter a valid email');
            valid = false;
        }

        if (!password) {
            showFieldError(passInput, passErr, 'Password is required');
            valid = false;
        }

        return valid;
    }

    /** Toggle password visibility */
    function handleTogglePassword() {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        togglePass.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    }

    /** Handle form submission */
    async function handleSubmit(e) {
        e.preventDefault();
        hideAlerts();

        if (!validate()) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value.trim(),
                    password: passInput.value,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            showAlert('success', 'Login successful! Redirecting...');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            let errorMsg = error.message;
            if (errorMsg === 'Failed to fetch') {
                errorMsg = 'Unable to connect to the server. Please check your connection or if the backend is running.';
            }
            showAlert('error', errorMsg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    /** Clear errors on input */
    function handleInputFocus(inputEl, errorEl) {
        inputEl.addEventListener('focus', () => clearFieldError(inputEl, errorEl));
    }

    /** Initialize */
    function init() {
        form.addEventListener('submit', handleSubmit);
        togglePass.addEventListener('click', handleTogglePassword);

        handleInputFocus(emailInput, Helpers.$('#login-email-error'));
        handleInputFocus(passInput, Helpers.$('#login-password-error'));
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    LoginPage.init();
});

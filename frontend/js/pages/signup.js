/**
 * ElevateCV AI — Signup Page
 * Client-side validation and API integration for user registration.
 */

const SignupPage = (() => {
    const API_BASE = 'http://localhost:5000/api/auth';

    const form           = Helpers.$('#signup-form');
    const nameInput      = Helpers.$('#signup-name');
    const emailInput     = Helpers.$('#signup-email');
    const passInput      = Helpers.$('#signup-password');
    const confirmInput   = Helpers.$('#signup-confirm-password');
    const submitBtn      = Helpers.$('#signup-submit');
    const togglePass     = Helpers.$('#signup-toggle-password');
    const alertError     = Helpers.$('#signup-alert-error');
    const alertSuccess   = Helpers.$('#signup-alert-success');
    const errorText      = Helpers.$('#signup-error-text');
    const successText    = Helpers.$('#signup-success-text');

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
        const nameErr    = Helpers.$('#signup-name-error');
        const emailErr   = Helpers.$('#signup-email-error');
        const passErr    = Helpers.$('#signup-password-error');
        const confirmErr = Helpers.$('#signup-confirm-password-error');

        clearFieldError(nameInput, nameErr);
        clearFieldError(emailInput, emailErr);
        clearFieldError(passInput, passErr);
        clearFieldError(confirmInput, confirmErr);

        const name     = nameInput.value.trim();
        const email    = emailInput.value.trim();
        const password = passInput.value;
        const confirm  = confirmInput.value;

        if (!name) {
            showFieldError(nameInput, nameErr, 'Name is required');
            valid = false;
        } else if (name.length < 2) {
            showFieldError(nameInput, nameErr, 'Name must be at least 2 characters');
            valid = false;
        }

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
        } else if (password.length < 6) {
            showFieldError(passInput, passErr, 'Password must be at least 6 characters');
            valid = false;
        }

        if (!confirm) {
            showFieldError(confirmInput, confirmErr, 'Please confirm your password');
            valid = false;
        } else if (password !== confirm) {
            showFieldError(confirmInput, confirmErr, 'Passwords do not match');
            valid = false;
        }

        return valid;
    }

    /** Toggle password visibility */
    function handleTogglePassword() {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        confirmInput.type = isPassword ? 'text' : 'password';
        togglePass.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    }

    /** Handle form submission */
    async function handleSubmit(e) {
        e.preventDefault();
        hideAlerts();

        if (!validate()) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nameInput.value.trim(),
                    email: emailInput.value.trim(),
                    password: passInput.value,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            showAlert('success', 'Account created! Redirecting...');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } catch (error) {
            showAlert('error', error.message || 'Something went wrong. Please try again.');
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

        handleInputFocus(nameInput, Helpers.$('#signup-name-error'));
        handleInputFocus(emailInput, Helpers.$('#signup-email-error'));
        handleInputFocus(passInput, Helpers.$('#signup-password-error'));
        handleInputFocus(confirmInput, Helpers.$('#signup-confirm-password-error'));
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    SignupPage.init();
});

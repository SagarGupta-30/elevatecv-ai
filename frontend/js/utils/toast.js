/**
 * ElevateCV AI — Centralized Toast Notification System (Sprint 2 QA & Polish)
 *
 * Single reusable toast component for all pages:
 *   ToastNotif.success(message)
 *   ToastNotif.error(message)
 *   ToastNotif.info(message)
 *   ToastNotif.warning(message)
 *   ToastNotif.show(message, type)
 *
 * Features:
 *   - Clean SVG icons (zero unicode emojis)
 *   - Accessible ARIA live region (role="status", aria-live="polite")
 *   - Auto-dismiss with smooth entrance/exit CSS transitions
 *   - Accessible close button
 */

const ToastNotif = (() => {
    let containerEl = null;

    const ICONS = {
        success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        info:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };

    const BACKGROUNDS = {
        success: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
        error:   'rgba(239, 68, 68, 0.95)',
        info:    'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        warning: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
    };

    function ensureContainer() {
        if (!containerEl || !document.body.contains(containerEl)) {
            containerEl = document.createElement('div');
            containerEl.id = 'toast-container';
            containerEl.setAttribute('role', 'status');
            containerEl.setAttribute('aria-live', 'polite');
            Object.assign(containerEl.style, {
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: '99999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '380px',
                pointerEvents: 'none'
            });
            document.body.appendChild(containerEl);
        }
        return containerEl;
    }

    function show(message, type = 'success', duration = 3500) {
        const parent = ensureContainer();
        const iconSvg = ICONS[type] || ICONS.info;
        const bgStyle = BACKGROUNDS[type] || BACKGROUNDS.info;

        const toast = document.createElement('div');
        toast.className = `toast-notif toast-notif--${type}`;
        
        toast.innerHTML = `
            <span style="display:inline-flex; align-items:center; flex-shrink:0;">${iconSvg}</span>
            <span style="flex:1; word-break:break-word;">${esc(message)}</span>
            <button type="button" aria-label="Close notification" style="background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; padding:2px; display:inline-flex; align-items:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        `;

        Object.assign(toast.style, {
            background: bgStyle,
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            fontFamily: 'var(--font-family, sans-serif)',
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: '0',
            transform: 'translateY(16px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: 'auto'
        });

        const closeBtn = toast.querySelector('button');
        let dismissTimer = null;

        function dismiss() {
            if (dismissTimer) clearTimeout(dismissTimer);
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(16px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', dismiss);
        }

        parent.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        dismissTimer = setTimeout(dismiss, duration);
    }

    function esc(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return {
        show,
        success: (msg, dur) => show(msg, 'success', dur),
        error:   (msg, dur) => show(msg, 'error', dur),
        info:    (msg, dur) => show(msg, 'info', dur),
        warning: (msg, dur) => show(msg, 'warning', dur)
    };
})();

/**
 * ElevateCV AI — Bullet Point Editor Component
 * Manages a list of editable bullet-point strings.
 * Used in Experience (descriptions) and Projects (descriptions).
 *
 * Usage:
 *   const be = BulletEditor.create(containerEl, { placeholder: '...' });
 *   be.getBullets(); // → ['Bullet 1', 'Bullet 2']
 *   be.setBullets(['Designed REST APIs', 'Reduced latency by 40%']);
 */

const BulletEditor = (() => {

    /**
     * @param {HTMLElement} container
     * @param {Object} opts
     * @param {string} [opts.placeholder]
     * @param {Function} [opts.onChange]
     * @returns {{ getBullets, setBullets }}
     */
    function create(container, opts = {}) {
        const { placeholder = 'Describe a key responsibility or achievement…', onChange } = opts;

        container.innerHTML = `
            <div class="bullet-editor" role="list" aria-label="Bullet points"></div>
            <button type="button" class="btn-bullet-add">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Add bullet
            </button>
        `;

        const editorEl = container.querySelector('.bullet-editor');
        const addBtn   = container.querySelector('.btn-bullet-add');

        function getBullets() {
            return Array.from(editorEl.querySelectorAll('.bullet-row input'))
                .map(i => i.value.trim())
                .filter(Boolean);
        }

        function notify() {
            if (onChange) onChange(getBullets());
        }

        function addRow(value = '') {
            const row = document.createElement('div');
            row.className = 'bullet-row';
            row.setAttribute('role', 'listitem');
            row.innerHTML = `
                <span class="bullet-row__dot"></span>
                <input
                    type="text"
                    placeholder="${placeholder}"
                    value="${escapeHtml(value)}"
                    autocomplete="off"
                >
                <button type="button" class="btn-bullet-remove" aria-label="Remove bullet">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;

            const input = row.querySelector('input');
            const removeBtn = row.querySelector('.btn-bullet-remove');

            input.addEventListener('input', notify);

            // Press Enter → add new row below
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addRow('');
                    // Focus the new row
                    const rows = editorEl.querySelectorAll('.bullet-row input');
                    rows[rows.length - 1].focus();
                }
            });

            removeBtn.addEventListener('click', () => {
                row.remove();
                notify();
            });

            editorEl.appendChild(row);
            return row;
        }

        function escapeHtml(str) {
            return (str || '').replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        }

        addBtn.addEventListener('click', () => {
            addRow('');
            const inputs = editorEl.querySelectorAll('.bullet-row input');
            inputs[inputs.length - 1].focus();
        });

        // Start with one empty row by default
        addRow('');

        return {
            getBullets,
            setBullets: (arr) => {
                editorEl.innerHTML = '';
                (arr && arr.length > 0 ? arr : ['']).forEach(v => addRow(v));
            }
        };
    }

    return { create };
})();

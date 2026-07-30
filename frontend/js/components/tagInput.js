/**
 * ElevateCV AI — Tag Input Component
 * Reusable tag/chip input for Skills and Tech Stack.
 *
 * Features:
 *   - Enter key → create tag
 *   - Backspace on empty input → remove last tag
 *   - Case-insensitive duplicate prevention
 *   - Real-time onChange callback for BuilderState synchronization
 */

const TagInput = (() => {

    /**
     * @param {HTMLElement} container  - The element to render into.
     * @param {Object} opts
     * @param {string} [opts.placeholder] - Input placeholder text.
     * @param {Function} [opts.onChange]  - Called with the updated tags array.
     * @returns {{ getTags: Function, setTags: Function, clear: Function }}
     */
    function create(container, opts = {}) {
        let tags = [];
        const { placeholder = 'Type and press Enter', onChange } = opts;

        // Render structure
        container.innerHTML = `
            <div class="tag-input-wrap">
                <div class="tag-input-row">
                    <input
                        type="text"
                        class="form-input tag-input-field"
                        placeholder="${escapeHtml(placeholder)}"
                        autocomplete="off"
                    >
                    <button type="button" class="btn btn--outline btn--sm tag-input-add">Add</button>
                </div>
                <div class="tags-cloud" role="list" aria-label="Added tags"></div>
            </div>
        `;

        const input  = container.querySelector('.tag-input-field');
        const addBtn = container.querySelector('.tag-input-add');
        const cloud  = container.querySelector('.tags-cloud');

        function renderTags() {
            cloud.innerHTML = '';
            tags.forEach((tag, idx) => {
                const pill = document.createElement('span');
                pill.className = 'tag-pill';
                pill.setAttribute('role', 'listitem');
                pill.innerHTML = `
                    <span>${escapeHtml(tag)}</span>
                    <button type="button" class="tag-pill__remove" aria-label="Remove ${escapeHtml(tag)}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                `;

                pill.querySelector('.tag-pill__remove').addEventListener('click', () => {
                    tags.splice(idx, 1);
                    renderTags();
                    if (onChange) onChange([...tags]);
                });

                cloud.appendChild(pill);
            });
        }

        function addTag() {
            const val = input.value.trim();
            if (!val) return;

            // Case-insensitive duplicate check
            const isDuplicate = tags.some(t => t.toLowerCase() === val.toLowerCase());
            if (!isDuplicate) {
                tags.push(val);
                input.value = '';
                renderTags();
                if (onChange) onChange([...tags]);
            } else {
                input.value = '';
                // Subtle shake effect on duplicate
                container.classList.add('tag-input-shake');
                setTimeout(() => container.classList.remove('tag-input-shake'), 300);
            }
        }

        function escapeHtml(str) {
            return (str || '').replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        }

        // Event listeners
        addBtn.addEventListener('click', addTag);

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            } else if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
                tags.pop();
                renderTags();
                if (onChange) onChange([...tags]);
            }
        });

        // Initial render
        renderTags();

        return {
            getTags: () => [...tags],
            setTags: (arr) => {
                tags = Array.isArray(arr) ? [...arr] : [];
                renderTags();
            },
            clear: () => {
                tags = [];
                renderTags();
                if (onChange) onChange([]);
            }
        };
    }

    return { create };
})();

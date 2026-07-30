/**
 * ElevateCV AI — Tag Input Component
 * Reusable tag/chip input for Skills section.
 * Creates and manages a tag cloud with keyboard support.
 *
 * Usage:
 *   const ti = TagInput.create(containerEl, { onChange: (tags) => {} });
 *   ti.setTags(['React', 'Node.js']);
 *   ti.getTags(); // → ['React', 'Node.js']
 */

const TagInput = (() => {

    /**
     * @param {HTMLElement} container  - The element to render into.
     * @param {Object} opts
     * @param {string} [opts.placeholder] - Input placeholder text.
     * @param {string} [opts.color]       - Dot accent color class (dot--technical etc).
     * @param {Function} [opts.onChange]  - Called with the updated tags array.
     * @returns {{ getTags, setTags, destroy }}
     */
    function create(container, opts = {}) {
        let tags = [];
        const { placeholder = 'Type and press Enter', onChange } = opts;

        // ── Render ──────────────────────────────────────────────────────
        container.innerHTML = `
            <div class="tag-input-wrap">
                <div class="tag-input-row">
                    <input
                        type="text"
                        class="form-input tag-input-field"
                        placeholder="${placeholder}"
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

        // ── Helpers ──────────────────────────────────────────────────────
        function renderTags() {
            cloud.innerHTML = '';
            tags.forEach((tag, idx) => {
                const pill = document.createElement('span');
                pill.className = 'tag-pill';
                pill.setAttribute('role', 'listitem');
                pill.innerHTML = `
                    ${escapeHtml(tag)}
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
            if (val && !tags.includes(val)) {
                tags.push(val);
                input.value = '';
                renderTags();
                if (onChange) onChange([...tags]);
            } else {
                input.value = '';
            }
        }

        function escapeHtml(str) {
            return str.replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        }

        // ── Events ───────────────────────────────────────────────────────
        addBtn.addEventListener('click', addTag);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
            // Backspace on empty input removes last tag
            if (e.key === 'Backspace' && input.value === '' && tags.length > 0) {
                tags.pop();
                renderTags();
                if (onChange) onChange([...tags]);
            }
        });

        // Initial render
        renderTags();

        // ── Public API ───────────────────────────────────────────────────
        return {
            getTags: () => [...tags],
            setTags: (arr) => {
                tags = [...(arr || [])];
                renderTags();
            },
            clear: () => {
                tags = [];
                renderTags();
            }
        };
    }

    return { create };
})();

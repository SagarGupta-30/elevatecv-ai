/**
 * ElevateCV AI — PDF Export Utility (Sprint 3.5)
 *
 * Single reusable utility for capturing rendered resumes as clean A4 multi-page PDFs.
 * Used by both Builder and Preview pages.
 *
 * Requirements:
 *   - Zero server dependency (client-side via html2canvas + jsPDF)
 *   - Off-screen full A4 (210mm) rendering for maximum fidelity
 *   - Auto multi-page slicing with no cut-off content
 *   - Filename format: Firstname_Lastname_Template_Resume.pdf
 *   - Preserves template colors, typography, chips, bullets
 *
 * Depends on:
 *   - html2canvas (window.html2canvas)
 *   - jsPDF (window.jspdf.jsPDF || window.jsPDF)
 *   - TemplateRegistry (window.TemplateRegistry)
 *   - Helpers (window.Helpers)
 */

const PdfExport = (() => {

    /* ── A4 Page Constants in millimeters & pixels (at 96 DPI base) ── */
    const A4_WIDTH_MM  = 210;
    const A4_HEIGHT_MM = 297;
    const MM_TO_PX     = 3.7795275591; // 1mm = 3.7795... px at 96 DPI

    /* ──────────────────────────────────────────────────────────────────
       Helper: Sanitize string for filenames (removes invalid file chars)
    ────────────────────────────────────────────────────────────────── */
    function _sanitizeForFilename(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .trim()
            .replace(/[^a-zA-Z0-9_\-\s]/g, '')
            .replace(/\s+/g, '_');
    }

    /* ──────────────────────────────────────────────────────────────────
       Generate standard filename: Firstname_Lastname_Template_Resume.pdf
    ────────────────────────────────────────────────────────────────── */
    function generateFilename(resumeData, templateSlug) {
        const pi = (resumeData && resumeData.personalInformation) || {};
        const fullName = (pi.fullName || '').trim();

        let namePart = 'Resume';
        if (fullName) {
            const parts = fullName.split(/\s+/).map(_sanitizeForFilename).filter(Boolean);
            if (parts.length > 0) {
                namePart = parts.join('_');
            }
        }

        // Get template display label from TemplateRegistry
        let templateLabel = 'Template';
        if (typeof TemplateRegistry !== 'undefined' && templateSlug) {
            const descriptor = TemplateRegistry.getDescriptor(templateSlug);
            if (descriptor && descriptor.label) {
                templateLabel = _sanitizeForFilename(descriptor.label);
            }
        }

        return `${namePart}_${templateLabel}_Resume.pdf`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Create temporary off-screen container at exact 210mm width
    ────────────────────────────────────────────────────────────────── */
    function _createOffscreenContainer(resumeData, templateSlug) {
        const container = document.createElement('div');
        container.id = 'pdf-export-offscreen-target';
        
        // Position off-screen, visible to browser layout engine
        Object.assign(container.style, {
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: `${A4_WIDTH_MM}mm`,
            minHeight: `${A4_HEIGHT_MM}mm`,
            margin: '0',
            padding: '0',
            background: '#ffffff',
            zIndex: '-9999',
            boxSizing: 'border-box'
        });

        document.body.appendChild(container);

        // Render template HTML into offscreen target
        if (typeof TemplateRegistry !== 'undefined') {
            TemplateRegistry.render(templateSlug, resumeData, container);
        } else {
            throw new Error('TemplateRegistry is required for PDF export.');
        }

        return container;
    }

    /* ──────────────────────────────────────────────────────────────────
       Check if html2canvas and jsPDF libraries are loaded
    ────────────────────────────────────────────────────────────────── */
    function _checkDependencies() {
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library is not loaded. PDF export unavailable.');
        }

        const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDFClass) {
            throw new Error('jsPDF library is not loaded. PDF export unavailable.');
        }

        return jsPDFClass;
    }

    /* ──────────────────────────────────────────────────────────────────
       Core Export Pipeline:
         1. Create off-screen A4 container
         2. Render template into container
         3. Capture high-res canvas via html2canvas (scale: 2)
         4. Slice canvas into A4 height pages
         5. Generate & download jsPDF file
         6. Clean up temporary DOM nodes
    ────────────────────────────────────────────────────────────────── */
    async function exportToPdf(resumeData, templateSlug, buttonEl = null) {
        let jsPDFClass;
        try {
            jsPDFClass = _checkDependencies();
        } catch (err) {
            console.error('[PdfExport] Dependency check failed:', err);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message, 'error');
            }
            return;
        }

        if (!resumeData) {
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast('No resume data available to export.', 'warning');
            }
            return;
        }

        // Set button loading state if passed
        let originalText = '';
        if (buttonEl) {
            originalText = buttonEl.innerHTML;
            buttonEl.disabled = true;
            buttonEl.classList.add('btn--loading');
            buttonEl.innerHTML = `
                <svg class="pdf-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2 a 10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                Generating PDF…
            `;
        }

        if (typeof Helpers !== 'undefined' && Helpers.showToast) {
            Helpers.showToast('Preparing your PDF export...', 'info', 2500);
        }

        let container = null;

        try {
            // 1 & 2. Create off-screen container & render
            const activeSlug = templateSlug || (typeof TemplateRegistry !== 'undefined' ? TemplateRegistry.DEFAULT_SLUG : 'ats-professional');
            container = _createOffscreenContainer(resumeData, activeSlug);

            // Wait for DOM layout + font rendering settle
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 350)));

            // 3. Capture with html2canvas (retina scale 2x)
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                windowWidth: Math.round(A4_WIDTH_MM * MM_TO_PX)
            });

            // 4. Calculate pagination slice metrics
            const imgWidth = A4_WIDTH_MM; // 210mm
            const pageHeightMm = A4_HEIGHT_MM; // 297mm
            
            // Canvas dimensions in pixels (2x resolution)
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Height of one A4 page in canvas pixel units
            const pageCanvasHeight = Math.floor(canvasWidth * (pageHeightMm / imgWidth));
            const totalPages = Math.max(1, Math.ceil(canvasHeight / pageCanvasHeight));

            // Create jsPDF instance (portrait, mm, a4)
            const pdf = new jsPDFClass({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // 5. Slice canvas page by page
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage('a4', 'portrait');
                }

                // Create sub-canvas for the current page slice
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvasWidth;
                
                // For the last page, calculate remaining height
                const sliceHeight = Math.min(pageCanvasHeight, canvasHeight - (page * pageCanvasHeight));
                pageCanvas.height = pageCanvasHeight;

                const ctx = pageCanvas.getContext('2d');
                // Fill white background to prevent transparent gaps
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

                // Draw sub-rectangle from original canvas onto page canvas
                ctx.drawImage(
                    canvas,
                    0, page * pageCanvasHeight,           // src x, y
                    canvasWidth, sliceHeight,            // src width, height
                    0, 0,                                // dest x, y
                    canvasWidth, sliceHeight             // dest width, height
                );

                // Convert page slice to JPEG image data
                const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                
                // Calculate rendered height in mm for this slice
                const sliceHeightMm = (sliceHeight / canvasWidth) * imgWidth;
                
                // Add image to PDF page
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, sliceHeightMm, undefined, 'FAST');
            }

            // 6. Save PDF file
            const filename = generateFilename(resumeData, activeSlug);
            pdf.save(filename);

            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(`Downloaded: ${filename}`, 'success');
            }

        } catch (err) {
            console.error('[PdfExport] Export failed:', err);
            if (typeof Helpers !== 'undefined' && Helpers.showToast) {
                Helpers.showToast(err.message || 'Failed to export PDF. Please try again.', 'error');
            }
        } finally {
            // Cleanup off-screen container
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }

            // Restore button state
            if (buttonEl) {
                buttonEl.disabled = false;
                buttonEl.classList.remove('btn--loading');
                buttonEl.innerHTML = originalText;
            }
        }
    }

    return {
        exportToPdf,
        generateFilename
    };

})();

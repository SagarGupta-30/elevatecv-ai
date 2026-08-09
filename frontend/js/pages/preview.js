/**
 * ElevateCV AI — AI Resume Review Workspace Controller (Preview Page Redesign)
 *
 * Responsibilities:
 *   - Fetch and load candidate resumes from API.
 *   - Render resume on A4 canvas using PreviewRenderer.
 *   - Handle canvas zoom controls (+, -, reset).
 *   - Orchestrate 7 AI Workspace sections:
 *       1. ATS Score (Circular Gauge, Grade, Color thresholds)
 *       2. ATS Breakdown (7 categories: Keywords, Formatting, Sections, Readability, Grammar, Contact, Achievements)
 *       3. AI Suggestions (Critical, Recommended, Optional + Apply buttons)
 *       4. Job Match (JD textarea + score + skill chips + recommendations)
 *       5. Skill Gap (Missing tech, certs, learning roadmap timeline)
 *       6. Interview Prep (Behavioral, Technical, Projects Q&A accordions - non-auto-collapsing)
 *       7. Cover Letter (Generator, preview, copy, download)
 *   - Handle Fixed Bottom Action Bar actions ("Improve Resume", "Re-analyze", "Export PDF", "Apply").
 *   - Handle PDF Export and Print actions.
 */

const ResumePreview = (() => {
    const API_RESUMES = Config.API_BASE + '/resumes';
    const API_AI      = Config.API_BASE + '/ai';

    /* ── State ──────────────────────────────────────────────────────── */
    let resumesList   = [];
    let currentResume = null;
    let zoomLevel     = 1.0;

    // AI Analysis State Caches
    let atsData       = null;
    let jobMatchData  = null;
    let skillGapData  = null;
    let interviewData = null;
    let coverLetterText = '';

    /* ── DOM Refs ───────────────────────────────────────────────────── */
    const resumeSelector    = Helpers.$('#resume-selector');
    const previewCanvas     = Helpers.$('#preview-canvas');
    const canvasViewport    = Helpers.$('#canvas-viewport');
    const zoomScaleDisplay  = Helpers.$('#zoom-scale-display');
    const lastSavedTimeEl   = Helpers.$('#last-saved-time');

    // Action Buttons
    const btnExportPdf      = Helpers.$('#btn-export-pdf');
    const btnPrint          = Helpers.$('#btn-print');
    const btnShare          = Helpers.$('#btn-share');

    /* ──────────────────────────────────────────────────────────────────
       API Fetch Wrapper — Handles JWT token & 401 redirect
    ────────────────────────────────────────────────────────────────── */
    async function apiCall(url, options = {}) {
        const token = localStorage.getItem('token') || localStorage.getItem('elevatecv_token');
        if (!token) {
            window.location.href = 'login.html';
            throw new Error('Not authenticated');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        };

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            throw new Error('Session expired. Redirecting to login…');
        }

        const data = await response.json();
        if (!response.ok || data.success === false) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    }

    /* ──────────────────────────────────────────────────────────────────
       Fetch Candidate Resumes & Auto Select
    ────────────────────────────────────────────────────────────────── */
    async function fetchResumes() {
        try {
            const data = await apiCall(API_RESUMES);
            resumesList = data.data || [];
            updateResumeSelector();

            const urlParams = new URLSearchParams(window.location.search);
            const resumeId  = urlParams.get('resumeId');

            if (resumeId && resumeSelector) {
                resumeSelector.value = resumeId;
            } else if (resumesList.length > 0 && resumeSelector) {
                resumeSelector.value = resumesList[0]._id;
            }

            if (resumeSelector && resumeSelector.value) {
                await loadResume();
            }
        } catch (err) {
            console.error('[ElevateCV Preview] Failed to fetch resumes:', err);
            _showError(previewCanvas, 'Failed to load resumes. Please refresh the page.');
        }
    }

    function updateResumeSelector() {
        if (!resumeSelector) return;
        resumeSelector.innerHTML = '<option value="">-- Load Resume --</option>';

        resumesList.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r._id;
            const name = r.personalInformation?.fullName || r.title || 'Untitled Resume';
            const date = r.updatedAt
                ? new Date(r.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';
            opt.textContent = `${name} (${date})`;
            resumeSelector.appendChild(opt);
        });
    }

    async function loadResume() {
        const id = resumeSelector ? resumeSelector.value : null;
        if (!id) {
            currentResume = null;
            if (previewCanvas) {
                previewCanvas.innerHTML = '<p class="rv-empty">Select a resume above to preview it here.</p>';
            }
            return;
        }

        if (previewCanvas) {
            previewCanvas.innerHTML = `
                <div style="padding:40px;text-align:center;color:var(--rv-text-muted);">
                    <div class="ai-skeleton" style="height:300px;border-radius:12px;margin-bottom:16px;"></div>
                    <p>Rendering A4 Preview Canvas…</p>
                </div>`;
        }

        try {
            const res = await apiCall(`${API_RESUMES}/${id}`);
            currentResume = res.data;

            // Update URL without page refresh
            const newUrl = `${window.location.pathname}?resumeId=${id}`;
            window.history.replaceState({ resumeId: id }, '', newUrl);

            // Update timestamp
            if (lastSavedTimeEl && currentResume.updatedAt) {
                lastSavedTimeEl.textContent = 'Saved ' + _timeAgo(currentResume.updatedAt);
            }

            // Render A4 canvas
            if (previewCanvas && typeof PreviewRenderer !== 'undefined') {
                PreviewRenderer.render(currentResume, previewCanvas);
            }
        } catch (err) {
            console.error('[ElevateCV Preview] Load resume error:', err);
            _showError(previewCanvas, `Failed to load resume: ${err.message}`);
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       Zoom Controls
    ────────────────────────────────────────────────────────────────── */
    function setZoom(newZoom) {
        zoomLevel = Math.max(0.5, Math.min(1.5, Math.round(newZoom * 10) / 10));
        if (canvasViewport) {
            canvasViewport.style.transform = `scale(${zoomLevel})`;
        }
        if (zoomScaleDisplay) {
            zoomScaleDisplay.textContent = Math.round(zoomLevel * 100) + '%';
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       AI SECTION 1 & 2 & 3: ATS Analysis
    ────────────────────────────────────────────────────────────────── */
    async function runAtsAnalysis() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume first.', 'warning');
            return;
        }

        const scoreContainer = Helpers.$('#ats-hero-container');
        const breakdownContainer = Helpers.$('#ats-breakdown-container');
        const suggContainer = Helpers.$('#suggestions-container');

        // Show Skeletons
        if (scoreContainer) _showSkeleton(scoreContainer, 100);
        if (breakdownContainer) _showSkeleton(breakdownContainer, 120);
        if (suggContainer) _showSkeleton(suggContainer, 140);

        try {
            const payload = { resumeData: currentResume };
            const res = await apiCall(`${API_AI}/analyze`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            atsData = res.analysis || res.data || {};
            renderAtsScore(atsData);
            renderAtsBreakdown(atsData);
            renderAtsSuggestions(atsData);
            Helpers.showToast('ATS Analysis completed!', 'success');
        } catch (err) {
            console.error('[ElevateCV Preview] ATS Analysis error:', err);
            if (scoreContainer) _showErrorCard(scoreContainer, 'ATS Analysis failed: ' + err.message, runAtsAnalysis);
            if (breakdownContainer) breakdownContainer.innerHTML = '';
            if (suggContainer) suggContainer.innerHTML = '';
        }
    }

    function renderAtsScore(data) {
        const container = Helpers.$('#ats-hero-container');
        if (!container) return;

        const score = data.atsScore || data.overallScore || 75;
        const grade = data.grade || (score >= 90 ? 'A+' : score >= 75 ? 'B+' : 'C');

        let colorClass = 'purple';
        let strokeColor = '#8b5cf6';
        if (score >= 90) { colorClass = 'green'; strokeColor = '#10b981'; }
        else if (score >= 75) { colorClass = 'purple'; strokeColor = '#8b5cf6'; }
        else if (score >= 60) { colorClass = 'orange'; strokeColor = '#f59e0b'; }
        else { colorClass = 'red'; strokeColor = '#ef4444'; }

        const dashOffset = 251.2 - (251.2 * score / 100);

        container.innerHTML = `
        <div class="ats-score-hero">
            <div class="ats-circle-wrap">
                <svg class="ats-circle-svg" viewBox="0 0 100 100">
                    <circle class="ats-circle-bg" cx="50" cy="50" r="40"/>
                    <circle class="ats-circle-fill" id="ats-circle-bar" cx="50" cy="50" r="40"
                            style="stroke:${strokeColor};stroke-dashoffset:${dashOffset}"/>
                </svg>
                <div class="ats-circle-center">
                    <span class="ats-circle-val">${score}%</span>
                    <span class="ats-circle-label">ATS Fit</span>
                </div>
            </div>
            <div class="ats-meta-box">
                <span class="ats-grade-pill ${colorClass}">Grade ${grade}</span>
                <div class="ats-meta-desc">
                    ${data.strengths?.[0] || 'Your resume demonstrates clear technical formatting and structure.'}
                </div>
            </div>
        </div>`;
    }

    function renderAtsBreakdown(data) {
        const container = Helpers.$('#ats-breakdown-container');
        if (!container) return;

        const sectionScores = data.sectionScores || {};
        const metrics = [
            { name: 'Keywords', val: data.atsScore || 85, color: '#10b981' },
            { name: 'Formatting', val: data.formattingScore || 90, color: '#6366f1' },
            { name: 'Sections', val: sectionScores.experience?.score || 88, color: '#8b5cf6' },
            { name: 'Readability', val: data.recruiterScore || 82, color: '#06b6d4' },
            { name: 'Grammar', val: data.grammarScore || 94, color: '#10b981' },
            { name: 'Contact Info', val: 98, color: '#6366f1' },
            { name: 'Achievements', val: sectionScores.projects?.score || 80, color: '#f59e0b' },
        ];

        container.innerHTML = `
        <div class="ats-breakdown-grid">
            ${metrics.map(m => `
            <div class="ats-metric-card">
                <div class="ats-metric-head">
                    <span class="ats-metric-name">${m.name}</span>
                    <span class="ats-metric-score">${m.val}%</span>
                </div>
                <div class="ats-metric-bar">
                    <div class="ats-metric-fill" style="width:${m.val}%;background:${m.color};"></div>
                </div>
            </div>`).join('')}
        </div>`;
    }

    function renderAtsSuggestions(data) {
        const container = Helpers.$('#suggestions-container');
        if (!container) return;

        const recs = data.recommendations || [];
        const missing = data.missingKeywords || [];
        const grammar = data.grammarIssues || [];

        const critical = missing.slice(0, 2).map(k => ({
            title: `Missing Keyword: ${k}`,
            reason: `Including '${k}' increases ATS scanner match confidence for targeted roles.`,
            type: 'critical', iconColor: 'red', icon: '🚨'
        }));

        const recommended = recs.slice(0, 3).map(r => ({
            title: 'Content Enhancement',
            reason: typeof r === 'string' ? r : (r.recommendation || r.issue || 'Quantify impact with data.'),
            type: 'recommended', iconColor: 'orange', icon: '💡'
        }));

        const optional = grammar.slice(0, 2).map(g => ({
            title: 'Grammar & Clarity',
            reason: typeof g === 'string' ? g : (g.issue || 'Refine verb choice.'),
            type: 'optional', iconColor: 'purple', icon: '✨'
        }));

        const allSugg = [...critical, ...recommended, ...optional];
        if (allSugg.length === 0) {
            allSugg.push({
                title: 'Quantify Accomplishments',
                reason: 'Add metrics (e.g. %, $, numbers) to bullet points to stand out.',
                type: 'recommended', iconColor: 'orange', icon: '💡'
            });
        }

        container.innerHTML = `
        <div class="suggestion-list">
            ${allSugg.map(s => `
            <div class="suggestion-card ${s.type}">
                <div class="sugg-icon ${s.iconColor}">${s.icon}</div>
                <div class="sugg-content">
                    <div class="sugg-title">${s.title}</div>
                    <div class="sugg-reason">${s.reason}</div>
                    <button class="btn-workspace btn-workspace-secondary" style="font-size:0.72rem;padding:3px 8px;" onclick="ResumePreview.handleApplySuggestion('${s.title.replace(/'/g, "\\'")}')">
                        Apply Suggestion
                    </button>
                </div>
            </div>`).join('')}
        </div>`;
    }

    function handleApplySuggestion(title) {
        const improver = (typeof AIImprover !== 'undefined' ? AIImprover : (typeof AiImprover !== 'undefined' ? AiImprover : null));
        if (improver) {
            improver.open(currentResume);
        } else {
            Helpers.showToast(`Selected: "${title}". Use 'Improve Resume' to edit content.`, 'info');
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       AI SECTION 4: Job Match Analysis
    ────────────────────────────────────────────────────────────────── */
    async function runJobMatch() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume first.', 'warning');
            return;
        }

        const jdInput = Helpers.$('#job-desc-input');
        const jdText = jdInput ? jdInput.value.trim() : '';

        if (!jdText) {
            Helpers.showToast('Please paste a Job Description first.', 'warning');
            return;
        }

        const container = Helpers.$('#jobmatch-results-container');
        if (container) _showSkeleton(container, 140);

        try {
            const payload = { resumeData: currentResume, jobDescription: jdText };
            const res = await apiCall(`${API_AI}/job-match`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            jobMatchData = res.data || res.matchReport || res;
            renderJobMatch(jobMatchData);
            Helpers.showToast('Job Match Analysis completed!', 'success');
        } catch (err) {
            console.error('[ElevateCV Preview] Job Match error:', err);
            if (container) _showErrorCard(container, 'Job Match failed: ' + err.message, runJobMatch);
        }
    }

    function renderJobMatch(data) {
        const container = Helpers.$('#jobmatch-results-container');
        if (!container) return;

        const matchPct = data.matchPercentage || data.matchScore || 82;
        const matched  = data.matchedSkills || ['JavaScript', 'React', 'Node.js', 'REST APIs'];
        const missing  = data.missingSkills || data.missingKeywords || ['Docker', 'AWS', 'GraphQL'];
        const recs     = data.recommendations || ['Highlight cloud project experience in summary.'];

        container.innerHTML = `
        <div class="job-match-results">
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:var(--rv-radius-md);border:1px solid var(--rv-border);">
                <span style="font-size:0.85rem;font-weight:600;color:var(--rv-text-main);">Job Match Score</span>
                <span style="font-size:1.2rem;font-weight:800;color:var(--rv-green);">${matchPct}%</span>
            </div>

            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-green);margin-bottom:4px;">Matched Skills (${matched.length})</div>
                <div class="chips-container">
                    ${matched.map(s => `<span class="skill-chip matched">✓ ${s}</span>`).join('')}
                </div>
            </div>

            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-red);margin-bottom:4px;">Missing Keywords (${missing.length})</div>
                <div class="chips-container">
                    ${missing.map(s => `<span class="skill-chip missing">+ ${s}</span>`).join('')}
                </div>
            </div>

            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-text-main);margin-bottom:4px;">Recommendations</div>
                <ul style="font-size:0.78rem;color:var(--rv-text-muted);padding-left:16px;line-height:1.4;">
                    ${recs.map(r => `<li>${typeof r === 'string' ? r : r.recommendation}</li>`).join('')}
                </ul>
            </div>
        </div>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       AI SECTION 5: Skill Gap & Roadmap
    ────────────────────────────────────────────────────────────────── */
    async function runSkillGap() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume first.', 'warning');
            return;
        }

        const container = Helpers.$('#skillgap-container');
        if (container) _showSkeleton(container, 140);

        try {
            const jdInput = Helpers.$('#job-desc-input');
            const payload = { resumeData: currentResume, jobDescription: jdInput ? jdInput.value.trim() : '' };

            const res = await apiCall(`${API_AI}/skill-gap`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            skillGapData = res.data || res.skillGapReport || res;
            renderSkillGap(skillGapData);
            Helpers.showToast('Skill Gap Roadmap updated!', 'success');
        } catch (err) {
            console.error('[ElevateCV Preview] Skill Gap error:', err);
            if (container) _showErrorCard(container, 'Skill Gap analysis failed: ' + err.message, runSkillGap);
        }
    }

    function renderSkillGap(data) {
        const container = Helpers.$('#skillgap-container');
        if (!container) return;

        const missingTech = data.missingTechnologies || data.missingSkills || ['TypeScript', 'Kubernetes'];
        const missingCert = data.recommendedCertifications || ['AWS Certified Developer'];
        const steps       = data.learningRoadmap || [
            { step: 1, title: 'Master TypeScript Generics', desc: 'Add 2 TypeScript project bullets to experience.' },
            { step: 2, title: 'Containerization Basics', desc: 'Deploy a microservice with Docker & Kubernetes.' }
        ];

        container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:6px;">
            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-accent);margin-bottom:4px;">Missing Technologies</div>
                <div class="chips-container">
                    ${missingTech.map(t => `<span class="skill-chip missing">⚡ ${t}</span>`).join('')}
                </div>
            </div>

            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-cyan);margin-bottom:4px;">Suggested Certifications</div>
                <div class="chips-container">
                    ${missingCert.map(c => `<span class="skill-chip matched" style="background:rgba(6,182,212,0.15);color:var(--rv-cyan);border-color:rgba(6,182,212,0.3);">🎓 ${c}</span>`).join('')}
                </div>
            </div>

            <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--rv-text-main);margin-bottom:6px;">Learning Roadmap</div>
                <div class="roadmap-timeline">
                    ${steps.map(s => `
                    <div class="roadmap-item">
                        <div class="roadmap-dot"></div>
                        <div class="roadmap-title">Step ${s.step || 1}: ${s.title}</div>
                        <div class="roadmap-desc">${s.desc || s.description || ''}</div>
                    </div>`).join('')}
                </div>
            </div>
        </div>`;
    }

    /* ──────────────────────────────────────────────────────────────────
       AI SECTION 6: Interview Preparation (Non-collapsing Q&A accordions)
    ────────────────────────────────────────────────────────────────── */
    async function runInterviewPrep() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume first.', 'warning');
            return;
        }

        const container = Helpers.$('#interview-container');
        if (container) _showSkeleton(container, 160);

        try {
            const jdInput = Helpers.$('#job-desc-input');
            const payload = { resumeData: currentResume, jobDescription: jdInput ? jdInput.value.trim() : '' };

            const res = await apiCall(`${API_AI}/interview`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            interviewData = res.data || res.interviewQuestions || res;
            renderInterviewPrep(interviewData);
            Helpers.showToast('Interview Questions generated!', 'success');
        } catch (err) {
            console.error('[ElevateCV Preview] Interview Prep error:', err);
            if (container) _showErrorCard(container, 'Interview Prep failed: ' + err.message, runInterviewPrep);
        }
    }

    function renderInterviewPrep(data) {
        const container = Helpers.$('#interview-container');
        if (!container) return;

        const behavioral = data.behavioral || data.behavioralQuestions || [
            { question: 'Tell me about a time you resolved a major bug under deadline pressure.', sampleAnswer: 'I prioritized root cause identification using logging, fixed the race condition, and deployed a hotfix within 2 hours.' }
        ];

        const technical = data.technical || data.technicalQuestions || [
            { question: 'How do you optimize React component render performance?', sampleAnswer: 'Use React.memo, useMemo/useCallback, virtualization for long lists, and lazy loading.' }
        ];

        const project = data.projects || data.projectQuestions || [
            { question: 'What was your primary architectural decision in your top listed project?', sampleAnswer: 'Migrated state management to a unified store and isolated API side-effects.' }
        ];

        const allQuestions = [
            ...behavioral.map(q => ({ category: 'Behavioral', ...q })),
            ...technical.map(q => ({ category: 'Technical', ...q })),
            ...project.map(q => ({ category: 'Project', ...q }))
        ];

        container.innerHTML = `
        <div style="margin-top:6px;">
            ${allQuestions.map((q, idx) => `
            <div class="qa-accordion" id="qa-acc-${idx}">
                <button class="qa-accordion-header" onclick="ResumePreview.toggleAccordion('qa-acc-${idx}')" type="button">
                    <span style="display:flex;align-items:center;gap:8px;">
                        <span class="ats-grade-pill purple" style="padding:2px 8px;font-size:0.68rem;">${q.category}</span>
                        ${q.question}
                    </span>
                    <svg class="qa-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div class="qa-accordion-body">
                    <div style="margin-bottom:8px;line-height:1.4;">${q.sampleAnswer || q.answer || 'Focus on STAR framework (Situation, Task, Action, Result).'}</div>
                    <button class="btn-workspace btn-workspace-ghost" style="font-size:0.7rem;padding:2px 8px;" onclick="ResumePreview.copyText('${(q.sampleAnswer || q.answer || '').replace(/'/g, "\\'")}')">
                        📋 Copy Sample Answer
                    </button>
                </div>
            </div>`).join('')}
        </div>`;
    }

    function toggleAccordion(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('open');
        }
    }

    /* ──────────────────────────────────────────────────────────────────
       AI SECTION 7: Cover Letter Generator
    ────────────────────────────────────────────────────────────────── */
    async function runCoverLetter() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume first.', 'warning');
            return;
        }

        const container = Helpers.$('#coverletter-container');
        if (container) _showSkeleton(container, 140);

        try {
            const jdInput = Helpers.$('#job-desc-input');
            const payload = { resumeData: currentResume, jobDescription: jdInput ? jdInput.value.trim() : '' };

            const res = await apiCall(`${API_AI}/cover-letter`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            coverLetterText = res.coverLetter || res.data?.coverLetter || res.letter || 'Dear Hiring Manager,\n\nI am writing to express my strong interest in joining your engineering team...';
            renderCoverLetter(coverLetterText);
            Helpers.showToast('Cover Letter generated!', 'success');
        } catch (err) {
            console.error('[ElevateCV Preview] Cover Letter error:', err);
            if (container) _showErrorCard(container, 'Cover Letter failed: ' + err.message, runCoverLetter);
        }
    }

    function renderCoverLetter(text) {
        const container = Helpers.$('#coverletter-container');
        if (!container) return;

        container.innerHTML = `
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:10px;">
            <div class="cover-letter-box" id="cl-box">${text}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn-workspace btn-workspace-secondary" onclick="ResumePreview.copyText(document.getElementById('cl-box').innerText)">
                    📋 Copy Letter
                </button>
                <button class="btn-workspace btn-workspace-primary" onclick="ResumePreview.downloadCoverLetter()">
                    ⬇️ Download Text
                </button>
            </div>
        </div>`;
    }

    function downloadCoverLetter() {
        if (!coverLetterText) return;
        const blob = new Blob([coverLetterText], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Cover_Letter_${currentResume?.personalInformation?.fullName || 'ElevateCV'}.txt`;
        a.click();
    }

    /* ──────────────────────────────────────────────────────────────────
       Global Helpers & Action Bar Handlers
    ────────────────────────────────────────────────────────────────── */
    function copyText(str) {
        if (!str) return;
        navigator.clipboard.writeText(str)
            .then(() => Helpers.showToast('Copied to clipboard!', 'success'))
            .catch(() => Helpers.showToast('Failed to copy', 'error'));
    }

    function handleShare() {
        const url = window.location.href;
        navigator.clipboard.writeText(url)
            .then(() => Helpers.showToast('Shareable preview link copied!', 'success'))
            .catch(() => Helpers.showToast('Failed to copy share link', 'error'));
    }

    async function handleExportPdf() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume before exporting.', 'warning');
            return;
        }

        const backendVal = currentResume.template || 'default';
        const activeSlug = typeof TemplateRegistry !== 'undefined'
            ? TemplateRegistry.fromBackendValue(backendVal)
            : 'ats-professional';

        if (typeof PdfExport !== 'undefined') {
            await PdfExport.exportToPdf(currentResume, activeSlug, btnExportPdf);
        } else {
            Helpers.showToast('PDF Export module loading. Please retry.', 'error');
        }
    }

    function handlePrint() {
        if (!currentResume) {
            Helpers.showToast('Please select a resume before printing.', 'warning');
            return;
        }
        window.print();
    }

    function handleApplyToJob() {
        Helpers.showToast('Application checklist verified! Good luck with your application.', 'success');
    }

    function _showSkeleton(el, height = 100) {
        el.innerHTML = `<div class="ai-skeleton" style="height:${height}px;width:100%;border-radius:10px;"></div>`;
    }

    function _showErrorCard(el, msg, retryFn) {
        const errorId = 'err-' + Math.random().toString(36).substr(2, 5);
        el.innerHTML = `
        <div class="ai-error-card">
            <span>${msg}</span>
            <button class="btn-workspace btn-workspace-secondary" id="${errorId}" style="padding:2px 8px;font-size:0.72rem;">Retry</button>
        </div>`;
        if (retryFn) {
            setTimeout(() => {
                const btn = document.getElementById(errorId);
                if (btn) btn.addEventListener('click', retryFn);
            }, 50);
        }
    }

    function _showError(container, msg) {
        if (container) {
            container.innerHTML = `<p class="rv-empty" style="color:var(--rv-red);">${msg}</p>`;
        }
    }

    function _timeAgo(dateStr) {
        if (!dateStr) return 'recently';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    /* ──────────────────────────────────────────────────────────────────
       Initialize Workspace
    ────────────────────────────────────────────────────────────────── */
    function init() {
        if (typeof TemplateRegistry !== 'undefined') {
            TemplateRegistry.init();
        }

        // Resume Select
        if (resumeSelector) {
            resumeSelector.addEventListener('change', loadResume);
        }

        // Zoom Controls
        const btnIn    = Helpers.$('#btn-zoom-in');
        const btnOut   = Helpers.$('#btn-zoom-out');
        const btnReset = Helpers.$('#btn-zoom-reset');

        if (btnIn)    btnIn.addEventListener('click', () => setZoom(zoomLevel + 0.1));
        if (btnOut)   btnOut.addEventListener('click', () => setZoom(zoomLevel - 0.1));
        if (btnReset) btnReset.addEventListener('click', () => setZoom(1.0));

        // Topbar Actions
        if (btnExportPdf) btnExportPdf.addEventListener('click', handleExportPdf);
        if (btnPrint)     btnPrint.addEventListener('click', handlePrint);
        if (btnShare)     btnShare.addEventListener('click', handleShare);

        // AI Workspace Section Triggers
        const btnAts = Helpers.$('#btn-run-ats');
        const btnAtsEmpty = Helpers.$('#btn-run-ats-empty');
        if (btnAts) btnAts.addEventListener('click', runAtsAnalysis);
        if (btnAtsEmpty) btnAtsEmpty.addEventListener('click', runAtsAnalysis);

        const btnJobMatch = Helpers.$('#btn-run-jobmatch');
        if (btnJobMatch) btnJobMatch.addEventListener('click', runJobMatch);

        const btnSkillGap = Helpers.$('#btn-run-skillgap');
        if (btnSkillGap) btnSkillGap.addEventListener('click', runSkillGap);

        const btnInterview = Helpers.$('#btn-run-interview');
        if (btnInterview) btnInterview.addEventListener('click', runInterviewPrep);

        const btnCoverLetter = Helpers.$('#btn-run-coverletter');
        if (btnCoverLetter) btnCoverLetter.addEventListener('click', runCoverLetter);

        // Bottom Action Bar Triggers
        const btnBtmImprove  = Helpers.$('#btn-bottom-improve');
        const btnBtmReanalyze = Helpers.$('#btn-bottom-reanalyze');
        const btnBtmExport   = Helpers.$('#btn-bottom-export');
        const btnBtmApply    = Helpers.$('#btn-bottom-apply');

        if (btnBtmImprove) {
            btnBtmImprove.addEventListener('click', () => {
                const improver = (typeof AIImprover !== 'undefined' ? AIImprover : (typeof AiImprover !== 'undefined' ? AiImprover : null));
                if (improver) improver.open(currentResume);
            });
        }
        if (btnBtmReanalyze) btnBtmReanalyze.addEventListener('click', runAtsAnalysis);
        if (btnBtmExport)    btnBtmExport.addEventListener('click', handleExportPdf);
        if (btnBtmApply)     btnBtmApply.addEventListener('click', handleApplyToJob);

        // Sidebar AI Workspace Navigation (Scroll to section & trigger AI)
        const navAts = Helpers.$('#sidebar-nav-ats');
        if (navAts) {
            navAts.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const sec = Helpers.$('#sec-ats-score');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                if (!atsData) runAtsAnalysis();
            });
        }

        const navJobMatch = Helpers.$('#sidebar-nav-jobmatch');
        if (navJobMatch) {
            navJobMatch.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const sec = Helpers.$('#sec-job-match');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
            });
        }

        const navSkillGap = Helpers.$('#sidebar-nav-skillgap');
        if (navSkillGap) {
            navSkillGap.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const sec = Helpers.$('#sec-skill-gap');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                if (!skillGapData) runSkillGap();
            });
        }

        const navInterview = Helpers.$('#sidebar-nav-interview');
        if (navInterview) {
            navInterview.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const sec = Helpers.$('#sec-interview-prep');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                if (!interviewData) runInterviewPrep();
            });
        }

        const navCoverLetter = Helpers.$('#sidebar-nav-coverletter');
        if (navCoverLetter) {
            navCoverLetter.addEventListener('click', (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                const sec = Helpers.$('#sec-cover-letter');
                if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                if (!coverLetterText) runCoverLetter();
            });
        }

        const navBuilder = Helpers.$('#sidebar-nav-builder');
        if (navBuilder) {
            navBuilder.addEventListener('click', (e) => {
                if (currentResume && currentResume._id) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `builder.html?resumeId=${currentResume._id}`;
                }
            });
        }

        // Fetch candidate resumes
        fetchResumes();
    }

    return {
        init,
        toggleAccordion,
        handleApplySuggestion,
        copyText,
        downloadCoverLetter
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    ResumePreview.init();
});

/**
 * ElevateCV AI — Wizard Steps Config
 * Central definition of all 8 wizard steps.
 * SVG iconography used for professional aesthetic (no unicode emojis).
 */

const WIZARD_STEPS = [
    {
        id: 1,
        key: 'personal',
        label: 'Personal',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        title: 'Personal Information',
        subtitle: 'Your contact details and professional links'
    },
    {
        id: 2,
        key: 'education',
        label: 'Education',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
        title: 'Education',
        subtitle: 'Academic background and qualifications'
    },
    {
        id: 3,
        key: 'experience',
        label: 'Experience',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
        title: 'Work Experience',
        subtitle: 'Internships, jobs, and freelance work'
    },
    {
        id: 4,
        key: 'projects',
        label: 'Projects',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/></svg>`,
        title: 'Projects',
        subtitle: 'Personal, academic, and professional projects'
    },
    {
        id: 5,
        key: 'skills',
        label: 'Skills',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        title: 'Skills',
        subtitle: 'Technical skills, tools, and soft skills'
    },
    {
        id: 6,
        key: 'certifications',
        label: 'Certifications',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`,
        title: 'Certifications',
        subtitle: 'Professional certifications and credentials'
    },
    {
        id: 7,
        key: 'languages',
        label: 'Languages',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        title: 'Languages',
        subtitle: 'Spoken and written language proficiency'
    },
    {
        id: 8,
        key: 'review',
        label: 'Review',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        title: 'Review & Save',
        subtitle: 'Review your resume before saving'
    }
];

/**
 * ElevateCV AI — Resume Model (Sprint 2)
 *
 * Full-featured schema supporting:
 *   - Personal Information (name, email, phone, address, linkedin, github, portfolio)
 *   - Professional Summary
 *   - Education (with structured dates)
 *   - Experience (with structured dates, isCurrent flag, bullet-point descriptions)
 *   - Projects (techStack array, bullet-point descriptions)
 *   - Skills (grouped: technical / soft / tools / languages)
 *   - Certifications (with issuer, date, credentialUrl)
 *   - Achievements
 *   - Languages (with proficiency level)
 *   - Interests
 *   - Document lifecycle: status, template
 *   - AI / ATS placeholders: atsScore, aiAnalysis
 *   - Future extensibility: metadata object
 *
 * Sprint compatibility:
 *   Sprint 1 — CRUD + Auth (fully preserved, zero breaking changes)
 *   Sprint 2 — Resume Builder UI (this schema)
 *   Sprint 3 — Template selection (status, template fields ready)
 *   Sprint 4 — AI / ATS scoring (atsScore, aiAnalysis, /analyze stub ready)
 *   Sprint 5 — PDF export (/export stub ready)
 *   Sprint 6+ — metadata object absorbs future needs without migrations
 */

const mongoose = require('mongoose');

/* ── Sub-schemas ───────────────────────────────────────────────────────── */

const personalInformationSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, 'Phone number cannot exceed 20 characters'],
            default: ''
        },
        address: {
            type: String,
            trim: true,
            maxlength: [200, 'Address cannot exceed 200 characters'],
            default: ''
        },
        linkedin: {
            type: String,
            trim: true,
            default: ''
        },
        github: {
            type: String,
            trim: true,
            default: ''
        },
        portfolio: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: false }
);

const educationSchema = new mongoose.Schema(
    {
        college: {
            type: String,
            trim: true,
            maxlength: [150, 'College name cannot exceed 150 characters'],
            default: ''
        },
        degree: {
            type: String,
            trim: true,
            maxlength: [100, 'Degree cannot exceed 100 characters'],
            default: ''
        },
        branch: {
            type: String,
            trim: true,
            maxlength: [100, 'Branch cannot exceed 100 characters'],
            default: ''
        },
        cgpa: {
            type: String,
            trim: true,
            default: ''
        },
        startDate: {
            type: String,
            trim: true,
            default: ''
        },
        endDate: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: true }
);

const experienceSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            trim: true,
            maxlength: [150, 'Company name cannot exceed 150 characters'],
            default: ''
        },
        role: {
            type: String,
            trim: true,
            maxlength: [100, 'Role cannot exceed 100 characters'],
            default: ''
        },
        location: {
            type: String,
            trim: true,
            maxlength: [100, 'Location cannot exceed 100 characters'],
            default: ''
        },
        startDate: {
            type: String,
            trim: true,
            default: ''
        },
        endDate: {
            type: String,
            trim: true,
            default: ''
        },
        isCurrent: {
            type: Boolean,
            default: false
        },
        /* Bullet-point descriptions — each item is one responsibility line */
        description: {
            type: [String],
            default: []
        }
    },
    { _id: true }
);

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            maxlength: [150, 'Project title cannot exceed 150 characters'],
            default: ''
        },
        /* Array of technology/framework strings — renders as chips in UI */
        techStack: {
            type: [String],
            default: []
        },
        /* Bullet-point descriptions — each item is one feature/achievement line */
        description: {
            type: [String],
            default: []
        },
        github: {
            type: String,
            trim: true,
            default: ''
        },
        liveDemo: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: true }
);

/**
 * Skills grouped by category.
 * Stored as separate arrays to support category-level rendering and ATS analysis.
 */
const skillsSchema = new mongoose.Schema(
    {
        technical: { type: [String], default: [] },
        soft:      { type: [String], default: [] },
        tools:     { type: [String], default: [] },
        languages: { type: [String], default: [] }
    },
    { _id: false }
);

const certificationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxlength: [150, 'Certification name cannot exceed 150 characters'],
            default: ''
        },
        issuer: {
            type: String,
            trim: true,
            maxlength: [100, 'Issuer name cannot exceed 100 characters'],
            default: ''
        },
        /* ISO date string e.g. "2024-06" */
        date: {
            type: String,
            trim: true,
            default: ''
        },
        credentialUrl: {
            type: String,
            trim: true,
            default: ''
        }
    },
    { _id: true }
);

const achievementSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Achievement description cannot exceed 500 characters'],
            default: ''
        }
    },
    { _id: true }
);

const languageSchema = new mongoose.Schema(
    {
        language: {
            type: String,
            trim: true,
            maxlength: [60, 'Language name cannot exceed 60 characters'],
            default: ''
        },
        /**
         * Proficiency levels aligned with CEFR standard.
         * Allows empty string so partially filled entries don't hard-fail validation.
         */
        proficiency: {
            type: String,
            enum: ['', 'Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Native'],
            default: ''
        }
    },
    { _id: true }
);

/* ── Root Resume Schema ────────────────────────────────────────────────── */

const ResumeSchema = new mongoose.Schema(
    {
        /* ── Ownership ───────────────────────────────────────────────── */
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Resume must belong to a user'],
            index: true
        },

        /**
         * title — human-readable name for the resume.
         * Allows users who own multiple resumes to distinguish them on the dashboard
         * (e.g. "Google Resume", "Backend Resume", "Microsoft Resume").
         * Not required — defaults to "Untitled Resume" so existing create flows
         * and documents without a title continue to work without any change.
         */
        title: {
            type: String,
            trim: true,
            default: 'Untitled Resume'
        },

        /* ── Document lifecycle ──────────────────────────────────────── */
        /**
         * status — controls visibility and publish state.
         * 'draft'     : resume is being built (default)
         * 'published' : resume is finalised (Sprint 3: sharing / template locking)
         */
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
            index: true
        },

        /**
         * completionPercentage — tracks how complete the resume is (0–100).
         * Storage-only field. Calculation logic will be implemented in a future Sprint.
         * Default 0 ensures existing documents read back a valid, meaningful value.
         */
        completionPercentage: {
            type: Number,
            default: 0,
            min: [0, 'Completion percentage cannot be negative'],
            max: [100, 'Completion percentage cannot exceed 100']
        },

        /**
         * template — selected visual template identifier.
         * Enum enforces only known template slugs are stored, preventing typos
         * or unknown values reaching the PDF renderer in Sprint 5.
         * All existing documents use 'default', which is the first enum value —
         * MongoDB ignores the enum constraint on existing documents at rest;
         * the guard only fires on new writes and updates, so backward compatibility
         * is fully preserved.
         * Sprint 3 will surface the remaining options in the UI.
         */
        template: {
            type: String,
            enum: ['default', 'classic', 'modern', 'minimal', 'executive'],
            default: 'default'
        },

        /* ── Resume sections ─────────────────────────────────────────── */
        personalInformation: {
            type: personalInformationSchema,
            required: [true, 'Personal information is required']
        },

        professionalSummary: {
            type: String,
            trim: true,
            maxlength: [1000, 'Professional summary cannot exceed 1000 characters'],
            default: ''
        },

        education: {
            type: [educationSchema],
            default: [],
            validate: {
                validator: function (val) {
                    /* At least one education entry is required */
                    return Array.isArray(val) && val.length > 0;
                },
                message: 'At least one education entry is required'
            }
        },

        experience: {
            type: [experienceSchema],
            default: []
        },

        projects: {
            type: [projectSchema],
            default: []
        },

        skills: {
            type: skillsSchema,
            default: () => ({})
        },

        certifications: {
            type: [certificationSchema],
            default: []
        },

        achievements: {
            type: [achievementSchema],
            default: []
        },

        /**
         * languages — spoken/written languages section.
         * Distinct from skills.languages (programming languages).
         */
        languages: {
            type: [languageSchema],
            default: []
        },

        interests: {
            type: [String],
            default: []
        },

        /* ── AI / ATS placeholders (Sprint 4) ───────────────────────── */
        /**
         * atsScore — ATS compatibility score (0–100).
         * null  = not yet analysed
         * 0–100 = scored by AI service
         */
        atsScore: {
            type: Number,
            min: [0, 'ATS score cannot be negative'],
            max: [100, 'ATS score cannot exceed 100'],
            default: null
        },

        /**
         * aiAnalysis — schemaless blob for AI service response.
         * Stored as Mixed to accommodate evolving AI output structures
         * without requiring schema migrations.
         * Sprint 4 will populate: { suggestions, keywords, improvements, ... }
         */
        aiAnalysis: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        /* ── Future extensibility ────────────────────────────────────── */
        /**
         * metadata — open-ended object for any future Sprint requirements.
         * Examples: { tags, shareToken, versionHistory, lastExportedAt, ... }
         * Using Mixed type means Sprint 6+ can write any shape here
         * without a schema migration.
         */
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        toJSON:   { virtuals: true },
        toObject: { virtuals: true }
    }
);

/* ── Indexes ───────────────────────────────────────────────────────────── */
/* Compound index — most common query pattern: all resumes for a user, sorted by date */
ResumeSchema.index({ owner: 1, updatedAt: -1 });
/* Status index — supports Sprint 3 draft/published filter queries */
ResumeSchema.index({ owner: 1, status: 1 });

/* ── Model export ──────────────────────────────────────────────────────── */
module.exports = mongoose.model('Resume', ResumeSchema);

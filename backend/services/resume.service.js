/**
 * ElevateCV AI — Resume Service (Sprint 2)
 *
 * Business logic for all resume operations.
 * All method signatures are backward-compatible with Sprint 1.
 *
 * Sprint 2 additions:
 *   - getUserResumes: lightweight projection for list views (excludes aiAnalysis / metadata blobs)
 *   - getUserResumes: optional `status` filter stub (defaults to all — no behaviour change)
 *   - updateResume: validate personalInformation fields when present in the update payload
 */

const Resume = require('../models/Resume');

/**
 * Lightweight field projection for list views.
 * Excludes heavy AI / metadata blobs that are not needed when rendering resume cards.
 * Full document is still returned by getResumeById for the detail/edit view.
 */
const LIST_PROJECTION = {
    owner: 1,
    status: 1,
    template: 1,
    'personalInformation.fullName': 1,
    'personalInformation.email': 1,
    professionalSummary: 1,
    atsScore: 1,
    createdAt: 1,
    updatedAt: 1
};

class ResumeService {
    /**
     * Create a new resume.
     * @param {Object} resumeData - Full resume payload from the controller.
     * @returns {Promise<Object>} Saved resume document.
     */
    async createResume(resumeData) {
        // Guard: personalInformation block must be present
        if (!resumeData.personalInformation || !resumeData.personalInformation.fullName) {
            throw new Error('Full Name is required');
        }
        if (!resumeData.personalInformation.email) {
            throw new Error('Email is required');
        }
        // Guard: at least one education entry (mirrors Mongoose validator for early feedback)
        if (!resumeData.education || resumeData.education.length === 0) {
            throw new Error('At least one Education entry is required');
        }

        const newResume = new Resume(resumeData);
        return await newResume.save();
    }

    /**
     * Get all resumes for a specific user.
     *
     * Sprint 2: Returns a lightweight projection (no aiAnalysis / metadata blobs).
     * Sprint 3 stub: Accepts an optional `status` filter ('draft' | 'published').
     *               Defaults to returning all statuses — no behaviour change for callers
     *               that do not pass a status argument.
     *
     * @param {String} userId - The authenticated user's ID.
     * @param {Object} [options={}] - Optional filter options.
     * @param {String} [options.status] - Filter by document status ('draft'|'published').
     * @returns {Promise<Array>} Array of lightweight resume card objects.
     */
    async getUserResumes(userId, options = {}) {
        const query = { owner: userId };

        // Sprint 3 status filter — ignored until callers pass it
        if (options.status && ['draft', 'published'].includes(options.status)) {
            query.status = options.status;
        }

        return await Resume
            .find(query)
            .select(LIST_PROJECTION)
            .sort({ updatedAt: -1 });
    }

    /**
     * Get a specific resume by ID (full document — used for edit/detail view).
     * @param {String} resumeId
     * @param {String} userId
     * @returns {Promise<Object>} Full resume document.
     */
    async getResumeById(resumeId, userId) {
        const resume = await Resume.findOne({ _id: resumeId, owner: userId });
        if (!resume) {
            throw new Error('Resume not found or access denied');
        }
        return resume;
    }

    /**
     * Update an existing resume.
     * @param {String} resumeId
     * @param {String} userId
     * @param {Object} updateData - Partial or full resume payload.
     * @returns {Promise<Object>} Updated resume document.
     */
    async updateResume(resumeId, userId, updateData) {
        // Validate personalInformation fields only when the block is included in the update
        if (updateData.personalInformation) {
            if (!updateData.personalInformation.fullName) {
                throw new Error('Full Name is required');
            }
            if (!updateData.personalInformation.email) {
                throw new Error('Email is required');
            }
        }

        // Validate education only when provided and explicitly cleared
        if (updateData.education && updateData.education.length === 0) {
            throw new Error('At least one Education entry is required');
        }

        const resume = await Resume.findOneAndUpdate(
            { _id: resumeId, owner: userId },
            { $set: updateData },
            { returnDocument: 'after', runValidators: true }
        );

        if (!resume) {
            throw new Error('Resume not found or access denied');
        }

        return resume;
    }

    /**
     * Delete a resume.
     * @param {String} resumeId
     * @param {String} userId
     * @returns {Promise<Object>} Deleted resume document.
     */
    async deleteResume(resumeId, userId) {
        const resume = await Resume.findOneAndDelete({ _id: resumeId, owner: userId });
        if (!resume) {
            throw new Error('Resume not found or access denied');
        }
        return resume;
    }
}

module.exports = new ResumeService();

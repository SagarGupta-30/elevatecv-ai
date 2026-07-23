const Resume = require('../models/Resume');

class ResumeService {
    /**
     * Create a new resume
     * @param {Object} resumeData
     * @returns {Promise<Object>}
     */
    async createResume(resumeData) {
        // Validation: Required Name, Email, and at least one Education entry
        if (!resumeData.personalInformation || !resumeData.personalInformation.fullName) {
            throw new Error('Full Name is required');
        }
        if (!resumeData.personalInformation.email) {
            throw new Error('Email is required');
        }
        if (!resumeData.education || resumeData.education.length === 0) {
            throw new Error('At least one Education entry is required');
        }

        const newResume = new Resume(resumeData);
        return await newResume.save();
    }

    /**
     * Get all resumes for a specific user
     * @param {String} userId
     * @returns {Promise<Array>}
     */
    async getUserResumes(userId) {
        return await Resume.find({ owner: userId }).sort({ updatedAt: -1 });
    }

    /**
     * Get a specific resume by ID
     * @param {String} resumeId
     * @param {String} userId
     * @returns {Promise<Object>}
     */
    async getResumeById(resumeId, userId) {
        const resume = await Resume.findOne({ _id: resumeId, owner: userId });
        if (!resume) {
            throw new Error('Resume not found or access denied');
        }
        return resume;
    }

    /**
     * Update an existing resume
     * @param {String} resumeId
     * @param {String} userId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    async updateResume(resumeId, userId, updateData) {
        // Validation check for required fields if updating personalInfo or education
        if (updateData.personalInformation) {
            if (!updateData.personalInformation.fullName) {
                throw new Error('Full Name is required');
            }
            if (!updateData.personalInformation.email) {
                throw new Error('Email is required');
            }
        }
        if (updateData.education && updateData.education.length === 0) {
            throw new Error('At least one Education entry is required');
        }

        const resume = await Resume.findOneAndUpdate(
            { _id: resumeId, owner: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!resume) {
            throw new Error('Resume not found or access denied');
        }

        return resume;
    }

    /**
     * Delete a resume
     * @param {String} resumeId
     * @param {String} userId
     * @returns {Promise<Object>}
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

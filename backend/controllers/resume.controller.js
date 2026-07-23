const resumeService = require('../services/resume.service');

class ResumeController {
    /**
     * Create a new resume
     */
    async createResume(req, res) {
        try {
            const resumeData = { ...req.body, owner: req.userId };
            const resume = await resumeService.createResume(resumeData);
            
            return res.status(201).json({
                success: true,
                message: 'Resume created successfully',
                data: resume,
                error: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: null,
                error: error.name || 'Error'
            });
        }
    }

    /**
     * Get all resumes for the authenticated user
     */
    async getUserResumes(req, res) {
        try {
            const resumes = await resumeService.getUserResumes(req.userId);
            
            return res.status(200).json({
                success: true,
                message: 'Resumes retrieved successfully',
                data: resumes,
                error: null
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: null,
                error: error.name || 'Error'
            });
        }
    }

    /**
     * Get a specific resume by ID
     */
    async getResume(req, res) {
        try {
            const resume = await resumeService.getResumeById(req.params.id, req.userId);
            
            return res.status(200).json({
                success: true,
                message: 'Resume retrieved successfully',
                data: resume,
                error: null
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message,
                data: null,
                error: 'NotFound'
            });
        }
    }

    /**
     * Update an existing resume
     */
    async updateResume(req, res) {
        try {
            // Prevent changing the owner field
            const updateData = { ...req.body };
            delete updateData.owner;

            const resume = await resumeService.updateResume(req.params.id, req.userId, updateData);
            
            return res.status(200).json({
                success: true,
                message: 'Resume updated successfully',
                data: resume,
                error: null
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                data: null,
                error: error.name || 'Error'
            });
        }
    }

    /**
     * Delete a resume
     */
    async deleteResume(req, res) {
        try {
            await resumeService.deleteResume(req.params.id, req.userId);
            
            return res.status(200).json({
                success: true,
                message: 'Resume deleted successfully',
                data: null,
                error: null
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message,
                data: null,
                error: 'NotFound'
            });
        }
    }
}

module.exports = new ResumeController();

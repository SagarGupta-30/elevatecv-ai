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

    /**
     * POST /api/resumes/import
     * Imports a PDF/DOCX/DOC resume file, extracts raw text, parses fields using AI,
     * and returns structured resume data ready for review & saving.
     */
    async importResume(req, res) {
        const importService = require('../services/importService');
        const { cleanupFile } = require('../middleware/upload.middleware');

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a PDF, DOCX, or DOC file.',
                data: null,
                error: 'BadRequest'
            });
        }

        try {
            const result = await importService.parseResumeFile(
                req.file.path,
                req.file.mimetype,
                req.file.originalname
            );

            // Add metadata indicating resume was imported
            if (result && result.resume) {
                result.resume.metadata = {
                    ...(result.resume.metadata || {}),
                    isImported: true,
                    importedFileName: req.file.originalname,
                    importedAt: new Date().toISOString()
                };
            }

            return res.status(200).json({
                success: true,
                message: 'Resume text extracted and parsed successfully.',
                data: result,
                error: null
            });
        } catch (error) {
            console.error('[ResumeController] Import error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to import and parse resume file.',
                data: null,
                error: error.name || 'ImportError'
            });
        } finally {
            cleanupFile(req.file?.path);
        }
    }

    /**
     * POST /api/resumes/export-docx or POST /api/resumes/:id/export-docx
     * Exports resume JSON object to a formatted .docx document download.
     */
    async exportDocx(req, res) {
        const { generateResumeDocx } = require('../services/docxExportService');
        try {
            let resumeData = req.body;
            if ((!resumeData || !resumeData.title) && req.params.id) {
                resumeData = await resumeService.getResumeById(req.params.id, req.userId);
            }

            if (!resumeData) {
                return res.status(400).json({
                    success: false,
                    message: 'Resume data is required for DOCX generation.',
                    data: null,
                    error: 'BadRequest'
                });
            }

            const docxBuffer = await generateResumeDocx(resumeData);
            const fileName = (resumeData.title || 'Resume').replace(/[^a-z0-9_-]/gi, '_');

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}.docx"`);
            return res.send(docxBuffer);
        } catch (error) {
            console.error('[ResumeController] DOCX Export error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate DOCX document.',
                data: null,
                error: error.name || 'ExportError'
            });
        }
    }
}

module.exports = new ResumeController();

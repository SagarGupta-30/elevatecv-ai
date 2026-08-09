/**
 * ElevateCV AI — Professional Resume DOCX Export Generator
 * Converts ElevateCV Resume schema JSON into a clean, formatted Word document (.docx).
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');

/**
 * Generates a DOCX file Buffer from resume JSON data.
 * @param {Object} resume
 * @returns {Promise<Buffer>}
 */
async function generateResumeDocx(resume) {
    const pi = resume.personalInformation || {};
    const summary = resume.professionalSummary || resume.summary || '';
    const education = Array.isArray(resume.education) ? resume.education : [];
    const experience = Array.isArray(resume.experience) ? resume.experience : [];
    const projects = Array.isArray(resume.projects) ? resume.projects : [];
    const skills = resume.skills || {};
    const certs = Array.isArray(resume.certifications) ? resume.certifications : [];
    const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];

    const sections = [];

    // Helper for Section Heading
    function createHeading(text) {
        return new Paragraph({
            text: text.toUpperCase(),
            heading: HeadingLevel.HEADING_2,
            space: { before: 240, after: 120 },
            border: {
                bottom: { color: '4B5563', space: 4, style: BorderStyle.SINGLE, size: 6 }
            }
        });
    }

    const docChildren = [];

    // Header: Name & Contact Info
    docChildren.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: pi.fullName || 'Candidate Name',
                    bold: true,
                    size: 32,
                    color: '1E293B'
                })
            ]
        })
    );

    const contactParts = [];
    if (pi.email) contactParts.push(pi.email);
    if (pi.phone) contactParts.push(pi.phone);
    if (pi.address) contactParts.push(pi.address);
    if (pi.linkedin) contactParts.push(pi.linkedin);
    if (pi.github) contactParts.push(pi.github);
    if (pi.portfolio) contactParts.push(pi.portfolio);

    if (contactParts.length > 0) {
        docChildren.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                space: { after: 200 },
                children: [
                    new TextRun({
                        text: contactParts.join(' | '),
                        size: 18,
                        color: '64748B'
                    })
                ]
            })
        );
    }

    // Professional Summary
    if (summary) {
        docChildren.push(createHeading('Professional Summary'));
        docChildren.push(
            new Paragraph({
                space: { after: 180 },
                children: [new TextRun({ text: summary, size: 20 })]
            })
        );
    }

    // Work Experience
    if (experience.length > 0) {
        docChildren.push(createHeading('Work Experience'));
        experience.forEach(exp => {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: exp.role || 'Role', bold: true, size: 22 }),
                        new TextRun({ text: ` — ${exp.company || ''}`, italic: true, size: 20 }),
                        new TextRun({
                            text: ` (${exp.startDate || ''} – ${exp.isCurrent ? 'Present' : exp.endDate || ''})`,
                            size: 18,
                            color: '64748B'
                        })
                    ]
                })
            );

            if (Array.isArray(exp.description)) {
                exp.description.forEach(bullet => {
                    if (bullet && bullet.trim()) {
                        docChildren.push(
                            new Paragraph({
                                bullet: { level: 0 },
                                children: [new TextRun({ text: bullet.trim(), size: 20 })]
                            })
                        );
                    }
                });
            }
        });
    }

    // Projects
    if (projects.length > 0) {
        docChildren.push(createHeading('Projects'));
        projects.forEach(proj => {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: proj.title || 'Project Title', bold: true, size: 22 }),
                        proj.techStack ? new TextRun({ text: ` [${Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.techStack}]`, italic: true, size: 18, color: '6366F1' }) : new TextRun('')
                    ]
                })
            );

            if (Array.isArray(proj.description)) {
                proj.description.forEach(bullet => {
                    if (bullet && bullet.trim()) {
                        docChildren.push(
                            new Paragraph({
                                bullet: { level: 0 },
                                children: [new TextRun({ text: bullet.trim(), size: 20 })]
                            })
                        );
                    }
                });
            }
        });
    }

    // Education
    if (education.length > 0) {
        docChildren.push(createHeading('Education'));
        education.forEach(edu => {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `${edu.degree || 'Degree'} ${edu.branch ? `in ${edu.branch}` : ''}`, bold: true, size: 20 }),
                        new TextRun({ text: ` — ${edu.college || ''}`, size: 20 }),
                        edu.cgpa ? new TextRun({ text: ` (CGPA: ${edu.cgpa})`, italic: true, size: 18 }) : new TextRun('')
                    ]
                })
            );
        });
    }

    // Skills
    const techSkills = Array.isArray(skills.technical) ? skills.technical.join(', ') : '';
    const tools = Array.isArray(skills.tools) ? skills.tools.join(', ') : '';
    const soft = Array.isArray(skills.soft) ? skills.soft.join(', ') : '';

    if (techSkills || tools || soft) {
        docChildren.push(createHeading('Skills'));
        if (techSkills) {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Technical Skills: ', bold: true, size: 20 }),
                        new TextRun({ text: techSkills, size: 20 })
                    ]
                })
            );
        }
        if (tools) {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Tools & Technologies: ', bold: true, size: 20 }),
                        new TextRun({ text: tools, size: 20 })
                    ]
                })
            );
        }
        if (soft) {
            docChildren.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: 'Soft Skills: ', bold: true, size: 20 }),
                        new TextRun({ text: soft, size: 20 })
                    ]
                })
            );
        }
    }

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docChildren
            }
        ]
    });

    return await Packer.toBuffer(doc);
}

module.exports = {
    generateResumeDocx
};

const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInformation: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        location: { type: String },
        linkedin: { type: String },
        github: { type: String },
        portfolio: { type: String }
    },
    summary: {
        type: String
    },
    education: [{
        college: String,
        degree: String,
        branch: String,
        cgpa: String,
        startYear: String,
        endYear: String
    }],
    skills: [{
        type: String
    }],
    projects: [{
        title: String,
        description: String,
        technologies: String,
        githubLink: String,
        liveDemo: String
    }],
    experience: [{
        company: String,
        role: String,
        duration: String,
        responsibilities: String
    }],
    certifications: [{
        name: String
    }],
    achievements: [{
        description: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Resume', ResumeSchema);

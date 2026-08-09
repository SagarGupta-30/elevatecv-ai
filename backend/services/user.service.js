/**
 * ElevateCV AI — User Profile Service
 * Business logic for user profile retrieval and updates.
 */

const User    = require('../models/User');
const Resume  = require('../models/Resume');

const ALLOWED_FIELDS = [
    'name', 'phone', 'bio', 'location',
    'linkedin', 'github', 'portfolio', 'twitter', 'website',
    'college', 'degree', 'graduationYear', 'preferredRole',
    'skills', 'languages', 'avatarUrl'
];

/**
 * Retrieve the user's full profile plus computed resume stats.
 */
async function getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    // Fetch resume stats
    let resumeCount = 0;
    let draftCount  = 0;
    let doneCount   = 0;

    try {
        const resumes = await Resume.find({ user: userId }).select('status').lean();
        resumeCount = resumes.length;
        draftCount  = resumes.filter(r => (r.status || '').toLowerCase() === 'draft').length;
        doneCount   = resumeCount - draftCount;
    } catch (_) {
        /* non-critical — continue without stats */
    }

    return {
        user,
        stats: {
            totalResumes: resumeCount,
            completed:    doneCount,
            draft:        draftCount,
        }
    };
}

/**
 * Update allowed profile fields for a user.
 */
async function updateUserProfile(userId, payload) {
    const user = await User.findById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    ALLOWED_FIELDS.forEach(field => {
        if (payload[field] !== undefined) {
            user[field] = payload[field];
        }
    });

    await user.save();
    return user;
}

module.exports = { getUserProfile, updateUserProfile };

/**
 * ElevateCV AI — User Model
 * Mongoose schema for user accounts with password hashing.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: validator.isEmail,
                message: 'Please provide a valid email address',
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },

        /* ── Extended Profile Fields ─────────────────── */
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        bio: {
            type: String,
            default: '',
            maxlength: [500, 'Bio cannot exceed 500 characters'],
            trim: true,
        },
        location: {
            type: String,
            default: '',
            maxlength: [100, 'Location cannot exceed 100 characters'],
            trim: true,
        },
        linkedin: {
            type: String,
            default: '',
            trim: true,
        },
        github: {
            type: String,
            default: '',
            trim: true,
        },
        portfolio: {
            type: String,
            default: '',
            trim: true,
        },
        twitter: {
            type: String,
            default: '',
            trim: true,
        },
        website: {
            type: String,
            default: '',
            trim: true,
        },
        college: {
            type: String,
            default: '',
            trim: true,
        },
        degree: {
            type: String,
            default: '',
            trim: true,
        },
        graduationYear: {
            type: String,
            default: '',
        },
        preferredRole: {
            type: String,
            default: '',
            trim: true,
        },
        skills: {
            type: [String],
            default: [],
        },
        languages: {
            type: [String],
            default: [],
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
        passwordChangedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/* Hash password before saving */
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

/* Compare candidate password with stored hash */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/* Remove password from JSON output */
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);

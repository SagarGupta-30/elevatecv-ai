/**
 * ElevateCV AI — Database Configuration
 * Connects to MongoDB Atlas using Mongoose.
 * Fails fast with a clear error message if MONGO_URI is not set or unreachable.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ FATAL: MONGO_URI environment variable is not set.');
        console.error('   Set it in the Render dashboard → Environment → Environment Variables.');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        console.error('   Verify MONGO_URI in environment variables and that Atlas IP whitelist includes 0.0.0.0/0');
        process.exit(1);
    }
};

module.exports = connectDB;

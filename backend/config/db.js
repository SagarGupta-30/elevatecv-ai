/**
 * ElevateCV AI — Database Configuration
 * Connects to MongoDB Atlas using Mongoose with graceful fallback for local development.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        
        if (error.message.includes('authentication failed') || error.message.includes('bad auth') || error.message.includes('selection timed out')) {
            console.log('⚠️ MongoDB Atlas connection restricted (Authentication failed / IP Whitelist required).');
            console.log('🔄 Initializing MongoMemoryServer fallback for local execution...');
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                const memUri = mongod.getUri();
                const conn = await mongoose.connect(memUri);
                console.log(`✅ MongoDB connected (in-memory fallback): ${conn.connection.host}`);
                return;
            } catch (memErr) {
                console.error(`❌ Memory server fallback failed: ${memErr.message}`);
            }
        }
        process.exit(1);
    }
};

module.exports = connectDB;

/**
 * ElevateCV AI — Test Server Entry Point
 * Uses MongoMemoryServer for E2E testing without requiring a real MongoDB instance.
 */

require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Start in-memory MongoDB
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log(`🧪 Using in-memory MongoDB at: ${uri}`);
    
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected (in-memory)');
    
    app.listen(PORT, () => {
        console.log(`⚡ ElevateCV AI test server running on http://localhost:${PORT}`);
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(0);
    });
};

startServer();

/**
 * ElevateCV AI — Server Entry Point
 * Connects to MongoDB and starts the Express server.
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`⚡ ElevateCV AI server running on port ${PORT}`);
        console.log('📌 Active AI API Endpoints:');
        console.log('   - POST /api/ai/analyze');
        console.log('   - POST /api/ai/improve');
        console.log('   - POST /api/ai/cover-letter');
        console.log('   - POST /api/ai/interview');
        console.log('   - POST /api/ai/job-match');
        console.log('   - POST /api/ai/skill-gap');
    });
};

startServer();

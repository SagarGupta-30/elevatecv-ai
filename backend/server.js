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
        const env = process.env.NODE_ENV || 'development';
        const commit = process.env.RENDER_GIT_COMMIT || 'latest';

        console.log('================================');
        console.log('ElevateCV AI Backend Started');
        console.log(`Environment: ${env}`);
        console.log(`Commit: ${commit}`);
        console.log('\nMounted Routes:\n');
        console.log('✓ GET  /');
        console.log('✓ GET  /api/debug/routes');
        console.log('✓ POST /api/ai/analyze');
        console.log('✓ POST /api/ai/improve');
        console.log('✓ POST /api/ai/cover-letter');
        console.log('✓ POST /api/ai/interview');
        console.log('✓ POST /api/ai/job-match');
        console.log('✓ POST /api/ai/skill-gap');
        console.log('================================');
    });
};

startServer();

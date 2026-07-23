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
        console.log(`⚡ ElevateCV AI server running on http://localhost:${PORT}`);
    });
};

startServer();

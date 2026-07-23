/**
 * ElevateCV AI — Server Entry Point
 * Starts the Express server on the configured port.
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`⚡ ElevateCV AI server running on http://localhost:${PORT}`);
});

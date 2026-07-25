/**
 * ElevateCV AI — API Configuration
 * Centralised API base URL: auto-detects dev vs. production.
 *
 * Dev  → http://localhost:5001/api
 * Prod → https://elevatecv-ai-e8ku.onrender.com/api
 */

const Config = (() => {
    const PROD_API = 'https://elevatecv-ai-e8ku.onrender.com/api';
    const DEV_API  = 'http://localhost:5001/api';

    const isLocalhost = (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === ''
    );

    const API_BASE = isLocalhost ? DEV_API : PROD_API;

    return { API_BASE };
})();

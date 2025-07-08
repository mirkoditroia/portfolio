import functions from 'firebase-functions';
import app from './server.js';

// Export Express app as a Firebase HTTPS function
export const server = functions.region('europe-west1').https.onRequest(app); 
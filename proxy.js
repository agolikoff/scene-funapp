import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration from environment variables
const VALIDATION_URL = process.env.VALIDATION_URL || 'http://event-api-dev.shottracker-internal.com/v1/data/auth/_validate';
const X_FORWARDED_FOR = process.env.X_FORWARDED_FOR || 'event-api-dev.shottracker.com';
const VALIDATION_HOST = process.env.VALIDATION_HOST || 'hype-dev.shottracker.com';
const VALIDATION_PATH = process.env.VALIDATION_PATH || '3d/external/view';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 10000;
const BYPASS_KEY = process.env.BYPASS_KEY;

// Middleware for JSON parsing
app.use(express.json());

// Middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware to skip static files and only process API requests
app.use((req, res, next) => {
  // Skip static file requests - let Nginx handle them
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|glb|gltf|manifest|woff|woff2|ttf|eot|html|json|xml|txt|ico)$/)) {
    return res.status(404).send('Static files should be served by Nginx');
  }
  next();
});

// Main route for handling API requests (non-static files)
app.all('*', async (req, res) => {
  try {
    // Check for bypass key first
    const bypassKey = req.query.bypass;
    if (BYPASS_KEY && bypassKey === BYPASS_KEY) {
      console.log('Bypass key provided, showing real_index.html directly');
      return res.sendFile(path.join(__dirname, 'real_index.html'));
    }

    // Extract Authorization and X-Date headers
    const authHeader = req.headers.authorization;
    const dateHeader = req.headers['x-date'];

    console.log('Extracted headers:');
    console.log('Authorization:', authHeader ? 'present' : 'missing');
    console.log('X-Date:', dateHeader || 'missing');
    console.log('Bypass key:', bypassKey ? 'provided' : 'not provided');

    // Check for required headers
    if (!authHeader || !dateHeader) {
      console.log('Missing required headers, showing 403.html');
      return res.sendFile(path.join(__dirname, '403.html'));
    }

    // Prepare headers for validation request
    const validationHeaders = {
      'Authorization': authHeader,
      'X-Date': dateHeader,
      'X-Forwarded-For': X_FORWARDED_FOR,
      'Content-Type': 'application/json'
    };

    // Request body for validation
    const validationBody = {
      host: VALIDATION_HOST,
      path: VALIDATION_PATH
    };

    console.log('Sending validation request...');
    console.log('URL:', VALIDATION_URL);
    console.log('Headers:', validationHeaders);
    console.log('Body:', validationBody);

    // Make PUT request to validation endpoint
    const validationResponse = await axios.put(
      VALIDATION_URL,
      validationBody,
      {
        headers: validationHeaders,
        timeout: REQUEST_TIMEOUT
      }
    );

    console.log('Validation response:', validationResponse.status, validationResponse.statusText);

    // If request is successful (status 200-299), show real_index.html
    if (validationResponse.status >= 200 && validationResponse.status < 300) {
      console.log('Validation successful, showing real_index.html');
      return res.sendFile(path.join(__dirname, 'real_index.html'));
    } else {
      console.log('Validation failed, showing 403.html');
      return res.sendFile(path.join(__dirname, '403.html'));
    }

  } catch (error) {
    console.error('Error processing request:', error.message);
    
    // If this is an axios error (network issues, timeouts, etc.)
    if (error.response) {
      console.log('Validation server response:', error.response.status, error.response.statusText);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('Request was not sent:', error.request);
    } else {
      console.log('Request setup error:', error.message);
    }

    // On any error, show 403.html
    return res.sendFile(path.join(__dirname, '403.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server started on port ${PORT}`);
  console.log(`Available at: http://localhost:${PORT}`);
  console.log('Server ready to handle requests...');
  console.log('\nConfiguration:');
  console.log(`- Validation URL: ${VALIDATION_URL}`);
  console.log(`- X-Forwarded-For: ${X_FORWARDED_FOR}`);
  console.log(`- Validation Host: ${VALIDATION_HOST}`);
  console.log(`- Validation Path: ${VALIDATION_PATH}`);
  console.log(`- Request Timeout: ${REQUEST_TIMEOUT}ms`);
  console.log(`- Bypass Key: ${BYPASS_KEY ? 'configured' : 'not configured'}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal. Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM signal. Shutting down server...');
  process.exit(0);
});

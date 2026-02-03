import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import routes from './routes';
import { initWebSocket } from './websocket';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', // Vite dev server (default)
  'http://localhost:5173', // Vite dev server (alternate)
  'http://localhost:4173', // Vite preview
  process.env.FRONTEND_URL, // Production frontend URL
].filter((origin): origin is string => Boolean(origin));

// Log allowed origins for debugging
console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Remove trailing slash from origin for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));

    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      console.warn('Allowed origins:', normalizedAllowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
initWebSocket(server);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const databaseUrl = process.env.DATABASE_URL || '';

function isPlaceholderDatabaseUrl(url) {
  return url.includes('YOUR_POSTGRES_PASSWORD');
}

function getPublicError(err) {
  const message = err?.message || 'Internal server error';

  if (
    err?.name === 'PrismaClientInitializationError' ||
    message.includes('Authentication failed against database server') ||
    message.includes("database credentials for `postgres` are not valid")
  ) {
    return {
      status: 503,
      message: 'Database connection failed. Update DATABASE_URL in backend/.env with your real Postgres username and password.',
    };
  }

  return {
    status: err?.status || 500,
    message,
  };
}

if (isPlaceholderDatabaseUrl(databaseUrl)) {
  console.warn('[Startup] DATABASE_URL still contains the placeholder password. Update backend/.env before using auth or database features.');
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/groups', require('./routes/groups'));
app.use('/groups', require('./routes/balance'));
app.use('/participants', require('./routes/participants'));
app.use('/expenses', require('./routes/expenses'));
app.use('/ai', require('./routes/ai'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SplitMint AI API', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  const publicError = getPublicError(err);
  res.status(publicError.status).json({
    success: false,
    message: publicError.message,
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 SplitMint AI API running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Startup] Port ${PORT} is already in use. Stop the other process or change PORT in backend/.env.`);
    process.exit(1);
  }

  console.error('[Startup] Server failed to start.', err.message);
  process.exit(1);
});

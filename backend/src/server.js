require('dotenv').config();

const http = require('node:http');
const app = require('./app');
const pool = require('./config/database');

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);
let isShuttingDown = false;

function closeServer(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) console.error('HTTP server shutdown failed.');

    try {
      await pool.end();
      clearTimeout(forceExit);
      process.exit(error ? 1 : 0);
    } catch {
      console.error('Database connection pool shutdown failed.');
      process.exit(1);
    }
  });
}

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Backend server failed to start.');
  }
  process.exitCode = 1;
});

process.on('SIGINT', () => closeServer('SIGINT'));
process.on('SIGTERM', () => closeServer('SIGTERM'));

server.listen(port, () => {
  console.log(`Goc Desk API is listening on port ${port}.`);
});

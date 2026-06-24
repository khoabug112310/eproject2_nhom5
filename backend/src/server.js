// Entry Point - Khởi chạy server
const app = require('./app');
const config = require('./config/env');
const http = require('http');
const { initSocket } = require('./socket');

const PORT = config.PORT;

// Wrap Express app in HTTP Server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io connection handlers
initSocket(server);

server.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  console.log(`✓ Frontend URL: ${config.FRONTEND_URL}`);
});

// Entry Point - Khởi chạy server
const app = require('./app');
const config = require('./config/env');

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`✓ Server is running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${config.NODE_ENV}`);
  console.log(`✓ Frontend URL: ${config.FRONTEND_URL}`);
});

require('dotenv').config();

const validateEnv = require('./src/config/validateEnv');
validateEnv();

const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/socket/socket');

const PORT = process.env.PORT || 4000;

connectDB();

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing server gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
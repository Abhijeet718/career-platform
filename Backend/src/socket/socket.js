const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

let io;

function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            const rawCookieHeader = socket.handshake.headers.cookie;
            if (!rawCookieHeader) {
                return next(new Error("Unauthorized"));
            }

            const parsedCookies = cookie.parse(rawCookieHeader);
            const token = parsedCookies.token;
            if (!token) {
                return next(new Error("Unauthorized"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(`user:${socket.user.id}`);
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error("Socket.io has not been initialized yet");
    }
    return io;
}

function emitToUser(userId, event, payload) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initializeSocket, getIO, emitToUser };
const { Router } = require("express");
const mongoose = require("mongoose");
const ApiResponse = require("../utils/ApiResponse");

const healthRouter = Router();

healthRouter.get("/", (req, res) => {
    const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];

    return res.status(200).json(
        new ApiResponse(200, {
            uptimeSeconds: Math.floor(process.uptime()),
            database: dbStates[mongoose.connection.readyState] || "unknown",
            timestamp: new Date().toISOString()
        }, "OK")
    );
});

module.exports = healthRouter;
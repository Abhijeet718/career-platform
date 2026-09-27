const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());

if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))

const authRouter = require('./routes/auth.routes');
const healthRouter = require('./routes/health.routes');
const jobRouter = require('./routes/job.routes');
const applicationRouter = require('./routes/application.routes');
const resumeRouter = require('./routes/resume.routes');

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/resume', resumeRouter);

const ApiError = require('./utils/ApiError');
app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
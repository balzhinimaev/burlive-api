// Load environment variables early
import dotenv from 'dotenv';
dotenv.config();

// Core Node & Express modules
import express, {
    ErrorRequestHandler,
    Request,
    Response,
    NextFunction,
} from 'express';
import { createServer, Server as HttpServer } from 'node:http';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

// Third-party middleware & utilities
import { Server as SocketIOServer, Socket } from 'socket.io';
// import cors from 'cors';
// import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

// Application-specific modules
import logger from './utils/logger';
import authenticateToken from './middleware/authenticateToken';

// Route handlers & Controllers
import userRouter from './routes/userRouter';
import sentencesRouter from './routes/sentenceRouter';
import translationsRouter from './routes/translationRouter';
import dialectRouter from './routes/dialectRouter';
import vocabularyRouter from './routes/vocabularyRouter';
import lessonsRouter from './routes/lessonsRoutes';
import questionRouter from './routes/questionsRoutes';
import testRouter from './routes/testRoutes';
import levelRoutes from './routes/levelRoutes';
import moduleRoutes from './routes/modulesRouter';
import themeRouter from './routes/themeRouter';
import subscriptionController from './controllers/subscriptionController';
import participationRouter from './routes/participationRouter';
import promotionRouter from './routes/promotionRouter';
import taskRouter from './routes/taskRouter';
import mediaRouter from './routes/mediaRouter';
import UserModel from './models/User'; // Needed for Socket.IO user updates
import { DecodedToken } from '../types/express';
import telegramRouter from './routes/telegramRouter';

// --- Configuration & Environment Validation ---
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_API_URL = process.env.FRONTEND_API_URL || "http://localhost:5000";
const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Critical environment variable checks on startup
if (!MONGO_URL) {
    logger.error('FATAL: MONGO_URL is not defined.');
    process.exit(1);
}
if (!JWT_SECRET) {
    logger.error('FATAL: JWT_SECRET is not defined.');
    process.exit(1);
}
// Add other critical checks (e.g., payment provider keys)

// --- Application Setup ---
const app = express();

app.set('trust proxy', 1);

const server: HttpServer = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: [FRONTEND_URL, FRONTEND_API_URL, 'http://localhost:3000'], // Restrict to known origins
        methods: ['GET', 'POST'],
    },
});

// --- Core Middleware Pipeline (Order Matters) ---

// // 1. Security Headers
// app.use(helmet());

// // 2. Cross-Origin Resource Sharing
// app.use(
//     cors({
//         origin: [FRONTEND_URL, 'http://localhost:3000', 'http://express-api:5000'], // Match IO origins
//         methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//         credentials: true, // If using cookies or auth headers across origins
//     }),
// );

// 3. Rate Limiting (Applied globally)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Max requests per windowMs per IP
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// 4. Body Parsing
// Raw parser for specific webhook endpoints requiring signature verification
app.post(
    '/telegram/payment-callback', // Example webhook path
    express.raw({ type: 'application/json' }), // Use raw parser only for this path
    subscriptionController.paymentCallback, // Controller handling the webhook
);
// Default JSON parser for other routes
app.use(bodyParser.json());

// Inject Socket.IO instance into request context if needed by controllers
app.use((req: Request, _res: Response, next: NextFunction) => {
    req.io = io;
    next();
});

// --- Route Definitions ---

// Publicly accessible routes
app.use('/users', userRouter); // Contains login/register endpoints
app.use('/promotion', promotionRouter);

// Routes requiring authentication (via authenticateToken middleware)
// Note: Controllers within these routers must handle logic for both
// authenticated end-users and the authenticated bot entity.
app.use('/tasks', authenticateToken, taskRouter);
app.use('/participation', authenticateToken, participationRouter);
app.use('/media', authenticateToken, mediaRouter);
app.use('/dialect', authenticateToken, dialectRouter);
app.use('/sentences', authenticateToken, sentencesRouter);
app.use('/vocabulary', authenticateToken, vocabularyRouter);
app.use('/translations', authenticateToken, translationsRouter);
app.use('/levels', authenticateToken, levelRoutes);
app.use('/modules', authenticateToken, moduleRoutes);
app.use('/lessons', authenticateToken, lessonsRouter);
app.use('/themes', authenticateToken, themeRouter);
app.use('/questions', authenticateToken, questionRouter);
app.use('/test', authenticateToken, testRouter);
app.use('/telegram', authenticateToken, telegramRouter);

// --- Socket.IO Authentication & Connection Handling ---

// Middleware to authenticate Socket.IO connection attempts using JWT
io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token as string | undefined;
    let actualToken = token?.startsWith('Bearer ')
        ? token.split(' ')[1]
        : token;

    if (!actualToken)
        return next(new Error('Authentication error: Token not provided'));
    if (!JWT_SECRET) return next(new Error('Server configuration error')); // Should not happen if startup check passed

    try {
        const decoded = jwt.verify(actualToken, JWT_SECRET) as DecodedToken;
        // Attach identifier to socket data for this connection's context
        socket.data.userId = decoded._id;
        next(); // Grant connection
    } catch (err: any) {
        logger.warn(`Socket Auth Fail [${socket.id}]: ${err.message}`);
        const errorMessage =
            err instanceof jwt.TokenExpiredError
                ? 'Authentication error: Token expired'
                : 'Authentication error: Invalid token';
        next(new Error(errorMessage)); // Deny connection
    }
});

// Handle authenticated connections
io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`Socket Connect [${socket.id}], User [${userId || 'N/A'}]`);

    if (userId) {
        socket.join(userId.toString()); // Join user-specific room
        // Update user's active sockets list (best-effort)
        UserModel.findByIdAndUpdate(userId, {
            $addToSet: { activeSockets: socket.id },
            lastActivity: new Date(),
        })
            .exec() // Ensure promise execution
            .catch((err) =>
                logger.error(
                    `Socket Connect: Failed to add socket ${socket.id} for user ${userId}`,
                    err,
                ),
            );
    }

    socket.on('disconnect', (reason: string) => {
        logger.info(
            `Socket Disconnect [${socket.id}], User [${userId || 'N/A'}], Reason: ${reason}`,
        );
        if (userId) {
            // Clean up user's active sockets list (best-effort)
            UserModel.findByIdAndUpdate(userId, {
                $pull: { activeSockets: socket.id },
            })
                .exec()
                .catch((err) =>
                    logger.error(
                        `Socket Disconnect: Failed to remove socket ${socket.id} for user ${userId}`,
                        err,
                    ),
                );
        }
    });

    // Register other application-specific event listeners here
    // e.g., socket.on('chat message', (msg) => { ... });
});

// --- Global Error Handling Middleware (Must be last) ---
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log detailed error internally
    logger.error(`Unhandled Error: ${err.message}`, {
        statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        // requestId: req.requestId, // If using request IDs
        stack: isProduction ? undefined : err.stack, // Avoid stack trace in prod logs if too verbose
        errorDetails: err, // Include full error object if helpful
    });

    // Send generic error response in production for 500 errors
    const responseMessage =
        isProduction && statusCode === 500
            ? 'Internal Server Error'
            : err.message || 'An unexpected error occurred';

    res.status(statusCode).json({ message: responseMessage });
};
app.use(errorHandler);

// --- Database Connection & Server Initialization ---
logger.info('Attempting MongoDB connection...');
mongoose
    .connect(MONGO_URL!, {
        dbName: "burlive"
    })
    .then(() => {
        logger.info('MongoDB connection established successfully.');
        // Start listening only after DB connection is successful
        server.listen(PORT, () => {
            logger.info(`HTTP server started. Listening on port ${PORT}`);
            logger.info(
                `Environment: ${process.env.NODE_ENV || 'development'}`,
            );
        });
    })
    .catch((error) => {
        logger.error('FATAL: MongoDB connection failed:', error);
        process.exit(1); // Exit if DB connection fails on startup
    });

export default server;

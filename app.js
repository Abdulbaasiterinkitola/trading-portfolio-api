import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { PORT } from './src/config/env.js';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';

import authRoutes from './src/routes/auth.js';
import portfolioRoutes from './src/routes/portfolio.js';
import stockRoutes from './src/routes/stock.js';
import { startLiveUpdates } from './src/services/liveUpdates.js';

import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const rateLimiter = new RateLimiterMemory({
    keyGenerator: (req) => req.ip,
    points: 100,
    duration: 60,
});

app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (error) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests',
        });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ message: "API is working!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

// Socket.IO authentication middleware
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    logger.info('New user connected:', socket.id);

    const userId = socket.userId;

    if (userId) {
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} joined their personal room`);
    }

    // Handle stock subscriptions
    socket.on('subscribe_to_stock', (symbol) => {
        if (typeof symbol === 'string' && symbol.length > 0) {
            socket.join(`stock_${symbol.toUpperCase()}`);
            logger.info(`User ${userId} subscribed to ${symbol} updates`);
        }
    });

    socket.on('unsubscribe_from_stock', (symbol) => {
        if (typeof symbol === 'string' && symbol.length > 0) {
            socket.leave(`stock_${symbol.toUpperCase()}`);
            logger.info(`User ${userId} unsubscribed from ${symbol} updates`);
        }
    });

    // Handle portfolio refresh requests
    socket.on('request_portfolio_update', async () => {
        try {
            const portfolioUpdates = await import('./src/services/portfolioUpdates.js');
            await portfolioUpdates.default.forceUpdateUserPortfolio(userId);
        } catch (error) {
            socket.emit('error', { message: 'Failed to update portfolio' });
        }
    });

    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

connectDB().then(() => {
    httpServer.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        startLiveUpdates();
    });
}).catch(err => {
    logger.error("Failed to connect to the database", err);
});

export default app;
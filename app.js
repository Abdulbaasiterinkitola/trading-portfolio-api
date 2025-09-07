import express from 'express';
import { PORT } from './src/config/env.js';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';
import authRoutes from './src/routes/auth.js';
import portfolioRoutes from './src/routes/portfolio.js';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Routes (move outside of connectDB)
app.get('/api/test', (req, res) => {
    res.json({ message: "API is working!" });
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Start server after DB connection
connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });
}).catch(err => {
    logger.error("Failed to connect to the database", err);
});

export default app;
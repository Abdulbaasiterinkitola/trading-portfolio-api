import Portfolio from '../models/Portfolio.js';
import logger from '../utils/logger.js';
import { calculatePortfolioMetrics } from '../services/liveUpdates.js';

// Add or update a stock in the portfolio
export const addStock = async (req, res) => {
    try {
        const { symbol, quantity, purchasePrice } = req.body;
        const userId = req.user._id;

        let stock = await Portfolio.findOne({ userId, symbol });

        if (stock) {
            // Update existing stock
            const totalQuantity = stock.quantity + quantity;
            const totalValue = (stock.quantity * stock.purchasePrice) + (quantity * purchasePrice);
            stock.purchasePrice = totalValue / totalQuantity;
            stock.quantity = totalQuantity;
            await stock.save();

            logger.info(`Updated stock ${symbol} for user ${req.user.username}`);
        } else {
            // Add new stock
            stock = new Portfolio({ userId, symbol, quantity, purchasePrice });
            await stock.save();

            logger.info(`Added stock ${symbol} for user ${req.user.username}`);
        }

        // Return updated portfolio metrics
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.status(201).json({
            success: true,
            message: stock._id ? 'Stock updated in portfolio' : 'Stock added to portfolio',
            stock,
            portfolio: portfolioData
        });
    } catch (error) {
        logger.error('Add stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding stock to portfolio'
        });
    }
};

// Remove a stock from the portfolio
export const removeStock = async (req, res) => {
    try {
        const { symbol } = req.params;
        const userId = req.user._id;

        const deletedStock = await Portfolio.findOneAndDelete({ userId, symbol });

        if (!deletedStock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found in portfolio'
            });
        }

        logger.info(`Removed stock ${symbol} for user ${req.user.username}`);

        // Return updated portfolio metrics
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.json({
            success: true,
            message: 'Stock removed from portfolio',
            portfolio: portfolioData
        });
    } catch (error) {
        logger.error('Remove stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing stock from portfolio'
        });
    }
};

// Get portfolio (returns live metrics)
export const getPortfolio = async (req, res) => {
    try {
        const userId = req.user._id;
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.json({
            success: true,
            portfolio: portfolioData
        });
    } catch (error) {
        logger.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching portfolio'
        });
    }
};

// Get portfolio summary
export const getPortfolioSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.json({
            success: true,
            ...portfolioData
        });
    } catch (error) {
        logger.error('Portfolio summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting portfolio summary'
        });
    }
};

// Get dashboard metrics
export const getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.json({
            success: true,
            ...portfolioData
        });
    } catch (error) {
        logger.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error loading dashboard' });
    }
};

// Get live portfolio
export const getLivePortfolio = async (req, res) => {
    try {
        const userId = req.user._id;
        const portfolioData = await calculatePortfolioMetrics(userId);

        res.json({
            success: true,
            ...portfolioData
        });
    } catch (error) {
        logger.error('Get live portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching live portfolio'
        });
    }
};
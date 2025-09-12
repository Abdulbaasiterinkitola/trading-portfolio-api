import Portfolio from '../models/Portfolio.js';
import logger from '../utils/logger.js';
import { calculatePortfolioMetrics } from '../services/liveUpdates.js';
import { ALPHA_VANTAGE_API_KEY } from '../config/env.js';

import axios from 'axios';

const getCurrentStockPrice = async (symbol) => {
    try {
        const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        );

        const data = response.data['Global Quote'];
        if (data && data['05. price']) {
            return parseFloat(data['05. price']);
        } else {
            throw new Error(`Invalid stock symbol or no price data for ${symbol}`);
        }
    } catch (error) {
        logger.error(`Error fetching price for ${symbol}:`, error);
        throw new Error('Could not fetch stock price. Please try again later.');
    }
};

// Add a stock to the portfolio
export const addStock = async (req, res) => {
    try {
        const { symbol, quantity } = req.body;
        const userId = req.user._id;
        if (!symbol || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Symbol and only positive quantity are required'
            });
        }
        const livePrice = await getCurrentStockPrice(symbol);

        let stock = await Portfolio.findOne({ userId, symbol });

        if (stock) {
            const totalQuantity = stock.quantity + quantity;
            const totalValue = (stock.quantity * stock.purchasePrice) + (quantity * livePrice);
            stock.purchasePrice = totalValue / totalQuantity;
            stock.quantity = totalQuantity;
            await stock.save();
        } else {
            stock = new Portfolio({
                userId,
                symbol,
                quantity,
                purchasePrice: livePrice
            });
            await stock.save();
        }

        const portfolioData = await calculatePortfolioMetrics(userId);

        res.status(201).json({
            success: true,
            message: stock._id ? 'Stock updated in portfolio' : 'Stock added to portfolio',
            stock,
            portfolio: portfolioData
        });
    } catch (error) {
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
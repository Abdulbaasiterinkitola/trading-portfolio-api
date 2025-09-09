import Portfolio from '../models/Portfolio.js';
import logger from '../utils/logger.js';
import { getCurrentStockPrice } from '../services/stock.js';

export const addStock = async (req, res) => {
    try {
        const { symbol, quantity, purchasePrice } = req.body;
        const userId = req.user._id;

        // Check if stock already exists in portfolio
        const existingStock = await Portfolio.findOne({ userId, symbol });
        
        if (existingStock) {
            // Update existing stock (add to quantity, average the price)
            const totalQuantity = existingStock.quantity + quantity;
            const totalValue = (existingStock.quantity * existingStock.purchasePrice) + (quantity * purchasePrice);
            const averagePrice = totalValue / totalQuantity;

            existingStock.quantity = totalQuantity;
            existingStock.purchasePrice = averagePrice;
            await existingStock.save();

            logger.info(`Updated stock ${symbol} for user ${req.user.username}`);
            
            return res.json({
                success: true,
                message: 'Stock updated in portfolio',
                stock: existingStock
            });
        }

        // Create new stock entry
        const newStock = new Portfolio({
            userId,
            symbol,
            quantity,
            purchasePrice
        });

        await newStock.save();

        logger.info(`Added stock ${symbol} for user ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Stock added to portfolio',
            stock: newStock
        });
    } catch (error) {
        logger.error('Add stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding stock to portfolio'
        });
    }
};

export const getPortfolio = async (req, res) => {
    try {
        const userId = req.user._id;
        const portfolio = await Portfolio.find({ userId });

        res.json({
            success: true,
            portfolio
        });
    } catch (error) {
        logger.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching portfolio'
        });
    }
};

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

        res.json({
            success: true,
            message: 'Stock removed from portfolio'
        });
    } catch (error) {
        logger.error('Remove stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing stock from portfolio'
        });
    }
};

export const getPortfolioSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const holdings = await Portfolio.find({ userId });
        
        if (!holdings.length) {
            return res.json({
                success: true,
                totalValue: 0,
                totalInvested: 0,
                profitLoss: 0,
                positions: []
            });
        }

        let totalValue = 0;
        let totalInvested = 0;
        
        const positions = await Promise.all(holdings.map(async (holding) => {
            try {
                const currentPrice = await getCurrentStockPrice(holding.symbol);
                const currentValue = holding.quantity * currentPrice;
                const invested = holding.quantity * holding.purchasePrice;
                const pnl = currentValue - invested;
                
                totalValue += currentValue;
                totalInvested += invested;
                
                return {
                    symbol: holding.symbol,
                    quantity: holding.quantity,
                    avgCost: holding.purchasePrice,
                    currentPrice,
                    currentValue,
                    profitLoss: pnl,
                    profitLossPercent: (pnl / invested) * 100
                };
            } catch (error) {
                logger.error(`Error fetching price for ${holding.symbol}:`, error);
                return null;
            }
        }));

        const validPositions = positions.filter(position => position !== null);
        const totalPnL = totalValue - totalInvested;

        res.json({
            success: true,
            totalValue,
            totalInvested,
            profitLoss: totalPnL,
            profitLossPercent: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
            positions: validPositions
        });

    } catch (error) {
        logger.error('Portfolio summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting portfolio summary'
        });
    }
};

export const getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const holdings = await Portfolio.find({ userId });
        
        if (!holdings.length) {
            return res.json({
                success: true,
                message: "No stocks in portfolio",
                totalValue: 0,
                stockCount: 0
            });
        }

        let totalValue = 0;
        let totalInvested = 0;
        
        for (const holding of holdings) {
            const currentPrice = await getCurrentStockPrice(holding.symbol);
            const value = holding.quantity * currentPrice;
            const invested = holding.quantity * holding.purchasePrice;
            
            totalValue += value;
            totalInvested += invested;
        }

        res.json({
            success: true,
            totalValue,
            totalInvested,
            profitLoss: totalValue - totalInvested,
            stockCount: holdings.length
        });

    } catch (error) {
        logger.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error loading dashboard' });
    }
};
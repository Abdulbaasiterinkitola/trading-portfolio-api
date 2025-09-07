import Portfolio from '../models/Portfolio.js';
import logger from '../utils/logger.js';

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
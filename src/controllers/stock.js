import { getCurrentStockPrice, getStockInfo } from '../services/stock.js';
import logger from '../utils/logger.js';

export const getPrice = async (req, res) => {
    try {
        const { symbol } = req.params;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Stock symbol is required'
            });
        }

        const price = await getCurrentStockPrice(symbol.toUpperCase());

        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            price,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Get price error:', error);
        
        if (error.message.includes('Invalid symbol')) {
            return res.status(404).json({
                success: false,
                message: `Invalid stock symbol: ${req.params.symbol}`
            });
        }

        if (error.message.includes('API call limit')) {
            return res.status(429).json({
                success: false,
                message: 'API rate limit reached. Please try again later.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching stock price'
        });
    }
};

export const getInfo = async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const info = await getStockInfo(symbol.toUpperCase());

        res.json({
            success: true,
            data: info
        });

    } catch (error) {
        logger.error('Get stock info error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error fetching stock information'
        });
    }
};
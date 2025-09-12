import { io } from '../../app.js';
import logger from '../utils/logger.js';
import { getCurrentStockPrice } from './stock.js';
import Portfolio from '../models/Portfolio.js';

// Calculate portfolio metrics for a user
export const calculatePortfolioMetrics = async (userId) => {
    try {
        const positions = await Portfolio.find({ userId });
        if (!positions.length) {
            return {
                totalValue: 0,
                totalInvested: 0,
                profitLoss: 0,
                profitLossPercent: 0,
                stockCount: 0,
                positions: [],
                lastUpdated: new Date()
            };
        }

        let totalInvested = 0;
        let totalValue = 0;

        const positionData = await Promise.all(
            positions.map(async (position) => {
                try {
                    const currentPrice = await getCurrentStockPrice(position.symbol);
                    const investmentValue = position.quantity * position.purchasePrice;
                    const positionValue = position.quantity * currentPrice;
                    const pnl = positionValue - investmentValue;
                    const pnlPercentage = investmentValue ? (pnl / investmentValue) * 100 : 0;

                    totalInvested += investmentValue;
                    totalValue += positionValue;

                    return {
                        symbol: position.symbol,
                        quantity: position.quantity,
                        avgCost: position.purchasePrice,
                        currentPrice,
                        investmentValue: Math.round(investmentValue * 100) / 100,
                        currentValue: Math.round(positionValue * 100) / 100,
                        profitLoss: Math.round(pnl * 100) / 100,
                        profitLossPercent: Math.round(pnlPercentage * 100) / 100
                    };
                } catch (error) {
                    logger.error(`Error fetching price for ${position.symbol}:`, error);
                    return null;
                }
            })
        );

        const validPositions = positionData.filter(Boolean);
        const totalPnL = totalValue - totalInvested;
        const totalPnLPercentage = totalInvested ? (totalPnL / totalInvested) * 100 : 0;

        return {
            totalValue: Math.round(totalValue * 100) / 100,
            totalInvested: Math.round(totalInvested * 100) / 100,
            profitLoss: Math.round(totalPnL * 100) / 100,
            profitLossPercent: Math.round(totalPnLPercentage * 100) / 100,
            stockCount: validPositions.length,
            positions: validPositions,
            lastUpdated: new Date()
        };
    } catch (error) {
        logger.error(`Error calculating portfolio metrics for user ${userId}:`, error);
        return null;
    }
};

// Start live portfolio updates via Socket.IO
export const startLiveUpdates = () => {
    setInterval(async () => {
        try {
            const userIds = await Portfolio.distinct('userId');

            for (const userId of userIds) {
                const portfolioData = await calculatePortfolioMetrics(userId);

                if (portfolioData) {
                    io.to(userId.toString()).emit('portfolioUpdate', portfolioData);
                    logger.info(`Sent portfolio update to user ${userId}`);
                }
            }
        } catch (error) {
            logger.error('Error in live updates:', error);
        }
    }, 10 * 60 * 1000);
};
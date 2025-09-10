import { z } from 'zod';

const addStockSchema = z.object({
    symbol: z.string().min(1).max(5).toUpperCase(),
    quantity: z.number().int().positive(),
    purchasePrice: z.number().positive()
});

export const validateAddStock = (req, res, next) => {
    try {
        req.body = addStockSchema.parse(req.body);
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: error.errors
        });
    }
};
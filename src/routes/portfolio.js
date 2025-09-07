import express from 'express';
import { addStock, getPortfolio, removeStock } from '../controllers/portfolio.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getPortfolio);
router.post('/stock', addStock);
router.delete('/stock/:symbol', removeStock);

export default router;
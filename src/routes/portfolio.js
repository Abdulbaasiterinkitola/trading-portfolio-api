import express from 'express';
import { addStock, getPortfolio, removeStock, getPortfolioSummary, getDashboard, getLivePortfolio } from '../controllers/portfolio.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getPortfolio);
router.get('/summary', getPortfolioSummary);
router.get('/dashboard', getDashboard);
router.get('/live', getLivePortfolio);

router.post('/stock', addStock);
router.delete('/stock/:symbol', removeStock);

export default router;
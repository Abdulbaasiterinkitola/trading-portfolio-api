import express from 'express';
import { getPrice, getInfo } from '../controllers/stock.js';

const router = express.Router();

router.get('/:symbol/price', getPrice);
router.get('/:symbol/info', getInfo);

export default router;
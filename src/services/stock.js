import axios from "axios";
import logger from "../utils/logger";
import { ALPHA_VANTAGE_API_KEY } from "../config/env";

const ALPHA_VANTAGE_API_KEY = {ALPHA_VANTAGE_API_KEY};
const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

const priceCache = new Map();
const CACHE_DURATION = 60000;

export const getCurrentStockPrice = async (symbol) => {
  const now = Date.now();
  try {
    const cacheKey = `price_${symbol}`;
    const cached = priceCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      logger.info(`Cache hit for ${symbol}`);
      return cached.price;
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const data = response.data;

    if (data[`Error Message`]) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data[`Note`]) {
      throw new Error("API call limit exceeded. Please try again later.");
    }

    const quote = data['Global Quote'];
        if (!quote || !quote['05. price']) {
            throw new Error(`No price data for ${symbol}`);
        }

        const price = parseFloat(quote['05. price']);

        priceCache.set(cacheKey, {
            price,
            timestamp: now
        });

        logger.info(`Fetched price for ${symbol}: $${price}`);
        return price;

  } catch (error) {
    logger.error(`Error fetching stock price for ${symbol}: ${error.message}`);
    throw error;
  }
};

export const getStockInfo = async (symbol) => {
    try {
        const cacheKey = `info_${symbol}`;
        const cached = priceCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        const response = await axios.get(BASE_URL, {
            params: {
                function: 'OVERVIEW',
                symbol: symbol,
                apikey: ALPHA_VANTAGE_API_KEY
            }
        });

        const data = response.data;

        if (data['Error Message'] || !data.Symbol) {
            throw new Error(`Invalid symbol: ${symbol}`);
        }

        const stockInfo = {
            symbol: data.Symbol,
            name: data.Name,
            exchange: data.Exchange,
            currency: data.Currency,
            sector: data.Sector,
            industry: data.Industry
        };

        priceCache.set(cacheKey, {
            data: stockInfo,
            timestamp: Date.now()
        });

        return stockInfo;

    } catch (error) {
        logger.error(`Error fetching info for ${symbol}:`, error.message);
        throw error;
    }
};

export const getMultiplePrices = async (symbols) => {
    const prices = {};
    
    for (const symbol of symbols) {
        try {
            prices[symbol] = await getCurrentStockPrice(symbol);

            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            logger.error(`Error fetching price for ${symbol}:`, error.message);
            prices[symbol] = null;
        }
    }

    return prices;
};
import axios from "axios";
import logger from "../utils/logger.js";
import { ALPHA_VANTAGE_API_KEY } from "../config/env.js";

const ALPHA_VANTAGE_BASE_URL = "https://www.alphavantage.co/query";

const priceCache = new Map();
const CACHE_DURATION = 60000;

export const getCurrentStockPrice = async (symbol) => {
  const now = Date.now();
  try {
    // Log environment details
    logger.info(`🔍 DEBUG: Fetching ${symbol} with API key: ${ALPHA_VANTAGE_API_KEY ? 'Present' : 'MISSING'}`);
    logger.info(`🔍 DEBUG: Environment: ${process.env.NODE_ENV}`);
    
    const cacheKey = `price_${symbol}`;
    const cached = priceCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      logger.info(`Cache hit for ${symbol}`);
      return cached.price;
    }

    const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    logger.info(`🔍 DEBUG: Full URL: ${url}`);

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 10000 // 10 second timeout
    });

    // Log the FULL response
    logger.info(`🔍 DEBUG: Status: ${response.status}`);
    logger.info(`🔍 DEBUG: Headers:`, response.headers);
    logger.info(`🔍 DEBUG: Full Response Body:`, JSON.stringify(response.data, null, 2));
   
    const data = response.data;
    
    // Check for specific Alpha Vantage error patterns
    if (data['Error Message']) {
        logger.error(`🔍 Alpha Vantage Error Message: ${data['Error Message']}`);
        throw new Error(`Invalid symbol: ${symbol}`);
    }
    if (data['Note']) {
        logger.error(`🔍 Alpha Vantage Note: ${data['Note']}`);
        const cached = priceCache.get(cacheKey);
        if (cached) {
            logger.warn(`Daily quota hit. Serving stale data for ${symbol}`);
            return cached.price;
        }
        throw new Error("API call limit exceeded. Please try again later.");
    }
    
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
        const cached = priceCache.get(cacheKey);
        if (cached) {
            logger.warn(`Using cached price for ${symbol} due to API failure`);
            return cached.price;
        }
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

        const response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}`, {
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

        logger.info(`Fetched info for ${symbol}:`, stockInfo);
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
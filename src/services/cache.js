import NodeCache from "node-cache";

const cache = new NodeCache({stdTTL: 60});

export const getCachedPrice = (symbol) => {
    return cache.get(`price_${symbol}`);
};

export const setCachedPrice = (symbol, price) => {
    cache.set(`price_${symbol}`, price);
};

export default cache;
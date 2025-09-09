import { configDotenv } from "dotenv";

configDotenv();

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI; 
export const API_VERSION = 1;
export const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
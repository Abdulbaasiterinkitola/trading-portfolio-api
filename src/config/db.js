import mongoose from "mongoose";
import logger from "../utils/logger.js";
import  { MONGODB_URI } from "./env.js";

const connectDB = async () => {
    return mongoose
        .connect(MONGODB_URI)
        .then(() => {
            logger.info("MongoDB connected");
        })
        .catch((err) => {
            logger.error("MongoDB connection error:", err);
        });
};

export default connectDB;
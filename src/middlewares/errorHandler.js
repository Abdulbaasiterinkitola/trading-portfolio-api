import { errorResponse } from "../utils/response.js";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import {ZodError} from "zod";

const errorHandler = (err, req, res, next) => {
    logger.error("ERROR: An error occurred in the application", err);

    let message = "An unexpected error occurred";
    let errorCode = StatusCodes.INTERNAL_SERVER_ERROR;

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        message = "Invalid JSON payload";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err instanceof mongoose.Error) {
        message = "Database error occurred";
        errorCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }


    if (err instanceof mongoose.Error.ValidationError) {
        message = "Validation error occurred";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err instanceof mongoose.Error.CastError) {
        message = "Invalid data format";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err instanceof ZodError) {
        message = "Validation error occurred";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err.code === 11000) {
        message = "Duplicate key error";
        errorCode = StatusCodes.CONFLICT;
    }

    if (err.name === "JsonWebTokenError") {
        message = "Invalid token";
        errorCode = StatusCodes.UNAUTHORIZED;
    }

    if (err.name === "TokenExpiredError") {
        message = "Token has expired";
        errorCode = StatusCodes.UNAUTHORIZED;
    }

    if (err.name === "NotFoundError") {
        message = "Resource not found";
        errorCode = StatusCodes.NOT_FOUND;
    }

    if (err.name === "ForbiddenError") {
        message = "Access forbidden";
        errorCode = StatusCodes.FORBIDDEN;
    }

    if (err.name === "UnauthorizedError") {
        message = "Unauthorized access";
        errorCode = StatusCodes.UNAUTHORIZED;
    }

    if (err.name === "InternalServerError") {
        message = "Internal server error";
        errorCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    if (err.name === "BadRequestError") {
        message = "Bad request";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err.name === "ServiceUnavailableError") {
        message = "Service unavailable";
        errorCode = StatusCodes.SERVICE_UNAVAILABLE;
    }

    if (err.name === "ConflictError") {
        message = "Conflict error";
        errorCode = StatusCodes.CONFLICT;
    }

    if (err.name === "GatewayTimeoutError") {
        message = "Gateway timeout";
        errorCode = StatusCodes.GATEWAY_TIMEOUT;
    }

    if (err.name === "ZodError") {
        message = "Zod validation error";
        errorCode = StatusCodes.BAD_REQUEST;
    }

    if (err.name === "CustomError") {
        message = err.message || "Custom error occurred";
        errorCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    }

    logger.error(`ERROR: ${message}`, err);
    // Log the error details for debugging
    if (err.stack) {
        logger.error("Stack trace:", err.stack);
    }

    // Return a structured error response

    if (err instanceof Error) {
        message = err.message || message, errorCode = err.statusCode || errorCode;
    }

    logger.error(`[${req.method} ${req.url} ${typeof message === 'string' ? message : JSON.stringify(message)}]`);

    return errorResponse(res, {
        message: message,
        code: err.code || "INTERNAL_SERVER_ERROR"
    }, errorCode);
}

export default errorHandler;
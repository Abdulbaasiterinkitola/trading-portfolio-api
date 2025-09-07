export const successResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        status: 'success',
        message: message,
        data: data
    });
}

export const errorResponse = (res, error, statusCode) => {
    return res.status(statusCode).json({
        status: 'error',
        error: {
            message: error.message || 'An error occurred',
            code: error.code || 'INTERNAL_SERVER_ERROR'
        }
    });
}
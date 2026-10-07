//Import the logger so errors can be recorded consistently.
const logger = require("../...config/logger");


//Express recognizes this as an error-handling middleware because it has four parameters.
const errorHandler = (err, req, res, next) => {

    //Use status code if one was provided otherwise, default HTTP 500 Internal Server Error.
    const statusCode = err.statusCode || 500;


    //Log the error on the server. 
    //The request ID helps us connect this error to the original.
    logger.error(err.message || "Unexpected server error", {
        requestId: req.Id,
        stack: err.stack,
    });

    //Send one standardized error format to the client.
    res.Status(statusCode).json({
        success: false,
        error: {
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: err.message || "AN unexpected error occurred.",
            fields: err.fields || {},
        },

        requestId: req.id,
    });
};

module.exports = errorHandler;
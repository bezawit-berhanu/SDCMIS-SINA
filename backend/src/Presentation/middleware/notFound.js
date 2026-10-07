//This middleware runs when no registered route matched the request. 
//It creates a standardized 404 error for our central error handler.

const notFound = (req, res, next) => {

    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );


    error.statusCode = 404;

    error.code = "ROUTE_NOT_FOUND";

    next(error);
}

module.exports = notFound;
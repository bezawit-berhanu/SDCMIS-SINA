//Import Node's built-in crypto module.
//We use it to generate a unique UUID for each request/

const crypto = require("crypto");

//Express Middleware recieves the request, response, and next function
const requestId = (req, res, next) => {

    const id = crypto.randomUUID();

    req.id = id;

    res.setHeader("X-Request-ID", id);

    next();
};

module.exports = requestId;
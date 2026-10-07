// Import the Prisma client from infrastructure.
// This is the database implementation our application will use.
const prisma = require("../infrastructure/database/prisma");


// Create the application's dependency container.
//
// As the project grows, this object will contain repositories,
// services, and use cases with their dependencies already connected.
const container = {

    // Make Prisma available to the rest of the application
    // through the dependency container.
    prisma,

};


// Export the container.
module.exports = container;
const prisma = require("../Infrastructure/prisma");
const userRepository = require("../Infrastructure/Repositories/user.repository");

const passwordService = require("../Infrastructure/authentication/password.service");
const tokenService = require("../Infrastructure/authentication/token.service");

const LoginUser = require("../application/auth/LoginUser");
const GetCurrentUser = require("../application/auth/GetCurrentUser");


const loginUser = new LoginUser({
    userRepository,
    passwordService,
    tokenService,
});

const getCurrentUser = new GetCurrentUser({
    userRepository,
});


const container = {
    prisma,
    userRepository,
    passwordService,
    tokenService,
    loginUser,
    getCurrentUser,
};

module.exports = container;
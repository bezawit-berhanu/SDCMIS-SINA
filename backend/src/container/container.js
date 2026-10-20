const prisma = require("../Infrastructure/prisma");
const userRepository = require("../Infrastructure/Repositories/user.repository");

const passwordService = require("../Infrastructure/authentication/password.service");
const tokenService = require("../Infrastructure/authentication/token.service");

const LoginUser = require("../application/auth/LoginUser");
const RegisterUser = require("../application/auth/RegisterUser");
const GetCurrentUser = require("../application/auth/GetCurrentUser");

const UpdateUserName = require("../application/settings/UpdateUserName");
const UpdateUserContact = require("../application/settings/UpdateUserContact");
const ChangeUserPassword = require("../application/settings/ChangeUserPassword");
const UpdateUserProfile = require("../application/settings/UpdateUserProfile");

const loginUser = new LoginUser({
    userRepository,
    passwordService,
    tokenService,
});

const registerUser = new RegisterUser({
    userRepository,
    passwordService,
});

const getCurrentUser = new GetCurrentUser({
    userRepository,
});

const updateUserName = new UpdateUserName({
    userRepository,
});

const updateUserContact = new UpdateUserContact({
    userRepository,
});

const changeUserPassword = new ChangeUserPassword({
    userRepository,
    passwordService,
});

const updateUserProfile = new UpdateUserProfile({
    userRepository,
});

const container = {
    prisma,
    userRepository,
    passwordService,
    tokenService,
    loginUser,
    registerUser,
    getCurrentUser,
    updateUserName,
    updateUserContact,
    changeUserPassword,
    updateUserProfile,
};

module.exports = container;
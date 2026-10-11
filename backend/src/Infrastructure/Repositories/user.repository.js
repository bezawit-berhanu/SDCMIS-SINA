const prisma = require("../prisma");

const userRepository = {
    async findByEmail(email) {
        return prisma.user.findFirst({
            where: {
                email: email.trim().toLowerCase(),
                deletedAt: null,
                recordStatus: "ACTIVE",
            },
        });
    },

    async findActiveById(id) {
        return prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                recordStatus: "ACTIVE",
            },
        });
    },
};

module.exports = userRepository;
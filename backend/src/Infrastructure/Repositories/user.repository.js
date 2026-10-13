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

    async findByPhone(phone) {
        if (!phone) return null;
        return prisma.user.findFirst({
            where: {
                phone: phone.trim(),
                deletedAt: null,
                recordStatus: "ACTIVE",
            },
        });
    },

    async findAnyByEmail(email) {
        if (!email) return null;
        return prisma.user.findFirst({
            where: {
                email: email.trim().toLowerCase(),
            },
        });
    },

    async findAnyByPhone(phone) {
        if (!phone) return null;
        return prisma.user.findFirst({
            where: {
                phone: phone.trim(),
            },
        });
    },

    async findActiveById(id) {
        if (!id) return null;
        return prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
                recordStatus: "ACTIVE",
            },
        });
    },

    async create(userData) {
        return prisma.user.create({
            data: {
                fullname: userData.fullname || userData.fullName,
                email: userData.email,
                phone: userData.phone,
                passwordHash: userData.passwordHash,
                role: userData.role,
                themePreference: userData.themePreference,
                recordStatus: userData.recordStatus,
            },
        });
    },
};

module.exports = userRepository;
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

    async update(id, updateData) {
        if (!id) return null;
        const data = {};
        if (updateData.fullName !== undefined || updateData.fullname !== undefined) {
            data.fullname = (updateData.fullName || updateData.fullname).trim();
        }
        if (updateData.email !== undefined) {
            data.email = updateData.email ? updateData.email.trim().toLowerCase() : null;
        }
        if (updateData.phone !== undefined) {
            data.phone = updateData.phone ? updateData.phone.trim() : null;
        }
        if (updateData.passwordHash !== undefined) {
            data.passwordHash = updateData.passwordHash;
        }
        if (updateData.themePreference !== undefined) {
            data.themePreference = updateData.themePreference;
        }

        return prisma.user.update({
            where: { id },
            data,
        });
    },

    async findAnyByEmailExcludingUser(email, excludeUserId) {
        if (!email) return null;
        return prisma.user.findFirst({
            where: {
                email: email.trim().toLowerCase(),
                id: { not: excludeUserId },
            },
        });
    },

    async findAnyByPhoneExcludingUser(phone, excludeUserId) {
        if (!phone) return null;
        return prisma.user.findFirst({
            where: {
                phone: phone.trim(),
                id: { not: excludeUserId },
            },
        });
    },
};

module.exports = userRepository;
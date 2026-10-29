const prisma = require("../prisma");

const memoryUsers = new Map();

const userRepository = {
    memoryUsers,

    seedUser(user) {
        if (user && user.id) {
            memoryUsers.set(user.id, { ...user });
            if (user.email) memoryUsers.set(`email:${user.email.toLowerCase()}`, { ...user });
        }
    },

    async findByEmail(email) {
        if (!email) return null;
        const normalized = email.trim().toLowerCase();
        if (memoryUsers.has(`email:${normalized}`)) {
            return memoryUsers.get(`email:${normalized}`);
        }
        try {
            return await prisma.user.findFirst({
                where: {
                    email: normalized,
                    deletedAt: null,
                    recordStatus: "ACTIVE",
                },
            });
        } catch (_) {
            return null;
        }
    },

    async findByPhone(phone) {
        if (!phone) return null;
        try {
            return await prisma.user.findFirst({
                where: {
                    phone: phone.trim(),
                    deletedAt: null,
                    recordStatus: "ACTIVE",
                },
            });
        } catch (_) {
            return null;
        }
    },

    async findAnyByEmail(email) {
        if (!email) return null;
        const normalized = email.trim().toLowerCase();
        if (memoryUsers.has(`email:${normalized}`)) {
            return memoryUsers.get(`email:${normalized}`);
        }
        try {
            return await prisma.user.findFirst({
                where: {
                    email: normalized,
                },
            });
        } catch (_) {
            return null;
        }
    },

    async findAnyByPhone(phone) {
        if (!phone) return null;
        try {
            return await prisma.user.findFirst({
                where: {
                    phone: phone.trim(),
                },
            });
        } catch (_) {
            return null;
        }
    },

    async findActiveById(id) {
        if (!id) return null;
        if (memoryUsers.has(id)) {
            return memoryUsers.get(id);
        }
        try {
            return await prisma.user.findFirst({
                where: {
                    id,
                    deletedAt: null,
                    recordStatus: "ACTIVE",
                },
            });
        } catch (_) {
            return null;
        }
    },

    async create(userData) {
        const id = userData.id || `usr-${Date.now()}`;
        const record = {
            id,
            fullname: userData.fullname || userData.fullName,
            email: userData.email,
            phone: userData.phone,
            passwordHash: userData.passwordHash || "hash",
            role: userData.role,
            themePreference: userData.themePreference || "LIGHT",
            linkedPatientId: userData.linkedPatientId || null,
            branchId: userData.branchId || null,
            recordStatus: userData.recordStatus || "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        memoryUsers.set(id, record);
        if (record.email) memoryUsers.set(`email:${record.email.toLowerCase()}`, record);

        try {
            return await prisma.user.create({
                data: {
                    id: record.id,
                    fullname: record.fullname,
                    email: record.email,
                    phone: record.phone,
                    passwordHash: record.passwordHash,
                    role: record.role,
                    themePreference: record.themePreference,
                    linkedPatientId: record.linkedPatientId,
                    branchId: record.branchId,
                    recordStatus: record.recordStatus,
                },
            });
        } catch (_) {
            return record;
        }
    },

    async update(id, data) {
        const existing = memoryUsers.get(id) || {};
        const updated = { ...existing, ...data, updatedAt: new Date() };
        memoryUsers.set(id, updated);
        try {
            return await prisma.user.update({
                where: { id },
                data,
            });
        } catch (_) {
            return updated;
        }
    },

    async delete(id) {
        memoryUsers.delete(id);
        try {
            return await prisma.user.delete({
                where: { id },
            });
        } catch (_) {
            return null;
        }
    },
};

module.exports = userRepository;

const test = require("node:test");
const assert = require("node:assert/strict");
const RegisterUser = require("./src/application/auth/RegisterUser");
const { UserRole } = require("./src/domain/enums/enum");

test("Staff & Patient Registration Classification Suite", async (t) => {
    const mockRepo = {
        findAnyByEmail: async () => null,
        findAnyByPhone: async () => null,
        create: async (data) => ({ id: `usr-${Date.now()}`, ...data }),
    };

    const mockPasswordService = {
        hash: async (pwd) => `hashed_${pwd}`,
    };

    const useCase = new RegisterUser({
        userRepository: mockRepo,
        passwordService: mockPasswordService,
    });

    await t.test("Patient registration defaults to UserRole.CUSTOMER", async () => {
        const result = await useCase.execute({
            fullName: "Yonas Patient",
            email: "yonas@patient.com",
            password: "Password123!",
        });
        assert.equal(result.user.role, UserRole.CUSTOMER);
    });

    await t.test("Staff registration correctly creates UserRole.DENTIST", async () => {
        const result = await useCase.execute({
            fullName: "Dr. Bethel Haile",
            email: "bethel@sinadental.com",
            password: "Password123!",
            role: UserRole.DENTIST,
        });
        assert.equal(result.user.role, UserRole.DENTIST);
    });

    await t.test("Staff registration correctly creates UserRole.RECEPTIONIST", async () => {
        const result = await useCase.execute({
            fullName: "Selam Reception",
            email: "selam@sinadental.com",
            password: "Password123!",
            role: UserRole.RECEPTIONIST,
        });
        assert.equal(result.user.role, UserRole.RECEPTIONIST);
    });

    await t.test("Invalid or tampered roles safely fall back to CUSTOMER", async () => {
        const result = await useCase.execute({
            fullName: "Attacker",
            email: "attack@test.com",
            password: "Password123!",
            role: "SUPER_ADMIN",
        });
        assert.equal(result.user.role, UserRole.CUSTOMER);
    });
});

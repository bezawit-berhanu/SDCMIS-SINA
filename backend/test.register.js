const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

const mockPrisma = {
    user: {
        findFirst: async () => null,
        create: async (args) => ({ id: "mock-id", ...args.data }),
    },
    $disconnect: async () => {},
};
require.cache[require.resolve("./src/Infrastructure/prisma")] = {
    id: require.resolve("./src/Infrastructure/prisma"),
    filename: require.resolve("./src/Infrastructure/prisma"),
    loaded: true,
    exports: mockPrisma,
};

const RegisterUser = require("./src/application/auth/RegisterUser");
const passwordService = require("./src/Infrastructure/authentication/password.service");
const container = require("./src/container/container");
const app = require("./app");
const { UserRole, RecordStatus, ThemePreference } = require("./src/domain/enums/enum");

/**
 * Creates an in-memory test repository simulating Prisma userRepository behavior
 */
function createMockUserRepository(initialUsers = []) {
    const users = [...initialUsers];

    return {
        users,
        async findByEmail(email) {
            if (!email) return null;
            const normalized = email.trim().toLowerCase();
            return users.find(
                (u) => u.email === normalized && u.recordStatus === "ACTIVE" && !u.deletedAt
            ) || null;
        },
        async findByPhone(phone) {
            if (!phone) return null;
            const normalized = phone.trim();
            return users.find(
                (u) => u.phone === normalized && u.recordStatus === "ACTIVE" && !u.deletedAt
            ) || null;
        },
        async findAnyByEmail(email) {
            if (!email) return null;
            const normalized = email.trim().toLowerCase();
            return users.find((u) => u.email === normalized) || null;
        },
        async findAnyByPhone(phone) {
            if (!phone) return null;
            const normalized = phone.trim();
            return users.find((u) => u.phone === normalized) || null;
        },
        async findActiveById(id) {
            if (!id) return null;
            return users.find(
                (u) => u.id === id && u.recordStatus === "ACTIVE" && !u.deletedAt
            ) || null;
        },
        async create(userData) {
            const newUser = {
                id: `mock-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                fullname: userData.fullname || userData.fullName,
                email: userData.email,
                phone: userData.phone,
                passwordHash: userData.passwordHash,
                role: userData.role,
                themePreference: userData.themePreference || ThemePreference.LIGHT,
                recordStatus: userData.recordStatus || RecordStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };
            users.push(newUser);
            return newUser;
        },
    };
}

describe("RegisterUser Use Case", () => {
    let mockRepo;
    let registerUser;

    beforeEach(() => {
        mockRepo = createMockUserRepository();
        registerUser = new RegisterUser({
            userRepository: mockRepo,
            passwordService,
        });
    });

    describe("Subtask 1: Required Fields Validation", () => {
        it("fails when fullName is missing (undefined)", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    email: "patient@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.fullName);
                    return true;
                }
            );
        });

        it("fails when fullName is an empty string or whitespace", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "   ",
                    email: "patient@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.fullName);
                    return true;
                }
            );
        });

        it("fails when fullName exceeds 120 characters", async () => {
            const longName = "A".repeat(121);
            await assert.rejects(
                () => registerUser.execute({
                    fullName: longName,
                    email: "patient@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.fullName.includes("120"));
                    return true;
                }
            );
        });

        it("fails when password is missing", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "patient@example.com",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password);
                    return true;
                }
            );
        });

        it("fails when both email and phone are omitted", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.contact);
                    return true;
                }
            );
        });
    });

    describe("Subtask 2: Valid Email/Phone Validation", () => {
        it("fails when email has an invalid format", async () => {
            const invalidEmails = ["notanemail", "test@", "@domain.com", "user@domain", "user @domain.com"];
            for (const email of invalidEmails) {
                await assert.rejects(
                    () => registerUser.execute({
                        fullName: "John Doe",
                        email,
                        password: "ValidP@ssword123!",
                    }),
                    (err) => {
                        assert.strictEqual(err.statusCode, 400);
                        assert.strictEqual(err.code, "VALIDATION_ERROR");
                        assert.ok(err.fields.email);
                        return true;
                    }
                );
            }
        });

        it("fails when email exceeds 255 characters", async () => {
            const longEmail = "a".repeat(250) + "@domain.com";
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: longEmail,
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });

        it("fails when phone has an invalid format or too few digits", async () => {
            const invalidPhones = ["abc", "123", "+12", "phone123456", "12345"];
            for (const phone of invalidPhones) {
                await assert.rejects(
                    () => registerUser.execute({
                        fullName: "John Doe",
                        phone,
                        password: "ValidP@ssword123!",
                    }),
                    (err) => {
                        assert.strictEqual(err.statusCode, 400);
                        assert.strictEqual(err.code, "VALIDATION_ERROR");
                        assert.ok(err.fields.phone);
                        return true;
                    }
                );
            }
        });

        it("fails when phone exceeds 30 characters", async () => {
            const longPhone = "+12345678901234567890123456789012345";
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    phone: longPhone,
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.phone);
                    return true;
                }
            );
        });

        it("accepts valid phone formats with formatting characters", async () => {
            const validPhones = ["+1-555-123-4567", "+251911234567", "(555) 123-4567", "0911234567"];
            for (const phone of validPhones) {
                const res = await registerUser.execute({
                    fullName: "Valid Phone User",
                    phone,
                    password: "ValidP@ssword123!",
                });
                assert.ok(res.user);
                assert.strictEqual(res.user.phone, phone.trim());
            }
        });

        it("normalizes email to lowercase and trims whitespace", async () => {
            const res = await registerUser.execute({
                fullName: "Jane Doe",
                email: "  Jane.DOE@Example.COM  ",
                password: "ValidP@ssword123!",
            });
            assert.strictEqual(res.user.email, "jane.doe@example.com");
        });
    });

    describe("Subtask 3: Password Strength Enforcement", () => {
        it("fails when password is fewer than 8 characters", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: "P@1s",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("8 characters"));
                    return true;
                }
            );
        });

        it("fails when password lacks an uppercase letter", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: "password123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("uppercase"));
                    return true;
                }
            );
        });

        it("fails when password lacks a lowercase letter", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: "PASSWORD123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("lowercase"));
                    return true;
                }
            );
        });

        it("fails when password lacks a digit", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: "PasswordSpecial!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("number"));
                    return true;
                }
            );
        });

        it("fails when password lacks a special character", async () => {
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: "Password12345",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("special character"));
                    return true;
                }
            );
        });

        it("fails when password exceeds 72 bytes (bcrypt restriction)", async () => {
            const longPassword = "A1!" + "a".repeat(75);
            await assert.rejects(
                () => registerUser.execute({
                    fullName: "John Doe",
                    email: "john@example.com",
                    password: longPassword,
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password.includes("72 bytes"));
                    return true;
                }
            );
        });

        it("successfully hashes passwords with bcrypt", async () => {
            const plainPassword = "SuperStrongP@ssw0rd99!";
            const res = await registerUser.execute({
                fullName: "Alice Smith",
                email: "alice@example.com",
                password: plainPassword,
            });

            // Locate stored user in mock database
            const stored = mockRepo.users.find((u) => u.email === "alice@example.com");
            assert.ok(stored);
            assert.notStrictEqual(stored.passwordHash, plainPassword);
            assert.ok(stored.passwordHash.startsWith("$2"));

            const isMatch = await passwordService.verify(plainPassword, stored.passwordHash);
            assert.strictEqual(isMatch, true);
        });
    });

    describe("Subtask 4: Duplicate Account Prevention", () => {
        it("rejects registration when email is already registered by an active account (409 Conflict)", async () => {
            await registerUser.execute({
                fullName: "Existing User",
                email: "existing@example.com",
                password: "SecureP@ss123!",
            });

            await assert.rejects(
                () => registerUser.execute({
                    fullName: "Duplicate User",
                    email: "EXISTING@example.com",
                    password: "AnotherP@ss123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });

        it("rejects registration when email is in use by a soft-deleted record (TiDB unique constraint safety)", async () => {
            // Seed a soft-deleted user
            mockRepo.users.push({
                id: "deleted-user-1",
                fullname: "Archived User",
                email: "archived@example.com",
                phone: null,
                passwordHash: "hash",
                role: UserRole.CUSTOMER,
                recordStatus: RecordStatus.DELETED,
                deletedAt: new Date(),
            });

            await assert.rejects(
                () => registerUser.execute({
                    fullName: "New Account",
                    email: "archived@example.com",
                    password: "SecureP@ss123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });

        it("rejects registration when phone is already registered by an active account (409 Conflict)", async () => {
            await registerUser.execute({
                fullName: "First Phone User",
                phone: "+1-555-999-8888",
                password: "SecureP@ss123!",
            });

            await assert.rejects(
                () => registerUser.execute({
                    fullName: "Second Phone User",
                    phone: "+1-555-999-8888",
                    password: "SecureP@ss123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.phone);
                    return true;
                }
            );
        });

        it("handles concurrent uniqueness conflict safely (Prisma P2002 error simulation)", async () => {
            // Simulate a race condition where pre-check passes, but DB throws P2002
            const raceRepo = {
                ...mockRepo,
                async create() {
                    const p2002 = new Error("Unique constraint failed on the fields: (`email`)");
                    p2002.code = "P2002";
                    p2002.meta = { target: ["email"] };
                    throw p2002;
                },
            };

            const raceRegister = new RegisterUser({
                userRepository: raceRepo,
                passwordService,
            });

            await assert.rejects(
                () => raceRegister.execute({
                    fullName: "Race User",
                    email: "race@example.com",
                    password: "SecureP@ss123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });
    });

    describe("Privilege Escalation Prevention", () => {
        it("strictly enforces default CUSTOMER role even if client requests DENTIST", async () => {
            const res = await registerUser.execute({
                fullName: "Hacker Dentist",
                email: "hacker@example.com",
                password: "SecureP@ss123!",
                role: "DENTIST",
            });

            assert.strictEqual(res.user.role, UserRole.CUSTOMER);
            const stored = mockRepo.users.find((u) => u.email === "hacker@example.com");
            assert.strictEqual(stored.role, UserRole.CUSTOMER);
        });

        it("strictly enforces default CUSTOMER role if client requests RECEPTIONIST or ADMIN", async () => {
            const res = await registerUser.execute({
                fullName: "Hacker Admin",
                email: "admin-hacker@example.com",
                password: "SecureP@ss123!",
                role: "ADMINISTRATOR",
            });

            assert.strictEqual(res.user.role, UserRole.CUSTOMER);
        });
    });

    describe("Database Errors", () => {
        it("bubbles up unexpected database errors without misclassification", async () => {
            const failingRepo = {
                ...mockRepo,
                async create() {
                    const dbErr = new Error("Connection lost to database");
                    dbErr.code = "ECONNRESET";
                    throw dbErr;
                },
            };

            const failingRegister = new RegisterUser({
                userRepository: failingRepo,
                passwordService,
            });

            await assert.rejects(
                () => failingRegister.execute({
                    fullName: "Fail User",
                    email: "fail@example.com",
                    password: "SecureP@ss123!",
                }),
                (err) => {
                    assert.strictEqual(err.code, "ECONNRESET");
                    return true;
                }
            );
        });
    });

    describe("Security and Data Sanitization", () => {
        it("never exposes password or passwordHash in response", async () => {
            const res = await registerUser.execute({
                fullName: "Safe User",
                email: "safe@example.com",
                password: "SecureP@ss123!",
            });

            assert.strictEqual("password" in res.user, false);
            assert.strictEqual("passwordHash" in res.user, false);
            assert.strictEqual(JSON.stringify(res).includes("passwordHash"), false);
        });
    });
});

describe("Express API HTTP Integration Tests", () => {
    let server;
    let baseUrl;
    let originalRegisterUser;

    before(async () => {
        originalRegisterUser = container.registerUser;
        await new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                baseUrl = `http://127.0.0.1:${address.port}`;
                resolve();
            });
        });
    });

    beforeEach(() => {
        const mockRepo = createMockUserRepository();
        container.registerUser = new RegisterUser({
            userRepository: mockRepo,
            passwordService,
        });
    });

    after(async () => {
        if (originalRegisterUser) {
            container.registerUser = originalRegisterUser;
        }
        if (server && server.listening) {
            server.closeAllConnections?.();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it("POST /api/auth/register returns 201 Created on valid registration", async () => {
        const payload = {
            fullName: "API Dental Patient",
            email: "api.patient@example.com",
            phone: "+1-555-019-2834",
            password: "SecureP@ssword123!",
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        assert.ok(json.data.user);
        assert.strictEqual(json.data.user.fullName, "API Dental Patient");
        assert.strictEqual(json.data.user.email, "api.patient@example.com");
        assert.strictEqual(json.data.user.role, "CUSTOMER");
        assert.strictEqual("passwordHash" in json.data.user, false);
        assert.strictEqual("password" in json.data.user, false);
        assert.ok(res.headers.get("x-request-id"), "Response should include X-Request-ID header");
    });

    it("POST /api/v1/auth/register returns 201 Created on valid registration (supporting existing API prefix)", async () => {
        const payload = {
            fullName: "V1 API Patient",
            email: "v1.patient@example.com",
            password: "SecureP@ssword123!",
        };

        const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.success, true);
        assert.strictEqual(json.data.user.email, "v1.patient@example.com");
    });

    it("POST /api/auth/register returns 400 Bad Request on invalid input", async () => {
        const payload = {
            fullName: "",
            email: "invalid-email",
            password: "weak",
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        assert.strictEqual(res.status, 400);
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "VALIDATION_ERROR");
        assert.ok(json.error.fields.fullName);
        assert.ok(json.error.fields.email);
        assert.ok(json.error.fields.password);
    });

    it("POST /api/auth/register returns 409 Conflict when account already exists", async () => {
        const payload = {
            fullName: "Original User",
            email: "dupe@example.com",
            password: "SecureP@ssword123!",
        };

        const firstRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        assert.strictEqual(firstRes.status, 201);

        const dupeRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await dupeRes.json();
        assert.strictEqual(dupeRes.status, 409);
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "DUPLICATE_ACCOUNT");
        assert.ok(json.error.fields.email);
    });

    it("POST /api/auth/register ignores client-supplied role to prevent privilege escalation", async () => {
        const payload = {
            fullName: "Sneaky User",
            email: "sneaky@example.com",
            password: "SecureP@ssword123!",
            role: "DENTIST",
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(json.data.user.role, "CUSTOMER");
    });
});

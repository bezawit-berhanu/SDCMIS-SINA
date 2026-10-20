const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const express = require("express");

// Mock prisma before requiring container/app to prevent remote TiDB connection in tests
const mockPrisma = {
    user: {
        findFirst: async () => null,
        create: async (args) => ({ id: "mock-id", ...args.data }),
        update: async (args) => ({ id: args.where.id, ...args.data }),
    },
    $disconnect: async () => {},
};
require.cache[require.resolve("./src/Infrastructure/prisma")] = {
    id: require.resolve("./src/Infrastructure/prisma"),
    filename: require.resolve("./src/Infrastructure/prisma"),
    loaded: true,
    exports: mockPrisma,
};

const passwordService = require("./src/Infrastructure/authentication/password.service");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const UpdateUserName = require("./src/application/settings/UpdateUserName");
const UpdateUserContact = require("./src/application/settings/UpdateUserContact");
const ChangeUserPassword = require("./src/application/settings/ChangeUserPassword");
const UpdateUserProfile = require("./src/application/settings/UpdateUserProfile");
const GetCurrentUser = require("./src/application/auth/GetCurrentUser");
const { UserRole, RecordStatus, ThemePreference } = require("./src/domain/enums/enum");

const authenticate = require("./src/Presentation/middleware/auth");
const errorHandler = require("./src/Presentation/middleware/errorHandler");
const container = require("./src/container/container");
const userRoutes = require("./src/Presentation/routes/user.routes");

describe("Scrum 7 — Personal Settings (Unit & Integration Tests)", () => {
    let mockUsersDb = {};
    let mockRepo;
    let updateUserNameUC;
    let updateUserContactUC;
    let changeUserPasswordUC;
    let updateUserProfileUC;

    beforeEach(async () => {
        const hashedOldPassword = await passwordService.hash("OldP@ssw0rd123");
        const hashedOtherPassword = await passwordService.hash("OtherP@ssw0rd123");

        mockUsersDb = {
            "user-1": {
                id: "user-1",
                fullname: "Dr. Alice Smith",
                email: "alice@example.com",
                phone: "+251911223344",
                passwordHash: hashedOldPassword,
                role: UserRole.DENTIST,
                themePreference: ThemePreference.LIGHT,
                recordStatus: RecordStatus.ACTIVE,
                deletedAt: null,
            },
            "user-2": {
                id: "user-2",
                fullname: "Bob Receptionist",
                email: "bob@example.com",
                phone: "+251922334455",
                passwordHash: hashedOtherPassword,
                role: UserRole.RECEPTIONIST,
                themePreference: ThemePreference.LIGHT,
                recordStatus: RecordStatus.ACTIVE,
                deletedAt: null,
            },
        };

        mockRepo = {
            async findActiveById(id) {
                const u = mockUsersDb[id];
                if (u && u.recordStatus === RecordStatus.ACTIVE && !u.deletedAt) {
                    return { ...u };
                }
                return null;
            },
            async findAnyByEmailExcludingUser(email, excludeUserId) {
                const normalized = email.trim().toLowerCase();
                const found = Object.values(mockUsersDb).find(
                    (u) => u.email && u.email.toLowerCase() === normalized && u.id !== excludeUserId
                );
                return found ? { ...found } : null;
            },
            async findAnyByPhoneExcludingUser(phone, excludeUserId) {
                const normalized = phone.trim();
                const found = Object.values(mockUsersDb).find(
                    (u) => u.phone && u.phone.trim() === normalized && u.id !== excludeUserId
                );
                return found ? { ...found } : null;
            },
            async update(id, updateData) {
                const existing = mockUsersDb[id];
                if (!existing) return null;
                const updated = { ...existing };
                if (updateData.fullname !== undefined) updated.fullname = updateData.fullname;
                if (updateData.email !== undefined) updated.email = updateData.email;
                if (updateData.phone !== undefined) updated.phone = updateData.phone;
                if (updateData.passwordHash !== undefined) updated.passwordHash = updateData.passwordHash;
                if (updateData.themePreference !== undefined) updated.themePreference = updateData.themePreference;
                mockUsersDb[id] = updated;
                return { ...updated };
            },
        };

        updateUserNameUC = new UpdateUserName({ userRepository: mockRepo });
        updateUserContactUC = new UpdateUserContact({ userRepository: mockRepo });
        changeUserPasswordUC = new ChangeUserPassword({
            userRepository: mockRepo,
            passwordService,
        });
        updateUserProfileUC = new UpdateUserProfile({ userRepository: mockRepo });
    });

    describe("1. Update Name Use Case", () => {
        it("successfully updates the user's name", async () => {
            const result = await updateUserNameUC.execute({
                userId: "user-1",
                fullName: "Dr. Alice Abera",
            });

            assert.strictEqual(result.user.fullName, "Dr. Alice Abera");
            assert.strictEqual(mockUsersDb["user-1"].fullname, "Dr. Alice Abera");
        });

        it("fails when full name is empty or whitespace", async () => {
            await assert.rejects(
                async () => {
                    await updateUserNameUC.execute({
                        userId: "user-1",
                        fullName: "   ",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.fullName);
                    return true;
                }
            );
        });

        it("fails when full name exceeds 120 characters", async () => {
            const longName = "A".repeat(121);
            await assert.rejects(
                async () => {
                    await updateUserNameUC.execute({
                        userId: "user-1",
                        fullName: longName,
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.fullName);
                    return true;
                }
            );
        });

        it("fails with 401 when userId is missing", async () => {
            await assert.rejects(
                async () => {
                    await updateUserNameUC.execute({
                        fullName: "Valid Name",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 401);
                    return true;
                }
            );
        });
    });

    describe("2. Update Contact Use Case", () => {
        it("successfully updates email and phone", async () => {
            const result = await updateUserContactUC.execute({
                userId: "user-1",
                email: "alice.new@example.com",
                phone: "+251911998877",
            });

            assert.strictEqual(result.user.email, "alice.new@example.com");
            assert.strictEqual(result.user.phone, "+251911998877");
            assert.strictEqual(mockUsersDb["user-1"].email, "alice.new@example.com");
            assert.strictEqual(mockUsersDb["user-1"].phone, "+251911998877");
        });

        it("successfully clears phone when valid email is maintained", async () => {
            const result = await updateUserContactUC.execute({
                userId: "user-1",
                email: "alice@example.com",
                phone: "",
            });

            assert.strictEqual(result.user.email, "alice@example.com");
            assert.strictEqual(result.user.phone, null);
        });

        it("fails when both email and phone are removed", async () => {
            await assert.rejects(
                async () => {
                    await updateUserContactUC.execute({
                        userId: "user-1",
                        email: "",
                        phone: "",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.contact);
                    return true;
                }
            );
        });

        it("fails when email has an invalid format", async () => {
            await assert.rejects(
                async () => {
                    await updateUserContactUC.execute({
                        userId: "user-1",
                        email: "not-an-email",
                        phone: "+251911223344",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });

        it("fails when phone has an invalid format", async () => {
            await assert.rejects(
                async () => {
                    await updateUserContactUC.execute({
                        userId: "user-1",
                        email: "alice@example.com",
                        phone: "123", // too short
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.phone);
                    return true;
                }
            );
        });

        it("rejects duplicate email with 409 conflict when owned by another user", async () => {
            await assert.rejects(
                async () => {
                    await updateUserContactUC.execute({
                        userId: "user-1",
                        email: "bob@example.com", // owned by user-2
                        phone: "+251911223344",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.email);
                    return true;
                }
            );
        });

        it("rejects duplicate phone with 409 conflict when owned by another user", async () => {
            await assert.rejects(
                async () => {
                    await updateUserContactUC.execute({
                        userId: "user-1",
                        email: "alice@example.com",
                        phone: "+251922334455", // owned by user-2
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.strictEqual(err.code, "DUPLICATE_ACCOUNT");
                    assert.ok(err.fields.phone);
                    return true;
                }
            );
        });

        it("allows user to keep their own current email and phone without duplicate conflict", async () => {
            const result = await updateUserContactUC.execute({
                userId: "user-1",
                email: "alice@example.com",
                phone: "+251911223344",
            });

            assert.strictEqual(result.user.email, "alice@example.com");
            assert.strictEqual(result.user.phone, "+251911223344");
        });
    });

    describe("3. Change Password Use Case", () => {
        it("successfully changes password when current password is valid and new password meets policy", async () => {
            const result = await changeUserPasswordUC.execute({
                userId: "user-1",
                currentPassword: "OldP@ssw0rd123",
                newPassword: "NewSecur3P@ssword!",
            });

            assert.strictEqual(result.success, true);
            // Verify new password verifies against stored hash
            const isValid = await passwordService.verify("NewSecur3P@ssword!", mockUsersDb["user-1"].passwordHash);
            assert.strictEqual(isValid, true);
        });

        it("fails when current password is incorrect", async () => {
            await assert.rejects(
                async () => {
                    await changeUserPasswordUC.execute({
                        userId: "user-1",
                        currentPassword: "WrongPassword!1",
                        newPassword: "NewSecur3P@ssword!",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "INVALID_CURRENT_PASSWORD");
                    assert.ok(err.fields.currentPassword);
                    return true;
                }
            );
        });

        it("fails when new password does not meet complexity requirements", async () => {
            await assert.rejects(
                async () => {
                    await changeUserPasswordUC.execute({
                        userId: "user-1",
                        currentPassword: "OldP@ssw0rd123",
                        newPassword: "weak",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.newPassword);
                    return true;
                }
            );
        });

        it("fails when new password is identical to current password", async () => {
            await assert.rejects(
                async () => {
                    await changeUserPasswordUC.execute({
                        userId: "user-1",
                        currentPassword: "OldP@ssw0rd123",
                        newPassword: "OldP@ssw0rd123",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "PASSWORD_REUSED");
                    assert.ok(err.fields.newPassword);
                    return true;
                }
            );
        });
    });

    describe("4. Update Profile Information Use Case", () => {
        it("updates profile fields and theme preference", async () => {
            const result = await updateUserProfileUC.execute({
                userId: "user-1",
                fullName: "Dr. Alice Profile",
                email: "alice.profile@example.com",
                phone: "+251911000111",
                themePreference: ThemePreference.DARK,
            });

            assert.strictEqual(result.user.fullName, "Dr. Alice Profile");
            assert.strictEqual(result.user.email, "alice.profile@example.com");
            assert.strictEqual(result.user.phone, "+251911000111");
            assert.strictEqual(result.user.themePreference, ThemePreference.DARK);
            assert.strictEqual(mockUsersDb["user-1"].themePreference, ThemePreference.DARK);
        });

        it("rejects invalid theme preference", async () => {
            await assert.rejects(
                async () => {
                    await updateUserProfileUC.execute({
                        userId: "user-1",
                        themePreference: "BLUE",
                    });
                },
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.themePreference);
                    return true;
                }
            );
        });
    });

    describe("5. End-to-End HTTP Route Tests", () => {
        let server;
        let baseUrl;
        let token;

        before(async () => {
            container.userRepository = mockRepo;
            container.getCurrentUser = new GetCurrentUser({ userRepository: mockRepo });
            container.updateUserName = updateUserNameUC;
            container.updateUserContact = updateUserContactUC;
            container.changeUserPassword = changeUserPasswordUC;
            container.updateUserProfile = updateUserProfileUC;

            token = tokenService.signAccessToken(mockUsersDb["user-1"]);

            const app = express();
            app.use(express.json());
            app.use("/api/v1/users", userRoutes);
            app.use(errorHandler);

            await new Promise((resolve) => {
                server = app.listen(0, "127.0.0.1", () => {
                    const address = server.address();
                    baseUrl = `http://127.0.0.1:${address.port}`;
                    resolve();
                });
            });
        });

        after(async () => {
            if (server) {
                await new Promise((resolve) => server.close(resolve));
            }
        });

        async function request(path, options = {}) {
            const url = new URL(path, baseUrl);
            return new Promise((resolve, reject) => {
                const req = http.request(
                    url,
                    {
                        method: options.method || "GET",
                        headers: {
                            "Content-Type": "application/json",
                            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
                            ...options.headers,
                        },
                    },
                    (res) => {
                        let data = "";
                        res.on("data", (chunk) => (data += chunk));
                        res.on("end", () => {
                            let parsed;
                            try {
                                parsed = JSON.parse(data);
                            } catch {
                                parsed = data;
                            }
                            resolve({ status: res.statusCode, body: parsed });
                        });
                    }
                );
                req.on("error", reject);
                if (options.body) {
                    req.write(JSON.stringify(options.body));
                }
                req.end();
            });
        }

        it("GET /api/v1/users/profile returns authenticated user profile", async () => {
            const res = await request("/api/v1/users/profile", { token });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.data.user.id, "user-1");
            assert.strictEqual(res.body.data.user.email, "alice@example.com");
        });

        it("PATCH /api/v1/users/name updates full name", async () => {
            const res = await request("/api/v1/users/name", {
                method: "PATCH",
                token,
                body: { fullName: "Dr. Alice HTTP" },
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.user.fullName, "Dr. Alice HTTP");
        });

        it("PATCH /api/v1/users/contact updates contact info", async () => {
            const res = await request("/api/v1/users/contact", {
                method: "PATCH",
                token,
                body: { email: "alice.http@example.com", phone: "+251911888999" },
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.user.email, "alice.http@example.com");
            assert.strictEqual(res.body.data.user.phone, "+251911888999");
        });

        it("POST /api/v1/users/change-password changes password", async () => {
            const res = await request("/api/v1/users/change-password", {
                method: "POST",
                token,
                body: {
                    currentPassword: "OldP@ssw0rd123",
                    newPassword: "BrandN3wPassword!",
                },
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.success, true);
        });

        it("PATCH /api/v1/users/profile updates profile and theme", async () => {
            const res = await request("/api/v1/users/profile", {
                method: "PATCH",
                token,
                body: {
                    fullName: "Dr. Alice Complete",
                    themePreference: ThemePreference.DARK,
                },
            });
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.data.user.fullName, "Dr. Alice Complete");
            assert.strictEqual(res.body.data.user.themePreference, ThemePreference.DARK);
        });

        it("returns 401 when request lacks authorization token", async () => {
            const res = await request("/api/v1/users/profile");
            assert.strictEqual(res.status, 401);
        });
    });
});

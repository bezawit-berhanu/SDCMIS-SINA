
/*
 * TEMPORARY MANUAL TEST
 *
 * Run from the backend directory:
 * node test-user-entity.js
 *
 * This tests domain validation without connecting to TiDB.
 * The password hash below is fake and is NOT a usable bcrypt hash.
 * It is only a non-empty string for testing the entity's validation.
 */

const User = require("./src/domain/entities/user");
const UserRole = require("./src/domain/enums/enum");

const testUser = new User({
    id: "test-user-id",
    fullName: "Test Dentist",
    email: "dentist@example.com",
    passwordHash: "fake-hash-for-domain-test",
    role: UserRole.DENTIST,
});

console.log("Role:", testUser.role);
console.log("Active:", testUser.isActive);
console.log("Safe output:", testUser.toSafeObject());

/*
 * This assertion confirms the safe output doesn't expose
 * the password hash.
 */
if ("passwordHash" in testUser.toSafeObject()) {
    throw new Error("Security test failed: password hash was exposed.");
}

console.log("User entity test passed.");

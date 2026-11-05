const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const env = require("./src/config/env");

async function runTests() {
    console.log("=== JWT TokenService Unit Test Suite (SRS 8.6.2 / NFR-SEC-01) ===");

    const mockUser = {
        id: "usr-dentist-77",
        role: "DENTIST",
        fullName: "Dr. Aster",
    };

    // Test 1: Generate & Sign Access Token with correct claims
    {
        const token = tokenService.signAccessToken(mockUser);
        assert.ok(typeof token === "string", "Token should be a string");
        assert.ok(token.split(".").length === 3, "Token should be a valid 3-part JWT");

        const decoded = tokenService.decodeToken(token);
        assert.strictEqual(decoded.payload.sub, mockUser.id, "Subject must be user.id");
        assert.strictEqual(decoded.payload.role, mockUser.role, "Role claim must match");
        assert.strictEqual(decoded.payload.iss, "sdcmis-sina-api", "Issuer must be sdcmis-sina-api");
        assert.strictEqual(decoded.payload.aud, "sdcmis-sina_client", "Audience must be sdcmis-sina_client");
        console.log("✓ Test 1: Sign token with claims passed");
    }

    // Test 2: Verify valid token
    {
        const token = tokenService.signAccessToken(mockUser);
        const payload = tokenService.verifyAccessToken(token);
        assert.strictEqual(payload.sub, mockUser.id);
        assert.strictEqual(payload.role, mockUser.role);
        console.log("✓ Test 2: Verify valid token passed");
    }

    // Test 3: Reject expired token with ERR-SESSION-EXPIRED
    {
        const expiredToken = jwt.sign(
            { role: mockUser.role },
            env.JWT_ACCESS_SECRET,
            {
                subject: mockUser.id,
                expiresIn: -1, // Expired 1 second ago
                issuer: "sdcmis-sina-api",
                audience: "sdcmis-sina_client",
                algorithm: "HS256",
            }
        );

        assert.throws(
            () => tokenService.verifyAccessToken(expiredToken),
            (err) => {
                assert.strictEqual(err.statusCode, 401);
                assert.strictEqual(err.code, "ERR-SESSION-EXPIRED");
                return true;
            },
            "Expired token must throw with ERR-SESSION-EXPIRED"
        );
        console.log("✓ Test 3: Expired token throws ERR-SESSION-EXPIRED passed");
    }

    // Test 4: Reject tampered / invalid token
    {
        assert.throws(
            () => tokenService.verifyAccessToken("invalid.tampered.token"),
            (err) => {
                assert.strictEqual(err.statusCode, 401);
                assert.strictEqual(err.code, "INVALID_TOKEN");
                return true;
            },
            "Tampered token must throw INVALID_TOKEN"
        );

        assert.throws(
            () => tokenService.verifyAccessToken(null),
            (err) => {
                assert.strictEqual(err.statusCode, 401);
                return true;
            },
            "Null token must throw 401"
        );
        console.log("✓ Test 4: Tampered/null token throws INVALID_TOKEN passed");
    }

    // Test 5: extractBearerToken helper
    {
        const validHeader = "Bearer eyJhbGciOi...";
        assert.strictEqual(tokenService.extractBearerToken(validHeader), "eyJhbGciOi...");

        const lowerCaseHeader = "bearer my-jwt-token";
        assert.strictEqual(tokenService.extractBearerToken(lowerCaseHeader), "my-jwt-token");

        assert.strictEqual(tokenService.extractBearerToken("Basic 12345"), null);
        assert.strictEqual(tokenService.extractBearerToken(""), null);
        assert.strictEqual(tokenService.extractBearerToken(null), null);
        console.log("✓ Test 5: extractBearerToken case-insensitive parsing passed");
    }

    console.log("ALL 5 JWT TokenService unit tests passed successfully!");
}

runTests().catch((err) => {
    console.error("JWT test failure:", err);
    process.exit(1);
});

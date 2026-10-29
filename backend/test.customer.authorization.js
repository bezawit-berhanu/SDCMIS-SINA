const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const container = require("./src/container/container");
const { UserRole, RecordStatus } = require("./src/domain/enums/enum");

function request(server, { method, path, body = null, token = null }) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const req = http.request(
            {
                hostname: "127.0.0.1",
                port: address.port,
                path,
                method,
                headers,
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    let json = null;
                    try {
                        json = JSON.parse(data);
                    } catch (_) {}
                    resolve({ status: res.statusCode, body: json, text: data });
                });
            }
        );
        req.on("error", reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

test("Task 3: Data Authorization — Customer A -> GET /api/patients/B -> 403 Forbidden", async (t) => {
    let server;
    let customerAToken;
    let customerBToken;
    let dentistToken;

    t.before(async () => {
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

        // Create Patient A and Patient B in repository
        const patA = await container.patientRepository.create({
            id: "pat-A-100",
            full_name: "Customer Alice",
            age: 28,
            contact_info: "alice@example.com",
            service_type: "Routine Checkup",
            remaining_fee: 50.0,
            createdByUserId: "usr-receptionist-01",
        });

        const patB = await container.patientRepository.create({
            id: "pat-B-200",
            full_name: "Customer Bob",
            age: 35,
            contact_info: "bob@example.com",
            service_type: "Teeth Whitening",
            remaining_fee: 120.0,
            createdByUserId: "usr-receptionist-01",
        });

        // Seed users in mock/user repository for token resolution
        const userA = {
            id: "usr-cust-A",
            fullName: "Customer Alice",
            email: "alice@example.com",
            role: UserRole.CUSTOMER,
            linkedPatientId: "pat-A-100",
            recordStatus: RecordStatus.ACTIVE,
        };

        const userB = {
            id: "usr-cust-B",
            fullName: "Customer Bob",
            email: "bob@example.com",
            role: UserRole.CUSTOMER,
            linkedPatientId: "pat-B-200",
            recordStatus: RecordStatus.ACTIVE,
        };

        const dentistUser = {
            id: "usr-dentist-01",
            fullName: "Dr. Sara",
            email: "drsara@example.com",
            role: UserRole.DENTIST,
            recordStatus: RecordStatus.ACTIVE,
        };

        // Inject users into userRepository cache if present
        if (container.userRepository?.users) {
            container.userRepository.users.push(userA, userB, dentistUser);
        } else if (container.userRepository?.create) {
            try {
                await container.userRepository.create(userA);
                await container.userRepository.create(userB);
                await container.userRepository.create(dentistUser);
            } catch (_) {}
        }

        // Generate JWT access tokens
        customerAToken = tokenService.generateAccessToken(userA);
        customerBToken = tokenService.generateAccessToken(userB);
        dentistToken = tokenService.generateAccessToken(dentistUser);
    });

    t.after(() => {
        return new Promise((resolve) => {
            server.close(() => {
                resolve();
                setTimeout(() => process.exit(0), 100);
            });
        });
    });

    await t.test("Customer A accessing Customer A's own patient record receives 200 OK", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/patients/pat-A-100",
            token: customerAToken,
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        const patientName = res.body.data?.patient?.name || res.body.data?.name || "";
        assert.ok(patientName.includes("Alice"));
    });

    await t.test("Customer A -> GET /api/patients/B -> ❌ 403 Forbidden", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/patients/pat-B-200",
            token: customerAToken,
        });

        assert.equal(res.status, 403, "Customer A accessing Patient B must return 403 Forbidden");
        assert.equal(res.body.success, false);
        assert.equal(res.body.code, "FORBIDDEN");
        assert.ok(res.body.message.includes("permission"));
    });

    await t.test("Customer A -> GET /api/patients/B/procedures -> ❌ 403 Forbidden", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/patients/pat-B-200/procedures",
            token: customerAToken,
        });

        assert.equal(res.status, 403);
        assert.equal(res.body.success, false);
        assert.equal(res.body.code, "FORBIDDEN");
    });

    await t.test("Customer A -> GET /api/patients/B/payments -> ❌ 403 Forbidden", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/patients/pat-B-200/payments",
            token: customerAToken,
        });

        assert.equal(res.status, 403);
        assert.equal(res.body.success, false);
        assert.equal(res.body.code, "FORBIDDEN");
    });

    await t.test("Customer A cannot create new clinical patients (POST /api/patients -> 403)", async () => {
        const res = await request(server, {
            method: "POST",
            path: "/api/patients",
            token: customerAToken,
            body: { name: "Malicious Patient Creation", age: 30 },
        });

        assert.equal(res.status, 403);
        assert.equal(res.body.code, "FORBIDDEN");
    });

    await t.test("Dentist accessing Patient B receives 200 OK (staff authorized)", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/patients/pat-B-200",
            token: dentistToken,
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });
});

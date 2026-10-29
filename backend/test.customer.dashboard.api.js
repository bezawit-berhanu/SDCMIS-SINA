const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const container = require("./src/container/container");
const { UserRole, RecordStatus, ProcedureStatus, AppointmentStatus } = require("./src/domain/enums/enum");

function request(server, { method, path, token = null }) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

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
                    resolve({ status: res.statusCode, body: json });
                });
            }
        );
        req.on("error", reject);
        req.end();
    });
}

test("Task 1: Customer Dashboard API Verification Suite", async (t) => {
    let server;
    let customerAliceToken;
    let customerBobToken;

    t.before(async () => {
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

        // Create Alice patient record with complete hierarchy
        const alicePatient = await container.patientRepository.create({
            id: "pat-alice-777",
            full_name: "Alice Dashboard Test",
            age: 29,
            contact_info: "alice.dash@example.com",
            service_type: "Orthodontics",
            remaining_fee: 150.0,
            createdByUserId: "usr-receptionist-01",
        });

        // Add procedures (one NEXT, one ONGOING, one DONE)
        const mockProcedures = [
            { id: "proc-1", description: "Initial Orthodontic Consultation", status: ProcedureStatus.DONE, fee: 80.0 },
            { id: "proc-2", description: "Archwire Replacement (Ongoing)", status: ProcedureStatus.ONGOING, fee: 120.0 },
            { id: "proc-3", description: "Bracket Tightening & Elastic bands", status: ProcedureStatus.NEXT, fee: 150.0 },
        ];

        // Add appointments
        const mockAppointments = [
            { id: "app-1", scheduledDate: new Date("2026-11-10T10:00:00Z"), status: AppointmentStatus.UPCOMING },
            { id: "app-2", scheduledDate: new Date("2026-10-01T09:00:00Z"), status: AppointmentStatus.ATTENDED },
        ];

        // Add payments
        const mockPayments = [
            { id: "pay-1", amount: 80.0, paymentDate: new Date("2026-10-01"), status: "VERIFIED" },
        ];

        alicePatient.procedures = mockProcedures;
        alicePatient.appointments = mockAppointments;
        alicePatient.payments = mockPayments;

        const rawAlice = container.patientRepository.patients.find((p) => p.id === "pat-alice-777");
        if (rawAlice) {
            rawAlice.procedures = mockProcedures;
            rawAlice.appointments = mockAppointments;
            rawAlice.payments = mockPayments;
        }

        const userAlice = {
            id: "usr-alice-777",
            fullName: "Alice Dashboard Test",
            email: "alice.dash@example.com",
            role: UserRole.CUSTOMER,
            linkedPatientId: "pat-alice-777",
            recordStatus: RecordStatus.ACTIVE,
        };

        const userBob = {
            id: "usr-bob-888",
            fullName: "Bob Other Customer",
            email: "bob.other@example.com",
            role: UserRole.CUSTOMER,
            linkedPatientId: "pat-bob-888",
            recordStatus: RecordStatus.ACTIVE,
        };

        container.userRepository.seedUser(userAlice);
        container.userRepository.seedUser(userBob);

        customerAliceToken = tokenService.signAccessToken(userAlice);
        customerBobToken = tokenService.signAccessToken(userBob);
    });

    t.after(() => {
        return new Promise((resolve) => {
            server.close(() => {
                resolve();
                setTimeout(() => process.exit(0), 100);
            });
        });
    });

    await t.test("GET /api/v1/customers/me returns only the authenticated customer's information", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/v1/customers/me",
            token: customerAliceToken,
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        const data = res.body.data;

        // 1. My Information
        assert.ok(data.myInformation);
        assert.equal(data.myInformation.patientId, "pat-alice-777");
        assert.equal(data.myInformation.name, "Alice Dashboard Test");
        assert.equal(data.myInformation.contact, "alice.dash@example.com");

        // 2. Treatment
        assert.ok(data.treatment);
        assert.equal(data.treatment.allProceduresCount, 3);
        assert.equal(data.treatment.completedCount, 1);
        assert.equal(data.treatment.ongoingProcedure?.description, "Archwire Replacement (Ongoing)");

        // 3. Next Procedure
        assert.ok(data.nextProcedure);
        assert.equal(data.nextProcedure.status, "NEXT");
        assert.equal(data.nextProcedure.description, "Bracket Tightening & Elastic bands");

        // 4. Appointment
        assert.ok(data.appointment);
        assert.equal(data.appointment.upcoming.length, 1);
        assert.equal(data.appointment.attended.length, 1);

        // 5. Balance
        assert.ok(data.balance);
        assert.equal(data.balance.remainingFee, 150.0);
        assert.equal(data.balance.totalPaid, 80.0);
        assert.equal(data.balance.payments.length, 1);
    });

    await t.test("GET /api/v1/patients/me alias also returns authenticated customer data", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/v1/patients/me",
            token: customerAliceToken,
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.myInformation.patientId, "pat-alice-777");
    });
});

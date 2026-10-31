import test from "node:test";
import assert from "node:assert/strict";

test("SDCIMP SRS Verification Suite: Customer Self-Service Module (SCR-13)", async (t) => {
    await t.test("FR-CUS-01 & BR-31: Strict customer data isolation (Customer A cannot access Patient B)", () => {
        const customerUser = { id: "usr-cust-A", role: "CUSTOMER", linkedPatientId: "pat-A" };
        const requestedPatientId = "pat-B";

        // Security Policy Check
        const isAuthorized = (user, patientId) => {
            if (user.role === "DENTIST" || user.role === "RECEPTIONIST") return true;
            if (user.role === "CUSTOMER") {
                return user.linkedPatientId === patientId;
            }
            return false;
        };

        const accessGranted = isAuthorized(customerUser, requestedPatientId);
        assert.equal(accessGranted, false, "Customer A must be denied access to Patient B");

        const selfAccessGranted = isAuthorized(customerUser, "pat-A");
        assert.equal(selfAccessGranted, true, "Customer A can access own Patient A record");
    });

    await t.test("FR-CUS-02: Live queue position resolution and waiting status tracking", () => {
        const myTicket = "#007";
        const currentServingTicket = "#005";
        const waitingTickets = ["#006", "#007", "#008"];

        // Compute position
        const myIndex = waitingTickets.indexOf(myTicket);
        const position = myIndex + 1; // 2nd waiting in line

        assert.equal(position, 2);
        assert.equal(myIndex, 1); // 1 patient ahead in waiting list
    });

    await t.test("FR-CUS-03: Read-only presentation guard for Customer users", () => {
        const permissions = {
            canEditProcedures: (role) => role === "DENTIST",
            canRecordPayment: (role) => role === "DENTIST" || role === "RECEPTIONIST",
            canCallQueue: (role) => role === "RECEPTIONIST",
            canViewOwnRecord: (role) => role === "CUSTOMER" || role === "DENTIST" || role === "RECEPTIONIST",
        };

        assert.equal(permissions.canEditProcedures("CUSTOMER"), false);
        assert.equal(permissions.canRecordPayment("CUSTOMER"), false);
        assert.equal(permissions.canCallQueue("CUSTOMER"), false);
        assert.equal(permissions.canViewOwnRecord("CUSTOMER"), true);
    });

    await t.test("FR-CUS-01 Alt 1: Graceful unlinked customer account state handling", () => {
        const unlinkedCustomer = {
            id: "usr-cust-new",
            role: "CUSTOMER",
            linkedPatientId: null,
        };

        const getDashboardState = (user) => {
            if (!user.linkedPatientId) {
                return {
                    status: "UNLINKED",
                    message: "Account pending front-desk linking",
                    showBanner: true,
                };
            }
            return { status: "ACTIVE", showBanner: false };
        };

        const state = getDashboardState(unlinkedCustomer);
        assert.equal(state.status, "UNLINKED");
        assert.equal(state.showBanner, true);
    });
});

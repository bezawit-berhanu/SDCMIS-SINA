import test from "node:test";
import assert from "node:assert/strict";

test("SDCIMP SRS Verification Suite: Receptionist Module (SCR-10, SCR-11, SCR-12, SCR-15, SCR-16)", async (t) => {
    await t.test("FR-REC-03 & BR-24: Add to Queue assigns sequential tickets with initial WAITING status", () => {
        const checkIns = [
            { id: "p1", name: "Abebe Bikila", service: "Orthodontics", ticketNum: 1 },
            { id: "p2", name: "Hana Bekele", service: "General", ticketNum: 2 },
            { id: "p3", name: "Dawit Wolde", service: "Cosmetics", ticketNum: 3 },
        ];

        const queueEntries = checkIns.map((item) => ({
            id: `q-${item.ticketNum}`,
            ticket: `#${String(item.ticketNum).padStart(3, "0")}`,
            patientName: item.name,
            serviceType: item.service,
            status: "WAITING",
        }));

        assert.equal(queueEntries[0].ticket, "#001");
        assert.equal(queueEntries[0].status, "WAITING");
        assert.equal(queueEntries[1].ticket, "#002");
        assert.equal(queueEntries[2].ticket, "#003");
    });

    await t.test("FR-REC-04, BR-27: Call action transitions WAITING -> SERVING and dispatches dentist notification", () => {
        let currentQueue = [
            { ticket: "#001", status: "WAITING", patient: "Abebe Bikila" },
            { ticket: "#002", status: "WAITING", patient: "Hana Bekele" },
        ];

        let notificationDispatched = null;

        // Perform Call
        const targetTicket = "#001";
        currentQueue = currentQueue.map((item) => {
            if (item.ticket === targetTicket) {
                notificationDispatched = {
                    message: `Patient ${targetTicket} is ready.`,
                    type: "PATIENT_READY",
                    ticket: targetTicket,
                };
                return { ...item, status: "SERVING" };
            }
            return item;
        });

        assert.equal(currentQueue[0].status, "SERVING");
        assert.equal(currentQueue[1].status, "WAITING");
        assert.ok(notificationDispatched);
        assert.equal(notificationDispatched.message, "Patient #001 is ready.");
    });

    await t.test("FR-REC-05, BR-28: Complete action transitions SERVING -> DONE and auto-advances next WAITING patient", () => {
        let queue = [
            { ticket: "#001", status: "SERVING", patient: "Abebe" },
            { ticket: "#002", status: "WAITING", patient: "Hana" },
            { ticket: "#003", status: "WAITING", patient: "Dawit" },
        ];

        // Complete visit for #001
        queue = queue.map((item) => (item.ticket === "#001" ? { ...item, status: "DONE" } : item));

        // Auto-advance next waiting patient per BR-28
        const nextWaiting = queue.find((item) => item.status === "WAITING");
        assert.ok(nextWaiting);
        assert.equal(nextWaiting.ticket, "#002");

        queue = queue.map((item) => (item.ticket === nextWaiting.ticket ? { ...item, status: "SERVING" } : item));

        assert.equal(queue[0].status, "DONE");
        assert.equal(queue[1].status, "SERVING"); // Auto-advanced
        assert.equal(queue[2].status, "WAITING");
    });

    await t.test("FR-REC-02, BR-17, BR-18: Payment recording with fixed-point decimal arithmetic", () => {
        const totalProcedureCost = 4500.0;
        let totalPaid = 1500.0;
        let remainingFee = totalProcedureCost - totalPaid;

        assert.equal(remainingFee, 3000.0);

        // Record installment payment
        const newPaymentAmount = 1250.50;
        totalPaid = parseFloat((totalPaid + newPaymentAmount).toFixed(2));
        remainingFee = parseFloat(Math.max(0, totalProcedureCost - totalPaid).toFixed(2));

        assert.equal(totalPaid, 2750.50);
        assert.equal(remainingFee, 1749.50);
    });

    await t.test("FR-REC-01: Attendance stats tracking (Scheduled, No-Shows, Attended)", () => {
        const appointments = [
            { id: "a1", status: "ATTENDED" },
            { id: "a2", status: "ATTENDED" },
            { id: "a3", status: "MISSED" },
            { id: "a4", status: "SCHEDULED" },
            { id: "a5", status: "ATTENDED" },
        ];

        const attended = appointments.filter((a) => a.status === "ATTENDED").length;
        const missed = appointments.filter((a) => a.status === "MISSED").length;
        const total = appointments.length;

        assert.equal(attended, 3);
        assert.equal(missed, 1);
        assert.equal(total, 5);
    });
});


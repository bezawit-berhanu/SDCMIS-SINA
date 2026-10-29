import { describe, it } from "node:test";
import assert from "node:assert";
import { customerService } from "./src/services/customer.service.js";
import { realtimeService } from "./src/services/realtime.service.js";

describe("Frontend Customer Dashboard & Live Queue Verification", () => {
    it("Task 2: customerService provides all 5 required hierarchy sections: My Information -> Treatment -> Next Procedure -> Appointment -> Balance", async () => {
        const dashboard = await customerService.getCustomerDashboard();

        // 1. My Information
        assert.ok(dashboard.myInformation, "My Information section must be present");
        assert.ok(dashboard.myInformation.patientId);
        assert.ok(dashboard.myInformation.name);
        assert.ok(dashboard.myInformation.contact);

        // 2. Treatment
        assert.ok(dashboard.treatment, "Treatment section must be present");
        assert.ok(Array.isArray(dashboard.treatment.procedures));

        // 3. Next Procedure
        assert.ok(dashboard.nextProcedure, "Next Procedure section must be present");
        assert.strictEqual(dashboard.nextProcedure.status, "NEXT");

        // 4. Appointment
        assert.ok(dashboard.appointment, "Appointment section must be present");
        assert.ok(Array.isArray(dashboard.appointment.upcoming));

        // 5. Balance
        assert.ok(dashboard.balance, "Balance section must be present");
        assert.ok(dashboard.balance.remainingFee !== undefined);
        assert.ok(dashboard.balance.totalPaid !== undefined);
    });

    it("Task 4: Customer Queue Position displays ticket #007, position 2, and WAITING status", async () => {
        const queuePos = await customerService.getMyQueuePosition("pat-1003");

        assert.strictEqual(queuePos.formattedQueueNumber, "#007");
        assert.strictEqual(queuePos.position, 2);
        assert.strictEqual(queuePos.status, "WAITING");
    });

    it("Task 5: Live Queue Updates — listener receives WAITING -> SERVING state transition", () => {
        let liveUpdate = null;
        const unsubscribe = customerService.subscribeLiveQueueUpdates((payload) => {
            liveUpdate = payload;
        });

        // Simulate receptionist call broadcast
        realtimeService.emit("QUEUE_STATUS_CHANGED", {
            formattedQueueNumber: "#007",
            previousStatus: "WAITING",
            newStatus: "SERVING",
            dentist: "Dr. Sara",
        });

        assert.ok(liveUpdate);
        assert.strictEqual(liveUpdate.formattedQueueNumber, "#007");
        assert.strictEqual(liveUpdate.previousStatus, "WAITING");
        assert.strictEqual(liveUpdate.newStatus, "SERVING");

        unsubscribe();
    });
});


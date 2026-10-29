import { describe, it } from "node:test";
import assert from "node:assert";
import { realtimeService } from "./src/services/realtime.service.js";

describe("Frontend Realtime Service Tests", () => {
    it("subscribes and emits events to registered listeners", () => {
        let received = null;
        const unsubscribe = realtimeService.subscribe("PATIENT_CALLED", (data) => {
            received = data;
        });

        realtimeService.emit("PATIENT_CALLED", { queueNumber: 3, formatted: "#003", message: "Patient #003 is ready." });

        assert.ok(received);
        assert.strictEqual(received.formatted, "#003");
        assert.strictEqual(received.message, "Patient #003 is ready.");

        // Test unsubscribe
        unsubscribe();
        received = null;
        realtimeService.emit("PATIENT_CALLED", { formatted: "#004" });
        assert.strictEqual(received, null);
    });

    it("manages connection state and dispatches STATUS_CHANGED", () => {
        let statusHistory = [];
        const unsubscribe = realtimeService.subscribe("STATUS_CHANGED", (payload) => {
            statusHistory.push(payload.status);
        });

        realtimeService.disconnect();
        assert.strictEqual(realtimeService.status, "DISCONNECTED");
        assert.ok(statusHistory.includes("DISCONNECTED"));

        unsubscribe();
    });
});


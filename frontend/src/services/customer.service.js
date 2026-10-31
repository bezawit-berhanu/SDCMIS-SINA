import { apiClient } from "../lib/api-client.js";
import { realtimeService } from "./realtime.service.js";
import { signalRService } from "./signalr.service.js";

/**
 * Customer Service
 * Encapsulates Customer Dashboard data retrieval and live queue real-time updates.
 */
class CustomerService {
    /**
     * Fetch authenticated customer's full dashboard profile:
     * My Information -> Treatment -> Next Procedure -> Appointment -> Balance
     */
    async getCustomerDashboard() {
        try {
            const response = await apiClient.get("/api/v1/customers/me");
            if (response && response.data) {
                return response.data;
            }
        } catch (_) {
            try {
                const alt = await apiClient.get("/api/patients/me");
                if (alt && alt.data) {
                    return alt.data;
                }
            } catch (_) {}
        }

        // Return null when unlinked or offline to display authentic empty state per SRS
        return null;
    }

    /**
     * Retrieve live queue position for patient
     */
    async getMyQueuePosition(patientId) {
        try {
            const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
            const response = await apiClient.get(`/api/v1/queue/my-position${query}`);
            if (response && response.data) {
                return response.data;
            }
        } catch (_) {}

        return {
            inQueue: false,
            status: "NONE",
            position: 0,
        };
    }

    /**
     * Subscribe to real-time queue position and status events
     * @param {Function} callback receives updated queue status (e.g. WAITING -> SERVING)
     * @returns {Function} unsubscribe function
     */
    subscribeLiveQueueUpdates(callback) {
        const unsubStatus = realtimeService.subscribe("QUEUE_STATUS_CHANGED", callback);
        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", callback);
        const unsubCompleted = realtimeService.subscribe("VISIT_COMPLETED", callback);
        const unsubSignalR = signalRService.on("QUEUE_UPDATED", callback);

        return () => {
            unsubStatus();
            unsubCall();
            unsubCompleted();
            unsubSignalR();
        };
    }
}

export const customerService = new CustomerService();
export default customerService;

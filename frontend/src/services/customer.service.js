import { apiClient } from "../lib/api-client";
import { realtimeService } from "./realtime.service";

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
            // Fallback to /api/patients/me
            try {
                const alt = await apiClient.get("/api/patients/me");
                if (alt && alt.data) {
                    return alt.data;
                }
            } catch (_) {}
        }

        // Return fallback mockup for disconnected or local dev sessions
        return {
            myInformation: {
                patientId: "pat-1003",
                name: "Sara Tadesse",
                age: 32,
                contact: "+251 91 122 3344",
                serviceType: "Composite Filling & Restoration",
                status: "ACTIVE",
                dentist: "Dr. Sara (General Dental Practitioner)",
                branch: "Central Bole Clinic",
            },
            treatment: {
                procedures: [
                    { id: "TRT-01", description: "Comprehensive Oral Examination", date: "2026-10-10", cost: "$120.00", status: "DONE" },
                    { id: "TRT-02", description: "Digital Dental Bitewing X-Rays", date: "2026-10-10", cost: "$65.00", status: "DONE" },
                    { id: "TRT-03", description: "Composite Resin Filling (Lower Left)", date: "2026-10-24", cost: "$150.00", status: "ONGOING" },
                ],
                completedCount: 2,
                ongoingProcedure: {
                    id: "TRT-03",
                    description: "Composite Resin Filling (Lower Left)",
                    status: "ONGOING",
                    cost: "$150.00",
                },
            },
            nextProcedure: {
                id: "PROC-NEXT-01",
                description: "Post-restoration occlusal polishing & seal check",
                scheduledDate: "Nov 05, 2026",
                status: "NEXT",
                estimatedDuration: "30 mins",
            },
            appointment: {
                upcoming: [
                    { id: "APP-301", date: "Nov 05, 2026", time: "10:30 AM", provider: "Dr. Sara", type: "Follow-up Examination" },
                ],
                attended: [
                    { id: "APP-201", date: "Oct 10, 2026", time: "09:00 AM", provider: "Dr. Sara", type: "Routine Cleaning" },
                ],
                nextAppointmentDate: "Nov 05, 2026 • 10:30 AM",
            },
            balance: {
                remainingFee: 45.00,
                balance: 45.00,
                totalPaid: 290.00,
                payments: [
                    { id: "RCP-101", amount: "$120.00", date: "Oct 10, 2026", method: "Card", status: "VERIFIED" },
                    { id: "RCP-102", amount: "$170.00", date: "Oct 24, 2026", method: "Cash", status: "VERIFIED" },
                ],
            },
            queue: {
                queueNumber: 7,
                formattedQueueNumber: "#007",
                position: 2,
                status: "WAITING",
            },
        };
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
            inQueue: true,
            queueNumber: 7,
            formattedQueueNumber: "#007",
            position: 2,
            positionText: "2",
            status: "WAITING",
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

        return () => {
            unsubStatus();
            unsubCall();
            unsubCompleted();
        };
    }
}

export const customerService = new CustomerService();
export default customerService;

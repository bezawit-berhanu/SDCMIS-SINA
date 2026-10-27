import apiClient from "./apiclient";

export const appointmentService = {
    async getAppointments(params = {}) {
        const response = await apiClient.get("/api/v1/appointments", { params });
        return response.data;
    },

    async getUpcomingAppointments() {
        const response = await apiClient.get("/api/v1/appointments/upcoming");
        return response.data;
    },

    async getMissedAppointments() {
        const response = await apiClient.get("/api/v1/appointments/missed");
        return response.data;
    },

    async getAppointmentById(id) {
        const response = await apiClient.get(`/api/v1/appointments/${id}`);
        return response.data;
    },

    async createAppointment(data) {
        const response = await apiClient.post("/api/v1/appointments", data);
        return response.data;
    },

    async updateAppointment(id, data) {
        const response = await apiClient.put(`/api/v1/appointments/${id}`, data);
        return response.data;
    },

    async deleteAppointment(id) {
        const response = await apiClient.delete(`/api/v1/appointments/${id}`);
        return response.data;
    },

    async cancelAppointment(id, reason = "") {
        const response = await apiClient.post(`/api/v1/appointments/${id}/cancel`, { reason });
        return response.data;
    },

    async rescheduleAppointment(id, newAppointmentDate, notes = "") {
        const response = await apiClient.post(`/api/v1/appointments/${id}/reschedule`, {
            newAppointmentDate,
            notes,
        });
        return response.data;
    },

    async syncMissedAppointments() {
        const response = await apiClient.post("/api/v1/appointments/sync-missed");
        return response.data;
    },
};

export default appointmentService;

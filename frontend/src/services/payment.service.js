import apiClient from "./apiclient";

export const paymentService = {
    async recordPayment(data) {
        const response = await apiClient.post("/api/v1/payments", data);
        return response.data;
    },

    async getPaymentHistory(patientId) {
        const response = await apiClient.get(`/api/v1/payments?patientId=${patientId}`);
        return response.data;
    },
};

export default paymentService;

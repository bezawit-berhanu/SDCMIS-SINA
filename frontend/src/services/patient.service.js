import apiClient from "./apiclient";

export const patientService = {
    async getPatients(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append("search", params.search);
        if (params.service) queryParams.append("service", params.service);
        if (params.status) queryParams.append("status", params.status);
        if (params.outstandingBalance) queryParams.append("outstandingBalance", params.outstandingBalance);
        if (params.procedureState) queryParams.append("procedureState", params.procedureState);
        if (params.branchId) queryParams.append("branchId", params.branchId);
        if (params.dentistId) queryParams.append("dentistId", params.dentistId);

        const url = `/api/v1/patients${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    async getPatientById(id) {
        const response = await apiClient.get(`/api/v1/patients/${id}`);
        return response.data;
    },

    async createPatient(data) {
        const response = await apiClient.post("/api/v1/patients", data);
        return response.data;
    },

    async updatePatient(id, data) {
        const response = await apiClient.put(`/api/v1/patients/${id}`, data);
        return response.data;
    },

    async deletePatient(id) {
        const response = await apiClient.delete(`/api/v1/patients/${id}`);
        return response.data;
    },

    async getBranchesAndDentists() {
        const response = await apiClient.get("/api/v1/branches");
        return response.data;
    },
};

export default patientService;

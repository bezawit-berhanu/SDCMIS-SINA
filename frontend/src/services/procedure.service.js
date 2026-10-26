import apiClient from "./apiclient";

export const procedureService = {
    async createNextProcedure(patientId, data) {
        const response = await apiClient.post(`/api/v1/patients/${patientId}/procedures/next`, data);
        return response.data;
    },

    async getProceduresByPatient(patientId) {
        const response = await apiClient.get(`/api/v1/patients/${patientId}/procedures`);
        return response.data;
    },

    async startOngoingProcedure(procedureId, patientId) {
        const response = await apiClient.post(`/api/v1/procedures/${procedureId}/start-ongoing`, {
            procedureId,
            patientId,
        });
        return response.data;
    },

    async completeProcedure(procedureId, completionDate, patientId) {
        const response = await apiClient.post(`/api/v1/procedures/${procedureId}/complete`, {
            procedureId,
            completionDate,
            patientId,
        });
        return response.data;
    },

    async updateProcedure(procedureId, data) {
        const response = await apiClient.put(`/api/v1/procedures/${procedureId}`, data);
        return response.data;
    },

    async deleteProcedure(procedureId) {
        const response = await apiClient.delete(`/api/v1/procedures/${procedureId}`);
        return response.data;
    },
};

export default procedureService;

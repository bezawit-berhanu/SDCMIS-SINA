const container = require("../../container/container");

const patientController = {
    async getPatients(req, res, next) {
        try {
            const query = {
                search: req.query.search || "",
                service: req.query.service || req.query.serviceType || "",
                status: req.query.status || "",
                outstandingBalance: req.query.outstandingBalance || req.query.balance || "",
                procedureState: req.query.procedureState || "",
                branchId: req.query.branchId || req.query.branchID || "",
                dentistId: req.query.dentistId || req.query.dentistid || "",
            };

            const result = await container.getPatients.execute(query);
            return res.status(200).json({
                success: true,
                data: result.patients,
                total: result.total,
                filtersApplied: result.filtersApplied,
            });
        } catch (error) {
            next(error);
        }
    },

    async getPatientById(req, res, next) {
        try {
            const patientId = req.params.id;
            const result = await container.getPatientById.execute({ patientId });
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async createPatient(req, res, next) {
        try {
            const actorUserId = req.user ? req.user.id : "system";
            const {
                name,
                fullName,
                age,
                contact,
                contactInfo,
                service,
                serviceType,
                initialProcedure,
                initialFee,
                dentistId,
                dentistid,
                branchId,
                branchID,
            } = req.body ?? {};

            const result = await container.createPatient.execute({
                name: name !== undefined ? name : fullName,
                age,
                contact: contact !== undefined ? contact : contactInfo,
                service: service !== undefined ? service : serviceType,
                initialProcedure,
                initialFee,
                dentistId: dentistId !== undefined ? dentistId : dentistid,
                branchId: branchId !== undefined ? branchId : branchID,
                createdByUserId: actorUserId,
            });

            return res.status(201).json({
                success: true,
                message: result.message,
                data: result.patient,
            });
        } catch (error) {
            next(error);
        }
    },

    async updatePatient(req, res, next) {
        try {
            const patientId = req.params.id;
            const actorUserId = req.user ? req.user.id : "system";
            const updatePayload = {
                ...req.body,
                patientId,
                actorUserId,
            };

            const result = await container.updatePatient.execute(updatePayload);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: result.patient,
            });
        } catch (error) {
            next(error);
        }
    },

    async deletePatient(req, res, next) {
        try {
            const patientId = req.params.id;
            const actorUserId = req.user ? req.user.id : "system";

            const result = await container.deletePatient.execute({
                patientId,
                actorUserId,
            });

            return res.status(200).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = patientController;

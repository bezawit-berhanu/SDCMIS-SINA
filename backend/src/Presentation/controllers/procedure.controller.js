const container = require("../../container/container");

/**
 * Procedure Controller
 * Handles HTTP requests for Procedure lifecycle and CRUD operations.
 */
class ProcedureController {
    /**
     * POST /procedures or POST /patients/:patientId/procedures/next
     * Schedules a new Next Procedure for a patient (Task 2)
     */
    async createNextProcedure(req, res, next) {
        try {
            const patientId = req.params.patientId || req.body.patientId || req.body.PatientId || req.body.patient_id;
            const payload = {
                ...req.body,
                patientId,
                createdByUserId: req.user?.id || req.body.createdByUserId || "usr-admin-01",
            };

            const result = await container.createNextProcedure.execute(payload);
            return res.status(201).json({
                success: true,
                message: "Next procedure scheduled successfully.",
                data: result,
            });
        } catch (error) {
            if (error.message.includes("Only one next procedure per patient") || error.message.includes("already")) {
                return res.status(409).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            if (error.message.includes("not exist") || error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }

    /**
     * GET /procedures?patientId=... or GET /patients/:patientId/procedures
     * Retrieves all clinical procedures for a patient (Task 2)
     */
    async getProceduresByPatient(req, res, next) {
        try {
            const patientId = req.params.patientId || req.query.patientId || req.query.PatientId;
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    error: { message: "patientId parameter is required." },
                });
            }

            const result = await container.getProceduresByPatient.execute(patientId);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }

    /**
     * PUT /procedures/:id (Task 2)
     */
    async updateProcedure(req, res, next) {
        try {
            const procedureId = req.params.id;
            const result = await container.updateProcedure.execute(procedureId, req.body);
            return res.status(200).json({
                success: true,
                message: "Procedure updated successfully.",
                data: result,
            });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            if (error.message.includes("Only one next procedure")) {
                return res.status(409).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }

    /**
     * DELETE /procedures/:id (Task 2)
     */
    async deleteProcedure(req, res, next) {
        try {
            const procedureId = req.params.id;
            const result = await container.deleteProcedure.execute(procedureId);
            return res.status(200).json({
                success: true,
                message: "Procedure deleted successfully.",
                data: result,
            });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }

    /**
     * POST /procedures/:id/start-ongoing or POST /procedures/ongoing (Task 4)
     * Transitions status from Next -> Ongoing
     */
    async startOngoingProcedure(req, res, next) {
        try {
            const procedureId = req.params.id || req.body.procedureId || req.body.ProcedureId;
            const patientId = req.params.patientId || req.body.patientId || req.body.PatientId;

            const result = await container.startOngoingProcedure.execute({
                procedureId,
                patientId,
            });

            return res.status(200).json({
                success: true,
                message: result.message,
                data: result.procedure,
            });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }

    /**
     * POST /procedures/:id/complete or POST /procedures/complete (Task 5)
     * Transitions status from Ongoing -> Done
     */
    async completeProcedure(req, res, next) {
        try {
            const procedureId = req.params.id || req.body.procedureId || req.body.ProcedureId;
            const patientId = req.params.patientId || req.body.patientId || req.body.PatientId;
            const completionDate = req.body.completionDate || req.body.CompletedDate;

            const result = await container.completeProcedure.execute({
                procedureId,
                patientId,
                completionDate,
            });

            return res.status(200).json({
                success: true,
                message: result.message,
                data: result.procedure,
            });
        } catch (error) {
            if (error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            return res.status(400).json({
                success: false,
                error: { message: error.message },
            });
        }
    }
}

module.exports = new ProcedureController();

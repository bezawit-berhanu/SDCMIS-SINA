const container = require("../../container/container");

/**
 * Payment Controller
 * Handles HTTP requests for payment recording and ledger history.
 */
class PaymentController {
    /**
     * POST /payments or POST /patients/:patientId/payments (Task 7)
     * Receptionist / Dentist Can record payment.
     * Validate: Amount > 0, Patient Exists, Payment does not exceed permitted balance
     */
    async recordPayment(req, res, next) {
        try {
            const patientId = req.params.patientId || req.body.patientId || req.body.PatientId || req.body.patient_id;
            const actor = req.user || {
                id: req.body.recordedBy || "usr-receptionist-01",
                fullName: "Front Desk Receptionist",
                role: req.body.userRole || "RECEPTIONIST",
            };

            const payload = {
                ...req.body,
                patientId,
            };

            const result = await container.recordPayment.execute(payload, actor);
            return res.status(201).json({
                success: true,
                message: result.message,
                data: result,
            });
        } catch (error) {
            if (error.message.includes("Unauthorized") || error.message.includes("Only a Receptionist")) {
                return res.status(403).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            if (error.message.includes("does not exist") || error.message.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    error: { message: error.message },
                });
            }
            if (error.message.includes("exceeds permitted")) {
                return res.status(422).json({
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
     * GET /payments?patientId=... or GET /patients/:patientId/payments (Task 9)
     * Displays: Amount, Due Date, Recorded by
     */
    async getPaymentHistory(req, res, next) {
        try {
            const patientId = req.params.patientId || req.query.patientId || req.query.PatientId;
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    error: { message: "patientId parameter is required to view payment history." },
                });
            }

            const result = await container.getPaymentHistory.execute(patientId);
            return res.status(200).json({
                success: true,
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
}

module.exports = new PaymentController();

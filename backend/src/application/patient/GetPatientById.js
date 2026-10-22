const { ProcedureStatus } = require("../../domain/enums/enum");

class GetPatientById {
    constructor({ patientRepository }) {
        this.patientRepository = patientRepository;
    }

    async execute({ patientId }) {
        if (!patientId || typeof patientId !== "string" || !patientId.trim()) {
            const error = new Error("Patient ID is required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }

        const patient = await this.patientRepository.findById(patientId.trim());
        if (!patient) {
            const error = new Error(`Patient with ID '${patientId}' was not found.`);
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        const safePatient = patient.toSafeObject();
        const allProcedures = safePatient.procedures || [];

        // Organize hierarchical clinical stages (Task 5)
        const currentProcedure = allProcedures.find((p) => p.status === ProcedureStatus.ONGOING) || null;
        const nextProcedure = allProcedures.find((p) => p.status === ProcedureStatus.NEXT) || null;
        const procedureHistory = allProcedures.filter((p) => p.status === ProcedureStatus.DONE || p.id !== currentProcedure?.id && p.id !== nextProcedure?.id);

        return {
            patient: safePatient,
            clinicalOverview: {
                currentProcedure,
                nextProcedure,
                procedureHistory,
                paymentInformation: {
                    remainingFee: safePatient.remainingFee,
                    balance: safePatient.balance,
                    payments: safePatient.payments || [],
                    totalPaid: (safePatient.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0),
                },
                appointments: safePatient.appointments || [],
                branch: safePatient.branch,
                dentist: safePatient.dentist,
            },
        };
    }
}

module.exports = GetPatientById;

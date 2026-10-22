class DeletePatient {
    constructor({ patientRepository }) {
        this.patientRepository = patientRepository;
    }

    async execute({ patientId, actorUserId = "system" }) {
        if (!patientId || typeof patientId !== "string" || !patientId.trim()) {
            const error = new Error("Patient ID is required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }

        const existing = await this.patientRepository.findById(patientId.trim());
        if (!existing) {
            const error = new Error(`Patient with ID '${patientId}' was not found or has already been deleted.`);
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        const result = await this.patientRepository.softDelete(patientId.trim(), actorUserId);

        return {
            success: true,
            id: patientId.trim(),
            name: existing.name || existing.full_name,
            message: `Patient '${existing.name || existing.full_name}' was successfully removed.`,
            auditLogged: true,
        };
    }
}

module.exports = DeletePatient;

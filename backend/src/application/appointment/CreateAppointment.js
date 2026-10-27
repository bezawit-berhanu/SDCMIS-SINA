/**
 * Application Use Case: CreateAppointment
 * Creates a scheduled dental appointment linking a Patient to an optional Procedure.
 */
class CreateAppointment {
    constructor({ appointmentRepository, patientRepository, procedureRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.procedureRepository = procedureRepository;
    }

    async execute(payload = {}, user = null) {
        const patientId = payload.patientId || payload.patient_id;
        if (!patientId) {
            const err = new Error("PatientId is required to book an appointment.");
            err.statusCode = 400;
            throw err;
        }

        // Verify patient existence (check in-memory patients first for fast resolution)
        let patient = null;
        if (this.patientRepository?.patients) {
            patient = this.patientRepository.patients.find((p) => String(p.id) === String(patientId));
        }
        if (!patient && this.patientRepository) {
            patient = await this.patientRepository.findById(patientId);
        }
        if (!patient) {
            const err = new Error(`Patient with ID "${patientId}" was not found.`);
            err.statusCode = 404;
            throw err;
        }

        // Verify procedure existence if specified
        const procedureId = payload.procedureId || payload.procedure_id || null;
        if (procedureId && this.procedureRepository) {
            const proc = await this.procedureRepository.findById(procedureId);
            if (!proc) {
                const err = new Error(`Procedure with ID "${procedureId}" was not found.`);
                err.statusCode = 404;
                throw err;
            }
        }

        const appointmentDate = payload.appointmentDate || payload.appointment_date || payload.scheduledDate;
        if (!appointmentDate) {
            const err = new Error("AppointmentDate is required.");
            err.statusCode = 400;
            throw err;
        }

        const parsedDate = new Date(appointmentDate);
        if (Number.isNaN(parsedDate.getTime())) {
            const err = new Error("Invalid appointment date format.");
            err.statusCode = 400;
            throw err;
        }

        const created = await this.appointmentRepository.create({
            patientId,
            procedureId,
            appointmentDate: parsedDate,
            status: payload.status || "UPCOMING",
            notes: payload.notes || "",
            createdByUserId: user?.id || null,
        });

        return created;
    }
}

module.exports = CreateAppointment;

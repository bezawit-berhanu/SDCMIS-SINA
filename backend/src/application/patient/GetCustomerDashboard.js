const { ProcedureStatus, AppointmentStatus, QueueStatus } = require("../../domain/enums/enum");

/**
 * GetCustomerDashboard
 * Aggregates only the authenticated customer's clinical and billing information:
 * My Information -> Treatment -> Next Procedure -> Appointment -> Balance
 */
class GetCustomerDashboard {
    constructor({ patientRepository, queueRepository, procedureRepository, paymentRepository, appointmentRepository } = {}) {
        this.patientRepository = patientRepository;
        this.queueRepository = queueRepository;
        this.procedureRepository = procedureRepository;
        this.paymentRepository = paymentRepository;
        this.appointmentRepository = appointmentRepository;
    }

    async execute(authenticatedUser) {
        if (!authenticatedUser || !authenticatedUser.id) {
            const error = new Error("Authentication required to access customer dashboard.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const patientId = authenticatedUser.linkedPatientId || authenticatedUser.patientId || authenticatedUser.id;

        const patient = await this.patientRepository.findById(patientId);
        if (!patient) {
            // Return empty skeleton if patient record not yet linked
            return {
                myInformation: {
                    patientId,
                    name: authenticatedUser.fullName || "Customer",
                    email: authenticatedUser.email || "",
                    phone: authenticatedUser.phone || "",
                    age: null,
                    serviceType: null,
                    status: "ACTIVE",
                },
                treatment: {
                    procedures: [],
                    completedCount: 0,
                    ongoingProcedure: null,
                },
                nextProcedure: null,
                appointment: {
                    upcoming: [],
                    attended: [],
                    nextAppointmentDate: null,
                },
                balance: {
                    remainingFee: 0,
                    balance: 0,
                    totalPaid: 0,
                    payments: [],
                },
                queue: null,
            };
        }

        const safePatient = typeof patient.toSafeObject === "function" ? patient.toSafeObject() : patient;
        const procedures = safePatient.procedures || [];
        const appointments = safePatient.appointments || [];
        const payments = safePatient.payments || [];

        // 1. My Information
        const myInformation = {
            patientId: safePatient.id,
            name: safePatient.name || safePatient.full_name || authenticatedUser.fullName,
            age: safePatient.age,
            contact: safePatient.contact || safePatient.contact_info || authenticatedUser.email || authenticatedUser.phone,
            serviceType: safePatient.serviceType || safePatient.service_type || "General Dentistry",
            status: safePatient.status || "ACTIVE",
            dentist: safePatient.dentist || null,
            branch: safePatient.branch || null,
            createdDate: safePatient.createdAt || safePatient.created_at,
        };

        // 2. Treatment
        const ongoingProcedure = procedures.find((p) => p.status === ProcedureStatus.ONGOING) || null;
        const completedProcedures = procedures.filter((p) => p.status === ProcedureStatus.DONE);
        const treatment = {
            procedures,
            completedCount: completedProcedures.length,
            ongoingProcedure,
            allProceduresCount: procedures.length,
        };

        // 3. Next Procedure
        const nextProcedure = procedures.find((p) => p.status === ProcedureStatus.NEXT) || null;

        // 4. Appointment
        const upcomingAppointments = appointments.filter((a) => a.status === AppointmentStatus.UPCOMING);
        const attendedAppointments = appointments.filter((a) => a.status === AppointmentStatus.ATTENDED);
        const appointment = {
            upcoming: upcomingAppointments,
            attended: attendedAppointments,
            all: appointments,
            nextAppointmentDate: safePatient.nextAppointmentDate || (upcomingAppointments[0]?.scheduledDate || null),
        };

        // 5. Balance
        const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
        const remainingFee = Number(safePatient.remainingFee !== undefined ? safePatient.remainingFee : safePatient.remaining_fee || 0);
        const balance = {
            remainingFee,
            balance: remainingFee,
            totalPaid,
            payments,
        };

        // 6. Today's live queue status for this patient
        let queueInfo = null;
        if (this.queueRepository) {
            try {
                const todayQueue = await this.queueRepository.findTodayQueue();
                const activeEntry = todayQueue.find(
                    (q) => q.patientId === patientId && q.status !== QueueStatus.DONE
                );
                if (activeEntry) {
                    const waitingList = todayQueue.filter((q) => q.status === QueueStatus.WAITING);
                    const positionIndex = waitingList.findIndex((q) => q.id === activeEntry.id);
                    queueInfo = {
                        queueEntryId: activeEntry.id,
                        queueNumber: activeEntry.queueNumber,
                        formattedQueueNumber: activeEntry.formattedQueueNumber,
                        status: activeEntry.status,
                        position: activeEntry.status === QueueStatus.WAITING ? (positionIndex >= 0 ? positionIndex + 1 : 1) : 0,
                        dentist: activeEntry.dentistName || null,
                    };
                }
            } catch (_) {}
        }

        return {
            myInformation,
            treatment,
            nextProcedure,
            appointment,
            balance,
            queue: queueInfo,
        };
    }
}

module.exports = GetCustomerDashboard;

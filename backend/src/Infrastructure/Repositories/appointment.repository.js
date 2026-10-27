const IAppointmentRepository = require("../../domain/repositories/appointment.repository.interface");
const Appointment = require("../../domain/entities/appointment");
const MissedAppointmentDetector = require("../../domain/services/missed.appointment.detector");
const { AppointmentStatus, RecordStatus } = require("../../domain/enums/enum");

class AppointmentRepository extends IAppointmentRepository {
    constructor({ prisma, patientRepository, procedureRepository } = {}) {
        super();
        this.prisma = prisma;
        this.patientRepository = patientRepository;
        this.procedureRepository = procedureRepository;

        // In-memory appointments store with realistic seed data
        this.appointments = [
            new Appointment({
                appointmentId: "apt-101",
                patientId: "pat-1001",
                procedureId: "proc-1",
                appointmentDate: new Date(Date.now() + 2 * 86400000), // 2 days ahead
                status: AppointmentStatus.UPCOMING,
                notes: "Scheduled routine examination and diagnostic consultation",
            }),
            new Appointment({
                appointmentId: "apt-102",
                patientId: "pat-1002",
                procedureId: "proc-2",
                appointmentDate: new Date(Date.now() - 3 * 86400000), // 3 days ago (Missed)
                status: AppointmentStatus.MISSED,
                notes: "Patient failed to attend scheduled restorative prep visit",
            }),
            new Appointment({
                appointmentId: "apt-103",
                patientId: "pat-1003",
                procedureId: "proc-3",
                appointmentDate: new Date(Date.now() + 5 * 86400000), // 5 days ahead
                status: AppointmentStatus.UPCOMING,
                notes: "Follow-up orthodontic bracket repositioning",
            }),
            new Appointment({
                appointmentId: "apt-104",
                patientId: "pat-1004",
                procedureId: "proc-4",
                appointmentDate: new Date(Date.now() - 7 * 86400000), // 7 days ago (Attended)
                status: AppointmentStatus.ATTENDED,
                notes: "Completed ultrasonic scaling and fluoride treatment",
            }),
            new Appointment({
                appointmentId: "apt-105",
                patientId: "pat-1001",
                procedureId: "proc-1",
                appointmentDate: new Date(Date.now() - 4 * 86400000), // 4 days ago (Passed upcoming -> Missed candidate)
                status: AppointmentStatus.UPCOMING,
                notes: "Diagnostic radiography review session",
            }),
        ];
    }

    _enrichAppointment(apt) {
        if (!apt) return null;
        const safe = apt.toSafeObject ? apt.toSafeObject() : { ...apt };

        // Enrich with patient information if available
        let patient = null;
        if (this.patientRepository) {
            patient = this.patientRepository.patients?.find((p) => String(p.id) === String(safe.patientId)) || null;
        }

        // Enrich with procedure information if available
        let procedure = null;
        if (this.procedureRepository && safe.procedureId) {
            procedure = this.procedureRepository.procedures?.find((p) => String(p.id) === String(safe.procedureId)) || null;
        }

        return {
            ...safe,
            patientName: patient?.name || patient?.fullName || "Patient",
            patientContact: patient?.contact || patient?.contact_info || "",
            procedureName: procedure?.name || procedure?.description || "Dental Consultation",
            procedureCost: procedure?.cost || 0,
            procedureStatus: procedure?.status || null,
        };
    }

    async create(appointmentData) {
        const patientId = appointmentData.patientId || appointmentData.patient_id;
        if (!patientId) {
            const err = new Error("PatientId is required to schedule an appointment.");
            err.statusCode = 400;
            throw err;
        }

        // Verify patient existence
        if (this.patientRepository) {
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                const err = new Error(`Patient with ID "${patientId}" does not exist.`);
                err.statusCode = 404;
                throw err;
            }
        }

        const id = appointmentData.appointmentId || appointmentData.id || `apt-${Date.now().toString().slice(-6)}`;
        const entity = new Appointment({
            ...appointmentData,
            appointmentId: id,
            id,
            patientId,
        });

        // Try Prisma DB first
        try {
            if (this.prisma?.appointment?.create) {
                const created = await this.prisma.appointment.create({
                    data: {
                        id: entity.id,
                        patient_id: entity.patientId,
                        procedure_id: entity.procedureId,
                        scheduled_date: entity.appointmentDate,
                        status: entity.status,
                    },
                });
                entity.id = created.id;
            }
        } catch (_) {
            // Fall back to in-memory store
        }

        // Always register in in-memory collection
        const existingIdx = this.appointments.findIndex((a) => a.id === entity.id);
        if (existingIdx >= 0) {
            this.appointments[existingIdx] = entity;
        } else {
            this.appointments.unshift(entity);
        }

        // Synchronize with patient appointments list if in memory
        if (this.patientRepository?.patients) {
            const memPatient = this.patientRepository.patients.find((p) => String(p.id) === String(patientId));
            if (memPatient) {
                if (!memPatient.appointments) memPatient.appointments = [];
                memPatient.appointments.unshift(entity.toSafeObject());
            }
        }

        return this._enrichAppointment(entity);
    }

    async findById(id) {
        if (!id) return null;

        // Check in-memory store first
        const memApt = this.appointments.find((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
        if (memApt) {
            return this._enrichAppointment(memApt);
        }

        // Check Prisma DB
        try {
            if (this.prisma?.appointment?.findUnique) {
                const row = await this.prisma.appointment.findUnique({ where: { id: String(id) } });
                if (row) {
                    const entity = new Appointment({
                        appointmentId: row.id,
                        patientId: row.patient_id,
                        procedureId: row.procedure_id,
                        appointmentDate: row.scheduled_date,
                        status: row.status,
                    });
                    return this._enrichAppointment(entity);
                }
            }
        } catch (_) {
            // DB fallback
        }

        return null;
    }

    async findAll(filter = {}) {
        let list = [...this.appointments];

        if (filter.patientId) {
            list = list.filter((a) => String(a.patientId) === String(filter.patientId));
        }

        if (filter.status) {
            const expectedStatus = filter.status.toUpperCase();
            list = list.filter((a) => a.status === expectedStatus);
        }

        if (filter.procedureId) {
            list = list.filter((a) => String(a.procedureId) === String(filter.procedureId));
        }

        if (filter.recordStatus) {
            list = list.filter((a) => a.recordStatus === filter.recordStatus);
        }

        return list.map((a) => this._enrichAppointment(a));
    }

    async findByPatientId(patientId) {
        if (!patientId) return [];
        return this.findAll({ patientId });
    }

    async findUpcoming(options = {}) {
        const now = options.currentDate || new Date();
        const list = this.appointments.filter((a) => {
            return a.status === AppointmentStatus.UPCOMING && a.appointmentDate.getTime() >= now.getTime();
        });

        list.sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());
        return list.map((a) => this._enrichAppointment(a));
    }

    async findMissed(options = {}) {
        // Auto-detect and sync any expired appointments
        await this.detectAndMarkMissed(options.currentDate || new Date());

        const list = this.appointments.filter((a) => a.status === AppointmentStatus.MISSED);
        list.sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());
        return list.map((a) => this._enrichAppointment(a));
    }

    async update(id, updateData = {}) {
        const apt = this.appointments.find((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
        if (!apt) {
            const err = new Error(`Appointment with ID "${id}" not found.`);
            err.statusCode = 404;
            throw err;
        }

        if (updateData.appointmentDate) {
            const parsed = new Date(updateData.appointmentDate);
            if (!Number.isNaN(parsed.getTime())) {
                apt.appointmentDate = parsed;
                apt.scheduledDate = parsed;
            }
        }

        if (updateData.status) {
            const statusUpper = updateData.status.toUpperCase();
            if (Object.values(AppointmentStatus).includes(statusUpper)) {
                apt.status = statusUpper;
            }
        }

        if (updateData.notes !== undefined) {
            apt.notes = String(updateData.notes).trim();
        }

        if (updateData.procedureId !== undefined) {
            apt.procedureId = updateData.procedureId ? String(updateData.procedureId) : null;
        }

        apt.updatedAt = new Date();

        // Update Prisma if available
        try {
            if (this.prisma?.appointment?.update) {
                await this.prisma.appointment.update({
                    where: { id: String(id) },
                    data: {
                        scheduled_date: apt.appointmentDate,
                        status: apt.status,
                    },
                });
            }
        } catch (_) {}

        return this._enrichAppointment(apt);
    }

    async cancel(id, reason = "") {
        const apt = this.appointments.find((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
        if (!apt) {
            const err = new Error(`Appointment with ID "${id}" not found.`);
            err.statusCode = 404;
            throw err;
        }

        apt.cancel(reason);

        try {
            if (this.prisma?.appointment?.update) {
                await this.prisma.appointment.update({
                    where: { id: String(id) },
                    data: { status: AppointmentStatus.CANCELLED },
                });
            }
        } catch (_) {}

        return this._enrichAppointment(apt);
    }

    async reschedule(id, newDate, additionalNotes = "") {
        const apt = this.appointments.find((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
        if (!apt) {
            const err = new Error(`Appointment with ID "${id}" not found.`);
            err.statusCode = 404;
            throw err;
        }

        apt.reschedule(newDate, additionalNotes);

        try {
            if (this.prisma?.appointment?.update) {
                await this.prisma.appointment.update({
                    where: { id: String(id) },
                    data: {
                        scheduled_date: apt.appointmentDate,
                        status: AppointmentStatus.UPCOMING,
                    },
                });
            }
        } catch (_) {}

        return this._enrichAppointment(apt);
    }

    async delete(id) {
        const idx = this.appointments.findIndex((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
        if (idx < 0) {
            const err = new Error(`Appointment with ID "${id}" not found.`);
            err.statusCode = 404;
            throw err;
        }

        const removed = this.appointments.splice(idx, 1)[0];
        removed.recordStatus = RecordStatus.DELETED;
        removed.deletedAt = new Date();

        try {
            if (this.prisma?.appointment?.delete) {
                await this.prisma.appointment.delete({ where: { id: String(id) } });
            }
        } catch (_) {}

        return { success: true, id };
    }

    async detectAndMarkMissed(currentDate = new Date()) {
        const now = currentDate instanceof Date ? currentDate : new Date(currentDate);

        // Build procedure status map if available
        const procedureMap = new Map();
        if (this.procedureRepository?.procedures) {
            for (const p of this.procedureRepository.procedures) {
                procedureMap.set(p.id, p);
            }
        }

        let updatedCount = 0;
        const newlyMissed = [];

        for (const apt of this.appointments) {
            const procStatus = apt.procedureId ? procedureMap.get(apt.procedureId)?.status : null;
            if (MissedAppointmentDetector.shouldBeMarkedMissed(apt, { currentDate: now, procedureStatus: procStatus })) {
                if (apt.status !== AppointmentStatus.MISSED) {
                    apt.status = AppointmentStatus.MISSED;
                    apt.updatedAt = new Date();
                    updatedCount++;
                    newlyMissed.push(this._enrichAppointment(apt));

                    try {
                        if (this.prisma?.appointment?.update) {
                            await this.prisma.appointment.update({
                                where: { id: apt.id },
                                data: { status: AppointmentStatus.MISSED },
                            });
                        }
                    } catch (_) {}
                }
            }
        }

        return {
            updatedCount,
            missedAppointments: newlyMissed,
            totalMissed: this.appointments.filter((a) => a.status === AppointmentStatus.MISSED).length,
        };
    }
}

module.exports = AppointmentRepository;

const crypto = require("node:crypto");
const IQueueRepository = require("../../domain/repositories/queue.repository.interface");
const QueueEntry = require("../../domain/entities/queue.entry");
const { QueueStatus, RecordStatus } = require("../../domain/enums/enum");

class QueueRepository extends IQueueRepository {
    constructor({ prisma, patientRepository } = {}) {
        super();
        this.prisma = prisma;
        this.patientRepository = patientRepository;

        const today = new Date();
        const baseTime = new Date(today);
        baseTime.setHours(9, 0, 0, 0);

        // Seed data reflecting the required specifications:
        // #001 Abebe - DONE
        // #002 Hana - SERVING
        // #003 Sara - WAITING
        // #004 Meron - WAITING
        this.queue = [
            new QueueEntry({
                queueEntryId: "que-001",
                patientId: "pat-1001",
                patientName: "Abebe Kebede",
                queueNumber: 1,
                status: QueueStatus.DONE,
                queueDate: today,
                checkInTime: new Date(baseTime.getTime()),
                calledTime: new Date(baseTime.getTime() + 15 * 60000),
                completedTime: new Date(baseTime.getTime() + 45 * 60000),
                serviceType: "Routine Dental Cleaning",
                dentistId: "usr-dentist-01",
                dentistName: "Dr. Sara",
            }),
            new QueueEntry({
                queueEntryId: "que-002",
                patientId: "pat-1002",
                patientName: "Hana Bekele",
                queueNumber: 2,
                status: QueueStatus.SERVING,
                queueDate: today,
                checkInTime: new Date(baseTime.getTime() + 20 * 60000),
                calledTime: new Date(baseTime.getTime() + 45 * 60000),
                serviceType: "Root Canal Therapy (Molar)",
                dentistId: "usr-dentist-01",
                dentistName: "Dr. Sara",
            }),
            new QueueEntry({
                queueEntryId: "que-003",
                patientId: "pat-1003",
                patientName: "Sara Tadesse",
                queueNumber: 3,
                status: QueueStatus.WAITING,
                queueDate: today,
                checkInTime: new Date(baseTime.getTime() + 40 * 60000),
                serviceType: "Composite Filling & Polish",
                dentistId: "usr-dentist-01",
                dentistName: "Dr. Sara",
            }),
            new QueueEntry({
                queueEntryId: "que-004",
                patientId: "pat-1004",
                patientName: "Meron Haile",
                queueNumber: 4,
                status: QueueStatus.WAITING,
                queueDate: today,
                checkInTime: new Date(baseTime.getTime() + 55 * 60000),
                serviceType: "Orthodontic Consultation",
                dentistId: "usr-dentist-01",
                dentistName: "Dr. Sara",
            }),
        ];
    }

    _isSameDay(d1, d2) {
        if (!d1 || !d2) return false;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    _enrichQueueEntry(entry) {
        if (!entry) return null;
        const safe = entry.toSafeObject ? entry.toSafeObject() : { ...entry };

        if (!safe.patientName && this.patientRepository && typeof this.patientRepository.findById === "function") {
            try {
                const patient = this.patientRepository.findById(safe.patientId);
                if (patient) {
                    safe.patientName = patient.full_name || patient.fullName || safe.patientName;
                    safe.serviceType = patient.service_type || patient.serviceType || safe.serviceType;
                    safe.dentistId = safe.dentistId || patient.dentistId || null;
                }
            } catch (_) {}
        }

        return safe;
    }

    async getNextQueueNumber(date = new Date()) {
        const todayEntries = this.queue.filter((e) => this._isSameDay(e.queueDate, date));
        if (todayEntries.length === 0) return 1;
        const maxNum = Math.max(...todayEntries.map((e) => e.queueNumber || 0));
        return maxNum + 1;
    }

    async create(queueEntryData) {
        const date = queueEntryData.queueDate || new Date();
        const nextNum = queueEntryData.queueNumber || (await this.getNextQueueNumber(date));
        const id = queueEntryData.queueEntryId || queueEntryData.id || `que-${crypto.randomUUID()}`;

        const entity = new QueueEntry({
            ...queueEntryData,
            queueEntryId: id,
            id,
            queueNumber: nextNum,
            queueDate: date,
            status: queueEntryData.status || QueueStatus.WAITING,
            checkInTime: queueEntryData.checkInTime || new Date(),
        });

        // Try Prisma if available
        try {
            if (this.prisma?.queueEntry?.create) {
                await this.prisma.queueEntry.create({
                    data: {
                        id: entity.id,
                        patient_id: entity.patientId,
                        queue_number: entity.queueNumber,
                        status: entity.status,
                        queue_date: entity.queueDate,
                        called_at: entity.calledTime,
                        completed_at: entity.completedTime,
                        created_by_user_id: entity.createdByUserId || "usr-receptionist-01",
                        created_at: entity.createdAt,
                        updated_at: entity.updatedAt,
                    },
                });
            }
        } catch (_) {
            // Graceful fallback to in-memory store
        }

        this.queue.push(entity);
        return this._enrichQueueEntry(entity);
    }

    async findById(id) {
        // Try Prisma first
        try {
            if (this.prisma?.queueEntry?.findUnique) {
                const record = await this.prisma.queueEntry.findUnique({
                    where: { id },
                    include: { patient: true },
                });
                if (record) {
                    const mapped = new QueueEntry({
                        queueEntryId: record.id,
                        patientId: record.patient_id,
                        patientName: record.patient?.full_name,
                        serviceType: record.patient?.service_type,
                        queueNumber: record.queue_number,
                        status: record.status,
                        queueDate: record.queue_date,
                        checkInTime: record.created_at,
                        calledTime: record.called_at,
                        completedTime: record.completed_at,
                        createdByUserId: record.created_by_user_id,
                    });
                    return this._enrichQueueEntry(mapped);
                }
            }
        } catch (_) {}

        const entry = this.queue.find((e) => e.id === id || e.queueEntryId === id);
        return entry ? this._enrichQueueEntry(entry) : null;
    }

    async findByPatientId(patientId, options = {}) {
        const matches = this.queue.filter((e) => e.patientId === patientId);
        return matches.map((e) => this._enrichQueueEntry(e));
    }

    async findTodayQueue(options = {}) {
        const targetDate = options.date ? new Date(options.date) : new Date();
        const statusFilter = options.status ? String(options.status).toUpperCase() : null;

        // Try Prisma first
        try {
            if (this.prisma?.queueEntry?.findMany) {
                const records = await this.prisma.queueEntry.findMany({
                    include: { patient: true },
                    orderBy: { queue_number: "asc" },
                });
                if (records && records.length > 0) {
                    let filtered = records;
                    if (statusFilter) {
                        filtered = filtered.filter((r) => r.status === statusFilter);
                    }
                    return filtered.map((record) => {
                        const ent = new QueueEntry({
                            queueEntryId: record.id,
                            patientId: record.patient_id,
                            patientName: record.patient?.full_name,
                            serviceType: record.patient?.service_type,
                            queueNumber: record.queue_number,
                            status: record.status,
                            queueDate: record.queue_date,
                            checkInTime: record.created_at,
                            calledTime: record.called_at,
                            completedTime: record.completed_at,
                        });
                        return this._enrichQueueEntry(ent);
                    });
                }
            }
        } catch (_) {}

        let list = this.queue.filter((e) => this._isSameDay(e.queueDate, targetDate));
        if (statusFilter) {
            list = list.filter((e) => e.status === statusFilter);
        }

        // Sort by queueNumber ascending
        list.sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
        return list.map((e) => this._enrichQueueEntry(e));
    }

    async findWaiting(date = new Date()) {
        return this.findTodayQueue({ date, status: QueueStatus.WAITING });
    }

    async findServing(date = new Date()) {
        return this.findTodayQueue({ date, status: QueueStatus.SERVING });
    }

    async findNextWaiting(date = new Date()) {
        const waitingList = await this.findWaiting(date);
        return waitingList.length > 0 ? waitingList[0] : null;
    }

    async update(id, updateData = {}) {
        const entry = this.queue.find((e) => e.id === id || e.queueEntryId === id);
        if (!entry) return null;

        if (updateData.status && updateData.status !== entry.status) {
            if (updateData.status === QueueStatus.SERVING) {
                entry.call(updateData.dentistId, updateData.dentistName);
            } else if (updateData.status === QueueStatus.DONE) {
                entry.complete();
            } else {
                entry.status = updateData.status;
            }
        }

        if (updateData.dentistId) entry.dentistId = String(updateData.dentistId);
        if (updateData.dentistName) entry.dentistName = String(updateData.dentistName);
        if (updateData.notes !== undefined) entry.notes = updateData.notes;
        entry.updatedAt = new Date();

        try {
            if (this.prisma?.queueEntry?.update) {
                await this.prisma.queueEntry.update({
                    where: { id: entry.id },
                    data: {
                        status: entry.status,
                        called_at: entry.calledTime,
                        completed_at: entry.completedTime,
                        updated_at: entry.updatedAt,
                    },
                });
            }
        } catch (_) {}

        return this._enrichQueueEntry(entry);
    }

    async updateStatus(id, status, metadata = {}) {
        return this.update(id, { ...metadata, status });
    }

    async delete(id) {
        const index = this.queue.findIndex((e) => e.id === id || e.queueEntryId === id);
        if (index === -1) return false;
        this.queue.splice(index, 1);

        try {
            if (this.prisma?.queueEntry?.delete) {
                await this.prisma.queueEntry.delete({ where: { id } });
            }
        } catch (_) {}

        return true;
    }
}

module.exports = QueueRepository;

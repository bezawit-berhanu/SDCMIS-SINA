const { RecordStatus } = require("../enums/enum");

class Patient {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const name = params.name || params.full_name || params.fullName || "";
        const age = params.age !== undefined && params.age !== null ? Number(params.age) : null;
        const contact = params.contact || params.contact_info || params.contactInfo || "";
        const serviceType = params.service_type || params.serviceType || params.service || "";
        const serviceTypeId = params.serviceTypeId ?? null;
        const remainingFee = params.remaining_fee !== undefined && params.remaining_fee !== null
            ? Number(params.remaining_fee)
            : (params.balance !== undefined && params.balance !== null ? Number(params.balance) : 0);
        const dentistId = params.dentistid || params.dentistId || params.dentist_id || null;
        const branchId = params.branchID || params.branchId || params.branch_id || null;
        const createdByUserId = params.created_by_user_id || params.createdByUserId || null;
        const recordStatus = params.record_status || params.recordStatus || params.status || RecordStatus.ACTIVE;
        const createdAt = params.created_at || params.createdAt || params.created_date || params.createdDate || new Date();
        const updatedAt = params.updated_at || params.updatedAt || new Date();
        const deletedAt = params.deletedAt ?? null;
        const nextAppointmentDate = params.next_appointment_date || params.nextAppointmentDate || null;

        // Validations
        if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 120) {
            throw new Error("Patient name must contain between 1 and 120 characters.");
        }

        if (age === null || Number.isNaN(age) || age < 0 || age > 150) {
            throw new Error("Patient age must be a valid number between 0 and 150.");
        }

        const normalizedContact = typeof contact === "string" ? contact.trim() : "";
        if (normalizedContact.length < 3 || normalizedContact.length > 255) {
            throw new Error("Patient contact information must be provided (between 3 and 255 characters).");
        }

        if (serviceType && (typeof serviceType !== "string" || serviceType.trim().length > 125)) {
            throw new Error("Service type must be a valid string under 125 characters.");
        }

        if (Number.isNaN(remainingFee) || remainingFee < 0) {
            throw new Error("Remaining fee/balance cannot be negative.");
        }

        if (!Object.values(RecordStatus).includes(recordStatus)) {
            throw new Error("The specified record status is invalid.");
        }

        this.id = id;
        this.name = name.trim();
        this.full_name = this.name;
        this.fullName = this.name;
        this.age = Math.floor(age);
        this.contact = normalizedContact;
        this.contact_info = normalizedContact;
        this.contactInfo = normalizedContact;
        this.serviceType = typeof serviceType === "string" ? serviceType.trim() : "";
        this.service_type = this.serviceType;
        this.serviceTypeId = serviceTypeId;
        this.remainingFee = Number(remainingFee.toFixed(2));
        this.remaining_fee = this.remainingFee;
        this.balance = this.remainingFee;
        this.dentistId = dentistId;
        this.dentistid = dentistId;
        this.branchId = branchId;
        this.branchID = branchId;
        this.createdByUserId = createdByUserId;
        this.created_by_user_id = createdByUserId;
        this.recordStatus = recordStatus;
        this.status = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.created_at = this.createdAt;
        this.createdDate = this.createdAt;
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
        this.nextAppointmentDate = nextAppointmentDate;

        // Associated relations
        this.dentist = params.dentist ?? null;
        this.branch = params.branch ?? null;
        this.procedures = Array.isArray(params.procedures) ? params.procedures : [];
        this.appointments = Array.isArray(params.appointments) ? params.appointments : [];
        this.payments = Array.isArray(params.payments) ? params.payments : [];
    }

    get isActive() {
        return this.recordStatus === RecordStatus.ACTIVE && !this.deletedAt;
    }

    toSafeObject() {
        return {
            id: this.id,
            name: this.name,
            full_name: this.full_name,
            fullName: this.fullName,
            age: this.age,
            contact: this.contact,
            contact_info: this.contact_info,
            contactInfo: this.contactInfo,
            serviceType: this.serviceType,
            service_type: this.service_type,
            status: this.status,
            recordStatus: this.recordStatus,
            createdDate: this.createdDate,
            createdAt: this.createdAt,
            created_at: this.created_at,
            updatedAt: this.updatedAt,
            dentistId: this.dentistId,
            dentistid: this.dentistid,
            branchId: this.branchId,
            branchID: this.branchID,
            remainingFee: this.remainingFee,
            balance: this.balance,
            dentist: this.dentist ? {
                id: this.dentist.id,
                fullName: this.dentist.fullName || this.dentist.fullname || this.dentist.name,
                name: this.dentist.fullName || this.dentist.fullname || this.dentist.name,
                email: this.dentist.email,
                phone: this.dentist.phone,
                branchId: this.dentist.branchId,
            } : null,
            branch: this.branch ? {
                id: this.branch.id,
                name: this.branch.name,
                address: this.branch.address,
                phone: this.branch.phone,
            } : null,
            procedures: this.procedures,
            appointments: this.appointments,
            payments: this.payments,
        };
    }
}

module.exports = Patient;

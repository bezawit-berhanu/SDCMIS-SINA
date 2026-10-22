const { RecordStatus } = require("../enums/enum");

class Branch {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const name = params.name || "";
        const address = params.address ?? null;
        const phone = params.phone ?? null;
        const recordStatus = params.recordStatus || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || new Date();
        const updatedAt = params.updatedAt || new Date();
        const deletedAt = params.deletedAt ?? null;
        const dentists = Array.isArray(params.dentists) ? params.dentists : [];

        if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 120) {
            throw new Error("Branch name must contain between 1 and 120 characters.");
        }

        if (phone && (!/^\+?[0-9\s\-().]{7,30}$/.test(phone.trim()))) {
            throw new Error("Branch phone number has an invalid format.");
        }

        if (!Object.values(RecordStatus).includes(recordStatus)) {
            throw new Error("The specified record status is invalid.");
        }

        this.id = id;
        this.name = name.trim();
        this.address = address ? address.trim() : null;
        this.phone = phone ? phone.trim() : null;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.dentists = dentists;
    }

    get isActive() {
        return this.recordStatus === RecordStatus.ACTIVE && !this.deletedAt;
    }

    toSafeObject() {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            phone: this.phone,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            dentists: this.dentists.map((d) => (typeof d === "object" && d !== null ? {
                id: d.id,
                fullName: d.fullName || d.fullname,
                email: d.email,
                phone: d.phone,
            } : d)),
        };
    }
}

module.exports = Branch;

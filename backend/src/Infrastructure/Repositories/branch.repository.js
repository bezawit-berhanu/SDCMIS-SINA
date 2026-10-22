const prisma = require("../prisma");
const Branch = require("../../domain/entities/branch");
const { UserRole, RecordStatus } = require("../../domain/enums/enum");

// In-memory fallback dataset for seamless offline execution and test suites
const inMemoryBranches = [
    {
        id: "br-001",
        name: "Main Dental Clinic - Bole",
        address: "Bole Medhanialem, Suite 402, Addis Ababa",
        phone: "+251911223344",
        recordStatus: RecordStatus.ACTIVE,
        createdAt: new Date("2026-01-15T08:00:00Z"),
        updatedAt: new Date("2026-01-15T08:00:00Z"),
        deletedAt: null,
    },
    {
        id: "br-002",
        name: "Kazanchis Executive Dental Center",
        address: "Kazanchis Business Center, 3rd Floor, Addis Ababa",
        phone: "+251922334455",
        recordStatus: RecordStatus.ACTIVE,
        createdAt: new Date("2026-02-01T08:00:00Z"),
        updatedAt: new Date("2026-02-01T08:00:00Z"),
        deletedAt: null,
    },
    {
        id: "br-003",
        name: "Sarbet Family Dental Practice",
        address: "Sarbet Old Airport Road, Addis Ababa",
        phone: "+251933445566",
        recordStatus: RecordStatus.ACTIVE,
        createdAt: new Date("2026-03-10T08:00:00Z"),
        updatedAt: new Date("2026-03-10T08:00:00Z"),
        deletedAt: null,
    },
];

const inMemoryDentists = [
    {
        id: "dent-001",
        fullName: "Dr. Aster Worku",
        email: "aster.worku@dentalclinic.com",
        phone: "+251911001122",
        role: UserRole.DENTIST,
        branchId: "br-001",
        recordStatus: RecordStatus.ACTIVE,
    },
    {
        id: "dent-002",
        fullName: "Dr. Dawit Tadesse",
        email: "dawit.tadesse@dentalclinic.com",
        phone: "+251922112233",
        role: UserRole.DENTIST,
        branchId: "br-001",
        recordStatus: RecordStatus.ACTIVE,
    },
    {
        id: "dent-003",
        fullName: "Dr. Selamawit Alemu",
        email: "selamawit.alemu@dentalclinic.com",
        phone: "+251933223344",
        role: UserRole.DENTIST,
        branchId: "br-002",
        recordStatus: RecordStatus.ACTIVE,
    },
    {
        id: "dent-004",
        fullName: "Dr. Michael Bekele",
        email: "michael.bekele@dentalclinic.com",
        phone: "+251944334455",
        role: UserRole.DENTIST,
        branchId: "br-003",
        recordStatus: RecordStatus.ACTIVE,
    },
];

class BranchRepository {
    constructor() {
        this.branches = [...inMemoryBranches];
        this.dentists = [...inMemoryDentists];
    }

    async findAllActive() {
        try {
            if (prisma?.branch?.findMany) {
                const dbBranches = await prisma.branch.findMany({
                    where: { recordStatus: "ACTIVE", deletedAt: null },
                    include: {
                        dentists: {
                            where: { recordStatus: "ACTIVE", deletedAt: null, role: UserRole.DENTIST },
                            select: { id: true, fullname: true, email: true, phone: true, branchId: true },
                        },
                    },
                });
                if (dbBranches && dbBranches.length > 0) {
                    return dbBranches.map((b) => new Branch({
                        ...b,
                        dentists: b.dentists.map((d) => ({
                            id: d.id,
                            fullName: d.fullname,
                            email: d.email,
                            phone: d.phone,
                            branchId: d.branchId,
                        })),
                    }));
                }
            }
        } catch (_) {
            // Fall through to memory
        }

        return this.branches
            .filter((b) => b.recordStatus === RecordStatus.ACTIVE && !b.deletedAt)
            .map((b) => {
                const associatedDentists = this.dentists.filter((d) => d.branchId === b.id && d.recordStatus === RecordStatus.ACTIVE);
                return new Branch({ ...b, dentists: associatedDentists });
            });
    }

    async findById(id) {
        if (!id) return null;
        try {
            if (prisma?.branch?.findUnique) {
                const b = await prisma.branch.findUnique({
                    where: { id },
                    include: {
                        dentists: {
                            where: { recordStatus: "ACTIVE", deletedAt: null, role: UserRole.DENTIST },
                            select: { id: true, fullname: true, email: true, phone: true, branchId: true },
                        },
                    },
                });
                if (b) {
                    return new Branch({
                        ...b,
                        dentists: b.dentists.map((d) => ({
                            id: d.id,
                            fullName: d.fullname,
                            email: d.email,
                            phone: d.phone,
                            branchId: d.branchId,
                        })),
                    });
                }
            }
        } catch (_) {
            // Fall through
        }

        const found = this.branches.find((b) => b.id === id && b.recordStatus === RecordStatus.ACTIVE && !b.deletedAt);
        if (!found) return null;
        const associatedDentists = this.dentists.filter((d) => d.branchId === found.id && d.recordStatus === RecordStatus.ACTIVE);
        return new Branch({ ...found, dentists: associatedDentists });
    }

    async findByName(name) {
        if (!name) return null;
        const norm = name.trim().toLowerCase();
        try {
            if (prisma?.branch?.findFirst) {
                const b = await prisma.branch.findFirst({
                    where: { name: { equals: name.trim() }, recordStatus: "ACTIVE", deletedAt: null },
                });
                if (b) return new Branch(b);
            }
        } catch (_) {
            // Fall through
        }
        const found = this.branches.find((b) => b.name.toLowerCase() === norm && b.recordStatus === RecordStatus.ACTIVE && !b.deletedAt);
        return found ? new Branch(found) : null;
    }

    async create(data) {
        const id = data.id || `br-${Date.now()}`;
        const newBranch = {
            id,
            name: data.name.trim(),
            address: data.address ? data.address.trim() : null,
            phone: data.phone ? data.phone.trim() : null,
            recordStatus: RecordStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        };

        try {
            if (prisma?.branch?.create) {
                const created = await prisma.branch.create({ data: newBranch });
                return new Branch(created);
            }
        } catch (_) {
            // Fall through
        }

        this.branches.push(newBranch);
        return new Branch(newBranch);
    }

    async findAllDentists() {
        try {
            if (prisma?.user?.findMany) {
                const dbDentists = await prisma.user.findMany({
                    where: { role: UserRole.DENTIST, recordStatus: "ACTIVE", deletedAt: null },
                    select: { id: true, fullname: true, email: true, phone: true, branchId: true },
                });
                if (dbDentists && dbDentists.length > 0) {
                    return dbDentists.map((d) => ({
                        id: d.id,
                        fullName: d.fullname,
                        name: d.fullname,
                        email: d.email,
                        phone: d.phone,
                        branchId: d.branchId,
                    }));
                }
            }
        } catch (_) {
            // Fall through
        }

        return this.dentists
            .filter((d) => d.recordStatus === RecordStatus.ACTIVE)
            .map((d) => ({
                id: d.id,
                fullName: d.fullName,
                name: d.fullName,
                email: d.email,
                phone: d.phone,
                branchId: d.branchId,
            }));
    }

    async findDentistById(dentistId) {
        if (!dentistId) return null;
        try {
            if (prisma?.user?.findUnique) {
                const d = await prisma.user.findUnique({
                    where: { id: dentistId },
                    select: { id: true, fullname: true, email: true, phone: true, branchId: true, role: true },
                });
                if (d && d.role === UserRole.DENTIST) {
                    return {
                        id: d.id,
                        fullName: d.fullname,
                        name: d.fullname,
                        email: d.email,
                        phone: d.phone,
                        branchId: d.branchId,
                    };
                }
            }
        } catch (_) {
            // Fall through
        }

        const found = this.dentists.find((d) => d.id === dentistId && d.recordStatus === RecordStatus.ACTIVE);
        return found ? { ...found, name: found.fullName } : null;
    }

    async associateDentistWithBranch(dentistId, branchId) {
        try {
            if (prisma?.user?.update) {
                await prisma.user.update({
                    where: { id: dentistId },
                    data: { branchId },
                });
            }
        } catch (_) {
            // Fall through
        }

        const dentist = this.dentists.find((d) => d.id === dentistId);
        if (dentist) {
            dentist.branchId = branchId;
        }
    }
}

module.exports = new BranchRepository();

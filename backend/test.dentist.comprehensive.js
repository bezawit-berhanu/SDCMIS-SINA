const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

// Mock prisma to avoid remote connection timeouts
const mockPrisma = {
    patient: {
        findFirst: async () => null,
        findUnique: async () => null,
        findMany: async () => [],
        create: async (args) => ({ id: "mock-pat-id", ...args.data }),
        update: async (args) => ({ id: args.where?.id || "mock-pat-id", ...args.data }),
    },
    auditLog: {
        create: async () => ({ id: "mock-audit-id" }),
    },
    $disconnect: async () => {},
};
require.cache[require.resolve("./src/Infrastructure/prisma")] = {
    id: require.resolve("./src/Infrastructure/prisma"),
    filename: require.resolve("./src/Infrastructure/prisma"),
    loaded: true,
    exports: mockPrisma,
};

const Patient = require("./src/domain/entities/patient");
const { RecordStatus } = require("./src/domain/enums/enum");
const patientRepository = require("./src/Infrastructure/Repositories/patient.repository");

/**
 * 2) Dentist Testing Suite
 * Tests:
 * - Dashboard (stats and patient lists)
 * - Patient creation
 * - Patient editing
 * - Patient deletion (soft delete)
 * - Search (by name, ID, service)
 * - Filtering (by branch, dentist, balance, status)
 */
describe("2) Dentist Testing Suite", () => {
    let createdPatientId;
    const testDentistId = "usr-dentist-01";
    const testBranchId = "br-bole-01";

    it("2.1 Patient Creation: Dentist creates patient with clinical details", async () => {
        const patientData = {
            fullName: "Kidus Mengistu",
            age: 32,
            contact: "+251911445566",
            serviceType: "Composite Restoration",
            initialFee: 850.00,
            remainingFee: 850.00,
            dentistId: testDentistId,
            branchId: testBranchId,
            status: RecordStatus.ACTIVE,
        };

        const created = await patientRepository.create(patientData);
        assert.ok(created);
        assert.ok(created.id);
        createdPatientId = created.id;
        assert.equal(created.name || created.fullName, "Kidus Mengistu");
        assert.equal(created.serviceType, "Composite Restoration");
        assert.equal(created.dentistId, testDentistId);
        assert.equal(created.branchId, testBranchId);
        assert.equal(created.status, RecordStatus.ACTIVE);
    });

    it("2.2 Dashboard: Retrieves dentist's active patient list and count", async () => {
        const dentistPatients = await patientRepository.findAll({
            dentistId: testDentistId,
            status: RecordStatus.ACTIVE,
        });

        assert.ok(Array.isArray(dentistPatients));
        const found = dentistPatients.find((p) => p.id === createdPatientId);
        assert.ok(found, "Created patient must appear in dentist dashboard");
        assert.equal(found.dentistId, testDentistId);
    });

    it("2.3 Patient Editing: Updates patient contact and procedure notes", async () => {
        const updated = await patientRepository.update(createdPatientId, {
            contact: "+251911998877",
            serviceType: "Molar Endodontic Therapy",
        });

        assert.ok(updated);
        assert.equal(updated.contact, "+251911998877");
        assert.equal(updated.serviceType, "Molar Endodontic Therapy");

        // Verify retrieval matches update
        const fetched = await patientRepository.findById(createdPatientId);
        assert.equal(fetched.contact, "+251911998877");
        assert.equal(fetched.serviceType, "Molar Endodontic Therapy");
    });

    it("2.4 Search: Locates patient by Name, ID, and Service Type", async () => {
        // Search by Name
        const nameResults = await patientRepository.findAll({ search: "Kidus" });
        assert.ok(nameResults.some((p) => p.id === createdPatientId));

        // Search by ID
        const idResults = await patientRepository.findAll({ search: createdPatientId });
        assert.ok(idResults.some((p) => p.id === createdPatientId));

        // Search by Service Type
        const serviceResults = await patientRepository.findAll({ search: "Endodontic" });
        assert.ok(serviceResults.some((p) => p.id === createdPatientId));
    });

    it("2.5 Filtering: Filters by Dentist, Branch, and Financial Balance", async () => {
        // Filter by Dentist
        const dentistResults = await patientRepository.findAll({ dentistId: testDentistId });
        assert.ok(dentistResults.every((p) => p.dentistId === testDentistId));

        // Filter by Branch
        const branchResults = await patientRepository.findAll({ branchId: testBranchId });
        assert.ok(branchResults.some((p) => p.id === createdPatientId));

        // Filter by Balance status
        const balanceResults = await patientRepository.findAll({ hasBalance: true });
        assert.ok(balanceResults.some((p) => p.id === createdPatientId));
    });

    it("2.6 Patient Deletion: Soft-deletes patient record preserving clinical audit history", async () => {
        const deleteResult = await patientRepository.softDelete(createdPatientId);
        assert.ok(deleteResult);
        assert.equal(deleteResult.success, true);
        assert.equal(deleteResult.auditLogged, true);

        // Soft-deleted patient must not be returned in default active query
        const activeList = await patientRepository.findAll({ status: RecordStatus.ACTIVE });
        const stillActive = activeList.some((p) => p.id === createdPatientId);
        assert.equal(stillActive, false, "Soft-deleted patient must not appear in active patient directory");

        // Standard lookup returns null for deleted record
        const directLookup = await patientRepository.findById(createdPatientId);
        assert.equal(directLookup, null, "Soft-deleted patient must return null on standard lookup");
    });
});

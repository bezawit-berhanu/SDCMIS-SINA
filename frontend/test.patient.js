import { describe, it } from "node:test";
import assert from "node:assert";

// Patient Filter and Search logic verification
function filterPatients(patients, { search = "", service = "", status = "", outstandingBalance = "", procedureState = "", branchId = "", dentistId = "" } = {}) {
    let result = [...patients];

    if (search.trim()) {
        const query = search.trim().toLowerCase();
        result = result.filter((p) => {
            const matchName = (p.name || p.fullName || "").toLowerCase().includes(query);
            const matchId = (p.id || "").toLowerCase().includes(query);
            const matchService = (p.serviceType || p.service_type || "").toLowerCase().includes(query);
            return matchName || matchId || matchService;
        });
    }

    if (service) {
        result = result.filter((p) => (p.serviceType || p.service_type || "").toLowerCase().includes(service.toLowerCase()));
    }

    if (status) {
        result = result.filter((p) => (p.status || p.recordStatus) === status);
    }

    if (outstandingBalance === "HAS_BALANCE") {
        result = result.filter((p) => Number(p.remainingFee || p.balance || 0) > 0);
    } else if (outstandingBalance === "PAID") {
        result = result.filter((p) => Number(p.remainingFee || p.balance || 0) <= 0);
    }

    if (procedureState) {
        const reqState = procedureState.toUpperCase();
        result = result.filter((p) => (p.procedures || []).some((proc) => (proc.status || "").toUpperCase() === reqState));
    }

    if (branchId) {
        result = result.filter((p) => p.branchId === branchId || (p.branch && p.branch.id === branchId));
    }

    if (dentistId) {
        result = result.filter((p) => p.dentistId === dentistId || (p.dentist && p.dentist.id === dentistId));
    }

    return result;
}

const mockPatients = [
    {
        id: "pat-1001",
        name: "Abebe Bikila",
        age: 34,
        contact: "+251911445566",
        serviceType: "Orthodontics",
        remainingFee: 1200.00,
        status: "ACTIVE",
        branchId: "br-001",
        dentistId: "dent-001",
        procedures: [{ id: "pr-1", status: "ONGOING" }, { id: "pr-2", status: "NEXT" }],
    },
    {
        id: "pat-1002",
        name: "Fatima Zahra",
        age: 28,
        contact: "+251922556677",
        serviceType: "Root Canal Therapy",
        remainingFee: 0.00,
        status: "ACTIVE",
        branchId: "br-001",
        dentistId: "dent-002",
        procedures: [{ id: "pr-3", status: "DONE" }],
    },
    {
        id: "pat-1003",
        name: "Yohannes Haile",
        age: 45,
        contact: "+251933667788",
        serviceType: "Dental Implant",
        remainingFee: 3500.00,
        status: "ACTIVE",
        branchId: "br-002",
        dentistId: "dent-003",
        procedures: [{ id: "pr-4", status: "ONGOING" }],
    },
    {
        id: "pat-1004",
        name: "Tigist Demissie",
        age: 22,
        contact: "+251944778899",
        serviceType: "Teeth Whitening",
        remainingFee: 0.00,
        status: "INACTIVE",
        branchId: "br-003",
        dentistId: "dent-004",
        procedures: [{ id: "pr-5", status: "DONE" }],
    },
];

describe("Frontend Patient Management & Search/Filter Suite", () => {
    // ----------------------------------------------------
    // Task 8: Search
    // ----------------------------------------------------
    describe("Task 8: Search Functionality", () => {
        it("searches by Name", () => {
            const results = filterPatients(mockPatients, { search: "Abebe" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, "Abebe Bikila");
        });

        it("searches by Patient ID", () => {
            const results = filterPatients(mockPatients, { search: "pat-1003" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, "Yohannes Haile");
        });

        it("searches by Service Type", () => {
            const results = filterPatients(mockPatients, { search: "Whitening" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, "Tigist Demissie");
        });
    });

    // ----------------------------------------------------
    // Task 9: Filter
    // ----------------------------------------------------
    describe("Task 9: Filter Functionality", () => {
        it("filters by Service", () => {
            const results = filterPatients(mockPatients, { service: "Root Canal" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].id, "pat-1002");
        });

        it("filters by Status", () => {
            const active = filterPatients(mockPatients, { status: "ACTIVE" });
            assert.strictEqual(active.length, 3);

            const inactive = filterPatients(mockPatients, { status: "INACTIVE" });
            assert.strictEqual(inactive.length, 1);
            assert.strictEqual(inactive[0].id, "pat-1004");
        });

        it("filters by Outstanding Balance (HAS_BALANCE)", () => {
            const withBal = filterPatients(mockPatients, { outstandingBalance: "HAS_BALANCE" });
            assert.strictEqual(withBal.length, 2);
            assert.ok(withBal.every((p) => p.remainingFee > 0));
        });

        it("filters by Outstanding Balance (PAID)", () => {
            const paid = filterPatients(mockPatients, { outstandingBalance: "PAID" });
            assert.strictEqual(paid.length, 2);
            assert.ok(paid.every((p) => p.remainingFee === 0));
        });

        it("filters by Procedure State (ONGOING)", () => {
            const ongoing = filterPatients(mockPatients, { procedureState: "ONGOING" });
            assert.strictEqual(ongoing.length, 2);
        });

        it("filters by Procedure State (DONE)", () => {
            const done = filterPatients(mockPatients, { procedureState: "DONE" });
            assert.strictEqual(done.length, 2);
        });
    });

    // ----------------------------------------------------
    // Task 10 & 11: Branch and Dentist Management and Filtering
    // ----------------------------------------------------
    describe("Tasks 10 & 11: Branch and Dentist Filtering", () => {
        it("filters by Branch only", () => {
            const results = filterPatients(mockPatients, { branchId: "br-001" });
            assert.strictEqual(results.length, 2);
            assert.ok(results.every((p) => p.branchId === "br-001"));
        });

        it("filters by Dentist only", () => {
            const results = filterPatients(mockPatients, { dentistId: "dent-003" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, "Yohannes Haile");
        });

        it("allows simultaneous branch + dentist filtering", () => {
            const results = filterPatients(mockPatients, { branchId: "br-001", dentistId: "dent-002" });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].name, "Fatima Zahra");
        });

        it("ensures search works together with Branch and Dentist filters", () => {
            const results = filterPatients(mockPatients, {
                search: "Abebe",
                branchId: "br-001",
                dentistId: "dent-001",
            });
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].id, "pat-1001");
        });

        it("returns empty result ('No patients found') when branch and dentist do not match", () => {
            const results = filterPatients(mockPatients, {
                branchId: "br-002",
                dentistId: "dent-001", // dent-001 is at br-001, not br-002
            });
            assert.strictEqual(results.length, 0);
        });
    });

    // ----------------------------------------------------
    // Validation Rules (Tasks 4 & 6)
    // ----------------------------------------------------
    describe("Tasks 4 & 6: Form Validation Logic", () => {
        function validatePatientForm(data) {
            const errors = {};
            if (!data.name || !data.name.trim()) errors.name = "Patient name is required.";
            if (data.name && data.name.trim().length > 120) errors.name = "Name must not exceed 120 characters.";

            const age = Number(data.age);
            if (data.age === "" || data.age === null || Number.isNaN(age)) errors.age = "Valid age is required.";
            else if (age < 0 || age > 150) errors.age = "Age must be between 0 and 150.";

            if (!data.contact || !data.contact.trim()) errors.contact = "Contact is required.";
            else if (data.contact.trim().length < 3) errors.contact = "Contact must be at least 3 characters.";

            if (data.fee !== undefined && data.fee !== "") {
                const feeNum = Number(data.fee);
                if (Number.isNaN(feeNum) || feeNum < 0) errors.fee = "Fee must be non-negative.";
            }

            return { isValid: Object.keys(errors).length === 0, errors };
        }

        it("accepts valid patient registration payload", () => {
            const check = validatePatientForm({
                name: "Dawit Worku",
                age: 32,
                contact: "+251911223344",
                fee: 150.00,
            });
            assert.strictEqual(check.isValid, true);
        });

        it("rejects blank name and out-of-range age", () => {
            const check = validatePatientForm({
                name: "",
                age: 200,
                contact: "0911",
            });
            assert.strictEqual(check.isValid, false);
            assert.ok(check.errors.name);
            assert.ok(check.errors.age);
        });

        it("rejects negative fee", () => {
            const check = validatePatientForm({
                name: "Sara",
                age: 25,
                contact: "+251911000000",
                fee: -50.00,
            });
            assert.strictEqual(check.isValid, false);
            assert.ok(check.errors.fee);
        });
    });
});

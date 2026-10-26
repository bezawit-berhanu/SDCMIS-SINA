const { describe, it, after } = require("node:test");
const assert = require("node:assert");

const container = require("./src/container/container");
const Procedure = require("./src/domain/entities/procedure");
const Payment = require("./src/domain/entities/payment");
const { ProcedureStatus, UserRole } = require("./src/domain/enums/enum");
const BalanceCalculator = require("./src/domain/services/balance.calculator");

describe("Clinical Procedure & Finance Management Sprint - Comprehensive E2E Verification", () => {
    after(async () => {
        try {
            if (container.prisma?.$disconnect) {
                await container.prisma.$disconnect();
            }
        } catch (_) {}
    });

    let testPatientId = "pat-1001"; // Abebe Kebede from seed

    // ----------------------------------------------------
    // Task 1: Define Procedure Model Tree
    // ----------------------------------------------------
    describe("Task 1: Procedure Model Definition", () => {
        it("verifies Procedure model tree: ProcedureId, PatientId, Name, Description, Cost, Status, TargetDate, CompletedDate", () => {
            const proc = new Procedure({
                ProcedureId: "proc-9999",
                PatientId: "pat-1001",
                Name: "Gingival Flap Surgery",
                Description: "Pocket reduction surgery with osseous recontouring",
                Cost: 850.00,
                Status: ProcedureStatus.NEXT,
                TargetDate: new Date("2026-11-20"),
                CompletedDate: null,
            });

            assert.strictEqual(proc.ProcedureId, "proc-9999");
            assert.strictEqual(proc.PatientId, "pat-1001");
            assert.strictEqual(proc.Name, "Gingival Flap Surgery");
            assert.strictEqual(proc.Description, "Pocket reduction surgery with osseous recontouring");
            assert.strictEqual(proc.Cost, 850.00);
            assert.strictEqual(proc.Status, ProcedureStatus.NEXT);
            assert.ok(proc.TargetDate instanceof Date);
            assert.strictEqual(proc.CompletedDate, null);
        });
    });

    // ----------------------------------------------------
    // Task 2: Next Procedure CRUD & Single Next Rule
    // ----------------------------------------------------
    describe("Task 2: Next Procedure CRUD and Single Next Constraint", () => {
        let createdProcId;

        it("enforces rule: Only one next procedure per patient (rejects duplicate NEXT)", async () => {
            // Patient pat-1001 already has proc-102 with status NEXT
            await assert.rejects(async () => {
                await container.createNextProcedure.execute({
                    patientId: testPatientId,
                    name: "Second Next Treatment",
                    description: "Duplicate next attempt",
                    cost: 300.00,
                });
            }, /Only one next procedure per patient is allowed/);
        });

        it("CRUD: Read - retrieves procedures list and segregates next, ongoing, done", async () => {
            const overview = await container.getProceduresByPatient.execute(testPatientId);
            assert.ok(overview.procedures.length >= 2);
            assert.ok(overview.nextProcedure);
            assert.strictEqual(overview.nextProcedure.status, ProcedureStatus.NEXT);
            assert.ok(overview.ongoingProcedure);
            assert.strictEqual(overview.ongoingProcedure.status, ProcedureStatus.ONGOING);
        });

        it("CRUD: Update - modifies procedure attributes and resyncs patient balance", async () => {
            const existingNext = await container.procedureRepository.findNextByPatientId(testPatientId);
            assert.ok(existingNext);

            const updatedResult = await container.updateProcedure.execute(existingNext.id, {
                name: "Updated Archwire Adjustment",
                cost: 950.00,
            });

            assert.strictEqual(updatedResult.procedure.name, "Updated Archwire Adjustment");
            assert.strictEqual(updatedResult.procedure.cost, 950.00);
        });
    });

    // ----------------------------------------------------
    // Task 3: Procedure Status Verification (NEXT, ONGOING, DONE)
    // ----------------------------------------------------
    describe("Task 3: Procedure Status Enumeration Verification", () => {
        it("verifies ProcedureStatus includes NEXT, ONGOING, and DONE", () => {
            assert.strictEqual(ProcedureStatus.NEXT, "NEXT");
            assert.strictEqual(ProcedureStatus.ONGOING, "ONGOING");
            assert.strictEqual(ProcedureStatus.DONE, "DONE");
        });
    });

    // ----------------------------------------------------
    // Task 4: Ongoing Procedure (Next -> Ongoing)
    // ----------------------------------------------------
    describe("Task 4: Next -> Ongoing Transition", () => {
        it("transitions procedure status from Next to Ongoing", async () => {
            const nextProc = await container.procedureRepository.findNextByPatientId(testPatientId);
            assert.ok(nextProc);

            const result = await container.startOngoingProcedure.execute({
                procedureId: nextProc.id,
            });

            assert.strictEqual(result.procedure.status, ProcedureStatus.ONGOING);
            assert.strictEqual(result.procedure.Status, ProcedureStatus.ONGOING);
        });
    });

    // ----------------------------------------------------
    // Task 5: Complete Procedure (Ongoing -> Done)
    // ----------------------------------------------------
    describe("Task 5: Ongoing -> Done Transition", () => {
        it("sets procedure status from ongoing to done and timestamps CompletedDate", async () => {
            const ongoingProc = await container.procedureRepository.findOngoingByPatientId(testPatientId);
            assert.ok(ongoingProc);

            const completionTime = new Date("2026-10-26T14:00:00Z");
            const result = await container.completeProcedure.execute({
                procedureId: ongoingProc.id,
                completionDate: completionTime,
            });

            assert.strictEqual(result.procedure.status, ProcedureStatus.DONE);
            assert.strictEqual(result.procedure.Status, ProcedureStatus.DONE);
            assert.ok(result.procedure.completedDate);
        });
    });

    // ----------------------------------------------------
    // Task 6: Payment Model Definition
    // ----------------------------------------------------
    describe("Task 6: Payment Model Definition", () => {
        it("verifies Payment model tree: PaymentId, PatientId, Amount, PaymentDate, RecordedBy", () => {
            const paymentDate = new Date("2026-10-26T12:00:00Z");
            const payment = new Payment({
                PaymentId: "pay-777",
                PatientId: "pat-1001",
                Amount: 500.00,
                PaymentDate: paymentDate,
                RecordedBy: "usr-rec-01",
            });

            assert.strictEqual(payment.PaymentId, "pay-777");
            assert.strictEqual(payment.PatientId, "pat-1001");
            assert.strictEqual(payment.Amount, 500.00);
            assert.deepStrictEqual(payment.PaymentDate, paymentDate);
            assert.strictEqual(payment.RecordedBy, "usr-rec-01");
        });
    });

    // ----------------------------------------------------
    // Task 7: Record Payment Authorization & Validation
    // ----------------------------------------------------
    describe("Task 7: Record Payment Implementation & Validations", () => {
        it("allows Receptionist to record payment with valid amount", async () => {
            const result = await container.recordPayment.execute(
                {
                    patientId: testPatientId,
                    amount: 200.00,
                    PaymentDate: new Date("2026-10-26"),
                },
                { id: "usr-rec-01", fullName: "Almaz Kebede", role: UserRole.RECEPTIONIST }
            );

            assert.ok(result.payment);
            assert.strictEqual(result.payment.amount, 200.00);
            assert.strictEqual(result.payment.patientId, testPatientId);
        });

        it("allows Dentist to record payment", async () => {
            const result = await container.recordPayment.execute(
                {
                    patientId: testPatientId,
                    amount: 150.00,
                    PaymentDate: new Date("2026-10-26"),
                },
                { id: "dent-001", fullName: "Dr. Hanna Tadesse", role: UserRole.DENTIST }
            );

            assert.ok(result.payment);
            assert.strictEqual(result.payment.amount, 150.00);
        });

        it("rejects payment recording by unauthorized roles (e.g. CUSTOMER)", async () => {
            await assert.rejects(async () => {
                await container.recordPayment.execute(
                    { patientId: testPatientId, amount: 100.00 },
                    { id: "usr-cust-01", role: UserRole.CUSTOMER }
                );
            }, /Unauthorized: Only a Receptionist or Dentist can record payments/);
        });

        it("validates Amount > 0", async () => {
            await assert.rejects(async () => {
                await container.recordPayment.execute(
                    { patientId: testPatientId, amount: 0 },
                    { role: UserRole.RECEPTIONIST }
                );
            }, /Payment amount must be greater than zero/);

            await assert.rejects(async () => {
                await container.recordPayment.execute(
                    { patientId: testPatientId, amount: -25 },
                    { role: UserRole.RECEPTIONIST }
                );
            }, /Payment amount must be greater than zero/);
        });

        it("validates Patient Exists", async () => {
            await assert.rejects(async () => {
                await container.recordPayment.execute(
                    { patientId: "non-existent-patient-9999", amount: 100 },
                    { role: UserRole.RECEPTIONIST }
                );
            }, /does not exist/);
        });

        it("validates payment does not exceed permitted balance when enforcement is enabled", async () => {
            await assert.rejects(async () => {
                await container.recordPayment.execute(
                    {
                        patientId: testPatientId,
                        amount: 999999.00,
                        enforcePermittedBalance: true,
                    },
                    { role: UserRole.RECEPTIONIST }
                );
            }, /exceeds permitted outstanding balance/);
        });
    });

    // ----------------------------------------------------
    // Task 8: Balance Calculation
    // Remaining Fee = Total procedure Cost - Total Payments
    // ----------------------------------------------------
    describe("Task 8: Balance Calculation (Remaining Fee = Total procedure Cost - Total Payments)", () => {
        it("calculates Remaining Fee accurately: Total procedure Cost - Total Payments", async () => {
            const procedures = await container.procedureRepository.findByPatientId(testPatientId);
            const payments = await container.paymentRepository.findByPatientId(testPatientId);

            const totalCost = BalanceCalculator.calculateTotalProcedureCost(procedures);
            const totalPayments = BalanceCalculator.calculateTotalPayments(payments);
            const expectedRemainingFee = Number((totalCost - totalPayments).toFixed(2));

            const history = await container.getPaymentHistory.execute(testPatientId);
            assert.strictEqual(history.totalProcedureCost, totalCost);
            assert.strictEqual(history.totalPaid, totalPayments);
            assert.strictEqual(history.remainingFee, expectedRemainingFee);
        });
    });

    // ----------------------------------------------------
    // Task 9: Payment History Display (Amount, Due Date, Recorded by)
    // ----------------------------------------------------
    describe("Task 9: Payment History Ledger (Amount, Due Date, Recorded by)", () => {
        it("returns ledger displaying Amount, Due Date, and Recorded by for each transaction", async () => {
            const history = await container.getPaymentHistory.execute(testPatientId);
            assert.ok(Array.isArray(history.paymentHistory));
            assert.ok(history.paymentHistory.length > 0);

            const record = history.paymentHistory[0];
            assert.ok(record.Amount !== undefined, "Record must contain Amount");
            assert.ok(record.DueDate !== undefined || record.PaymentDate !== undefined, "Record must contain Due Date / Payment Date");
            assert.ok(record.RecordedBy !== undefined, "Record must contain Recorded by");
        });
    });
});

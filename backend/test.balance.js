const { describe, it } = require("node:test");
const assert = require("node:assert");
const BalanceCalculator = require("./src/domain/services/balance.calculator");
const Procedure = require("./src/domain/entities/procedure");
const Payment = require("./src/domain/entities/payment");
const { ProcedureStatus, RecordStatus } = require("./src/domain/enums/enum");

describe("Balance Calculation - Comprehensive Verification Suite (Task 8)", () => {
    describe("Total Procedure Cost Calculation", () => {
        it("computes sum of active procedure costs across diverse states", () => {
            const procedures = [
                new Procedure({
                    name: "Dental Cleaning",
                    description: "Scaling and polishing",
                    cost: 250.00,
                    status: ProcedureStatus.DONE,
                }),
                new Procedure({
                    name: "Filling",
                    description: "Composite resin restoration",
                    cost: 350.50,
                    status: ProcedureStatus.ONGOING,
                }),
                new Procedure({
                    name: "Crown",
                    description: "Porcelain crown preparation",
                    cost: 1200.00,
                    status: ProcedureStatus.NEXT,
                }),
            ];

            const total = BalanceCalculator.calculateTotalProcedureCost(procedures);
            assert.strictEqual(total, 1800.50);
        });

        it("ignores deleted procedures in cost summation", () => {
            const procedures = [
                new Procedure({
                    name: "Active Treatment",
                    description: "Active procedure",
                    cost: 500.00,
                    status: ProcedureStatus.ONGOING,
                }),
                new Procedure({
                    name: "Cancelled Treatment",
                    description: "Cancelled procedure",
                    cost: 999.00,
                    status: ProcedureStatus.NEXT,
                    recordStatus: RecordStatus.DELETED,
                }),
            ];

            const total = BalanceCalculator.calculateTotalProcedureCost(procedures);
            assert.strictEqual(total, 500.00);
        });
    });

    describe("Total Payments Calculation", () => {
        it("computes sum of active patient payments", () => {
            const payments = [
                new Payment({
                    PaymentId: "p-1",
                    PatientId: "pat-1",
                    Amount: 400.00,
                    RecordedBy: "usr-rec-01",
                }),
                new Payment({
                    PaymentId: "p-2",
                    PatientId: "pat-1",
                    Amount: 250.50,
                    RecordedBy: "usr-dentist-01",
                }),
            ];

            const total = BalanceCalculator.calculateTotalPayments(payments);
            assert.strictEqual(total, 650.50);
        });

        it("ignores deleted payment transactions", () => {
            const payments = [
                new Payment({
                    PaymentId: "p-1",
                    PatientId: "pat-1",
                    Amount: 300.00,
                    RecordedBy: "usr-rec-01",
                }),
                new Payment({
                    PaymentId: "p-void",
                    PatientId: "pat-1",
                    Amount: 700.00,
                    RecordedBy: "usr-rec-01",
                    recordStatus: RecordStatus.DELETED,
                }),
            ];

            const total = BalanceCalculator.calculateTotalPayments(payments);
            assert.strictEqual(total, 300.00);
        });
    });

    describe("Remaining Fee Calculation: Remaining Fee = Total procedure Cost - Total Payments", () => {
        it("accurately calculates remaining fee when payments are less than procedure costs", () => {
            const procedures = [
                new Procedure({ name: "Cleaning", description: "Cleaning", cost: 300.00 }),
                new Procedure({ name: "Filling", description: "Filling", cost: 500.00 }),
            ];
            const payments = [
                new Payment({ PatientId: "pat-1", Amount: 200.00, RecordedBy: "usr-rec" }),
            ];

            // 800 - 200 = 600
            const remainingFee = BalanceCalculator.calculateRemainingFee(procedures, payments);
            assert.strictEqual(remainingFee, 600.00);
        });

        it("calculates 0 remaining fee when payments equal total procedure cost", () => {
            const procedures = [
                new Procedure({ name: "Extraction", description: "Extraction", cost: 450.00 }),
            ];
            const payments = [
                new Payment({ PatientId: "pat-1", Amount: 450.00, RecordedBy: "usr-rec" }),
            ];

            const remainingFee = BalanceCalculator.calculateRemainingFee(procedures, payments);
            assert.strictEqual(remainingFee, 0.00);
        });

        it("calculates negative remaining fee (credit/overpayment) when payments exceed cost", () => {
            const procedures = [
                new Procedure({ name: "Checkup", description: "Checkup", cost: 100.00 }),
            ];
            const payments = [
                new Payment({ PatientId: "pat-1", Amount: 150.00, RecordedBy: "usr-rec" }),
            ];

            const remainingFee = BalanceCalculator.calculateRemainingFee(procedures, payments);
            assert.strictEqual(remainingFee, -50.00);
        });

        it("handles numeric inputs directly", () => {
            const remainingFee = BalanceCalculator.calculateRemainingFee(1500.75, 500.25);
            assert.strictEqual(remainingFee, 1000.50);
        });
    });
});

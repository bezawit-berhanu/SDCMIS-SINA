const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Payment = require("./src/domain/entities/payment");
const Procedure = require("./src/domain/entities/procedure");
const BalanceCalculator = require("./src/domain/services/balance.calculator");
const { RecordStatus } = require("./src/domain/enums/enum");

/**
 * 4) Financial Testing Suite
 * Tests:
 * - Payment creation
 * - Payment history
 * - Remaining fee
 * - Decimal calculations
 * - Invalid payment amounts
 */
describe("4) Financial Testing Suite — Billing & Ledger Precision", () => {
    const patientId = "pat-finance-001";
    let paymentsHistory = [];

    it("4.1 Payment Creation: Successfully records patient payment with ledger metadata", () => {
        const payment = new Payment({
            PaymentId: "pay-101",
            PatientId: patientId,
            Amount: 350.50,
            PaymentDate: new Date(),
            RecordedBy: "usr-receptionist-01",
        });

        assert.equal(payment.paymentId, "pay-101");
        assert.equal(payment.patientId, patientId);
        assert.equal(payment.amount, 350.50);
        assert.equal(payment.recordedBy, "usr-receptionist-01");
        assert.equal(payment.recordStatus, RecordStatus.ACTIVE);

        paymentsHistory.push(payment);
    });

    it("4.2 Payment History: Accumulates multiple payment transactions for patient", () => {
        const payment2 = new Payment({
            PaymentId: "pay-102",
            PatientId: patientId,
            Amount: 149.50,
            PaymentDate: new Date(),
            RecordedBy: "usr-receptionist-01",
        });
        paymentsHistory.push(payment2);

        assert.equal(paymentsHistory.length, 2);
        const totalPaid = BalanceCalculator.calculateTotalPayments(paymentsHistory);
        assert.equal(totalPaid, 500.00);
    });

    it("4.3 Remaining Fee Calculation: Remaining Fee = Total Procedure Cost - Total Payments", () => {
        const procedures = [
            new Procedure({ name: "Consultation", cost: 200.00 }),
            new Procedure({ name: "Root Canal", cost: 650.00 }),
        ]; // Total cost = 850.00

        // Remaining Fee = 850.00 - 500.00 = 350.00
        const remainingFee = BalanceCalculator.calculateRemainingFee(procedures, paymentsHistory);
        assert.equal(remainingFee, 350.00);
    });

    it("4.4 Decimal Calculations: Preserves exact two-decimal precision without rounding drift", () => {
        const preciseProcedures = [
            new Procedure({ name: "Precision Proc 1", cost: 100.33 }),
            new Procedure({ name: "Precision Proc 2", cost: 200.33 }),
            new Procedure({ name: "Precision Proc 3", cost: 300.34 }),
        ]; // Sum = 601.00

        const totalCost = BalanceCalculator.calculateTotalProcedureCost(preciseProcedures);
        assert.equal(totalCost, 601.00);

        const payment = new Payment({ PatientId: patientId, Amount: 300.55 });
        const remaining = BalanceCalculator.calculateRemainingFee(totalCost, [payment]);
        assert.equal(remaining, 300.45);
    });

    it("4.5 Invalid Payment Amounts: Rejects zero, negative, and non-numeric amounts", () => {
        // Zero amount rejection
        assert.throws(() => {
            new Payment({ PatientId: patientId, Amount: 0 });
        }, /Payment amount must be greater than zero/i);

        // Negative amount rejection
        assert.throws(() => {
            new Payment({ PatientId: patientId, Amount: -75.00 });
        }, /Payment amount must be greater than zero/i);

        // Non-numeric amount rejection
        assert.throws(() => {
            new Payment({ PatientId: patientId, Amount: "not-a-number" });
        }, /Payment amount must be greater than zero/i);
    });
});

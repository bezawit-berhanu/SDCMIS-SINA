const { describe, it } = require("node:test");
const assert = require("node:assert");
const Payment = require("./src/domain/entities/payment");
const { RecordStatus } = require("./src/domain/enums/enum");

describe("Payment Model - Comprehensive Verification Suite", () => {
    describe("Model Structure: Payment Tree Verification", () => {
        it("instantiates Payment with all required tree attributes (PaymentId, PatientId, Amount, PaymentDate, RecordedBy)", () => {
            const now = new Date("2026-10-26T10:00:00.000Z");
            const payment = new Payment({
                PaymentId: "pay-1001",
                PatientId: "pat-2002",
                Amount: 350.50,
                PaymentDate: now,
                RecordedBy: "usr-rec-01",
            });

            assert.strictEqual(payment.PaymentId, "pay-1001");
            assert.strictEqual(payment.paymentId, "pay-1001");
            assert.strictEqual(payment.id, "pay-1001");

            assert.strictEqual(payment.PatientId, "pat-2002");
            assert.strictEqual(payment.patientId, "pat-2002");

            assert.strictEqual(payment.Amount, 350.50);
            assert.strictEqual(payment.amount, 350.50);

            assert.strictEqual(payment.PaymentDate.toISOString(), now.toISOString());
            assert.strictEqual(payment.paymentDate.toISOString(), now.toISOString());

            assert.strictEqual(payment.RecordedBy, "usr-rec-01");
            assert.strictEqual(payment.recordedBy, "usr-rec-01");
            assert.strictEqual(payment.recordedByUserId, "usr-rec-01");
        });

        it("serializes to safe object containing tree definitions and canonical properties", () => {
            const payment = new Payment({
                PaymentId: "pay-1002",
                PatientId: "pat-2002",
                Amount: 120.00,
                PaymentDate: new Date("2026-10-26"),
                RecordedBy: "usr-dentist-01",
            });

            const safe = payment.toSafeObject();
            assert.strictEqual(safe.PaymentId, "pay-1002");
            assert.strictEqual(safe.PatientId, "pat-2002");
            assert.strictEqual(safe.Amount, 120.00);
            assert.strictEqual(safe.RecordedBy, "usr-dentist-01");
            assert.strictEqual(safe.amount, 120.00);
            assert.strictEqual(safe.recordStatus, RecordStatus.ACTIVE);
        });
    });

    describe("Payment Validation Rules", () => {
        it("rejects non-positive payment amount (amount <= 0)", () => {
            assert.throws(() => {
                new Payment({
                    PatientId: "pat-01",
                    Amount: 0,
                    RecordedBy: "usr-rec-01",
                });
            }, /Payment amount must be greater than zero/);

            assert.throws(() => {
                new Payment({
                    PatientId: "pat-01",
                    Amount: -50,
                    RecordedBy: "usr-rec-01",
                });
            }, /Payment amount must be greater than zero/);
        });

        it("rejects missing or empty PatientId", () => {
            assert.throws(() => {
                new Payment({
                    Amount: 100,
                    RecordedBy: "usr-rec-01",
                });
            }, /PatientId is required for payment/);

            assert.throws(() => {
                new Payment({
                    PatientId: "   ",
                    Amount: 100,
                    RecordedBy: "usr-rec-01",
                });
            }, /PatientId is required for payment/);
        });

        it("rejects invalid payment dates", () => {
            assert.throws(() => {
                new Payment({
                    PatientId: "pat-01",
                    Amount: 100,
                    PaymentDate: "not-a-valid-date",
                    RecordedBy: "usr-rec-01",
                });
            }, /Invalid payment date/);
        });
    });
});

/**
 * Balance Calculator Domain Service
 * 
 * Core Clinical Finance Rule (Task 8, SRS BR-17, BR-18, Risk R-02):
 * Remaining Fee = Total procedure Cost - Total Payments
 * Uses integer-based fixed-point arithmetic in cents to prevent floating-point rounding errors.
 */
class BalanceCalculator {
    /**
     * Converts a monetary amount to integer cents to guarantee exact arithmetic.
     * @param {number|string} amount
     * @returns {number}
     */
    static toCents(amount) {
        if (amount === null || amount === undefined || amount === "") return 0;
        const num = Number(amount);
        if (Number.isNaN(num)) return 0;
        return Math.round(num * 100);
    }

    /**
     * Converts integer cents back to 2-decimal place fixed-point number.
     * @param {number} cents
     * @returns {number}
     */
    static fromCents(cents) {
        return Number((cents / 100).toFixed(2));
    }

    /**
     * Calculates total procedure cost across all active procedures
     * @param {Array} procedures 
     * @returns {number}
     */
    static calculateTotalProcedureCost(procedures = []) {
        if (!Array.isArray(procedures)) return 0;
        const totalCents = procedures.reduce((sumCents, p) => {
            if (!p) return sumCents;
            if (p.recordStatus === "DELETED" || p.record_status === "DELETED") return sumCents;
            const costVal = p.Cost !== undefined ? p.Cost : (p.cost !== undefined ? p.cost : 0);
            return sumCents + Math.max(0, this.toCents(costVal));
        }, 0);
        return this.fromCents(totalCents);
    }

    /**
     * Calculates total payments across all active payment records
     * @param {Array} payments 
     * @returns {number}
     */
    static calculateTotalPayments(payments = []) {
        if (!Array.isArray(payments)) return 0;
        const totalCents = payments.reduce((sumCents, p) => {
            if (!p) return sumCents;
            if (p.recordStatus === "DELETED" || p.record_status === "DELETED") return sumCents;
            const amountVal = p.Amount !== undefined ? p.Amount : (p.amount !== undefined ? p.amount : 0);
            return sumCents + Math.max(0, this.toCents(amountVal));
        }, 0);
        return this.fromCents(totalCents);
    }

    /**
     * Calculates Remaining Fee:
     * Remaining Fee = Total procedure Cost - Total Payments
     * @param {Array|number} proceduresOrCost 
     * @param {Array|number} paymentsOrTotal 
     * @returns {number}
     */
    static calculateRemainingFee(proceduresOrCost = 0, paymentsOrTotal = 0) {
        const costCents = typeof proceduresOrCost === "number"
            ? this.toCents(proceduresOrCost)
            : this.toCents(this.calculateTotalProcedureCost(proceduresOrCost));

        const paymentsCents = typeof paymentsOrTotal === "number"
            ? this.toCents(paymentsOrTotal)
            : this.toCents(this.calculateTotalPayments(paymentsOrTotal));

        const remainingCents = costCents - paymentsCents;
        return this.fromCents(remainingCents);
    }
}

module.exports = BalanceCalculator;

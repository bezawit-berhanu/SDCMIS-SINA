/**
 * Balance Calculator Domain Service
 * 
 * Core Clinical Finance Rule (Task 8):
 * Remaining Fee = Total procedure Cost - Total Payments
 */
class BalanceCalculator {
    /**
     * Calculates total procedure cost across all active procedures
     * @param {Array} procedures 
     * @returns {number}
     */
    static calculateTotalProcedureCost(procedures = []) {
        if (!Array.isArray(procedures)) return 0;
        const total = procedures.reduce((sum, p) => {
            if (!p) return sum;
            if (p.recordStatus === "DELETED" || p.record_status === "DELETED") return sum;
            const cost = Number(p.Cost !== undefined ? p.Cost : (p.cost !== undefined ? p.cost : 0));
            return sum + (Number.isNaN(cost) || cost < 0 ? 0 : cost);
        }, 0);
        return Number(total.toFixed(2));
    }

    /**
     * Calculates total payments across all active payment records
     * @param {Array} payments 
     * @returns {number}
     */
    static calculateTotalPayments(payments = []) {
        if (!Array.isArray(payments)) return 0;
        const total = payments.reduce((sum, p) => {
            if (!p) return sum;
            if (p.recordStatus === "DELETED" || p.record_status === "DELETED") return sum;
            const amount = Number(p.Amount !== undefined ? p.Amount : (p.amount !== undefined ? p.amount : 0));
            return sum + (Number.isNaN(amount) || amount < 0 ? 0 : amount);
        }, 0);
        return Number(total.toFixed(2));
    }

    /**
     * Calculates Remaining Fee:
     * Remaining Fee = Total procedure Cost - Total Payments
     * @param {Array|number} proceduresOrCost 
     * @param {Array|number} paymentsOrTotal 
     * @returns {number}
     */
    static calculateRemainingFee(proceduresOrCost = 0, paymentsOrTotal = 0) {
        const totalCost = typeof proceduresOrCost === "number"
            ? proceduresOrCost
            : this.calculateTotalProcedureCost(proceduresOrCost);

        const totalPayments = typeof paymentsOrTotal === "number"
            ? paymentsOrTotal
            : this.calculateTotalPayments(paymentsOrTotal);

        const remainingFee = totalCost - totalPayments;
        return Number(remainingFee.toFixed(2));
    }
}

module.exports = BalanceCalculator;

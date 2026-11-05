import { useState, useEffect, useMemo, useCallback } from "react";
import Button from "../components/common/Button";
import RecordPaymentModal from "../components/payment/RecordPaymentModal";
import apiClient from "../services/apiclient";
import { signalRService } from "../services/signalr.service";
import { FiCreditCard, FiCheck } from "react-icons/fi";

/**
 * SCR-11: Customers & Fees Screen
 * Accessible to: Receptionist
 * Allows searching, filtering, and sorting all customer fee balances,
 * and opening SCR-16 Record Payment modal per FR-REC-02 / FR-REC-08.
 */
export default function CustomerFeesPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [balanceFilter, setBalanceFilter] = useState("ALL"); // ALL, HAS_BALANCE, PAID
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
    const [feedback, setFeedback] = useState("");

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/api/v1/patients");
            if (res.data?.data && Array.isArray(res.data.data)) {
                setCustomers(res.data.data);
            } else if (Array.isArray(res.data?.patients)) {
                setCustomers(res.data.patients);
            } else {
                setCustomers([]);
            }
        } catch (_) {
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and SignalR real-time synchronization
    useEffect(() => {
        fetchCustomers();

        const unsubVisit = signalRService.on("VISIT_COMPLETED", () => {
            fetchCustomers();
        });
        const unsubQueue = signalRService.on("QUEUE_UPDATED", () => {
            fetchCustomers();
        });

        return () => {
            unsubVisit();
            unsubQueue();
        };
    }, [fetchCustomers]);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        return customers.filter((c) => {
            const matchesSearch =
                (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.phone || "").includes(searchQuery) ||
                (c.id || "").toLowerCase().includes(searchQuery.toLowerCase());

            const fee = Number(c.remainingFee || 0);
            const matchesFilter =
                balanceFilter === "ALL" ||
                (balanceFilter === "HAS_BALANCE" && fee > 0) ||
                (balanceFilter === "PAID" && fee <= 0);

            return matchesSearch && matchesFilter;
        });
    }, [customers, searchQuery, balanceFilter]);

    // Handle payment recorded successfully
    const handlePaymentSuccess = (paymentData) => {
        setCustomers((prev) =>
            prev.map((c) => {
                if (c.id === paymentData.patientId) {
                    const newPaid = Number(c.totalPaid || 0) + Number(paymentData.amount);
                    const newRemaining = Math.max(0, Number(c.totalCost || 0) - newPaid);
                    return {
                        ...c,
                        totalPaid: newPaid,
                        remainingFee: newRemaining,
                    };
                }
                return c;
            })
        );
        setSelectedCustomerForPayment(null);
        setFeedback(`Payment of ${Number(paymentData.amount).toFixed(2)} ETB successfully recorded.`);
        setTimeout(() => setFeedback(""), 4000);
    };

    const totalOutstandingClinicWide = useMemo(() => {
        return customers.reduce((acc, curr) => acc + Number(curr.remainingFee || 0), 0);
    }, [customers]);

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)", marginBottom: "0.25rem" }}>
                        Customers & Fee Balances
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Monitor outstanding patient fees, review balances, and record payments.
                    </p>
                </div>

                <div
                    style={{
                        padding: "0.75rem 1.25rem",
                        backgroundColor: "var(--bg-surface)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>
                        TOTAL CLINIC OUTSTANDING
                    </span>
                    <strong style={{ fontSize: "1.25rem", color: totalOutstandingClinicWide > 0 ? "#b91c1c" : "var(--primary)" }}>
                        {totalOutstandingClinicWide.toFixed(2)} ETB
                    </strong>
                </div>
            </div>

            {feedback && (
                <div
                    role="alert"
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        marginBottom: "1.25rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}
                >
                    <FiCheck />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <input
                    type="search"
                    placeholder="Search by patient name, phone, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: "1 1 300px",
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--bg-card)",
                        fontSize: "0.95rem",
                    }}
                />

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[
                        { id: "ALL", label: "All Customers" },
                        { id: "HAS_BALANCE", label: "Has Balance (> 0)" },
                        { id: "PAID", label: "Fully Settled" },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setBalanceFilter(btn.id)}
                            style={{
                                padding: "0.5rem 0.85rem",
                                borderRadius: "6px",
                                border: "1px solid",
                                borderColor: balanceFilter === btn.id ? "var(--primary)" : "var(--border)",
                                backgroundColor: balanceFilter === btn.id ? "var(--primary)" : "var(--bg-card)",
                                color: balanceFilter === btn.id ? "#ffffff" : "var(--text-main)",
                                fontWeight: "600",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customers Table */}
            <div className="card" style={{ padding: 0, overflowX: "auto", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        Loading customer records...
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        <FiCreditCard style={{ fontSize: "2rem", display: "block", margin: "0 auto 0.5rem", color: "var(--text-light)" }} />
                        <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>No customer fee records match your search or filter</p>
                        <p style={{ fontSize: "0.85rem", margin: "4px 0 0 0" }}>Patient balance ledger is clean or empty</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--bg-page)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Patient ID</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Name</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Contact</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Total Cost</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Total Paid</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700" }}>Remaining Fee</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "700", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((cust) => {
                                const fee = Number(cust.remainingFee || 0);
                                return (
                                    <tr key={cust.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                            {cust.id}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "var(--text-main)" }}>
                                            {cust.name}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>
                                            {cust.phone}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "var(--text-main)" }}>
                                            {Number(cust.totalCost || 0).toFixed(2)} ETB
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "var(--primary)", fontWeight: "600" }}>
                                            {Number(cust.totalPaid || 0).toFixed(2)} ETB
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem" }}>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "4px",
                                                    fontWeight: "700",
                                                    fontSize: "0.85rem",
                                                    backgroundColor: fee > 0 ? "rgba(220, 38, 38, 0.1)" : "rgba(27, 77, 46, 0.1)",
                                                    color: fee > 0 ? "#991b1b" : "var(--primary)",
                                                    border: "1px solid var(--border)"
                                                }}
                                            >
                                                {fee.toFixed(2)} ETB
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => setSelectedCustomerForPayment(cust)}
                                                icon={<FiCreditCard />}
                                            >
                                                Record Payment
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* SCR-16 Record Payment Modal */}
            {selectedCustomerForPayment && (
                <RecordPaymentModal
                    patient={selectedCustomerForPayment}
                    onClose={() => setSelectedCustomerForPayment(null)}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
}

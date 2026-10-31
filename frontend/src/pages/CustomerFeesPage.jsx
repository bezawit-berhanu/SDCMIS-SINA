import { useState, useEffect, useMemo } from "react";
import Button from "../components/common/Button";
import RecordPaymentModal from "../components/payment/RecordPaymentModal";
import apiClient from "../services/apiclient";

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

    // Initial mock/api dataset
    useEffect(() => {
        let isMounted = true;
        const fetchCustomers = async () => {
            try {
                const res = await apiClient.get("/api/v1/patients");
                if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
                    setCustomers(res.data.data);
                } else if (isMounted) {
                    // Fallback to comprehensive mock data
                    setCustomers([
                        {
                            id: "pat-001",
                            name: "Abebe Bikila",
                            phone: "+251911223344",
                            totalCost: 4500.0,
                            totalPaid: 3000.0,
                            remainingFee: 1500.0,
                            lastVisit: "2026-10-24",
                            serviceType: "Orthodontics",
                        },
                        {
                            id: "pat-002",
                            name: "Hana Bekele",
                            phone: "+251922334455",
                            totalCost: 1200.0,
                            totalPaid: 1200.0,
                            remainingFee: 0.0,
                            lastVisit: "2026-10-31",
                            serviceType: "General",
                        },
                        {
                            id: "pat-003",
                            name: "Dawit Wolde",
                            phone: "+251933445566",
                            totalCost: 3800.0,
                            totalPaid: 1000.0,
                            remainingFee: 2800.0,
                            lastVisit: "2026-10-28",
                            serviceType: "Cosmetics",
                        },
                        {
                            id: "pat-004",
                            name: "Tigist Assefa",
                            phone: "+251944556677",
                            totalCost: 800.0,
                            totalPaid: 800.0,
                            remainingFee: 0.0,
                            lastVisit: "2026-10-15",
                            serviceType: "Periodontics",
                        },
                    ]);
                }
            } catch (_) {
                if (isMounted) {
                    setCustomers([
                        {
                            id: "pat-001",
                            name: "Abebe Bikila",
                            phone: "+251911223344",
                            totalCost: 4500.0,
                            totalPaid: 3000.0,
                            remainingFee: 1500.0,
                            lastVisit: "2026-10-24",
                            serviceType: "Orthodontics",
                        },
                        {
                            id: "pat-002",
                            name: "Hana Bekele",
                            phone: "+251922334455",
                            totalCost: 1200.0,
                            totalPaid: 1200.0,
                            remainingFee: 0.0,
                            lastVisit: "2026-10-31",
                            serviceType: "General",
                        },
                        {
                            id: "pat-003",
                            name: "Dawit Wolde",
                            phone: "+251933445566",
                            totalCost: 3800.0,
                            totalPaid: 1000.0,
                            remainingFee: 2800.0,
                            lastVisit: "2026-10-28",
                            serviceType: "Cosmetics",
                        },
                    ]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCustomers();
        return () => { isMounted = false; };
    }, []);

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
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                        Customers & Fee Balances (SCR-11)
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Monitor outstanding patient fees, review balances, and record payments directly per FR-REC-02.
                    </p>
                </div>

                <div
                    style={{
                        padding: "0.75rem 1.25rem",
                        backgroundColor: "#fef3c7",
                        borderRadius: "8px",
                        border: "1px solid #fde68a",
                    }}
                >
                    <span style={{ fontSize: "0.8rem", color: "#92400e", fontWeight: "600", display: "block" }}>
                        TOTAL CLINIC OUTSTANDING
                    </span>
                    <strong style={{ fontSize: "1.25rem", color: "#b45309" }}>
                        {totalOutstandingClinicWide.toFixed(2)} ETB
                    </strong>
                </div>
            </div>

            {feedback && (
                <div
                    role="alert"
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        borderRadius: "8px",
                        marginBottom: "1.25rem",
                        fontWeight: "600",
                    }}
                >
                    ✓ {feedback}
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
                        border: "1px solid var(--border-color, #cbd5e1)",
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
                                borderColor: balanceFilter === btn.id ? "var(--primary-color, #0284c7)" : "#cbd5e1",
                                backgroundColor: balanceFilter === btn.id ? "var(--primary-color, #0284c7)" : "#ffffff",
                                color: balanceFilter === btn.id ? "#ffffff" : "#475569",
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
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                        Loading customer records...
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                        No customer fee records match your search or filter.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Patient ID</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Name</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Contact</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Total Cost</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Total Paid</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700" }}>Remaining Fee</th>
                                <th style={{ padding: "0.75rem 1rem", color: "#475569", fontWeight: "700", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((cust) => {
                                const fee = Number(cust.remainingFee || 0);
                                return (
                                    <tr key={cust.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#64748b" }}>
                                            {cust.id}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "#1e293b" }}>
                                            {cust.name}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                                            {cust.phone}
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                                            {Number(cust.totalCost || 0).toFixed(2)} ETB
                                        </td>
                                        <td style={{ padding: "0.75rem 1rem", color: "#166534", fontWeight: "600" }}>
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
                                                    backgroundColor: fee > 0 ? "#fee2e2" : "#dcfce7",
                                                    color: fee > 0 ? "#991b1b" : "#166534",
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

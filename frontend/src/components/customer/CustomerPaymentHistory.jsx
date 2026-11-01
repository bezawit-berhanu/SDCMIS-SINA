/**
 * CustomerPaymentHistory
 * Accessible to: Customer
 * Displays verified customer payments and receipts per FR-CUS-01 / Balance section.
 */
export default function CustomerPaymentHistory({ payments = [], remainingFee = 0 }) {
    return (
        <div className="card" style={{ marginTop: "1rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h3 className="card__title" style={{ color: "var(--primary)" }}>Payment Receipts & History</h3>
                    <p className="card__subtitle">Official clinic receipts for completed settlements</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                        Remaining Balance
                    </span>
                    <strong style={{ fontSize: "1.1rem", color: remainingFee > 0 ? "#b91c1c" : "var(--primary)" }}>
                        {Number(remainingFee).toFixed(2)} ETB
                    </strong>
                </div>
            </div>

            {payments.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)", margin: "0.5rem" }}>
                    No payment receipts found for this account.
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-page)" }}>
                                <th style={{ padding: "8px 12px", color: "var(--text-muted)" }}>Receipt #</th>
                                <th style={{ padding: "8px 12px", color: "var(--text-muted)" }}>Date</th>
                                <th style={{ padding: "8px 12px", color: "var(--text-muted)" }}>Method</th>
                                <th style={{ padding: "8px 12px", color: "var(--text-muted)", textAlign: "right" }}>Amount</th>
                                <th style={{ padding: "8px 12px", color: "var(--text-muted)", textAlign: "center" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, idx) => (
                                <tr key={p.id || idx} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600 }}>{p.id}</td>
                                    <td style={{ padding: "8px 12px" }}>{p.date}</td>
                                    <td style={{ padding: "8px 12px" }}>{p.method || "Cash"}</td>
                                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                                        {typeof p.amount === "number" ? `${p.amount.toFixed(2)} ETB` : p.amount}
                                    </td>
                                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                padding: "2px 6px",
                                                borderRadius: "4px",
                                                backgroundColor: "rgba(27, 77, 46, 0.1)",
                                                color: "var(--primary)",
                                                border: "1px solid var(--border)",
                                            }}
                                        >
                                            {p.status || "VERIFIED"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

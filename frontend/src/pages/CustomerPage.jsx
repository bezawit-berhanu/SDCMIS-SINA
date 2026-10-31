import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import CustomerQueueWidget from "../components/customer/CustomerQueueWidget";
import customerService from "../services/customer.service";
import { realtimeService } from "../services/realtime.service";
import CustomerReadOnlyNotice from "../components/customer/CustomerReadOnlyNotice";

/**
 * Customer Dashboard UI
 * Required Hierarchy:
 * My Information
 *       ↓
 * Treatment
 *       ↓
 * Next Procedure
 *       ↓
 * Appointment
 *       ↓
 * Balance
 */
export default function CustomerPage() {
    const { user, restoreSession } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    const loadDashboard = async () => {
        try {
            const data = await customerService.getCustomerDashboard();
            setDashboardData(data);
        } catch (_) {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();

        // Connect customer to real-time gateway for instant queue & appointment alerts
        realtimeService.connect({
            role: "CUSTOMER",
            userId: user?.id,
        });

        const unsubQueue = customerService.subscribeLiveQueueUpdates(() => {
            loadDashboard();
        });

        return () => {
            unsubQueue();
        };
    }, [user]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await restoreSession();
            await loadDashboard();
        } finally {
            setTimeout(() => setRefreshing(false), 400);
        }
    };

    const myInfo = dashboardData?.myInformation || {
        patientId: user?.linkedPatientId || "pat-1003",
        name: user?.fullName || "Sara Tadesse",
        age: 32,
        contact: user?.email || "+251 91 122 3344",
        serviceType: "Composite Filling & Restoration",
        status: "ACTIVE",
        dentist: "Dr. Sara (General Dental Practitioner)",
        branch: "Central Bole Clinic",
    };

    const treatment = dashboardData?.treatment || {
        procedures: [
            { id: "TRT-01", description: "Comprehensive Oral Examination", date: "Oct 10, 2026", cost: "$120.00", status: "DONE" },
            { id: "TRT-02", description: "Digital Dental Bitewing X-Rays (4 Views)", date: "Oct 10, 2026", cost: "$65.00", status: "DONE" },
            { id: "TRT-03", description: "Composite Resin Filling (Lower Left)", date: "Oct 24, 2026", cost: "$150.00", status: "ONGOING" },
        ],
        completedCount: 2,
    };

    const nextProc = dashboardData?.nextProcedure || {
        id: "PROC-NEXT-01",
        description: "Post-restoration occlusal polishing & seal check",
        scheduledDate: "Nov 05, 2026",
        status: "NEXT",
        estimatedDuration: "30 mins",
    };

    const appointment = dashboardData?.appointment || {
        upcoming: [
            { id: "APP-301", date: "Nov 05, 2026", time: "10:30 AM", provider: "Dr. Sara", type: "Follow-up Examination" },
        ],
        attended: [
            { id: "APP-201", date: "Oct 10, 2026", time: "09:00 AM", provider: "Dr. Sara", type: "Routine Cleaning" },
        ],
    };

    const balance = dashboardData?.balance || {
        remainingFee: 45.00,
        balance: 45.00,
        totalPaid: 290.00,
        payments: [
            { id: "RCP-101", amount: "$120.00", date: "Oct 10, 2026", method: "Card", status: "VERIFIED" },
            { id: "RCP-102", amount: "$170.00", date: "Oct 24, 2026", method: "Cash", status: "VERIFIED" },
        ],
    };

    return (
        <PageContainer
            title={user ? `Patient Portal — Welcome, ${user.fullName}` : "Patient Customer Portal"}
            subtitle="Your personal clinical chart, treatment timeline, scheduled visits, and account summary"
            actions={
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? "Refreshing..." : "🔄 Refresh"}
                </Button>
            }
        >
            {/* FR-CUS-01 Alt 1: Unlinked Customer Account Notice */}
            {user?.linkedPatientId === null && (
                <div
                    role="alert"
                    style={{
                        padding: "1rem 1.25rem",
                        backgroundColor: "#fef3c7",
                        borderLeft: "4px solid #f59e0b",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        color: "#92400e",
                    }}
                >
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: "700" }}>
                        Account Pending Front-Desk Linking (FR-CUS-01 Alt 1)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                        Your self-service account is active, but not yet linked to your clinic dental record. Please provide your phone number or ID at the reception desk to sync your historical treatments and live queue ticket.
                    </p>
                </div>
            )}
            <CustomerReadOnlyNotice />
            {/* Task 4 & 5: Live Queue Status Widget */}
            <CustomerQueueWidget
                initialQueue={dashboardData?.queue}
                patientId={myInfo.patientId}
            />

            {/* Hierarchy Level 1: My Information */}
            <section
                data-testid="section-my-information"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid #2563eb" }}
            >
                <div className="card__header">
                    <h2 className="card__title">1. My Information</h2>
                    <p className="card__subtitle">Your verified personal patient profile and clinic registration</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Patient Full Name</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px" }}>{myInfo.name}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Patient ID / Chart #</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px", color: "var(--primary)" }}>{myInfo.patientId}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Contact Info</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px" }}>{myInfo.contact}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Assigned Dentist</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px", color: "#047857" }}>{myInfo.dentist || "Dr. Sara"}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Registered Branch</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px" }}>{myInfo.branch || "Central Bole Clinic"}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Record Status</p>
                        <span style={{ display: "inline-block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", backgroundColor: "#dcfce7", padding: "2px 8px", borderRadius: "4px", marginTop: "4px" }}>
                            {myInfo.status}
                        </span>
                    </div>
                </div>
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "#94a3b8", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 2: Treatment */}
            <section
                data-testid="section-treatment"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid #0891b2" }}
            >
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title">2. Treatment History & Procedures</h2>
                        <p className="card__subtitle">Comprehensive dental care records and active procedures</p>
                    </div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {treatment.completedCount} Completed
                    </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(treatment.procedures || []).map((proc, index) => (
                        <div
                            key={proc.id || index}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.875rem",
                                backgroundColor: "var(--bg-page)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <div>
                                <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: 0 }}>
                                    {proc.description || proc.type || "Clinical Dental Procedure"}
                                </p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                                    {proc.date || "Recent visit"} {proc.cost ? `• ${proc.cost}` : proc.fee ? `• $${Number(proc.fee).toFixed(2)}` : ""}
                                </p>
                            </div>
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    backgroundColor: proc.status === "DONE" || proc.status === "COMPLETED" ? "#dcfce7" : proc.status === "ONGOING" ? "#e0f2fe" : "#fef3c7",
                                    color: proc.status === "DONE" || proc.status === "COMPLETED" ? "#166534" : proc.status === "ONGOING" ? "#0369a1" : "#92400e",
                                }}
                            >
                                {proc.status}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "#94a3b8", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 3: Next Procedure */}
            <section
                data-testid="section-next-procedure"
                className="card"
                style={{
                    marginBottom: "1.5rem",
                    borderLeft: "4px solid #7c3aed",
                    backgroundColor: "#faf5ff",
                }}
            >
                <div className="card__header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.25rem" }}>🦷</span>
                        <div>
                            <h2 className="card__title" style={{ color: "#5b21b6" }}>3. Next Procedure</h2>
                            <p className="card__subtitle">Your upcoming planned clinical operation</p>
                        </div>
                    </div>
                </div>
                {nextProc ? (
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor: "white",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid #ddd6fe",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#4c1d95", margin: 0 }}>
                                {nextProc.description || "Scheduled Procedure"}
                            </p>
                            <p style={{ fontSize: "0.8125rem", color: "#6d28d9", margin: "4px 0 0 0" }}>
                                Planned for: {nextProc.scheduledDate || "Next scheduled session"} • Est. duration: {nextProc.estimatedDuration || "45 mins"}
                            </p>
                        </div>
                        <span
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                backgroundColor: "#ede9fe",
                                color: "#6d28d9",
                                border: "1px solid #c4b5fd",
                            }}
                        >
                            {nextProc.status}
                        </span>
                    </div>
                ) : (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        No pending procedure scheduled. Your next procedure will appear here once planned by Dr. Sara.
                    </p>
                )}
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "#94a3b8", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 4: Appointment */}
            <section
                data-testid="section-appointment"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid #ea580c" }}
            >
                <div className="card__header">
                    <h2 className="card__title">4. Appointment Schedule</h2>
                    <p className="card__subtitle">Upcoming dental visits, clinical bookings, and past attendances</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "#c2410c" }}>
                            Upcoming Appointment
                        </h3>
                        {(appointment.upcoming || []).length > 0 ? (
                            (appointment.upcoming || []).map((app, idx) => (
                                <div
                                    key={app.id || idx}
                                    style={{
                                        padding: "0.75rem",
                                        backgroundColor: "#fff7ed",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid #fed7aa",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <p style={{ fontWeight: 700, fontSize: "0.875rem", margin: 0, color: "#9a3412" }}>
                                        {app.date} • {app.time}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "#7c2d12", margin: "2px 0 0 0" }}>
                                        {app.type || "Clinical Visit"} with {app.provider || "Dr. Sara"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No upcoming appointments scheduled.</p>
                        )}
                    </div>

                    <div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                            Past Attended Visits
                        </h3>
                        {(appointment.attended || []).length > 0 ? (
                            (appointment.attended || []).map((app, idx) => (
                                <div
                                    key={app.id || idx}
                                    style={{
                                        padding: "0.75rem",
                                        backgroundColor: "var(--bg-page)",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--border)",
                                        marginBottom: "0.5rem",
                                    }}
                                >
                                    <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>
                                        {app.date} {app.time ? `• ${app.time}` : ""}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                        {app.type || "Attended Appointment"} • {app.provider || "Dr. Sara"}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No previous visit records found.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "#94a3b8", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 5: Balance */}
            <section
                data-testid="section-balance"
                className="card"
                style={{ borderLeft: "4px solid #16a34a" }}
            >
                <div className="card__header">
                    <h2 className="card__title">5. Account Balance & Billing Summary</h2>
                    <p className="card__subtitle">Your financial standing, payment receipts, and outstanding fee</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ padding: "1rem", backgroundColor: "#f0fdf4", borderRadius: "var(--radius-md)", border: "1px solid #bbf7d0" }}>
                        <p style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Outstanding Balance</p>
                        <p data-testid="customer-balance-value" style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d", marginTop: "4px" }}>
                            ${Number(balance.remainingFee || balance.balance || 0).toFixed(2)}
                        </p>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Payments Made</p>
                        <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginTop: "4px" }}>
                            ${Number(balance.totalPaid || 0).toFixed(2)}
                        </p>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Billing Status</p>
                        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: Number(balance.remainingFee || 0) > 0 ? "#b45309" : "#16a34a", marginTop: "4px" }}>
                            {Number(balance.remainingFee || 0) > 0 ? "Pending Balance" : "Paid in Full"}
                        </p>
                    </div>
                </div>

                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem" }}>Payment Receipt History</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(balance.payments || []).map((pay, idx) => (
                        <div
                            key={pay.id || idx}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.625rem 0.875rem",
                                backgroundColor: "var(--bg-page)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                                fontSize: "0.8125rem",
                            }}
                        >
                            <span>Receipt #{pay.id || `RCP-${100 + idx}`} • {pay.date || "Oct 2026"} ({pay.method || "Cash"})</span>
                            <span style={{ fontWeight: 700, color: "#166534" }}>{pay.amount?.toString().startsWith("$") ? pay.amount : `$${Number(pay.amount).toFixed(2)}`}</span>
                        </div>
                    ))}
                </div>
            </section>
        </PageContainer>
    );
}

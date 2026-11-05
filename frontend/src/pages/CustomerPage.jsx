import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import CustomerQueueWidget from "../components/customer/CustomerQueueWidget";
import CustomerPaymentHistory from "../components/customer/CustomerPaymentHistory";
import customerService from "../services/customer.service";
import { realtimeService } from "../services/realtime.service";
import CustomerReadOnlyNotice from "../components/customer/CustomerReadOnlyNotice";
import { FiRefreshCw, FiPhone, FiClipboard, FiActivity } from "react-icons/fi";

/**
 * Customer Dashboard UI (SCR-13)
 * Required Hierarchy:
 * 1. My Information
 *       ↓
 * 2. Treatment
 *       ↓
 * 3. Next Procedure
 *       ↓
 * 4. Appointment
 *       ↓
 * 5. Balance
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
            setDashboardData(null);
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
        patientId: user?.linkedPatientId || "Not Linked",
        name: user?.fullName || "Valued Patient",
        age: user?.age || "--",
        contact: user?.phone || user?.email || "No contact info",
        serviceType: user?.serviceType || "General Dentistry",
        status: user?.linkedPatientId ? "ACTIVE" : "PENDING_LINK",
        dentist: "Dr. Assigned Practitioner",
        branch: "Sina Dental Clinic - Main",
    };

    const treatment = dashboardData?.treatment || {
        procedures: [],
        completedCount: 0,
    };

    const nextProc = dashboardData?.nextProcedure || null;

    const appointment = dashboardData?.appointment || {
        upcoming: [],
        attended: [],
    };

    const balance = dashboardData?.balance || {
        remainingFee: 0,
        balance: 0,
        totalPaid: 0,
        payments: [],
    };

    return (
        <PageContainer
            title={user ? `Patient Portal — Welcome, ${user.fullName}` : "Patient Customer Portal"}
            subtitle="Your personal clinical chart, treatment timeline, scheduled visits, and account summary"
            actions={
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing} icon={<FiRefreshCw />}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
            }
        >
            {/* Unlinked Customer Account Notice */}
            {!user?.linkedPatientId && (
                <div
                    role="alert"
                    style={{
                        padding: "1rem 1.25rem",
                        backgroundColor: "rgba(234, 179, 8, 0.1)",
                        borderLeft: "4px solid #eab308",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        color: "#854d0e",
                    }}
                >
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: "700" }}>
                        Account Pending Front-Desk Linking (FR-CUS-01 Alt 1)
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5 }}>
                        Your self-service account is active. To synchronize your past treatment history, ongoing procedures, and live queue position, please check in at the reception desk with your phone number.
                    </p>
                </div>
            )}

            <CustomerReadOnlyNotice />

            {/* Live Queue Status Widget */}
            <CustomerQueueWidget
                initialQueue={dashboardData?.queue}
                patientId={myInfo.patientId !== "Not Linked" ? myInfo.patientId : undefined}
            />

            {/* Quick Patient Actions Bar */}
            <div style={{
                display: "flex",
                gap: "12px",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                alignItems: "center",
                padding: "1rem",
                backgroundColor: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
            }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--primary)" }}>
                        Sina Dental Clinic Patient Care
                    </p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        Need to schedule a follow-up visit or consultation? Contact our front desk or check in at the reception lobby.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <a href="tel:+251116612233" style={{ textDecoration: "none" }}>
                        <Button variant="outline" size="sm" icon={<FiPhone />}>
                            Call Reception (+251 11 661 2233)
                        </Button>
                    </a>
                </div>
            </div>

            {/* Hierarchy Level 1: My Information */}
            <section
                data-testid="section-my-information"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
                <div className="card__header">
                    <h2 className="card__title" style={{ color: "var(--primary)" }}>1. My Information</h2>
                    <p className="card__subtitle">Your verified personal patient profile and clinic registration</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Patient Full Name</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px", color: "var(--text-main)" }}>{myInfo.name}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Patient ID / Chart #</p>
                        <p style={{ fontSize: "1rem", fontWeight: 700, marginTop: "2px", color: "var(--primary)" }}>{myInfo.patientId}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Contact Info</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px", color: "var(--text-main)" }}>{myInfo.contact}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Assigned Dentist</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px", color: "var(--primary)" }}>{myInfo.dentist}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Registered Branch</p>
                        <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: "2px", color: "var(--text-main)" }}>{myInfo.branch}</p>
                    </div>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Record Status</p>
                        <span style={{
                            display: "inline-block",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--primary)",
                            backgroundColor: "rgba(27, 77, 46, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            marginTop: "4px",
                            border: "1px solid var(--border)",
                        }}>
                            {myInfo.status}
                        </span>
                    </div>
                </div>
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "var(--border)", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 2: Treatment */}
            <section
                data-testid="section-treatment"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>2. Treatment History & Procedures</h2>
                        <p className="card__subtitle">Comprehensive dental care records and active procedures</p>
                    </div>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--primary)" }}>
                        {treatment.completedCount || 0} Completed
                    </span>
                </div>
                {treatment.procedures && treatment.procedures.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {treatment.procedures.map((proc, index) => (
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
                                    <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: 0, color: "var(--text-main)" }}>
                                        {proc.description || proc.type || proc.name || "Clinical Dental Procedure"}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                                        {proc.date || proc.completedDate || "Recent visit"} {proc.cost ? `• ${Number(proc.cost).toFixed(2)} ETB` : ""}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        padding: "3px 8px",
                                        borderRadius: "4px",
                                        backgroundColor: proc.status === "DONE" || proc.status === "COMPLETED" ? "rgba(27, 77, 46, 0.1)" : "rgba(234, 179, 8, 0.12)",
                                        color: proc.status === "DONE" || proc.status === "COMPLETED" ? "var(--primary)" : "#b45309",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    {proc.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
                        <FiClipboard style={{ fontSize: "1.75rem", display: "block", margin: "0 auto 0.5rem", color: "var(--text-light)" }} />
                        <p style={{ fontWeight: 600, margin: 0 }}>No treatment procedures logged yet</p>
                        <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0" }}>Procedures performed by your dentist will be recorded here</p>
                    </div>
                )}
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "var(--border)", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 3: Next Procedure */}
            <section
                data-testid="section-next-procedure"
                className="card"
                style={{
                    marginBottom: "1.5rem",
                    borderLeft: "4px solid var(--accent)",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                }}
            >
                <div className="card__header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiActivity style={{ fontSize: "1.25rem", color: "var(--primary)" }} />
                        <div>
                            <h2 className="card__title" style={{ color: "var(--primary)" }}>3. Next Procedure</h2>
                            <p className="card__subtitle">Your upcoming planned clinical operation</p>
                        </div>
                    </div>
                </div>
                {nextProc ? (
                    <div
                        style={{
                            padding: "1rem",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
                                {nextProc.description || nextProc.name || "Scheduled Procedure"}
                            </p>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                                Planned for: {nextProc.scheduledDate || nextProc.plannedDate || "Upcoming visit"}
                            </p>
                        </div>
                        <span
                            style={{
                                fontSize: "0.8125rem",
                                fontWeight: 800,
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                backgroundColor: "rgba(27, 77, 46, 0.1)",
                                color: "var(--primary)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            {nextProc.status || "NEXT"}
                        </span>
                    </div>
                ) : (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>No upcoming procedure currently planned</p>
                        <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0" }}>Your next procedure will appear here once scheduled by your dentist</p>
                    </div>
                )}
            </section>

            {/* Visual Arrow Separator */}
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "var(--border)", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 4: Appointment */}
            <section
                data-testid="section-appointment"
                className="card"
                style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
                <div className="card__header">
                    <h2 className="card__title" style={{ color: "var(--primary)" }}>4. Appointment Schedule</h2>
                    <p className="card__subtitle">Upcoming dental visits, clinical bookings, and past attendances</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--primary)" }}>
                            Upcoming Appointment
                        </h3>
                        {appointment.upcoming && appointment.upcoming.length > 0 ? (
                            appointment.upcoming.map((app, idx) => (
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
                                    <p style={{ fontWeight: 700, fontSize: "0.875rem", margin: 0, color: "var(--primary)" }}>
                                        {app.date} • {app.time}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                        {app.type || "Clinical Visit"} with {app.provider || "Dentist"}
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
                        {appointment.attended && appointment.attended.length > 0 ? (
                            appointment.attended.map((app, idx) => (
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
                                    <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0, color: "var(--text-main)" }}>
                                        {app.date} {app.time ? `• ${app.time}` : ""}
                                    </p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                        {app.type || "Attended Appointment"} • {app.provider || "Dentist"}
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
            <div style={{ textAlign: "center", margin: "-0.5rem 0 1rem 0", color: "var(--border)", fontSize: "1.25rem" }}>↓</div>

            {/* Hierarchy Level 5: Balance */}
            <section
                data-testid="section-balance"
                className="card"
                style={{ borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
                <div className="card__header">
                    <h2 className="card__title" style={{ color: "var(--primary)" }}>5. Account Balance & Billing Summary</h2>
                    <p className="card__subtitle">Your financial standing, payment receipts, and outstanding fee</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Outstanding Balance</p>
                        <p data-testid="customer-balance-value" style={{ fontSize: "1.5rem", fontWeight: 800, color: Number(balance.remainingFee || balance.balance || 0) > 0 ? "#b91c1c" : "var(--primary)", marginTop: "4px" }}>
                            {Number(balance.remainingFee || balance.balance || 0).toFixed(2)} ETB
                        </p>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Payments Made</p>
                        <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                            {Number(balance.totalPaid || 0).toFixed(2)} ETB
                        </p>
                    </div>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Billing Status</p>
                        <p style={{ fontSize: "1.25rem", fontWeight: 700, color: Number(balance.remainingFee || 0) > 0 ? "#b45309" : "var(--primary)", marginTop: "4px" }}>
                            {Number(balance.remainingFee || 0) > 0 ? "Pending Balance" : "Paid in Full"}
                        </p>
                    </div>
                </div>

                <CustomerPaymentHistory
                    payments={balance.payments}
                    remainingFee={balance.remainingFee || balance.balance || 0}
                />
            </section>
        </PageContainer>
    );
}

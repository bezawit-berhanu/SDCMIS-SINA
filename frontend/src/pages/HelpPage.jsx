import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import { FiArrowLeft, FiHelpCircle } from "react-icons/fi";

/**
 * SCR-17: Help / FAQ Page
 * Accessible to: Dentist, Receptionist, Customer, and Public guests.
 * Provides clear role-based operating instructions and system guidelines per SDCIMP SRS Section 2.6.
 */
export default function HelpPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const faqs = [
        {
            id: "faq-q1",
            category: "queue",
            role: "RECEPTIONIST",
            question: "How does the daily queue numbering and calling work?",
            answer:
                "Queue tickets are issued sequentially starting from #001 every single morning. When a Receptionist clicks 'Call', the patient moves from Waiting to Serving and a high-priority push notification is delivered to the Dentist immediately. When the visit is finished, clicking 'Complete' moves the patient to Done and automatically prompts auto-advancement for the next patient in line.",
        },
        {
            id: "faq-q2",
            category: "clinical",
            role: "DENTIST",
            question: "What is the procedure lifecycle (Next -> Ongoing -> Done)?",
            answer:
                "A patient can have exactly one 'Next' procedure and at most one 'Ongoing' procedure. Starting a treatment moves it to 'Ongoing'. Clicking 'Mark Complete' marks it complete, records the completion date, and archives it in permanent treatment history which is never deleted.",
        },
        {
            id: "faq-q3",
            category: "financial",
            role: "ALL",
            question: "How is the Remaining Fee balance computed?",
            answer:
                "Remaining Fee is always strictly calculated as: Total Planned & Completed Procedure Cost minus Total Recorded Payments. Fixed-point decimal arithmetic is used everywhere so numbers match across the Dentist, Receptionist, and Customer views.",
        },
        {
            id: "faq-q4",
            category: "appointments",
            role: "DENTIST",
            question: "How do Missed Appointments get rescheduled?",
            answer:
                "Any appointment whose scheduled date passes without completion is automatically surfaced under Missed Appointments. Dentists can directly select a new date and time to reschedule the patient back into Upcoming status.",
        },
        {
            id: "faq-q5",
            category: "customer",
            role: "CUSTOMER",
            question: "What information can Customers see on their dashboard?",
            answer:
                "Customers have self-service visibility into their personal profile, treatment history, next procedure, scheduled appointment, remaining balance, and live queue ticket status (#007, Position, Waiting/Serving). All customer views are strictly read-only and restricted to their own record.",
        },
        {
            id: "faq-q6",
            category: "realtime",
            role: "ALL",
            question: "Do I need to manually refresh the browser for updates?",
            answer:
                "No. The platform features an integrated real-time gateway using WebSockets with Server-Sent Events (SSE) fallback. Status changes, calls, and notifications appear dynamically without manual page reloading.",
        },
    ];

    const filteredFaqs = faqs.filter((faq) => {
        const matchesCategory = activeTab === "all" || faq.category === activeTab;
        const matchesQuery =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    const returnPath = user ? getDefaultDashboardForRole(user.role) : "/";

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <FiHelpCircle style={{ color: "var(--primary)", fontSize: "1.5rem" }} />
                        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)", margin: 0 }}>
                            SDCIMP Knowledge Base & FAQs
                        </h1>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: 0 }}>
                        System guidelines, clinical procedures, queue mechanics, and account help.
                    </p>
                </div>
                <Link to={returnPath}>
                    <Button variant="secondary" size="md" icon={<FiArrowLeft />}>
                        Back to {user ? "Dashboard" : "Home"}
                    </Button>
                </Link>
            </div>

            {/* Search Box */}
            <div style={{ marginBottom: "1.5rem" }}>
                <input
                    type="search"
                    placeholder="Search help topics, procedures, queue rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #cbd5e1)",
                        fontSize: "1rem",
                        outline: "none",
                    }}
                />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
                {[
                    { id: "all", label: "All Topics" },
                    { id: "queue", label: "Queue & Reception" },
                    { id: "clinical", label: "Clinical & Procedures" },
                    { id: "financial", label: "Fees & Payments" },
                    { id: "customer", label: "Customer Self-Service" },
                    { id: "realtime", label: "Real-Time Sync" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "9999px",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            backgroundColor: activeTab === tab.id ? "var(--primary)" : "var(--bg-surface)",
                            color: activeTab === tab.id ? "#ffffff" : "var(--text-main)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* FAQ List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {filteredFaqs.length === 0 ? (
                    <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No help articles match your search.</p>
                        <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveTab("all"); }} style={{ marginTop: "1rem" }}>
                            Reset Filters
                        </Button>
                    </div>
                ) : (
                    filteredFaqs.map((faq) => (
                        <div key={faq.id} className="card" style={{ padding: "1.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.75rem" }}>
                                <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                                    {faq.question}
                                </h2>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        padding: "0.2rem 0.5rem",
                                        borderRadius: "4px",
                                        backgroundColor: "rgba(27, 77, 46, 0.1)",
                                        color: "var(--primary)",
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    {faq.role}
                                </span>
                            </div>
                            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                                {faq.answer}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


import { useState, useEffect } from "react";
import Button from "../common/Button";

/**
 * SCR-18: Onboarding Tour (Overlay)
 * Accessible to: Dentist, Receptionist
 * Guided walkthrough on first login per SDCIMP SRS Section 2.6 & Section 5.5.
 */
export default function OnboardingTour({ role = "DENTIST", onComplete }) {
    const storageKey = `sdcimp_onboarding_completed_${role.toLowerCase()}`;
    const [isVisible, setIsVisible] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const completed = localStorage.getItem(storageKey);
        if (!completed) {
            setIsVisible(true);
        }
    }, [storageKey]);

    const handleDismiss = () => {
        localStorage.setItem(storageKey, "true");
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const dentistSteps = [
        {
            title: "Welcome to SINA Dentist Workspace (SCR-04)",
            description:
                "Your dashboard provides an at-a-glance view of clinic patients, service breakdowns, and total outstanding balances without manual calculations.",
            icon: "🩺",
        },
        {
            title: "Live Patient Queue & Alerts (BR-27)",
            description:
                "The notification bell in the top header alerts you in real time the moment a Receptionist calls a patient forward. No manual page refresh needed.",
            icon: "🔔",
        },
        {
            title: "Single Next Procedure & History (BR-11, BR-14)",
            description:
                "Plan one Next procedure per patient, move it to Ongoing when starting treatment, and archive to permanent history when ticked Done.",
            icon: "📋",
        },
        {
            title: "Missed Appointments & Rescheduling (FR-DEN-12)",
            description:
                "Any patient who missed their booked appointment date is automatically listed under Missed Appointments with one-click rescheduling.",
            icon: "📅",
        },
    ];

    const receptionistSteps = [
        {
            title: "Welcome to SINA Reception Desk (SCR-10)",
            description:
                "Manage walk-in and scheduled traffic through your live 3-column front desk queue (Waiting, Serving, Done).",
            icon: "🛎️",
        },
        {
            title: "One-Tap Call & Instant Dentist Push (BR-27)",
            description:
                "Clicking 'Call' moves a waiting patient to Serving and instantly alerts the dentist chair. Complete visit automatically prompts auto-advance.",
            icon: "📢",
        },
        {
            title: "Quick Ticket Check-In (SCR-15)",
            description:
                "Issue sequential daily tickets (#001, #002..) using '+ Check In' for walk-in arrivals or scheduled visits in seconds.",
            icon: "🎟️",
        },
        {
            title: "Customers & Fee Balances (SCR-11, SCR-16)",
            description:
                "Record patient payments with fixed-point accuracy and monitor remaining balances clinic-wide without paper spreadsheets.",
            icon: "💰",
        },
    ];

    const steps = role === "RECEPTIONIST" ? receptionistSteps : dentistSteps;
    const currentStep = steps[stepIndex] || steps[0];

    if (!isVisible) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-step-title"
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "1.5rem",
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    maxWidth: "500px",
                    width: "100%",
                    padding: "2.5rem 2rem",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        margin: "0 auto 1.25rem",
                        borderRadius: "50%",
                        backgroundColor: "#e0f2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                    }}
                >
                    {currentStep.icon}
                </div>

                <span
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        color: "#0284c7",
                        letterSpacing: "0.05em",
                        display: "block",
                        marginBottom: "0.5rem",
                    }}
                >
                    Step {stepIndex + 1} of {steps.length} • Quick Tour
                </span>

                <h2
                    id="tour-step-title"
                    style={{
                        fontSize: "1.35rem",
                        fontWeight: "800",
                        color: "#1e293b",
                        marginBottom: "0.75rem",
                    }}
                >
                    {currentStep.title}
                </h2>

                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#64748b",
                        lineHeight: 1.6,
                        marginBottom: "2rem",
                    }}
                >
                    {currentStep.description}
                </p>

                {/* Progress Dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
                    {steps.map((_, idx) => (
                        <span
                            key={idx}
                            style={{
                                width: idx === stepIndex ? "24px" : "8px",
                                height: "8px",
                                borderRadius: "4px",
                                backgroundColor: idx === stepIndex ? "#0284c7" : "#cbd5e1",
                                transition: "all 0.3s ease",
                            }}
                        />
                    ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#94a3b8",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        Skip Tour
                    </button>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        {stepIndex > 0 && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setStepIndex((prev) => prev - 1)}
                            >
                                Previous
                            </Button>
                        )}

                        {stepIndex < steps.length - 1 ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setStepIndex((prev) => prev + 1)}
                            >
                                Next Step →
                            </Button>
                        ) : (
                            <Button variant="primary" size="sm" onClick={handleDismiss}>
                                Get Started!
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

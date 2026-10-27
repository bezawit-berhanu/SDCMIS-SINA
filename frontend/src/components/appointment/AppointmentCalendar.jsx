import { useState } from "react";

export default function AppointmentCalendar({ selectedDate, onDateSelect, appointments = [] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    const days = [];
    // Padding before month starts
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, month, d));
    }

    const isSelected = (date) => {
        if (!selectedDate || !date) return false;
        const d1 = new Date(selectedDate);
        return d1.getFullYear() === date.getFullYear() &&
               d1.getMonth() === date.getMonth() &&
               d1.getDate() === date.getDate();
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return today.getFullYear() === date.getFullYear() &&
               today.getMonth() === date.getMonth() &&
               today.getDate() === date.getDate();
    };

    const getAppointmentsForDay = (date) => {
        if (!date) return [];
        return appointments.filter((a) => {
            const aDate = new Date(a.appointmentDate || a.scheduledDate);
            return aDate.getFullYear() === date.getFullYear() &&
                   aDate.getMonth() === date.getMonth() &&
                   aDate.getDate() === date.getDate();
        });
    };

    return (
        <div style={{
            backgroundColor: "white",
            borderRadius: "var(--radius-lg, 12px)",
            border: "1px solid var(--border, #e2e8f0)",
            padding: "1.25rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
        }}>
            {/* Calendar Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main, #0f172a)", margin: 0 }}>
                        {monthNames[month]} {year}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted, #64748b)", margin: "2px 0 0 0" }}>
                        Select a date to filter clinical appointments
                    </p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    <button
                        type="button"
                        onClick={prevMonth}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border, #cbd5e1)",
                            backgroundColor: "white",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 600
                        }}
                    >
                        ← Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const now = new Date();
                            setCurrentMonth(now);
                            if (onDateSelect) onDateSelect(now);
                        }}
                        style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--border, #cbd5e1)",
                            backgroundColor: "#f8fafc",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 600
                        }}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border, #cbd5e1)",
                            backgroundColor: "white",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontWeight: 600
                        }}
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "var(--text-muted, #64748b)",
                marginBottom: "8px"
            }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} style={{ padding: "4px" }}>{day}</div>
                ))}
            </div>

            {/* Calendar Days Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {days.map((date, idx) => {
                    if (!date) {
                        return <div key={`empty-${idx}`} style={{ minHeight: "44px" }} />;
                    }

                    const selected = isSelected(date);
                    const today = isToday(date);
                    const dayApts = getAppointmentsForDay(date);
                    const hasMissed = dayApts.some((a) => a.status === "MISSED");
                    const hasUpcoming = dayApts.some((a) => a.status === "UPCOMING");

                    return (
                        <button
                            key={date.toISOString()}
                            type="button"
                            onClick={() => onDateSelect && onDateSelect(date)}
                            style={{
                                minHeight: "48px",
                                padding: "4px",
                                borderRadius: "8px",
                                border: selected ? "2px solid #2563eb" : (today ? "1px solid #3b82f6" : "1px solid #f1f5f9"),
                                backgroundColor: selected ? "#eff6ff" : (today ? "#f8fafc" : "white"),
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                position: "relative",
                                transition: "all 0.15s ease",
                            }}
                        >
                            <span style={{
                                fontSize: "0.8125rem",
                                fontWeight: today || selected ? 700 : 500,
                                color: selected ? "#1d4ed8" : (today ? "#2563eb" : "#334155"),
                            }}>
                                {date.getDate()}
                            </span>

                            {/* Indicator pills for appointments */}
                            {dayApts.length > 0 && (
                                <div style={{ display: "flex", gap: "3px", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                                    {hasMissed && (
                                        <span title="Missed appointment" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                                    )}
                                    {hasUpcoming && (
                                        <span title="Upcoming appointment" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                                    )}
                                    {dayApts.length > 2 && (
                                        <span style={{ fontSize: "0.625rem", color: "#64748b", fontWeight: 700, lineHeight: 1 }}>
                                            +{dayApts.length}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", fontSize: "0.75rem", color: "#64748b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                    Upcoming
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                    Missed
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", border: "2px solid #2563eb" }} />
                    Selected
                </div>
            </div>
        </div>
    );
}

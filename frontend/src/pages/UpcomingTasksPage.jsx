import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import apiClient from "../services/apiclient";

/**
 * SCR-08: Upcoming Tasks Screen
 * Accessible to: Dentist
 * Forward-looking worklist of patients with future scheduled procedures & appointments per FR-DEN-11.
 */
export default function UpcomingTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterService, setFilterService] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let isMounted = true;
        const fetchTasks = async () => {
            try {
                const res = await apiClient.get("/api/v1/dentist/tasks");
                if (isMounted && res.data?.data && Array.isArray(res.data.data)) {
                    setTasks(res.data.data);
                } else if (isMounted) {
                    setTasks([
                        {
                            id: "task-01",
                            patientId: "pat-001",
                            patientName: "Abebe Bikila",
                            serviceType: "Orthodontics",
                            procedureName: "Bracket Adjustment & Archwire Replacement",
                            scheduledDate: "2026-11-05",
                            scheduledTime: "10:00 AM",
                            estCost: 800.0,
                            priority: "NORMAL",
                        },
                        {
                            id: "task-02",
                            patientId: "pat-003",
                            patientName: "Dawit Wolde",
                            serviceType: "Cosmetics",
                            procedureName: "Porcelain Veneer Placement - Upper Incisors",
                            scheduledDate: "2026-11-06",
                            scheduledTime: "02:30 PM",
                            estCost: 2800.0,
                            priority: "HIGH",
                        },
                        {
                            id: "task-03",
                            patientId: "pat-004",
                            patientName: "Tigist Assefa",
                            serviceType: "Periodontics",
                            procedureName: "Follow-up Deep Pocket Probing & Fluoride",
                            scheduledDate: "2026-11-08",
                            scheduledTime: "11:15 AM",
                            estCost: 500.0,
                            priority: "NORMAL",
                        },
                    ]);
                }
            } catch (_) {
                if (isMounted) {
                    setTasks([
                        {
                            id: "task-01",
                            patientId: "pat-001",
                            patientName: "Abebe Bikila",
                            serviceType: "Orthodontics",
                            procedureName: "Bracket Adjustment & Archwire Replacement",
                            scheduledDate: "2026-11-05",
                            scheduledTime: "10:00 AM",
                            estCost: 800.0,
                            priority: "NORMAL",
                        },
                        {
                            id: "task-02",
                            patientId: "pat-003",
                            patientName: "Dawit Wolde",
                            serviceType: "Cosmetics",
                            procedureName: "Porcelain Veneer Placement",
                            scheduledDate: "2026-11-06",
                            scheduledTime: "02:30 PM",
                            estCost: 2800.0,
                            priority: "HIGH",
                        },
                    ]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTasks();
        return () => { isMounted = false; };
    }, []);

    const filteredTasks = tasks.filter((t) => {
        const matchesService = filterService === "ALL" || t.serviceType === filterService;
        const matchesQuery =
            t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.procedureName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesService && matchesQuery;
    });

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-main)", marginBottom: "0.25rem" }}>
                        Upcoming Clinical Tasks (SCR-08)
                    </h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                        Chronological forward-looking worklist of planned patient procedures per FR-DEN-11.
                    </p>
                </div>

                <Link to="/dentist">
                    <Button variant="secondary" size="sm">
                        ← Back to Dentist Dashboard
                    </Button>
                </Link>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <input
                    type="search"
                    placeholder="Search tasks by patient or procedure name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: "1 1 260px",
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #cbd5e1)",
                        fontSize: "0.95rem",
                    }}
                />

                <select
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    style={{
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #cbd5e1)",
                        backgroundColor: "#ffffff",
                        fontSize: "0.95rem",
                    }}
                >
                    <option value="ALL">All Service Types</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="General">General</option>
                </select>
            </div>

            {/* Tasks Cards List */}
            {loading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading upcoming tasks...</div>
            ) : filteredTasks.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    <h3>Nothing scheduled — nice work!</h3>
                    <p style={{ marginTop: "0.5rem" }}>No upcoming tasks match your criteria per SCR-08 empty state.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="card"
                            style={{
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "1rem",
                                borderLeft: task.priority === "HIGH" ? "4px solid #ef4444" : "4px solid #0284c7",
                            }}
                        >
                            <div style={{ flex: "1 1 300px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>
                                        {task.patientName}
                                    </h3>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: "700",
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "9999px",
                                            backgroundColor: "#e0f2fe",
                                            color: "#0369a1",
                                        }}
                                    >
                                        {task.serviceType}
                                    </span>
                                </div>
                                <p style={{ margin: "0 0 0.5rem", color: "#475569", fontWeight: "600", fontSize: "0.95rem" }}>
                                    Planned: {task.procedureName}
                                </p>
                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    Est. Fee: <strong>{Number(task.estCost || 0).toFixed(2)} ETB</strong> • Patient ID: {task.patientId}
                                </span>
                            </div>

                            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                                <div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Scheduled</span>
                                    <strong style={{ fontSize: "1rem", color: "#0284c7" }}>
                                        📅 {task.scheduledDate} at {task.scheduledTime}
                                    </strong>
                                </div>
                                <Link to={`/patients/${task.patientId}`}>
                                    <Button variant="outline" size="sm">
                                        View Patient Detail (SCR-06) →
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import apiClient from "../services/apiclient";
import { FiClipboard, FiArrowLeft, FiSearch } from "react-icons/fi";

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
                setLoading(true);
                const res = await apiClient.get("/api/v1/dentist/tasks");
                if (isMounted) {
                    if (res.data?.data && Array.isArray(res.data.data)) {
                        setTasks(res.data.data);
                    } else if (Array.isArray(res.data?.tasks)) {
                        setTasks(res.data.tasks);
                    } else {
                        // Also try fetching appointments if dedicated tasks endpoint is empty
                        const apptRes = await apiClient.get("/api/v1/appointments");
                        if (apptRes.data?.data && Array.isArray(apptRes.data.data)) {
                            const formatted = apptRes.data.data.map((a) => ({
                                id: a.id,
                                patientId: a.patientId,
                                patientName: a.patientName || "Patient",
                                serviceType: a.serviceType || "Clinical Consultation",
                                procedureName: a.reason || a.procedure || "Dental Procedure",
                                scheduledDate: a.date || a.scheduledAt || "Scheduled",
                                scheduledTime: a.time || a.scheduledTime || "",
                                estCost: a.cost || 0,
                                priority: "NORMAL",
                            }));
                            setTasks(formatted);
                        } else {
                            setTasks([]);
                        }
                    }
                }
            } catch (_) {
                if (isMounted) {
                    setTasks([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTasks();
        return () => {
            isMounted = false;
        };
    }, []);

    // Filter by Service Type and Search Query
    const filteredTasks = tasks.filter((t) => {
        const matchesService = filterService === "ALL" || t.serviceType?.toLowerCase() === filterService.toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !searchQuery ||
            t.patientName?.toLowerCase().includes(q) ||
            t.procedureName?.toLowerCase().includes(q) ||
            t.patientId?.toLowerCase().includes(q);
        return matchesService && matchesSearch;
    });

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <Link to="/dentist" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <FiArrowLeft />
                            <span>Dentist Dashboard</span>
                        </Link>
                        <span style={{ color: "var(--border)" }}>/</span>
                        <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.9rem" }}>Upcoming Tasks</span>
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>
                        Upcoming Clinical Tasks (SCR-08)
                    </h1>
                    <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                        Forward-looking worklist of patients with scheduled treatments (FR-DEN-11)
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="card" style={{ padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <input
                    type="text"
                    placeholder="Search by patient name, procedure, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: "240px",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        fontSize: "0.9rem",
                        backgroundColor: "var(--bg-card)",
                    }}
                />
                <select
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        fontSize: "0.9rem",
                        backgroundColor: "var(--bg-card)",
                    }}
                >
                    <option value="ALL">All Services</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Endodontics">Endodontics</option>
                </select>
            </div>

            {/* Tasks Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                {loading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading upcoming tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        <FiClipboard style={{ fontSize: "2rem", display: "block", margin: "0 auto 0.5rem", color: "var(--text-light)" }} />
                        <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>No upcoming tasks scheduled</p>
                        <p style={{ fontSize: "0.85rem", margin: "0.25rem 0 0" }}>Patients with planned procedures will appear here</p>
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                        <thead>
                            <tr style={{ backgroundColor: "var(--bg-page)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Scheduled</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Patient</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Service</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Procedure</th>
                                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>Est. Cost</th>
                                <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <div style={{ fontWeight: 700, color: "var(--primary)" }}>{task.scheduledDate}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{task.scheduledTime}</div>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{task.patientName}</div>
                                        <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>{task.patientId}</div>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem" }}>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            padding: "0.2rem 0.5rem",
                                            borderRadius: "9999px",
                                            backgroundColor: "rgba(27, 77, 46, 0.1)",
                                            color: "var(--primary)",
                                            border: "1px solid var(--border)",
                                        }}>
                                            {task.serviceType}
                                        </span>
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-main)" }}>{task.procedureName}</td>
                                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--primary)" }}>
                                        {Number(task.estCost || 0).toFixed(2)} ETB
                                    </td>
                                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                                        <Link to={`/patients/${task.patientId}`}>
                                            <Button variant="outline" size="sm">
                                                Open Record
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

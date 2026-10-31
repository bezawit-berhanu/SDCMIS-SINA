const { EventEmitter } = require("node:events");
let wsModule;
try {
    wsModule = require("ws");
} catch (_) {
    wsModule = null;
}

class RealtimeGateway extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Set();
        this.eventsHistory = [];
        this.setMaxListeners(100);
    }

    /**
     * Attach WebSocket server to an existing HTTP/HTTPS server instance
     */
    attachToServer(httpServer, path = "/ws/queue") {
        if (!wsModule || !httpServer) return this;

        const WebSocketServer = wsModule.WebSocketServer || wsModule.Server;
        if (!WebSocketServer) return this;

        try {
            this.wss = new WebSocketServer({ noServer: true });

            httpServer.on("upgrade", (request, socket, head) => {
                const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
                const isSupportedPath =
                    url.pathname === path ||
                    url.pathname === "/ws" ||
                    url.pathname === "/api/v1/queue/ws" ||
                    url.pathname === "/hub/queue" ||
                    url.pathname.startsWith("/hub/");

                if (isSupportedPath) {
                    this.wss.handleUpgrade(request, socket, head, (ws) => {
                        this.wss.emit("connection", ws, request);
                    });
                }
            });

            this.wss.on("connection", (ws, request) => {
                const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
                ws.role = url.searchParams.get("role") || "ANONYMOUS";
                ws.userId = url.searchParams.get("userId") || null;
                ws.isAlive = true;

                this.clients.add(ws);

                // Send immediate welcome handshake
                this._safeSend(ws, {
                    type: "CONNECTED",
                    payload: {
                        message: "Real-time queue gateway connected successfully",
                        role: ws.role,
                        userId: ws.userId,
                        timestamp: new Date().toISOString(),
                    },
                });

                ws.on("pong", () => {
                    ws.isAlive = true;
                });

                ws.on("message", (raw) => {
                    try {
                        const rawStr = raw.toString();
                        // SignalR Protocol Handshake detection
                        if (rawStr.includes('"protocol":"json"') || rawStr.includes('"protocol": "json"')) {
                            ws.isSignalR = true;
                            ws.send("{}\x1e");
                            return;
                        }
                        const parsed = JSON.parse(rawStr.replace(/\x1e/g, ""));
                        if (parsed.type === "PING" || parsed.type === 6) {
                            if (ws.isSignalR) {
                                ws.send('{"type":6}\x1e'); // SignalR ping/keepalive response
                            } else {
                                this._safeSend(ws, { type: "PONG", timestamp: new Date().toISOString() });
                            }
                        }
                    } catch (_) {}
                });

                ws.on("close", () => {
                    this.clients.delete(ws);
                });

                ws.on("error", () => {
                    this.clients.delete(ws);
                });
            });
        } catch (err) {
            console.error("Failed to attach WebSocketServer to HTTP server:", err.message);
        }

        return this;
    }

    _safeSend(ws, data) {
        if (!ws || ws.readyState !== 1) return; // 1 = OPEN
        try {
            if (ws.isSignalR) {
                // Format SignalR text invocation record with 0x1E delimiter
                const signalRMsg = JSON.stringify({
                    type: 1,
                    target: data.type,
                    arguments: [data.payload || data],
                }) + "\x1e";
                ws.send(signalRMsg);
            } else {
                ws.send(JSON.stringify(data));
            }
        } catch (_) {}
    }

    /**
     * Broadcast an event to all connected WebSocket clients and local EventEmitter listeners
     */
    broadcast(type, payload = {}) {
        const message = {
            type,
            payload,
            timestamp: new Date().toISOString(),
        };

        // Record history (keep last 50 events)
        this.eventsHistory.unshift(message);
        if (this.eventsHistory.length > 50) {
            this.eventsHistory.pop();
        }

        // Emit locally for server-sent events (SSE) and tests
        this.emit("event", message);
        this.emit(type, payload);

        // Broadcast to WebSocket clients
        for (const client of this.clients) {
            this._safeSend(client, message);
        }

        return message;
    }

    /**
     * Send an event targeted to a specific user ID or role
     */
    sendToUser(userId, type, payload = {}) {
        const message = {
            type,
            payload,
            recipientUserId: userId,
            timestamp: new Date().toISOString(),
        };

        this.emit("event", message);
        this.emit(type, payload);
        this.emit(`user:${userId}`, message);

        for (const client of this.clients) {
            if (client.userId === userId || client.role === "DENTIST" || client.role === "RECEPTIONIST") {
                this._safeSend(client, message);
            }
        }

        return message;
    }

    /**
     * Send event targeted to a specific role (DENTIST, RECEPTIONIST, CUSTOMER)
     */
    sendToRole(role, type, payload = {}) {
        const message = {
            type,
            payload,
            targetRole: role,
            timestamp: new Date().toISOString(),
        };

        this.emit("event", message);
        this.emit(type, payload);
        this.emit(`role:${role}`, message);

        for (const client of this.clients) {
            if (client.role === role || client.role === "RECEPTIONIST") {
                this._safeSend(client, message);
            }
        }

        return message;
    }

    // High-level domain broadcast methods
    broadcastPatientCheckedIn(queueEntry) {
        return this.broadcast("PATIENT_CHECKED_IN", {
            queueEntry,
            message: `Patient ${queueEntry.formattedQueueNumber} (${queueEntry.patientName || "Patient"}) checked in.`,
        });
    }

    broadcastPatientCalled(queueEntry, notification = null) {
        const message = `Patient ${queueEntry.formattedQueueNumber} is ready.`;
        // Targeted notification to dentist
        if (queueEntry.dentistId) {
            this.sendToUser(queueEntry.dentistId, "DENTIST_NOTIFICATION", {
                queueEntry,
                notification,
                message,
            });
        }

        // General queue state broadcast for receptionists, dentists, and customer displays
        return this.broadcast("PATIENT_CALLED", {
            queueEntry,
            notification,
            message,
        });
    }

    broadcastQueueStatusChanged(queueEntry, previousStatus = "WAITING") {
        const payload = {
            queueEntryId: queueEntry.id,
            patientId: queueEntry.patientId,
            patientName: queueEntry.patientName,
            queueNumber: queueEntry.queueNumber,
            formattedQueueNumber: queueEntry.formattedQueueNumber,
            previousStatus,
            newStatus: queueEntry.status,
            status: queueEntry.status,
            dentist: queueEntry.dentistName || null,
            message: `Patient ${queueEntry.formattedQueueNumber} status changed from ${previousStatus} to ${queueEntry.status}.`,
            timestamp: new Date().toISOString(),
        };

        // Emit targeted customer notification if linked
        if (queueEntry.patientId) {
            this.sendToUser(queueEntry.patientId, "QUEUE_STATUS_CHANGED", payload);
        }

        return this.broadcast("QUEUE_STATUS_CHANGED", payload);
    }

    broadcastVisitCompleted(queueEntry, nextWaiting = null) {
        return this.broadcast("VISIT_COMPLETED", {
            completedQueueEntry: queueEntry,
            nextWaitingQueueEntry: nextWaiting,
            message: `Visit for ${queueEntry.formattedQueueNumber} completed.`,
        });
    }

    broadcastQueueUpdated(queueList = []) {
        return this.broadcast("QUEUE_UPDATED", {
            queue: queueList,
            timestamp: new Date().toISOString(),
        });
    }
}

// Singleton gateway instance
const realtimeGateway = new RealtimeGateway();

module.exports = {
    RealtimeGateway,
    realtimeGateway,
};

/**
 * Real-time Sync Service for SDCMIS-SINA Frontend
 * Connects to Backend Real-time Gateway via WebSocket with automatic SSE fallback.
 * Dispatches live queue updates, dentist notifications, and patient status changes.
 */

class RealtimeService {
    constructor() {
        this.ws = null;
        this.eventSource = null;
        this.listeners = new Map();
        this.status = "DISCONNECTED"; // DISCONNECTED | CONNECTING | CONNECTED | FALLBACK_SSE
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectTimer = null;
        this.role = null;
        this.userId = null;
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - e.g. 'PATIENT_CALLED', 'QUEUE_UPDATED', 'NOTIFICATION_CREATED', 'VISIT_COMPLETED', 'QUEUE_STATUS_CHANGED'
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);

        return () => {
            const set = this.listeners.get(eventName);
            if (set) {
                set.delete(callback);
            }
        };
    }

    /**
     * Trigger listeners for an event
     */
    emit(eventName, data) {
        const set = this.listeners.get(eventName);
        if (set) {
            set.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`Error in realtime listener for ${eventName}:`, err);
                }
            });
        }
    }

    /**
     * Connect to the real-time gateway
     */
    connect({ role = "ANONYMOUS", userId = null, port = 5000 } = {}) {
        this.role = role;
        this.userId = userId;

        if (this.status === "CONNECTED" || this.status === "CONNECTING") {
            return;
        }

        this.status = "CONNECTING";
        this.emit("STATUS_CHANGED", { status: this.status });

        // Determine host and protocol
        const isSecure = typeof window !== "undefined" && window.location?.protocol === "https:";
        const wsProtocol = isSecure ? "wss:" : "ws:";
        const httpProtocol = isSecure ? "https:" : "http:";
        const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
        const wsUrl = `${wsProtocol}//${host}:${port}/ws/queue?role=${encodeURIComponent(role)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;
        const sseUrl = `${httpProtocol}//${host}:${port}/api/v1/queue/stream?role=${encodeURIComponent(role)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;

        // Attempt WebSocket first if available
        if (typeof WebSocket !== "undefined") {
            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    this.status = "CONNECTED";
                    this.reconnectAttempts = 0;
                    this.emit("STATUS_CHANGED", { status: this.status, transport: "WEBSOCKET" });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this._handleIncomingMessage(message);
                    } catch (_) {}
                };

                this.ws.onerror = () => {
                    // Failover to SSE if WebSocket has connection issues
                    if (this.status !== "CONNECTED") {
                        this._fallbackToSSE(sseUrl);
                    }
                };

                this.ws.onclose = () => {
                    if (this.status === "CONNECTED") {
                        this.status = "DISCONNECTED";
                        this.emit("STATUS_CHANGED", { status: this.status });
                        this._scheduleReconnect({ role, userId, port });
                    }
                };

                return;
            } catch (_) {
                this._fallbackToSSE(sseUrl);
                return;
            }
        }

        // Fallback to SSE directly if WebSocket is unavailable
        this._fallbackToSSE(sseUrl);
    }

    _fallbackToSSE(sseUrl) {
        if (typeof EventSource === "undefined") {
            this.status = "UNSUPPORTED";
            this.emit("STATUS_CHANGED", { status: this.status });
            return;
        }

        try {
            if (this.eventSource) {
                this.eventSource.close();
            }

            this.eventSource = new EventSource(sseUrl);
            this.status = "FALLBACK_SSE";
            this.emit("STATUS_CHANGED", { status: this.status, transport: "SSE" });

            this.eventSource.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this._handleIncomingMessage(message);
                } catch (_) {}
            };

            this.eventSource.onerror = () => {
                this.status = "DISCONNECTED";
                this.emit("STATUS_CHANGED", { status: this.status });
            };
        } catch (_) {
            this.status = "DISCONNECTED";
            this.emit("STATUS_CHANGED", { status: this.status });
        }
    }

    _handleIncomingMessage(message) {
        if (!message || !message.type) return;

        // Emit typed event
        this.emit(message.type, message.payload || message);

        // Also emit wildcard event for debug/logging
        this.emit("*", message);
    }

    _scheduleReconnect(config) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
        this.reconnectAttempts++;
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect(config);
        }, delay);
    }

    disconnect() {
        clearTimeout(this.reconnectTimer);
        if (this.ws) {
            try {
                this.ws.close();
            } catch (_) {}
            this.ws = null;
        }
        if (this.eventSource) {
            try {
                this.eventSource.close();
            } catch (_) {}
            this.eventSource = null;
        }
        this.status = "DISCONNECTED";
        this.emit("STATUS_CHANGED", { status: this.status });
    }
}

export const realtimeService = new RealtimeService();
export default realtimeService;


import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";

/**
 * SignalR Hub Service for Sina Dental Clinic
 * Provides bidirectional real-time communication for queue events,
 * patient call alerts, and dentist push notifications.
 */
class SignalRService {
    constructor() {
        this.connection = null;
        this.listeners = new Map();
        this.isConnected = false;
        this.reconnectAttempts = 0;
    }

    /**
     * Subscribe to a SignalR hub event
     * @param {string} eventName
     * @param {Function} callback
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);

        if (this.connection) {
            this.connection.on(eventName, callback);
        }

        return () => {
            const set = this.listeners.get(eventName);
            if (set) set.delete(callback);
            if (this.connection) {
                this.connection.off(eventName, callback);
            }
        };
    }

    /**
     * Emit event internally to subscribers
     */
    emit(eventName, data) {
        const set = this.listeners.get(eventName);
        if (set) {
            set.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error(`[SignalR] Listener error for ${eventName}:`, err);
                }
            });
        }
    }

    /**
     * Start the SignalR connection to the Sina Dental real-time hub
     */
    async start({ role = "ANONYMOUS", userId = null, port = 5000 } = {}) {
        if (this.connection && this.isConnected) {
            return this.connection;
        }

        const host = typeof window !== "undefined" && window.location?.hostname ? window.location.hostname : "localhost";
        const protocol = typeof window !== "undefined" && window.location?.protocol === "https:" ? "https:" : "http:";
        const hubUrl = `${protocol}//${host}:${port}/hub/queue?role=${encodeURIComponent(role)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`;

        try {
            this.connection = new HubConnectionBuilder()
                .withUrl(hubUrl, {
                    skipNegotiation: true,
                    transport: HttpTransportType.WebSockets,
                })
                .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
                .configureLogging(LogLevel.Warning)
                .build();

            // Register all active listeners on the new connection
            for (const [evt, cbs] of this.listeners.entries()) {
                cbs.forEach((cb) => this.connection.on(evt, cb));
            }

            // Universal SignalR event handlers matching Sina SRS
            this.connection.on("PATIENT_CALLED", (payload) => this.emit("PATIENT_CALLED", payload));
            this.connection.on("VISIT_COMPLETED", (payload) => this.emit("VISIT_COMPLETED", payload));
            this.connection.on("QUEUE_UPDATED", (payload) => this.emit("QUEUE_UPDATED", payload));
            this.connection.on("NOTIFICATION_CREATED", (payload) => this.emit("NOTIFICATION_CREATED", payload));
            this.connection.on("QUEUE_STATUS_CHANGED", (payload) => this.emit("QUEUE_STATUS_CHANGED", payload));

            this.connection.onclose(() => {
                this.isConnected = false;
                this.emit("STATUS_CHANGED", { status: "DISCONNECTED" });
            });

            this.connection.onreconnecting(() => {
                this.isConnected = false;
                this.emit("STATUS_CHANGED", { status: "RECONNECTING" });
            });

            this.connection.onreconnected(() => {
                this.isConnected = true;
                this.emit("STATUS_CHANGED", { status: "CONNECTED" });
            });

            await this.connection.start();
            this.isConnected = true;
            this.emit("STATUS_CHANGED", { status: "CONNECTED" });
            console.log("[SignalR] Successfully connected to Sina Dental real-time hub");
            return this.connection;
        } catch (error) {
            console.warn("[SignalR] Connection to hub failed, falling back to real-time gateway:", error.message);
            this.isConnected = false;
            return null;
        }
    }

    async stop() {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch (_) {}
            this.isConnected = false;
        }
    }
}

export const signalRService = new SignalRService();
export default signalRService;

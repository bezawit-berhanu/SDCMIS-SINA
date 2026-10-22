const UserRole = Object.freeze({
    DENTIST: "DENTIST",
    RECEPTIONIST: "RECEPTIONIST",
    CUSTOMER: "CUSTOMER",
});

const RecordStatus = Object.freeze({
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    DELETED: "DELETED",
});

const ThemePreference = Object.freeze({
    LIGHT: "LIGHT",
    DARK: "DARK",
});

const ProcedureStatus = Object.freeze({
    NEXT: "NEXT",
    ONGOING: "ONGOING",
    DONE: "DONE",
});

const AppointmentStatus = Object.freeze({
    UPCOMING: "UPCOMING",
    MISSED: "MISSED",
    ATTENDED: "ATTENDED",
});

const AuditAction = Object.freeze({
    CREATE: "CREATE",
    UPDATE: "UPDATE",
    DELETE: "DELETE",
});

const AuditEntityType = Object.freeze({
    PATIENT: "PATIENT",
    PROCEDURE: "PROCEDURE",
    APPOINTMENT: "APPOINTMENT",
    PAYMENT: "PAYMENT",
    USER: "USER",
});

module.exports = {
    UserRole,
    userRole: UserRole,
    RecordStatus,
    ThemePreference,
    ProcedureStatus,
    AppointmentStatus,
    AuditAction,
    AuditEntityType,
    ...UserRole,
};
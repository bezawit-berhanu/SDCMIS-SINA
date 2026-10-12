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

module.exports = {
    UserRole,
    userRole: UserRole,
    RecordStatus,
    ThemePreference,
    ...UserRole,
};
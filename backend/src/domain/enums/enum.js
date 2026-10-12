const { ThemePreference } = require("@prisma/client");

const userRole = Object.freeze({
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
    userRole,
    RecordStatus,
    ThemePreference,
};
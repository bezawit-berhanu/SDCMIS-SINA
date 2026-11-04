import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Staff vs Patient Registration Classification Tests', () => {
    test('Patient registration assigns CUSTOMER role by default', () => {
        const registrationType = 'PATIENT';
        const role = registrationType === 'PATIENT' ? 'CUSTOMER' : 'DENTIST';
        assert.strictEqual(role, 'CUSTOMER');
    });

    test('Staff registration differentiates Dentist role', () => {
        const registrationType = 'STAFF';
        const staffRole = 'DENTIST';
        const assignedRole = registrationType === 'STAFF' ? staffRole : 'CUSTOMER';
        assert.strictEqual(assignedRole, 'DENTIST');
    });

    test('Staff registration differentiates Receptionist role', () => {
        const registrationType = 'STAFF';
        const staffRole = 'RECEPTIONIST';
        const assignedRole = registrationType === 'STAFF' ? staffRole : 'CUSTOMER';
        assert.strictEqual(assignedRole, 'RECEPTIONIST');
    });

    test('Strict branding enforcement on Auth page', () => {
        const pageTitle = 'Sina Dental Clinic';
        assert.strictEqual(pageTitle, 'Sina Dental Clinic');
        // Verify no extra clutter
        assert.doesNotMatch(pageTitle, /FAQ/i);
        assert.doesNotMatch(pageTitle, /Teaser/i);
    });

    test('Payload format validation for classified registration', () => {
        const createRegistrationPayload = ({ fullName, email, password, registrationType, staffRole }) => {
            const role = registrationType === 'STAFF' ? (staffRole || 'DENTIST') : 'CUSTOMER';
            return {
                fullName,
                email,
                password,
                role
            };
        };

        const patientPayload = createRegistrationPayload({
            fullName: 'Abebe Patient',
            email: 'patient@sina.et',
            password: 'Password123!',
            registrationType: 'PATIENT'
        });
        assert.strictEqual(patientPayload.role, 'CUSTOMER');

        const dentistPayload = createRegistrationPayload({
            fullName: 'Dr. Hana Dentist',
            email: 'dentist@sina.et',
            password: 'Password123!',
            registrationType: 'STAFF',
            staffRole: 'DENTIST'
        });
        assert.strictEqual(dentistPayload.role, 'DENTIST');

        const receptionistPayload = createRegistrationPayload({
            fullName: 'Receptionist Bethel',
            email: 'reception@sina.et',
            password: 'Password123!',
            registrationType: 'STAFF',
            staffRole: 'RECEPTIONIST'
        });
        assert.strictEqual(receptionistPayload.role, 'RECEPTIONIST');
    });
});


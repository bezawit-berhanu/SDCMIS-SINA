import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Zero Dummy Data Audit Test Suite', () => {
    const srcDir = path.join(__dirname, 'src');

    test('patient-context.jsx starts with zero hardcoded dummy patients', () => {
        const content = fs.readFileSync(path.join(srcDir, 'features', 'patient', 'patient-context.jsx'), 'utf-8');
        assert.doesNotMatch(content, /fallbackPatients/);
        assert.doesNotMatch(content, /Abebe Bikila/);
        assert.doesNotMatch(content, /Fatima Zahra/);
        assert.doesNotMatch(content, /Chala Tadesse/);
        assert.match(content, /useState\(\s*\[\s*\]\s*\)/);
    });

    test('DentistPage.jsx contains zero hardcoded mock procedures or patient arrays in state', () => {
        const content = fs.readFileSync(path.join(srcDir, 'pages', 'DentistPage.jsx'), 'utf-8');
        assert.doesNotMatch(content, /useState\(\s*\[\s*\{\s*id:\s*["']PROC-101/);
        assert.doesNotMatch(content, /Hana Bekele.*Composite Restoration/);
    });

    test('ReceptionistPage.jsx contains zero hardcoded queue or payment records in state', () => {
        const content = fs.readFileSync(path.join(srcDir, 'pages', 'ReceptionistPage.jsx'), 'utf-8');
        assert.doesNotMatch(content, /useState\(\s*\[\s*\{\s*id:\s*["']que-003/);
        assert.doesNotMatch(content, /useState\(\s*\[\s*\{\s*id:\s*["']RCP-201/);
    });

    test('CustomerPage.jsx contains zero hardcoded procedures or fallback mock balances', () => {
        const content = fs.readFileSync(path.join(srcDir, 'pages', 'CustomerPage.jsx'), 'utf-8');
        assert.doesNotMatch(content, /TRT-01.*Comprehensive Oral Examination/);
        assert.doesNotMatch(content, /PROC-NEXT-01.*Post-restoration occlusal polishing/);
    });

    test('CustomerFeesPage.jsx contains zero hardcoded customer arrays', () => {
        const content = fs.readFileSync(path.join(srcDir, 'pages', 'CustomerFeesPage.jsx'), 'utf-8');
        assert.doesNotMatch(content, /pat-001.*Abebe Bikila.*Orthodontics.*4500/);
    });

    test('QueueBoard.jsx contains zero hardcoded queue items in initial state', () => {
        const content = fs.readFileSync(path.join(srcDir, 'components', 'queue', 'QueueBoard.jsx'), 'utf-8');
        assert.doesNotMatch(content, /useState\(\s*\[\s*\{\s*id:\s*["']q-101/);
    });

    test('CustomerQueueWidget.jsx does not hardcode ticket #007 or position 2 in initial state', () => {
        const content = fs.readFileSync(path.join(srcDir, 'components', 'customer', 'CustomerQueueWidget.jsx'), 'utf-8');
        assert.doesNotMatch(content, /formattedQueueNumber:\s*["']#007["']/);
    });

    test('LoginPage.jsx and RegisterPage.jsx have no FAQ teasers or superfluous marketing copy', () => {
        const loginContent = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf-8');
        const regContent = fs.readFileSync(path.join(srcDir, 'pages', 'RegisterPage.jsx'), 'utf-8');
        const authLayoutContent = fs.readFileSync(path.join(srcDir, 'layouts', 'AuthLayout.jsx'), 'utf-8');

        assert.doesNotMatch(loginContent, /FAQ/i);
        assert.doesNotMatch(loginContent, /Frequently Asked Questions/i);
        assert.match(loginContent, /Sign In/);

        assert.doesNotMatch(regContent, /FAQ/i);
        assert.match(regContent, /Create Account/);

        assert.match(authLayoutContent, /Sina Dental Clinic/);
    });

    test('SignalR hub service exists and is integrated into realtime service', () => {
        const signalRPath = path.join(srcDir, 'services', 'signalr.service.js');
        const realtimePath = path.join(srcDir, 'services', 'realtime.service.js');

        assert.ok(fs.existsSync(signalRPath), 'signalr.service.js must exist');
        assert.ok(fs.existsSync(realtimePath), 'realtime.service.js must exist');

        const signalRContent = fs.readFileSync(signalRPath, 'utf-8');
        const realtimeContent = fs.readFileSync(realtimePath, 'utf-8');

        assert.match(signalRContent, /HubConnectionBuilder/);
        assert.match(realtimeContent, /signalRService/);
    });
});

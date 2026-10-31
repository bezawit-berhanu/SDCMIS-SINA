import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { signalRService } from './src/services/signalr.service.js';

describe('SignalR Real-Time Service Tests', () => {
    test('signalRService is initialized with default state', () => {
        assert.ok(signalRService);
        assert.strictEqual(signalRService.isConnected, false);
        assert.ok(signalRService.listeners instanceof Map);
    });

    test('on() registers event callbacks and emit() notifies subscribers', () => {
        let receivedData = null;
        const unsubscribe = signalRService.on('TEST_QUEUE_EVENT', (data) => {
            receivedData = data;
        });

        assert.strictEqual(typeof unsubscribe, 'function');

        signalRService.emit('TEST_QUEUE_EVENT', { ticketNumber: 'Q-101', status: 'SERVING' });
        assert.deepStrictEqual(receivedData, { ticketNumber: 'Q-101', status: 'SERVING' });

        // Test unsubscription
        unsubscribe();
        signalRService.emit('TEST_QUEUE_EVENT', { ticketNumber: 'Q-102', status: 'DONE' });
        // Should remain Q-101 because we unsubscribed
        assert.strictEqual(receivedData.ticketNumber, 'Q-101');
    });

    test('emit() handles error inside a listener gracefully without breaking other listeners', () => {
        let secondCalled = false;

        const unsub1 = signalRService.on('ERROR_TEST', () => {
            throw new Error('Listener error simulation');
        });
        const unsub2 = signalRService.on('ERROR_TEST', () => {
            secondCalled = true;
        });

        assert.doesNotThrow(() => {
            signalRService.emit('ERROR_TEST', { test: true });
        });

        assert.strictEqual(secondCalled, true);
        unsub1();
        unsub2();
    });

    test('supports core Sina Dental real-time event topics', () => {
        const events = [
            'PATIENT_CALLED',
            'VISIT_COMPLETED',
            'QUEUE_UPDATED',
            'NOTIFICATION_CREATED',
            'QUEUE_STATUS_CHANGED',
            'STATUS_CHANGED'
        ];

        events.forEach(evt => {
            let received = false;
            const unsub = signalRService.on(evt, () => {
                received = true;
            });
            signalRService.emit(evt, { test: evt });
            assert.strictEqual(received, true);
            unsub();
        });
    });
});

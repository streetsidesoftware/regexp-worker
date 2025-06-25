/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach } from 'node:test';

import { describe, expect, test, vi } from 'vitest';

import type { BaseWebWorker } from './WebWorker.js';
import { createWebWorker, supportsWebWorkers, WebWorker } from './WebWorker.js';

describe('WebWorker in Node', () => {
    test('supportsWebWorkers', () => {
        expect(supportsWebWorkers()).toBeTypeOf('boolean');
        expect(supportsWebWorkers()).toBe(false);
    });
});

describe('WebWorker', () => {
    beforeEach(() => {});

    test('createWebWorker', () => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        const worker = createWebWorker(import.meta.url);
        expect(worker).toBeInstanceOf(WebWorker);
    });

    test('createWebWorker not supported', () => {
        globalThis.Worker = undefined as unknown as typeof Worker;
        expect(() => createWebWorker(import.meta.url)).toThrowError('Web Workers are not supported in this environment.');
    });

    test('WebWorker', () => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        const webWorker = new WebWorker(mockWorker);
        expect(webWorker).toBeInstanceOf(WebWorker);
        expect(webWorker.postMessage).toBeDefined();
        expect(webWorker.terminate).toBeDefined();
        expect(webWorker.on).toBeDefined();
        expect(webWorker.off).toBeDefined();

        expect(() => webWorker.terminate()).not.toThrow();
        expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
    });

    test('WebWorker fail to terminate', () => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        const webWorker = new WebWorker(mockWorker);

        mockWorker.terminate.mockImplementation(() => {
            throw new Error('Failed.');
        });

        expect(() => webWorker.terminate()).not.toThrow();
    });

    test.each`
        eventType
        ${'message'}
        ${'error'}
    `('WebWorker addEventListener / removeEventListener $eventType', ({ eventType }) => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        const webWorker = new WebWorker(mockWorker);

        const listener = vi.fn();
        webWorker.on(eventType, listener);
        expect(mockWorker.addEventListener).toHaveBeenLastCalledWith(eventType, expect.any(Function));
        expect(mockWorker.addEventListener).toHaveBeenCalledTimes(1);
        webWorker.on(eventType, listener);
        expect(mockWorker.addEventListener).toHaveBeenCalledTimes(1);

        webWorker.off(eventType, vi.fn());
        expect(mockWorker.removeEventListener).not.toHaveBeenCalled();

        webWorker.off(eventType, listener);
        expect(mockWorker.removeEventListener).toHaveBeenCalledWith(eventType, expect.any(Function));
        expect(mockWorker.removeEventListener).toHaveBeenCalledTimes(1);
        webWorker.off(eventType, listener);
        expect(mockWorker.removeEventListener).toHaveBeenCalledTimes(1);

        webWorker.on(eventType, listener);
        expect(mockWorker.addEventListener).toHaveBeenLastCalledWith(eventType, expect.any(Function));

        expect(() => webWorker.removeAllListeners?.()).not.toThrow();
        expect(() => webWorker.terminate()).not.toThrow();

        expect(mockWorker.removeEventListener).toHaveBeenCalledTimes(2);
    });

    test.each`
        eventType
        ${'messageerror'}
        ${'unknown'}
    `('WebWorker addEventListener / removeEventListener $eventType', ({ eventType }) => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        const webWorker = new WebWorker(mockWorker);

        const listener = vi.fn();
        webWorker.on(eventType, listener);
        expect(mockWorker.addEventListener).not.toHaveBeenCalled();
        webWorker.on(eventType, listener);
        expect(mockWorker.addEventListener).not.toHaveBeenCalled();

        webWorker.off(eventType, vi.fn());
        expect(mockWorker.removeEventListener).not.toHaveBeenCalled();

        webWorker.off(eventType, listener);
        expect(mockWorker.removeEventListener).not.toHaveBeenCalled();
        webWorker.off(eventType, listener);
        expect(mockWorker.removeEventListener).not.toHaveBeenCalled();

        expect(() => webWorker.removeAllListeners?.()).not.toThrow();
        expect(() => webWorker.terminate()).not.toThrow();
    });

    test.each`
        eventType    | data
        ${'message'} | ${'Hello, World!'}
        ${'error'}   | ${new Error('Test error')}
    `('WebWorker trigger event $eventType', ({ eventType, data }) => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        let eventListener: EventListener = vi.fn();
        mockWorker.addEventListener.mockImplementation((event, listener) => {
            eventListener = listener as EventListener;
        });
        const webWorker = new WebWorker(mockWorker);

        const listener = vi.fn();
        webWorker.on(eventType, listener);

        const eData = {
            data: eventType === 'message' ? data : undefined,
            error: eventType === 'error' ? data : undefined,
        };
        const event: Event = { type: eventType, ...eData } as unknown as Event;

        eventListener(event);

        expect(listener).toHaveBeenCalledWith(data);

        expect(() => webWorker.removeAllListeners?.()).not.toThrow();
        expect(() => webWorker.terminate()).not.toThrow();
    });

    test('postMessage', () => {
        globalThis.Worker = MockWorker as unknown as typeof Worker;
        expect(globalThis.Worker).toBeDefined();
        const _worker = new Worker(import.meta.url);
        const mockWorker = vi.mocked(_worker, true);
        const webWorker = new WebWorker(mockWorker);

        const message = { type: 'test', data: 'Hello, World!' };
        expect(() => webWorker.postMessage(message)).not.toThrow();
        expect(mockWorker.postMessage).toHaveBeenCalledWith(message);

        expect(() => webWorker.removeAllListeners?.()).not.toThrow();
        expect(() => webWorker.terminate()).not.toThrow();
    });
});

class MockWorker implements BaseWebWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();

    constructor() {
        // Mock implementation if needed
    }
}

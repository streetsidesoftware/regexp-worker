import { beforeEach, describe, test, expect, vi } from 'vitest';
import type { MessagePort } from './MessagePort.js';
import { createHandler, LogLevel } from './WorkerMessageHandler.js';
import { createRequestEcho } from '../Procedures/procEcho.js';
import { createRequest } from '../Procedures/procedure.js';
import { NullID } from '../Procedures/uniqueId.js';
import { createRequestGenError } from '../Procedures/procGenError.js';

const consoleLog = (console.log = vi.fn());
const consoleWarn = (console.warn = vi.fn());
const consoleError = (console.error = vi.fn());

describe('WorkerMessageHandler', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('createHandler', () => {
        const port = mockMessagePort();
        const handler = createHandler(port);
        expect(port.registeredCallbacks.size).toBe(1);
        handler.dispose();
        expect(port.registeredCallbacks.size).toBe(0);
        port.close();
        expect(port.on).toBeCalledWith('message', expect.any(Function));
        expect(port.off).toBeCalledWith('message', expect.any(Function));
        expect(consoleLog).not.toBeCalled();
        expect(consoleWarn).not.toBeCalled();
        expect(consoleError).not.toBeCalled();
    });

    test('Echo', async () => {
        const port = mockMessagePort();
        const messagesIterator = port.messagesAsync[Symbol.asyncIterator]();
        const handler = createHandler(port);
        port.sendMessage(createRequestEcho('Hello'));
        const response = await messagesIterator.next();
        expect(response.value).toEqual(
            expect.objectContaining({
                data: 'Hello',
            }),
        );
        handler.dispose();
        port.close();
    });

    test('Echo using Iterator', async () => {
        const port = mockMessagePort();
        const handler = createHandler(port);
        port.sendMessage(createRequestEcho('Hello'));
        const response = await port.next();
        expect(response.value).toEqual(
            expect.objectContaining({
                data: 'Hello',
            }),
        );
        handler.dispose();
        port.close();
    });

    test('Unhandled Request', async () => {
        const port = mockMessagePort();
        const messagesIterator = port.messagesAsync[Symbol.asyncIterator]();
        const handler = createHandler(port);
        handler.logLevel = LogLevel.LogLevelDebug;
        port.sendMessage(createRequest('Test Unknown', {}));
        const response = await messagesIterator.next();
        expect(response.value).toEqual(
            expect.objectContaining({
                responseType: 'Error',
                data: {
                    message: 'Unhandled Request',
                    requestType: 'Test Unknown',
                },
            }),
        );
        handler.dispose();
        port.close();
        expect(consoleLog).toBeCalled();
        expect(consoleWarn).toBeCalled();
        expect(consoleError).not.toBeCalled();
    });

    test('Bad Request', async () => {
        const port = mockMessagePort();
        const messagesIterator = port.messagesAsync[Symbol.asyncIterator]();
        const handler = createHandler(port);
        handler.logLevel = LogLevel.LogLevelDebug;
        port.sendMessage('Bad Request');
        const response = await messagesIterator.next();
        expect(response.value).toEqual(
            expect.objectContaining({
                responseType: 'Error',
                id: NullID,
                data: {
                    message: expect.stringContaining('Badly formed Request'),
                    requestType: undefined,
                },
            }),
        );
        handler.dispose();
        port.close();
        expect(consoleLog).toBeCalled();
        expect(consoleWarn).not.toBeCalled();
        expect(consoleError).toBeCalled();
    });

    test('Generating Errors', async () => {
        const port = mockMessagePort();
        const handler = createHandler(port);

        const requestThrow = createRequestGenError('Throw');
        port.sendMessage(requestThrow);
        const responseThrow = await port.next();
        expect(responseThrow.value).toEqual(
            expect.objectContaining({
                id: requestThrow.id,
                responseType: 'Error',
                data: expect.objectContaining({
                    message: 'Error Thrown',
                }),
            }),
        );

        const requestReject = createRequestGenError('reject');
        port.sendMessage(requestReject);
        const responseReject = await port.next();
        expect(responseReject.value).toEqual(
            expect.objectContaining({
                id: requestReject.id,
                responseType: 'Error',
                data: expect.objectContaining({
                    message: 'Error: Reject',
                }),
            }),
        );

        handler.dispose();
        port.close();
    });
});

interface AsyncMessagePort extends MessagePort, AsyncIterator<any> {
    messages: any[];
    messagesAsync: AsyncIterable<any>;
    registeredCallbacks: Map<string, Set<(value?: any) => void>>;
    sendMessage(v: any): void;
    close: () => void;
}

function mockMessagePort(): AsyncMessagePort {
    let resolveAsync: ResolveAsync<any> | undefined;
    const messages = [] as Array<any>;
    const messagesAsync = callbackIterable<any>((resolve) => {
        resolveAsync = resolve;
    });

    function postMessage(value: any) {
        messages.push(value);
        resolveAsync?.(Promise.resolve({ value }));
    }

    const registeredCallbacks = new Map<string, Set<(value?: any) => void>>();

    function on(event: string, callback: (valid?: any) => void) {
        const callbacks = registeredCallbacks.get(event) ?? new Set();
        callbacks.add(callback);
        registeredCallbacks.set(event, callbacks);
        return port;
    }

    function off(event: string, callback: (valid?: any) => void) {
        const callbacks = registeredCallbacks.get(event);
        if (!callbacks || !callbacks.has(callback)) throw new Error(`Unknown Function "${event}"`);

        callbacks.delete(callback);
        if (!callbacks.size) {
            registeredCallbacks.delete(event);
        }
        return port;
    }

    function sendMessage(v: any) {
        const callbacks = registeredCallbacks.get('message');
        if (!callbacks) throw new Error('No listeners on "message"');
        for (const call of callbacks) {
            call(v);
        }
    }

    function close() {
        resolveAsync?.(Promise.resolve({ done: true, value: undefined }));
    }

    const mockOn = vi.fn(on) as AsyncMessagePort['on'];
    const mockOff = vi.fn(off) as AsyncMessagePort['off'];

    const iterator = messagesAsync[Symbol.asyncIterator]();
    const next = () => iterator.next();

    const port: AsyncMessagePort = {
        messages,
        messagesAsync,
        registeredCallbacks,
        sendMessage,
        postMessage: vi.fn(postMessage) as AsyncMessagePort['postMessage'],
        on: mockOn,
        off: mockOff,
        next,
        close,
    };

    return port;
}

type ResolveAsync<T> = (v: Promise<IteratorResult<T>>) => void;
type CallbackAsync<T> = (resolve: ResolveAsync<T>) => void;

function callbackIterable<T>(callBack: CallbackAsync<T>): AsyncIterable<T> {
    const buffer: Promise<IteratorResult<T>>[] = [];
    let done = false;
    let pending: ((v?: any) => void) | undefined;

    callBack((next) => {
        buffer.push(next);
        trigger();
    });

    function trigger() {
        const resolve = pending;
        pending = undefined;
        if (resolve) {
            resolve(next());
        }
    }

    async function next(): Promise<IteratorResult<T>> {
        if (done) return { done, value: undefined };

        if (buffer.length) {
            const v = await buffer.shift()!;
            done = !!v.done;
            return v;
        }

        return new Promise<IteratorResult<T>>((resolve) => {
            pending = resolve;
        });
    }

    const iterable = {
        [Symbol.asyncIterator]: () => ({ next }),
    };
    return iterable;
}

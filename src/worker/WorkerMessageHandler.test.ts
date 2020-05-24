import { MessagePort } from './MessagePort';
import { createHandler, LogLevel } from './WorkerMessageHandler';
import { createRequestEcho } from '../Procedures/procEcho';
import { createRequest } from '../Procedures/procedure';
import { NullID } from '../Procedures/uniqueId';

const consoleLog = console.log = jest.fn();
const consoleWarn = console.warn = jest.fn();
const consoleError = console.error = jest.fn();

describe('WorkerMessageHandler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
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
        expect(response.value).toEqual(expect.objectContaining({
            data: 'Hello'
        }))
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
        expect(response.value).toEqual(expect.objectContaining({
            responseType: 'Error',
            data: {
                message: 'Unhandled Request',
                requestType: 'Test Unknown'
            }
        }))
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
        expect(response.value).toEqual(expect.objectContaining({
            responseType: 'Error',
            id: NullID,
            data: {
                message: expect.stringContaining('Badly formed Request'),
                requestType: undefined
            }
        }))
        handler.dispose();
        port.close();
        expect(consoleLog).toBeCalled();
        expect(consoleWarn).not.toBeCalled();
        expect(consoleError).toBeCalled();
    });
});


interface AsyncMessagePort extends MessagePort {
    messages: any[];
    messagesAsync: AsyncIterable<any>;
    registeredCallbacks: Map<string, Set<(value?: any) => void>>;
    sendMessage(v: any): void;
    close: () => void;
}

function mockMessagePort(): AsyncMessagePort {

    let resolveAsync: ResolveAsync<any> | undefined;
    const messages = [] as Array<any>;
    const messagesAsync = callbackIterable<any>(resolve => {
        resolveAsync = resolve;
    });

    function postMessage(value: any) {
        messages.push(value);
        resolveAsync?.(Promise.resolve({ value }))
    }

    const registeredCallbacks = new Map<string, Set<(value?: any) => void>>()

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

    const mockOn = jest.fn(on) as AsyncMessagePort['on'];
    const mockOff = jest.fn(off) as AsyncMessagePort['off'];

    const port: AsyncMessagePort = {
        messages,
        messagesAsync,
        registeredCallbacks,
        sendMessage,
        postMessage: jest.fn(postMessage) as AsyncMessagePort['postMessage'],
        on: mockOn,
        off: mockOff,
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

        return new Promise<IteratorResult<T>>(resolve => {
            pending = resolve;
        });
    }

    const iterable = {
        [Symbol.asyncIterator]: () => ({ next })
    }
    return iterable;
}

import { procedures } from '../Procedures/procedures.js';
import type { MessagePort } from './MessagePort.js';
import { createHandler } from './WorkerMessageHandler.js';

class BrowserMessagePort implements MessagePort {
    #messageListeners: Set<(value: unknown) => void> = new Set();

    constructor() {
        globalThis.addEventListener('message', this.#listenerMessage);
    }

    postMessage(value: unknown): void {
        globalThis.postMessage(value);
    }

    on(event: 'close', listener: () => void): this;
    on(event: 'message', listener: (value: unknown) => void): this;
    on(event: string, listener: (value?: unknown) => void): this {
        if (event === 'message') {
            this.#messageListeners.add(listener);
        }
        return this;
    }

    off(event: 'close', listener: () => void): this;
    off(event: 'message', listener: (value: unknown) => void): this;
    off(event: string, listener: (value?: unknown) => void): this {
        if (event === 'message') {
            this.#messageListeners.delete(listener);
        }
        return this;
    }

    #listenerMessage: (value: MessageEvent) => void = (event: MessageEvent) => {
        for (const listener of this.#messageListeners) {
            listener(event.data);
        }
    };
}

createHandler(new BrowserMessagePort(), procedures);

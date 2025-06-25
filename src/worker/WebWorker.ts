import type { IWorker } from './Worker.js';

export function supportsWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
}

export function createWebWorker(scriptURL: string | URL): WebWorker {
    if (!supportsWebWorkers()) {
        throw new Error('Web Workers are not supported in this environment.');
    }
    const worker = new Worker(scriptURL, { type: 'module' });
    return new WebWorker(worker);
}

type Listener = ((err: Error) => void) | ((p?: unknown) => void);
type WebEventListener = EventListener;

export type BaseWebWorker = Pick<Worker, 'postMessage' | 'terminate' | 'addEventListener' | 'removeEventListener'>;

export class WebWorker implements IWorker {
    #eventListeners: Map<string, Map<Listener, WebEventListener>> = new Map();
    constructor(private worker: BaseWebWorker) {}

    postMessage(message: unknown): void {
        this.worker.postMessage(message);
    }
    terminate(): void {
        try {
            this.worker.terminate();
        } catch {
            // console.error('Failed to terminate the worker.');
        }
    }

    on(event: 'message', listener: (value: unknown) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'messageerror', listener: (error: Error) => void): this;
    // on(event: 'exit', listener: (exitCode: number) => void): this;
    // on(event: 'online', listener: () => void): this;
    on(event: string, listener: Listener): this {
        const eventListener = this.#toWebEventListener(event, listener);
        this.#addListener(event, eventListener, listener);
        return this;
    }

    off(event: 'message', listener: (value: unknown) => void): this;
    off(event: 'error', listener: (err: Error) => void): this;
    off(event: 'messageerror', listener: (error: Error) => void): this;
    off(event: string, listener: Listener): this {
        this.#removeListener(event, listener);
        return this;
    }

    #addListener(event: string, eventListener: WebEventListener | undefined, listener: Listener): void {
        if (!eventListener) {
            return;
        }

        const listeners = this.#eventListeners.get(event) || new Map<Listener, WebEventListener>();
        if (!this.#eventListeners.has(event)) {
            this.#eventListeners.set(event, listeners);
        }
        if (listeners.has(listener)) return; // Avoid adding the same listener multiple times
        listeners.set(listener, eventListener);
        this.worker.addEventListener(event, eventListener);
    }

    #removeListener(event: string, listener: Listener): void {
        const listeners = this.#eventListeners.get(event);
        const webEventListener = listeners?.get(listener);
        listeners?.delete(listener);
        if (webEventListener) {
            this.worker.removeEventListener(event, webEventListener);
        }
    }

    #toWebEventListener(event: string, listener: Listener): WebEventListener | undefined {
        switch (event) {
            case 'message':
                return ((e: MessageEvent) => (listener as (value: unknown) => void)(e.data)) as WebEventListener;
            case 'error':
                return ((e: ErrorEvent) => listener(e.error as Error)) as WebEventListener;
            case 'messageerror':
                return undefined; // 'messageerror' is not a standard event for Web Workers
        }
        return undefined;
    }

    removeAllListeners(): void {
        const listeners = this.#eventListeners;
        this.#eventListeners = new Map();
        for (const [event, eventListeners] of listeners.entries()) {
            for (const listener of eventListeners.values()) {
                this.worker.removeEventListener(event, listener);
            }
        }
    }
}

export interface IWorker {
    postMessage(message: unknown): void;
    terminate: (() => void) | (() => Promise<void>);

    on(event: 'error', listener: (err: Error) => void): this;
    // on(event: 'exit', listener: (exitCode: number) => void): this; // 'exit' event might have limited browser support
    on(event: 'message', listener: (value: unknown) => void): this;
    on(event: 'messageerror', listener: (error: Error) => void): this;
    // on(event: 'online', listener: () => void): this; // 'online' event might have limited browser support

    off(event: 'error', listener: (err: Error) => void): this;
    // off(event: 'exit', listener: (exitCode: number) => void): this; // 'exit' event might have limited browser support
    off(event: 'message', listener: (value: unknown) => void): this;
    off(event: 'messageerror', listener: (error: Error) => void): this;
    // off(event: 'online', listener: () => void): this; // 'online' event might have limited browser support

    removeAllListeners?: () => void;
}

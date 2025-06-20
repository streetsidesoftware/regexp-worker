export interface Worker {
    postMessage(message: unknown): void;
    terminate: (() => void) | (() => Promise<void>);

    on(event: 'error', listener: (err: Error) => void): this;
    /** 'exit' event might have limited browser support */
    on(event: 'exit', listener: (exitCode: number) => void): this;
    on(event: 'message', listener: (value: unknown) => void): this;
    on(event: 'messageerror', listener: (error: Error) => void): this;
    /** 'online' event might have limited browser support */
    on(event: 'online', listener: () => void): this;

    off(event: 'error', listener: (err: Error) => void): this;
    /** 'exit' event might have limited browser support */
    off(event: 'exit', listener: (exitCode: number) => void): this;
    off(event: 'message', listener: (value: unknown) => void): this;
    off(event: 'messageerror', listener: (error: Error) => void): this;
    /** 'online' event might have limited browser support */
    off(event: 'online', listener: () => void): this;

    removeAllListeners?: () => void;
}

export interface MessagePort {
    postMessage(value: unknown): void;
    on(event: 'close', listener: () => void): this;
    on(event: 'message', listener: (value: unknown) => void): this;
    off(event: 'close', listener: () => void): this;
    off(event: 'message', listener: (value: unknown) => void): this;
}

export const nullPort: MessagePort = Object.freeze({
    postMessage() {},
    on() {
        return nullPort;
    },
    off() {
        return nullPort;
    },
    once() {
        return nullPort;
    },
});

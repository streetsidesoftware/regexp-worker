export interface MessagePort {
    postMessage(value: any, transferList?: Array<ArrayBuffer | MessagePort>): void;
    on(event: 'close', listener: () => void): this;
    on(event: 'message', listener: (value: any) => void): this;
    off(event: 'close', listener: () => void): this;
    off(event: 'message', listener: (value: any) => void): this;
}


export const nullPort: MessagePort = {
    postMessage() {},
    on() { return nullPort },
    off() { return nullPort },
}

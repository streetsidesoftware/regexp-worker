import { MessagePort, nullPort } from './MessagePort';
import {
    isRequest, createErrorResponse,
} from './procedure';

import { procedures } from './procedures';


export function createHandler(port: MessagePort): WorkerMessageHandler {
    return new WorkerMessageHandler(port);
}

const LogLevelNone = 0;
const LogLevelError = 1;
const LogLevelWarn = 2;
const LogLevelInfo = 3;
const LogLevelDebug = 4;

type LogLevel = typeof LogLevelNone
    | typeof LogLevelError
    | typeof LogLevelWarn
    | typeof LogLevelInfo
    | typeof LogLevelDebug;


export class WorkerMessageHandler {
    public logLevel: LogLevel = LogLevelError;
    private listener: (value: any) => void;

    constructor(private port: MessagePort) {
        this.listener = (v: any) => this.listenerMessage(v);
        port.on('message', this.listener);
    }

    dispose(): void {
        this.port.off('message', this.listener);
        this.port = nullPort;
    }

    private post(msg: any) {
        this.log(LogLevelDebug, 'Post: ' + JSON.stringify(msg));
        this.port.postMessage(msg);
    }

    private log(level: LogLevel, message?: any, ...rest: any[]) {
        if (level > this.logLevel) return;
        switch(level) {
            case LogLevelError: console.error(message, ...rest); break;
            case LogLevelWarn: console.warn(message, ...rest); break;
            default:
                console.log(message, ...rest);
        }
    }

    private listenerMessage(value: any) {
        this.log(LogLevelDebug, `message: ${JSON.stringify(value)}`);
        if (!isRequest(value)) {
            const msg = `Badly formed Request: ${JSON.stringify(value)}`;
            this.log(LogLevelError, msg);
            this.post(createErrorResponse(value, msg));
            return;
        }
        const request = value;

        for (const proc of procedures) {
            const response = proc(request);
            if (response) {
                Promise.resolve(response)
                .catch(reason => createErrorResponse(request, reason.toString()))
                .then(r => this.post(r));
                return;
            }
        }

        this.post(createErrorResponse(request, 'Unhandled Request'));
    }
}

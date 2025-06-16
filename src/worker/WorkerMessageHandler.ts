import { format } from 'util';
import { isError } from '../helpers/errors.js';
import { createErrorResponse, isRequest } from '../Procedures/procedure.js';
import { procedures } from '../Procedures/procedures.js';
import { MessagePort, nullPort } from './MessagePort.js';

export function createHandler(port: MessagePort): WorkerMessageHandler {
    return new WorkerMessageHandler(port);
}

export enum LogLevel {
    LogLevelNone = 0,
    LogLevelError = 1,
    LogLevelWarn = 2,
    LogLevelInfo = 3,
    LogLevelDebug = 4,
}

export class WorkerMessageHandler {
    public logLevel: LogLevel = LogLevel.LogLevelError;
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
        this.log(LogLevel.LogLevelDebug, 'Post: ' + JSON.stringify(msg));
        this.port.postMessage(msg);
    }

    private log(level: LogLevel, message?: any, ...rest: any[]) {
        if (level > this.logLevel) return;
        switch (level) {
            case LogLevel.LogLevelError:
                console.error(message, ...rest);
                break;
            case LogLevel.LogLevelWarn:
                console.warn(message, ...rest);
                break;
            default:
                console.log(message, ...rest);
        }
    }

    private listenerMessage(value: any) {
        this.log(LogLevel.LogLevelDebug, `message: ${JSON.stringify(value)}`);
        if (!isRequest(value)) {
            const msg = `Badly formed Request: ${JSON.stringify(value)}`;
            this.log(LogLevel.LogLevelError, msg);
            this.post(createErrorResponse(value, msg));
            return;
        }
        const request = value;

        for (const proc of procedures) {
            try {
                const response = proc(request);
                if (response !== undefined) {
                    Promise.resolve(response)
                        .catch((reason) => createErrorResponse(request, reason.toString(), reason))
                        .then((r) => this.post(r));
                    return;
                }
            } catch (e) {
                const msg = isError(e) ? e.message : format(e);
                this.post(createErrorResponse(request, msg, isError(e) ? e : undefined));
                return;
            }
        }

        this.log(LogLevel.LogLevelWarn, `Unhandled Request "${value.requestType}"`);
        this.post(createErrorResponse(request, 'Unhandled Request'));
    }
}

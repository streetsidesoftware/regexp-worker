import { format } from 'util';
import { isError, toError } from '../helpers/errors.js';
import { createErrorResponse, isRequest } from '../Procedures/procedure.js';
import { procedures } from '../Procedures/procedures.js';
import type { MessagePort } from './MessagePort.js';
import { nullPort } from './MessagePort.js';

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

export type LogParams = Parameters<typeof console.log>;

export class WorkerMessageHandler {
    public logLevel: LogLevel = LogLevel.LogLevelError;
    private listener: (value: unknown) => void;

    constructor(private port: MessagePort) {
        this.listener = (v: unknown) => this.listenerMessage(v);
        port.on('message', this.listener);
    }

    dispose(): void {
        this.port.off('message', this.listener);
        this.port = nullPort;
    }

    private post(msg: unknown): void {
        this.log(LogLevel.LogLevelDebug, 'Post: ' + JSON.stringify(msg));
        this.port.postMessage(msg);
    }

    private log(level: LogLevel, ...params: LogParams): void {
        if (level > this.logLevel) return;
        switch (level) {
            case LogLevel.LogLevelError:
                console.error(...params);
                break;
            case LogLevel.LogLevelWarn:
                console.warn(...params);
                break;
            default:
                console.log(...params);
        }
    }

    private listenerMessage(value: unknown): void {
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
                        .catch((reason) => createErrorResponse(request, String(reason), toError(reason)))
                        .then((r) => this.post(r))
                        .catch(() => {});
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

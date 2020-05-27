import { ExecRegExpResult, ExecRegExpMatrixResult } from './helpers/evaluateRegExp';
import { Scheduler } from './scheduler';
import { createRequestExecRegExp } from './Procedures/procExecRegExp';
import { createRequestExecRegExpMatrix } from './Procedures/procExecRegExpMatrix';

export { ExecRegExpResult, toRegExp } from './helpers/evaluateRegExp';

export class RegExpWorker {
    private scheduler: Scheduler;
    public dispose: () => Promise<void> = () => this._dispose();

    constructor(timeoutMs?: number) {
        this.scheduler = new Scheduler(timeoutMs);
    }

    public execRegExp(regExp: RegExp, text: string, timeLimitMs?: number): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.scheduler.scheduleRequest(req, timeLimitMs).then(r => r.data);
    }

    public execRegExpMatrix(regExpArray: RegExp[], textArray: string[], timeLimitMs?: number): Promise<ExecRegExpMatrixResult> {
        const req = createRequestExecRegExpMatrix({ regExpArray, textArray });
        return this.scheduler.scheduleRequest(req, timeLimitMs).then(r => r.data);
    }

    private _dispose(): Promise<void> {
        return this.scheduler.dispose().then();
    }

    set timeout(timeoutMs: number) {
        this.scheduler.executionTimeLimitMs = timeoutMs;
    }

    get timeout(): number {
        return this.scheduler.executionTimeLimitMs;
    }
}

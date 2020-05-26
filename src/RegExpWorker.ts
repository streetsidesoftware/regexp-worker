import { ExecRegExpResult } from './helpers/evaluateRegExp';
import { Scheduler } from './scheduler';
import { createRequestExecRegExp } from './Procedures/procExecRegExp';

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

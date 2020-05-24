import { ExecRegExpResult } from './helpers/evaluateRegExp';
import { Scheduler } from './scheduler';
import { createRequestExecRegExp } from './Procedures/procExecRegExp';

export { ExecRegExpResult, toRegExp } from './helpers/evaluateRegExp';

export class RegExpWorker {
    private scheduler = new Scheduler();
    public dispose: () => Promise<void> = () => this._dispose();

    public execRegExp(regExp: RegExp, text: string): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.scheduler.sendRequest(req).then(r => r.data);
    }

    private _dispose(): Promise<void> {
        return this.scheduler.dispose().then();
    }
}

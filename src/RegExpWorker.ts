import { ExecRegExpResult } from './helpers/evaluateRegExp';
import { Scheduler } from './scheduler';
import { createRequestExecRegExp, isExecRegExpResponse, ResponseExecRegExp } from './Procedures/procExecRegExp';
import { Response, isErrorResponse, ErrorResponse } from './Procedures/procedure';

export { ExecRegExpResult, toRegExp } from './helpers/evaluateRegExp';

export class RegExpWorker {
    private scheduler = new Scheduler();
    public dispose: () => Promise<void> = () => this._dispose();

    public execRegExp(regExp: RegExp, text: string): Promise<ExecRegExpResult> {
        const req = createRequestExecRegExp({ regexp: regExp, text });
        return this.scheduler.sendRequest(req).then(r => checkResponse<ResponseExecRegExp>(r, isExecRegExpResponse).data);
    }

    private _dispose(): Promise<void> {
        return this.scheduler.dispose().then();
    }
}

/**
 * Checks the type of a response or throws the response
 */
function checkResponse<T extends Response>(
    response: ErrorResponse | Response,
    validator: (r : T | ErrorResponse | Response) => r is T
): T {
    if (!validator(response)) {
        if (isErrorResponse(response)) {
            throw { message: response.data.message, response: response, }
        } else {
            throw { message: 'Unexpected Response', response: response, }
        }
    }
    return response;
}

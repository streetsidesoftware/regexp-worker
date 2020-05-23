import { Scheduler } from './scheduler';
import { RequestEcho } from './procEcho';
import * as Path from 'path';

const relDir = /ts$/.test(__filename) ? '../lib' : '.';
const libDir = Path.join(__dirname, relDir);

describe('Scheduler', () => {

    test('Create', () => {
        const m = new Scheduler(libDir);
        return expect(m.dispose()).resolves.toBe(0);
    });

    test('Echo', () => {
        const scheduler = new Scheduler(libDir);
        async function run() {
            const request = scheduler.createRequest<RequestEcho>('Echo', sampleText());
            const r = await scheduler.sendRequest(request);
            expect(r.data).toBe(sampleText());
        }

        return run().finally(scheduler.dispose);
    });

});

function sampleText() {
    return `
    test('EvaluateRegExp', () => {
        const manager = new Manager(libDir);
        async function run() {
            const r = await manager.evaluateRegExp(/\w+/g, );
            expect(r).toBe('hello there');
        }

        return run().finally(manager.dispose);
    });
`;
}

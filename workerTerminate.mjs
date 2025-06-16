import { isMainThread, Worker } from 'worker_threads';

// a Very costly RegExp
const regEx = /(x+x+)+y+/g;
const sample = 'x'.repeat(50) + '';

if (!isMainThread) {
    console.log('Worker: Starting');
    const start = performance.now();
    console.log('%o', regEx.test(sample));
    console.log(`Elapsed Time ${elapsedTimeMsFrom(start)}`);
    console.log('Worker: Stopping');
    setTimeout(() => process.exit(0), 10);
}

if (isMainThread) {
    const worker = new Worker(new URL(import.meta.url));
    setTimeout(() => {
        console.log('Main: Terminating Worker');
        const start = performance.now();
        worker.terminate().then((i) => {
            console.log('Terminated with ' + i);
            console.log(`After ${elapsedTimeMsFrom(start)}ms`);
            console.log('Successfully Terminated!');
            process.exit(0);
        });
        setTimeout(() => {
            console.log('Hard Exit');
            console.log(`After ${elapsedTimeMsFrom(start)}ms`);
            process.exit(1);
        }, 2000);
    }, 500);
}

/**
 *
 * @param {number} relativeTo
 * @returns {number} elapsed time in milliseconds
 */
function elapsedTimeMsFrom(relativeTo) {
    return performance.now() - relativeTo;
}

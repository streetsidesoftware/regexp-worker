// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isMainThread, Worker } = require('worker_threads')

// a Very costly RegExp
const regEx = /(x+x+)+y+/g;
const sample = 'x'.repeat(50) + '';

if (!isMainThread) {
    console.log('Worker: Starting')
    const start = process.hrtime()
    regEx.test(sample) ? console.log('true') : console.log('false')
    console.log(`Elapsed Time ${elapsedTimeMsFrom(start)}`)
    console.log('Worker: Stopping')
    setTimeout(() => process.exit(0), 10)
}

if (isMainThread) {
    const worker = new Worker(__filename)
    setTimeout(() => {
        console.log('Main: Terminating Worker')
        const start = process.hrtime()
        worker.terminate().then(i => {
            console.log('Terminated with ' + i)
            console.log(`After ${elapsedTimeMsFrom(start)}ms`)
            console.log('Successfully Terminated!')
            process.exit(0)
        })
        setTimeout(() => {
            console.log('Hard Exit')
            console.log(`After ${elapsedTimeMsFrom(start)}ms`)
            process.exit(1)
        }, 2000)
    }, 500)
}

function elapsedTimeMsFrom(relativeTo) {
    return hrTimeToMs(process.hrtime(relativeTo));
}

function hrTimeToMs(hrTime) {
    return hrTime[0] * 1.0e-3 + hrTime[1] * 1.0e-6
}

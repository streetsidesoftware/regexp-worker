const { workerMatchAll } = require('regexp-worker');

async function run() {
    const response = await workerMatchAll('Good Morning', /\b/g);
    console.log(response.matches.map((m) => m.index));
}

run();

const { workerMatchAll } = require('regexp-worker');

async function run() {
    const response = await workerMatchAll('Good Morning', /\b\w+/g);
    console.log(response.matches.map((m) => m[0]));
}

run();

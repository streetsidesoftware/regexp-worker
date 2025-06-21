import { workerMatchAll } from 'regexp-worker';

const response = await workerMatchAll('Good Morning', /\b\w+/g);
console.log(response.matches.map((m) => m[0]));

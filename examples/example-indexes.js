import { workerMatchAll } from 'regexp-worker';

const response = await workerMatchAll('Good Morning', /\b/g);
console.log(response.matches.map((m) => m.index));

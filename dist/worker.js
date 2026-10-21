import { solve } from './solver.js';
self.onmessage = event => {
  const { id, level, options } = event.data;
  try {
    const result = solve(level, options, progress => self.postMessage({ type: 'progress', id, progress }));
    self.postMessage({ type: 'result', id, result });
  } catch (error) { self.postMessage({ type: 'error', id, message: error.message }); }
};

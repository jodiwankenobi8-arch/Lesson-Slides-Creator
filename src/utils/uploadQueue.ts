/**
 * Upload Queue - Sequential Upload Manager
 * 
 * ⭐ Key speed fix: MAX_CONCURRENT = 1 prevents bandwidth splitting
 * 
 * Uploads that run in parallel compete for bandwidth and feel slower.
 * Sequential uploads use full bandwidth and complete faster.
 */

type Task = () => Promise<void>;

const MAX_CONCURRENT = 1; // ⭐ key speed fix: prevents bandwidth splitting
let active = 0;
const q: Task[] = [];

function pump() {
  if (active >= MAX_CONCURRENT) return;
  const task = q.shift();
  if (!task) return;

  active++;
  task()
    .catch(() => {})
    .finally(() => {
      active--;
      pump();
    });
}

export function enqueueUpload(task: Task) {
  q.push(task);
  pump();
}

/**
 * Get queue status (useful for debugging)
 */
export function getQueueStatus() {
  return {
    active,
    queued: q.length,
    maxConcurrent: MAX_CONCURRENT,
  };
}

/**
 * Clear all queued uploads (useful for cleanup)
 */
export function clearQueue() {
  q.length = 0;
}

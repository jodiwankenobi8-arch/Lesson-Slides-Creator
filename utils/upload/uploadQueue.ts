/**
 * Upload Queue - Sequential Upload Manager
 * 
 * ✅ Fastest in real life: MAX_CONCURRENT = 1 prevents bandwidth splitting
 * 
 * When you upload files in parallel, they compete for bandwidth.
 * Sequential uploads use 100% of available bandwidth per file.
 */

type Task = () => Promise<void>;

const MAX_CONCURRENT = 1; // ✅ fastest in real life: prevents bandwidth splitting
let active = 0;
const queue: Task[] = [];

function pump() {
  if (active >= MAX_CONCURRENT) return;
  const task = queue.shift();
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
  queue.push(task);
  pump();
}

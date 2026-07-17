import { Job } from "bullmq";

// Shared dispatch wrapper for the queue workers. Looks the job's processorKey up
// in the feature's own job map, runs the handler, and re-throws so BullMQ marks
// the job failed and retries it. Each feature passes its own map, so a worker
// only ever runs the jobs that belong to its queue.
export function createProcessor<K extends string>(
  label: string,
  jobs: Record<K, (job: Job) => Promise<void>>,
) {
  return async function process(job: Job) {
    try {
      const handler = jobs[job.data.processorKey as K];
      if (!handler) {
        throw new Error(`[${label}]: Invalid job processor`);
      }
      await handler(job);
    } catch (error) {
      console.error(`[${label}]:`, job.name, "failed with error", error);
      throw error; // re-throw so BullMQ marks the job failed and retries it
    }
  };
}

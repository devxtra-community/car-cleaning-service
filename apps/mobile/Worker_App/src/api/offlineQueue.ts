import storage from '../utils/storage';
import api from './api';

const QUEUE_KEY = '@offline_requests_queue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: any;
  timestamp: number;
}

/**
 * Add a failed request to the queue.
 */
export const enqueueRequest = async (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
  try {
    const queue = await getQueue();
    const newRequest: QueuedRequest = {
      ...request,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: Date.now(),
    };

    queue.push(newRequest);
    await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Enqueued request to ${request.url}`);
  } catch (err) {
    console.error('[OfflineQueue] Failed to enqueue request:', err);
  }
};

/**
 * Get all queued requests.
 */
export const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const queueStr = await storage.getItem(QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (err) {
    console.error('[OfflineQueue] Failed to get queue:', err);
    return [];
  }
};

/**
 * Remove a specific request from the queue.
 */
export const dequeueRequest = async (id: string) => {
  try {
    const queue = await getQueue();
    const filtered = queue.filter((r) => r.id !== id);
    await storage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('[OfflineQueue] Failed to dequeue request:', err);
  }
};

/**
 * Clear the entire queue.
 */
export const clearQueue = async () => {
  try {
    await storage.removeItem(QUEUE_KEY);
  } catch (err) {
    console.error('[OfflineQueue] Failed to clear queue:', err);
  }
};

/**
 * Attempt to resend all queued requests.
 */
export const syncQueue = async () => {
  try {
    const queue = await getQueue();
    if (queue.length === 0) return { success: true, synced: 0, failed: 0 };

    console.log(`[OfflineQueue] Syncing ${queue.length} requests...`);
    let synced = 0;
    let failed = 0;

    // Process sequentially to maintain order and prevent server explosion
    for (const req of queue) {
      try {
        await api({
          url: req.url,
          method: req.method,
          data: req.data,
          headers: req.headers,
        });

        // If successful, remove from queue
        await dequeueRequest(req.id);
        synced++;
      } catch (err: any) {
        // If it's a network error (no internet), we stop syncing.
        // If it's a 4xx/5xx error, we might still want to remove it or log it, but for now we'll keep it.
        console.error(`[OfflineQueue] Failed to sync request ${req.url}:`, err.message);
        failed++;
      }
    }

    return { success: failed === 0, synced, failed };
  } catch (err) {
    console.error('[OfflineQueue] Error during sync:', err);
    return { success: false, synced: 0, failed: -1 };
  }
};

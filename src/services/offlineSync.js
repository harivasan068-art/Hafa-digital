/**
 * HafA DIGITAL - Offline Queue & Auto-Sync Engine
 * 
 * Manages local storage persistence for offline attendance & task updates
 * and listens for network reconnection to perform automatic background batch syncing.
 */

import { apiCall } from './api';

export const OFFLINE_QUEUE_KEY = 'hafa_offline_queue';

/**
 * Retrieves current list of queued offline payload submissions
 * @returns {Array} List of queued payload objects
 */
export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[OfflineSync] Error reading queue from localStorage:', err);
    return [];
  }
};

/**
 * Saves a payload item to the offline queue
 * @param {object} item - Submission item containing action and payload data
 * @returns {Array} Updated offline queue
 */
export const saveToOfflineQueue = (item) => {
  try {
    const queue = getOfflineQueue();
    const newItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      action: item.action || 'clockIn',
      data: item.data || item,
      timestamp: new Date().toISOString()
    };

    queue.push(newItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    // Dispatch custom window event to alert UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hafa_queue_updated'));
    }

    console.log('[OfflineSync] Saved payload to offline queue:', newItem);
    return queue;
  } catch (err) {
    console.error('[OfflineSync] Error saving to offline queue:', err);
    return [];
  }
};

/**
 * Removes a specific item from the offline queue by ID
 * @param {string} id - Unique offline item identifier
 */
export const removeFromOfflineQueue = (id) => {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hafa_queue_updated'));
    }
  } catch (err) {
    console.error('[OfflineSync] Error removing item from queue:', err);
  }
};

/**
 * Clears all items in the offline queue
 */
export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hafa_queue_updated'));
    }
  } catch (err) {
    console.error('[OfflineSync] Error clearing offline queue:', err);
  }
};

/**
 * Toast Notification Helper for Auto-Sync Success
 */

export const showToastNotification = (message, type = 'success') => {
  if (typeof document === 'undefined') return;

  const containerId = 'hafa-toast-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  const isAmber = type === 'amber' || type === 'warning';

  const borderColor = isSuccess ? '#10b981' : (isAmber ? '#f59e0b' : '#ef4444');
  const bgColor = '#0f172a';

  toast.style.cssText = `
    pointer-events: auto;
    background-color: ${bgColor};
    color: #f8fafc;
    border: 1px solid ${borderColor};
    border-left: 5px solid ${borderColor};
    padding: 14px 18px;
    border-radius: 12px;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <svg style="width: 20px; height: 20px; color: ${borderColor}; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${isSuccess 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        }
      </svg>
      <div>
        <div style="font-weight: 700; color: #f8fafc;">${isSuccess ? 'Auto-Sync Success' : 'Network Alert'}</div>
        <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">${message}</div>
      </div>
    </div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
};

/**
 * Triggers auto-sync of queued offline records sequentially or in batch
 */
export const syncOfflineQueue = async () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[OfflineSync] Currently offline. Skipping sync iteration.');
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  console.log(`[OfflineSync] Initiating auto-sync for ${queue.length} queued item(s)...`);

  let syncedCount = 0;
  let failedCount = 0;

  // Try batch sync first
  try {
    const batchPayload = queue.map(item => item.data);
    const res = await apiCall('batchAttendanceSync', { records: batchPayload });

    if (res && (res.success || res.status === 'success')) {
      syncedCount = queue.length;
      clearOfflineQueue();
      showToastNotification(`Auto-synced ${syncedCount} offline record(s) successfully!`, 'success');
      return { syncedCount, failedCount: 0 };
    }
  } catch (batchErr) {
    console.warn('[OfflineSync] Batch endpoint unavailable, falling back to sequential item sync:', batchErr);
  }

  // Sequential fallback loop
  for (const item of queue) {
    try {
      const res = await apiCall(item.action || 'clockIn', item.data);
      if (res && (res.success || res.status === 'success' || !res.error)) {
        syncedCount++;
        removeFromOfflineQueue(item.id);
      } else {
        failedCount++;
      }
    } catch (err) {
      console.error(`[OfflineSync] Failed syncing item ${item.id}:`, err);
      failedCount++;
    }
  }

  if (syncedCount > 0) {
    showToastNotification(`Auto-synced ${syncedCount} offline submission(s) successfully!`, 'success');
  }

  return { syncedCount, failedCount };
};

// Global Online Listener Registration
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Internet connectivity restored! Executing auto-sync...');
    showToastNotification('Internet reconnected. Syncing offline data...', 'amber');
    syncOfflineQueue();
  });
}

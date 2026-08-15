/**
 * HafA DIGITAL - Unified API Client & Resilience Layer
 * 
 * Direct interface with Google Apps Script Web App backend (doPost).
 * Features exponential backoff retries, in-flight request deduplication,
 * and intelligent client-side TTL caching.
 */

import { cache, getTTLForAction } from './cache';

// Key for saving deployed Google Apps Script URL in localStorage
export const GAS_URL_KEY = 'geotrack_gas_script_url';

// Live Google Apps Script default endpoint
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbz3XgBqUmLl0gmi53jTQT8TsLse1uP9FRnNTw-sP5trNP31BzYkXVvEr9VcZLCmFkn7/exec';

// Active in-flight requests tracking map for deduplication
const inFlightRequests = new Map();

// Read-only actions eligible for caching
const READ_ACTIONS = [
  'getEmployees',
  'getSettings',
  'getProductionTasks',
  'getAttendance',
  'getEmployeePerformanceSummary',
  'getWorkProofs'
];

/**
 * Retrieves configured Google Apps Script Web App URL from localStorage,
 * environment variables, or falls back to hardcoded default.
 */
export const getGasUrl = () => {
  const localUrl = localStorage.getItem(GAS_URL_KEY);
  if (localUrl && localUrl.trim() !== '') return localUrl.trim();

  if (import.meta.env.VITE_GOOGLE_SCRIPT_URL && import.meta.env.VITE_GOOGLE_SCRIPT_URL.trim() !== '') {
    return import.meta.env.VITE_GOOGLE_SCRIPT_URL.trim();
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL.trim();
  }

  return DEFAULT_GAS_URL;
};

/**
 * Sets or updates the custom Google Apps Script Web App URL in localStorage
 */
export const setGasUrl = (url) => {
  if (url) {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(GAS_URL_KEY);
  }
};

/**
 * Toast Notification Helper for API & Network errors
 */
const showToastError = (message) => {
  if (typeof document === 'undefined') return;

  const containerId = 'geotrack-toast-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
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
  toast.style.cssText = `
    pointer-events: auto;
    background-color: #0f172a;
    color: #f8fafc;
    border: 1px solid #ef4444;
    border-left: 4px solid #ef4444;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.25s ease-in-out;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <svg style="width: 20px; height: 20px; color: #ef4444; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <div>
        <div style="font-weight: 600; color: #f8fafc; margin-bottom: 2px;">API Connection Warning</div>
        <div style="color: #94a3b8; font-size: 12px;">${message}</div>
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
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 5000);
};

/**
 * Performs raw HTTP fetch request with error checking
 */
const fetchSingleAttempt = async (url, action, data) => {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ action, ...data }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText || 'Server error'}`);
  }

  const rawText = await response.text();

  if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE html>') || rawText.includes('<html')) {
    throw new Error('Google Apps Script returned HTML error page. Verify Web App deployment access settings.');
  }

  if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
    const redirectedResponse = await fetch(rawText.trim());
    const redirectedText = await redirectedResponse.text();
    return JSON.parse(redirectedText);
  }

  return JSON.parse(rawText);
};

/**
 * Flushes related cache entries upon successful write mutations
 */
const invalidateCacheOnMutation = (action) => {
  if (['clockIn', 'submitWorkProof', 'updateAttendanceStatus', 'batchAttendanceSync'].includes(action)) {
    cache.invalidatePattern('getAttendance');
    cache.invalidatePattern('getWorkProofs');
    cache.invalidatePattern('getEmployeePerformanceSummary');
  } else if (['saveProductionTask', 'updateTaskStatus'].includes(action)) {
    cache.invalidatePattern('getProductionTasks');
    cache.invalidatePattern('getEmployeePerformanceSummary');
  } else if (['createEmployee', 'updateEmployee', 'updateProfile', 'deleteEmployee'].includes(action)) {
    cache.invalidatePattern('getEmployees');
  } else if (['updateCompanySettings', 'updateSettings'].includes(action)) {
    cache.invalidatePattern('getSettings');
  }
};

/**
 * Universal Resilient API Call Handler
 * Features deduplication, caching, and exponential backoff retries.
 *
 * @param {string} action - Action name (e.g. 'clockIn', 'getEmployees')
 * @param {object} data - Payload data
 * @returns {Promise<object>} Response object
 */
export const apiCall = async (action, data = {}) => {
  const requestKey = `${action}_${JSON.stringify(data)}`;

  // 1. In-Flight Request Deduplication
  if (inFlightRequests.has(requestKey)) {
    console.log(`[GeoTrack API] Deduplicating pending request for '${action}'`);
    return inFlightRequests.get(requestKey);
  }

  // 2. Client-Side Cache Check for Read Actions
  const isReadAction = READ_ACTIONS.includes(action);
  const cacheKey = `${action}_${JSON.stringify(data)}`;

  if (isReadAction && !data.skipCache) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[GeoTrack API] Serving '${action}' from client cache`);
      return cachedData;
    }
  }

  // Create Promise execution with Exponential Backoff Retries
  const executionPromise = (async () => {
    const url = getGasUrl();
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError = null;

    while (attempt < MAX_RETRIES) {
      try {
        const result = await fetchSingleAttempt(url, action, data);

        // Cache successful read results
        if (isReadAction && result && (result.success || result.status === 'success' || !result.error)) {
          const ttlMinutes = getTTLForAction(action);
          cache.set(cacheKey, result, ttlMinutes);
        }

        // Invalidate stale cache on write mutations
        if (!isReadAction && result && (result.success || result.status === 'success' || !result.error)) {
          invalidateCacheOnMutation(action);
        }

        return result;
      } catch (err) {
        attempt++;
        lastError = err;
        console.warn(`[GeoTrack API Retry ${attempt}/${MAX_RETRIES}] Action '${action}' failed:`, err.message);

        if (attempt < MAX_RETRIES) {
          // Exponential Backoff Delay with Jitter (~800ms, ~2000ms, ~4000ms)
          const baseDelay = Math.pow(2.2, attempt) * 400;
          const jitter = Math.random() * 300;
          await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
        }
      }
    }

    const finalErrMsg = lastError?.message || 'Network request failed after maximum retries';
    console.error(`[GeoTrack API Error] '${action}' request failed permanently:`, lastError);
    showToastError(`Failed to process '${action}': ${finalErrMsg}`);

    return {
      success: false,
      message: `Network error: ${finalErrMsg}`,
      error: finalErrMsg
    };
  })();

  // Track in-flight request
  inFlightRequests.set(requestKey, executionPromise);

  try {
    const response = await executionPromise;
    return response;
  } finally {
    inFlightRequests.delete(requestKey);
  }
};

/**
 * Local Haversine Distance helper (in meters)
 */
export function calculateHaversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

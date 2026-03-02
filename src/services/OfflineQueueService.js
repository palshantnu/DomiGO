/**
 * OFFLINE QUEUE SERVICE — Ensures no trip/state-change event is lost when offline
 *
 * PURPOSE:
 *   When GEOFENCING_MODE is 'local_js', state changes trigger backend API calls.
 *   If the device has no connectivity at that moment, the event would be lost.
 *   This service persists failed events to AsyncStorage and retries them when
 *   connectivity is restored.
 *
 * HOW IT WORKS:
 *   1. enqueue(event) — saves a failed trip event to persistent storage
 *   2. flush(sendFn)  — retries all queued events; removes successes, keeps failures
 *   3. startListening(sendFn) — subscribes to NetInfo; auto-flushes when online
 *   4. stopListening() — unsubscribes from NetInfo
 *
 * RETRY POLICY:
 *   Each event is retried up to 5 times. After 5 failures it is dropped with console.warn.
 *
 * FLUSH TRIGGERS:
 *   - Automatically when NetInfo detects connectivity restored
 *   - Immediately on app mount (App.tsx) to catch events queued before app was killed
 *
 * DECOUPLED: This service has NO dependency on LocalStateDetectionService.
 *            It can be used independently with any sendFn.
 *
 * STORAGE KEY: '@geofencing_offline_queue' in AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = '@geofencing_offline_queue';
const MAX_RETRIES = 5;

let netInfoUnsubscribe = null;

async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('OfflineQueueService: failed to persist queue', e);
  }
}

async function enqueue(event) {
  const queue = await getQueue();
  queue.push({
    from: event.from,
    to: event.to,
    timestamp: event.timestamp || Date.now(),
    retryCount: 0,
    payload: event.payload,
  });
  await saveQueue(queue);
}

async function flush(sendFn) {
  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining = [];

  for (const event of queue) {
    try {
      await sendFn(event);
    } catch {
      event.retryCount += 1;
      if (event.retryCount >= MAX_RETRIES) {
        console.warn(
          `OfflineQueueService: dropping event after ${MAX_RETRIES} retries`,
          { from: event.from, to: event.to, timestamp: event.timestamp },
        );
      } else {
        remaining.push(event);
      }
    }
  }

  await saveQueue(remaining);
}

function startListening(sendFn) {
  stopListening();
  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      flush(sendFn);
    }
  });
}

function stopListening() {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
}

export default { enqueue, flush, startListening, stopListening };

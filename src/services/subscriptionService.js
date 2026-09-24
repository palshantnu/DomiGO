import {
  initConnection,
  endConnection,
  fetchProducts as fetchIapProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  isUserCancelledError,
} from 'react-native-iap';
import { Platform } from 'react-native';

export const PRODUCT_IDS = {
  LITE: 'domigo_lite_yearly',
  FULL: 'domigo_full_yearly',
};

const SKU_LIST = [PRODUCT_IDS.LITE, PRODUCT_IDS.FULL];

// react-native-iap 15+ needs the Android offerToken to start a subscription
// purchase, so we keep the last fetched subscription products around.
let subscriptionCache = [];

// Ensure the billing connection is established exactly once before any call.
let connectionPromise = null;

// The purchase currently waiting for a StoreKit / Play Billing outcome.
// On iOS react-native-iap does NOT reject requestPurchase() on failure; every
// error (sku not found, cancel, StoreKit failure) is only delivered through
// purchaseErrorListener, so we settle this from the global listeners below.
let pendingPurchase = null;

// If StoreKit finished the purchase flow without emitting an event
// (e.g. Ask to Buy / deferred), stop waiting after this grace period.
const IOS_EVENT_GRACE_MS = 2000;
// Safety net so the UI can never stay stuck waiting for a store event.
const PURCHASE_TIMEOUT_MS = 3 * 60 * 1000;

export const PURCHASE_UNAVAILABLE_MESSAGE =
  'This subscription is currently unavailable from the App Store. Please check your connection and try again later.';

const settlePendingPurchase = (outcome) => {
  if (!pendingPurchase) return;
  const { resolve, timer } = pendingPurchase;
  clearTimeout(timer);
  pendingPurchase = null;
  resolve(outcome);
};

export const isPurchaseCancelled = (error) => {
  try {
    return isUserCancelledError(error);
  } catch (e) {
    return false;
  }
};

const findCachedProduct = (sku) =>
  subscriptionCache.find((p) => p.id === sku || p.productId === sku);

export const productIdToPlan = (productId) => {
  switch (productId) {
    case PRODUCT_IDS.LITE:
      return 'lite';
    case PRODUCT_IDS.FULL:
      return 'full';
    default:
      return 'none';
  }
};

export const calculateExpiry = (purchaseDateMs) => {
  const d = new Date(purchaseDateMs);
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-CA");
};

export const initIAP = async () => {
  if (!connectionPromise) {
    connectionPromise = initConnection().catch((err) => {
      // reset so a later call can retry
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
};

export const fetchProducts = async () => {
  await initIAP();
  const subscriptions = await fetchIapProducts({ skus: SKU_LIST, type: 'subs' });
  subscriptionCache = subscriptions || [];
  return subscriptionCache;
};

const getAndroidOfferToken = (sku) => {
  const product = subscriptionCache.find(
    (p) => p.id === sku || p.productId === sku
  );
  const offers = product?.subscriptionOfferDetailsAndroid;
  return offers && offers.length > 0 ? offers[0].offerToken : undefined;
};

/**
 * Start a subscription purchase and wait for the store's outcome.
 * Resolves with `{ status }`:
 *   'purchased' – the purchase listener received the transaction (`purchase` attached)
 *   'cancelled' – the user dismissed the store sheet
 *   'error'     – the store reported a failure (`error` attached)
 *   'pending'   – no final result yet (Ask to Buy / deferred / timeout)
 * Throws only when the purchase could not be started (e.g. product unavailable).
 */
export const buySubscription = async (sku) => {
  if (!sku) {
    throw new Error(PURCHASE_UNAVAILABLE_MESSAGE);
  }

  await initIAP();

  if (Platform.OS === 'ios') {
    // StoreKit can only sell a product it has returned; without it the
    // purchase fails silently on the native side.
    if (!findCachedProduct(sku)) {
      try {
        await fetchProducts();
      } catch (e) {
        console.log('IAP fetchProducts before purchase failed', e);
      }
    }
    if (!findCachedProduct(sku)) {
      throw new Error(PURCHASE_UNAVAILABLE_MESSAGE);
    }
  }

  // Only one purchase flow can be in progress at a time.
  settlePendingPurchase({ status: 'pending' });

  const outcome = new Promise((resolve) => {
    const timer = setTimeout(
      () => settlePendingPurchase({ status: 'pending' }),
      PURCHASE_TIMEOUT_MS
    );
    pendingPurchase = { sku, resolve, timer };
  });
  const current = pendingPurchase;

  try {
    if (Platform.OS === 'android') {
      let offerToken = getAndroidOfferToken(sku);
      if (!offerToken) {
        await fetchProducts();
        offerToken = getAndroidOfferToken(sku);
      }
      await requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [sku],
            subscriptionOffers: offerToken ? [{ sku, offerToken }] : [],
          },
        },
      });
    } else {
      await requestPurchase({
        type: 'subs',
        request: {
          apple: { sku },
        },
      });

      // On iOS requestPurchase resolves once the StoreKit sheet is done; the
      // result arrives through the listeners. Stop waiting if none arrives.
      setTimeout(() => {
        if (pendingPurchase === current) {
          settlePendingPurchase({ status: 'pending' });
        }
      }, IOS_EVENT_GRACE_MS);
    }
  } catch (error) {
    if (pendingPurchase === current) {
      settlePendingPurchase(
        isPurchaseCancelled(error)
          ? { status: 'cancelled', error }
          : { status: 'error', error }
      );
    }
  }

  return outcome;
};

export const restorePurchases = async () => {
  await initIAP();
  const purchases = await getAvailablePurchases();
  return purchases || [];
};

export const endIAP = () => {
  connectionPromise = null;
  endConnection();
};

/**
 * Register global purchase listeners. Call once at app startup.
 * `onSuccess(purchase)` fires after the purchase is acknowledged/finished;
 * `onError(error)` fires on a failed or cancelled purchase.
 * Returns an unsubscribe function.
 */
export const subscribeToPurchaseUpdates = ({ onSuccess, onError } = {}) => {
  const updateSub = purchaseUpdatedListener(async (purchase) => {
    try {
      // Subscriptions / non-consumables must not be consumed.
      await finishTransaction({ purchase, isConsumable: false });
    } catch (e) {
      // already finished / not fatal for entitlement
    }
    onSuccess?.(purchase);

    if (
      pendingPurchase &&
      (purchase?.productId === pendingPurchase.sku || purchase?.id === pendingPurchase.sku)
    ) {
      settlePendingPurchase({ status: 'purchased', purchase });
    }
  });

  const errorSub = purchaseErrorListener((error) => {
    onError?.(error);

    if (pendingPurchase) {
      settlePendingPurchase(
        isPurchaseCancelled(error)
          ? { status: 'cancelled', error }
          : { status: 'error', error }
      );
    }
  });

  return () => {
    updateSub?.remove?.();
    errorSub?.remove?.();
  };
};

export { purchaseUpdatedListener, purchaseErrorListener, finishTransaction };

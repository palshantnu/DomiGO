import {
  initConnection,
  endConnection,
  fetchProducts as fetchIapProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
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

export const buySubscription = async (sku) => {
  await initIAP();

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
    return;
  }

  await requestPurchase({
    type: 'subs',
    request: {
      apple: { sku },
    },
  });
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
  });

  const errorSub = purchaseErrorListener((error) => {
    onError?.(error);
  });

  return () => {
    updateSub?.remove?.();
    errorSub?.remove?.();
  };
};

export { purchaseUpdatedListener, purchaseErrorListener, finishTransaction };

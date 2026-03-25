import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
} from 'react-native-iap';
import { Platform } from 'react-native';

export const PRODUCT_IDS = {
  LITE: 'domigo_lite_yearly',
  FULL: 'domigo_full_yearly',
};

const SKU_LIST = [PRODUCT_IDS.LITE, PRODUCT_IDS.FULL];

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
  const result = await initConnection();
  if (Platform.OS === 'android') {
    await flushFailedPurchasesCachedAsPendingAndroid();
  }
  return result;
};

export const fetchProducts = async () => {
  const subscriptions = await getSubscriptions({ skus: SKU_LIST });
  return subscriptions;
};

export const buySubscription = async (sku) => {
  await requestSubscription({ sku });
};

export const restorePurchases = async () => {
  const purchases = await getAvailablePurchases();
  return purchases;
};

export const endIAP = () => {
  endConnection();
};

export { purchaseUpdatedListener, purchaseErrorListener, finishTransaction };

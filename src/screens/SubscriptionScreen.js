import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import colors from '../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import {
  FETCH_SUBSCRIPTION_PRODUCTS,
  PURCHASE_SUBSCRIPTION,
  RESTORE_SUBSCRIPTION,
} from '../redux/actions/action-creator';
import { PRODUCT_IDS } from '../services/subscriptionService';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { CustomToast } from '../helpers/CommonHelpers';

const PLAN_FEATURES = {
  lite: [
    { label: 'GPS Location Tracking', included: true },
    { label: 'Trip Management', included: true },
    { label: 'State-Wise Residency Overview', included: true },
    { label: 'Calendar View', included: true },
    { label: 'Export Data & Reports', included: false },
    { label: 'Readiness & Compliance Score', included: false },
    { label: 'Document Management', included: false },
  ],
  full: [
    { label: 'GPS Location Tracking', included: true },
    { label: 'Trip Management', included: true },
    { label: 'State-Wise Residency Overview', included: true },
    { label: 'Calendar View', included: true },
    { label: 'Export Data & Reports', included: true },
    { label: 'Readiness & Compliance Score', included: true },
    { label: 'Document Management', included: true },
  ],
};

const STORE_NAME = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

function SubscriptionScreen({
  FETCH_SUBSCRIPTION_PRODUCTS,
  PURCHASE_SUBSCRIPTION,
  RESTORE_SUBSCRIPTION,
  products,
}) {
  const navigation = useNavigation();
  const { plan, isTrial, trialDaysLeft, isExpired } = useFeatureAccess();

  // Local UI state so the buttons never depend on the persisted redux
  // `loading` flag (which could be left `true` from a previous session).
  const [purchasingSku, setPurchasingSku] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const isMounted = useRef(true);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(false);
    const result = await FETCH_SUBSCRIPTION_PRODUCTS();
    if (!isMounted.current) return;
    setProductsLoading(false);
    setProductsError(!result?.success);
  }, [FETCH_SUBSCRIPTION_PRODUCTS]);

  useEffect(() => {
    isMounted.current = true;
    loadProducts();
    return () => {
      isMounted.current = false;
    };
  }, [loadProducts]);

  const getStoreProduct = (sku) =>
    (products || []).find((p) => p?.id === sku || p?.productId === sku);

  // Prefer the localized price returned by StoreKit / Play Billing.
  const getDisplayPrice = (sku, fallbackPrice) => {
    const product = getStoreProduct(sku);
    return product?.displayPrice || product?.localizedPrice || fallbackPrice;
  };

  const showProductsNotice =
    !productsLoading && (productsError || (products || []).length === 0);

  const handlePurchase = async (sku) => {
    if (purchasingSku || restoring) return;
    console.log('subscriptionplan',sku);
    setPurchasingSku(sku);
    try {
      const result = await PURCHASE_SUBSCRIPTION(sku);
      switch (result?.status) {
        case 'purchased':
          CustomToast.show('Subscription activated successfully!');
          break;
        case 'cancelled':
          break;
        case 'pending':
          Alert.alert(
            'Purchase Processing',
            `Your purchase is being processed by the ${STORE_NAME}. Your plan will update automatically once it is confirmed. You can also tap "Restore Purchases" later.`
          );
          break;
        default:
          Alert.alert(
            'Purchase Failed',
            result?.error ||
              'We could not complete your purchase. Please try again.'
          );
      }
    } catch (e) {
      Alert.alert(
        'Purchase Failed',
        e?.message || 'We could not complete your purchase. Please try again.'
      );
    } finally {
      if (isMounted.current) setPurchasingSku(null);
    }
  };

  const handleRestore = async () => {
    if (purchasingSku || restoring) return;
    setRestoring(true);
    try {
      const result = await RESTORE_SUBSCRIPTION();
      if (result?.restored) {
        CustomToast.show('Subscription restored successfully!');
      } else {
        CustomToast.show('No active subscription found.');
      }
    } finally {
      if (isMounted.current) setRestoring(false);
    }
  };

  const getStatusText = () => {
    if (isTrial) return `Free Trial - ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left`;
    if (isExpired) return 'Subscription Expired';
    if (plan === 'lite') return 'Lite Plan (Active)';
    if (plan === 'full') return 'Full Plan (Active)';
    return 'No Active Plan';
  };

  const getStatusColor = () => {
    if (isTrial) return colors.primary;
    if (isExpired || plan === 'none') return colors.danger;
    return colors.success;
  };

  const renderPlanCard = (planType, title, fallbackPrice, sku) => {
    const isCurrentPlan = plan === planType;
    const features = PLAN_FEATURES[planType];
    const price = getDisplayPrice(sku, fallbackPrice);
    const isPurchasing = purchasingSku === sku;
    const isBusy = !!purchasingSku || restoring;

    return (
      <View style={[styles.planCard, isCurrentPlan && styles.planCardActive]}>
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Current Plan</Text>
          </View>
        )}
        <Text style={styles.planTitle}>{title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.planPrice}>{price}</Text>
          <Text style={styles.planDuration}>/year</Text>
        </View>

        <View style={styles.divider} />

        {features.map((feat, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Ionicons
              name={feat.included ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={feat.included ? colors.success : '#ccc'}
            />
            <Text
              style={[
                styles.featureText,
                !feat.included && styles.featureTextDisabled,
              ]}
            >
              {feat.label}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.subscribeBtn,
            isCurrentPlan && styles.subscribeBtnDisabled,
            !isCurrentPlan && isBusy && !isPurchasing && styles.subscribeBtnBusy,
          ]}
          onPress={() => !isCurrentPlan && handlePurchase(sku)}
          disabled={isCurrentPlan || isBusy}
          accessibilityRole="button"
          accessibilityLabel={
            isCurrentPlan ? `${title} is your current plan` : `Subscribe to ${title} for ${price} per year`
          }
          accessibilityState={{ disabled: isCurrentPlan || isBusy, busy: isPurchasing }}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeBtnText}>
              {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Legal links required for auto-renewable subscriptions */}
        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('TermsOfUseScreen')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>|</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrivacyPolicyScreen')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#9ab1fa', '#ffffff']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header title="Subscription" showBack/>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}>
            <Ionicons
              name={isTrial ? 'time-outline' : plan === 'none' ? 'alert-circle-outline' : 'shield-checkmark-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {productsLoading && (products || []).length === 0 && (
            <View style={styles.productsNotice}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.productsNoticeText}>
                Loading subscription details...
              </Text>
            </View>
          )}

          {showProductsNotice && (
            <View style={styles.productsNotice}>
              <Text style={styles.productsNoticeText}>
                Unable to load subscription details from the {STORE_NAME}.
              </Text>
              <TouchableOpacity
                onPress={loadProducts}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderPlanCard('lite', 'Lite', '$49.99', PRODUCT_IDS.LITE)}
          {renderPlanCard('full', 'Full', '$99.99', PRODUCT_IDS.FULL)}

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={restoring || !!purchasingSku}
            accessibilityRole="button"
          >
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            {Platform.OS === 'ios'
              ? 'Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions are billed annually and auto-renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel your subscription in your App Store account settings.'
              : 'Subscriptions are billed annually and auto-renew unless cancelled at least 24 hours before the end of the current period.'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function mapStateToProps(state) {
  return {
    loading: state.subscription.loading,
    products: state.subscription.products,
    subscriptionPlan: state.subscription.plan,
  };
}

const mapDispatchToProps = {
  FETCH_SUBSCRIPTION_PRODUCTS,
  PURCHASE_SUBSCRIPTION,
  RESTORE_SUBSCRIPTION,
};

export default connect(mapStateToProps, mapDispatchToProps)(SubscriptionScreen);

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Keep cards at a readable width on iPad; no effect on phones.
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  productsNotice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  productsNoticeText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  subscribeBtnBusy: {
    opacity: 0.6,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  legalLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 10,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  planCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  featureTextDisabled: {
    color: '#bbb',
  },
  subscribeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  subscribeBtnDisabled: {
    backgroundColor: '#ccc',
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  restoreBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 8,
    lineHeight: 16,
  },
});

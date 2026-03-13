export const getAuthToken = (state) => state.auth.loginToken
export const getUserDataSelelctor = (state) => state.auth.userData
export const getAppLanguageSelector = (state) => state.common.appLanguage
export const getFamilyMembersSelector = (state) => state.common.familyMembersList
export const getThemeSelector = (state) => state?.common?.theme 
export const getUserPersonalDataSelelctor = (state) => state?.auth?.userPersonalData

// Subscription selectors
export const getSubscriptionPlan = (state) => state.subscription.plan;
export const getSubscriptionExpiry = (state) => state.subscription.expiryDate;
export const getSubscriptionProducts = (state) => state.subscription.products;
export const getSubscriptionLoading = (state) => state.subscription.loading;
export const getTrialStartDate = (state) => state.subscription.trialStartDate;
export const isTrialActive = (state) => {
  const { trialStartDate, plan } = state.subscription;
  if (plan !== 'none') return false;
  if (!trialStartDate) return false;
  const trialEnd = new Date(trialStartDate);
  trialEnd.setDate(trialEnd.getDate() + 7);
  return new Date() < trialEnd;
};
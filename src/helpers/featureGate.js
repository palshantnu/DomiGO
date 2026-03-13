import { store } from '../redux/store';
import { getAccessForPlan } from '../config/featureAccess';

const TRIAL_DAYS = 7;

export const getEffectivePlan = () => {
  const state = store.getState();
  const { plan, expiryDate, trialStartDate } = state.subscription;

  // If user has a paid plan, check expiry
  if (plan !== 'none') {
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return 'none'; // expired
    }
    return plan;
  }

  // Check if trial is active
  if (trialStartDate) {
    const trialEnd = new Date(trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (new Date() < trialEnd) {
      return 'trial';
    }
  }

  return 'none';
};

export const canAccess = (feature) => {
  const effectivePlan = getEffectivePlan();
  const access = getAccessForPlan(effectivePlan);
  return access[feature] === true;
};

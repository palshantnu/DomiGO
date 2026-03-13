import { useSelector } from 'react-redux';
import { getAccessForPlan } from '../config/featureAccess';

const TRIAL_DAYS = 7;

export const useFeatureAccess = () => {
  const plan = useSelector((state) => state.subscription.plan);
  const expiryDate = useSelector((state) => state.subscription.expiryDate);
  const trialStartDate = useSelector((state) => state.subscription.trialStartDate);

  const now = new Date();

  // Check trial
  let isTrial = false;
  let trialDaysLeft = 0;
  if (plan === 'none' && trialStartDate) {
    const trialEnd = new Date(trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (now < trialEnd) {
      isTrial = true;
      trialDaysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    }
  }

  // Check subscription expiry
  const isExpired = plan !== 'none' && expiryDate && new Date(expiryDate) < now;

  let effectivePlan;
  if (isTrial) {
    effectivePlan = 'trial';
  } else if (isExpired) {
    effectivePlan = 'none';
  } else {
    effectivePlan = plan;
  }

  const access = getAccessForPlan(effectivePlan);
  const canAccess = (feature) => access[feature] === true;

  return {
    plan: effectivePlan,
    isExpired,
    isTrial,
    trialDaysLeft,
    canAccess,
    isFullPlan: effectivePlan === 'full',
    isLitePlan: effectivePlan === 'lite',
    hasNoPlan: effectivePlan === 'none',
  };
};

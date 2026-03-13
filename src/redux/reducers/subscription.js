import {
  SET_SUBSCRIPTION_PLAN,
  SET_SUBSCRIPTION_LOADING,
  SET_SUBSCRIPTION_ERROR,
  CLEAR_SUBSCRIPTION,
  SET_SUBSCRIPTION_PRODUCTS,
  SET_TRIAL_START,
} from '../actions/action-types';

const initialState = {
  plan: 'none',
  productId: null,
  purchaseDate: null,
  expiryDate: null,
  trialStartDate: null,
  receipt: null,
  products: [],
  loading: false,
  error: null,
};

export const subscriptionReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SET_SUBSCRIPTION_PLAN:
      return {
        ...state,
        plan: payload.plan,
        productId: payload.productId,
        purchaseDate: payload.purchaseDate,
        expiryDate: payload.expiryDate,
        receipt: payload.receipt || state.receipt,
        loading: false,
        error: null,
      };
    case SET_SUBSCRIPTION_LOADING:
      return { ...state, loading: payload };
    case SET_SUBSCRIPTION_ERROR:
      return { ...state, error: payload, loading: false };
    case CLEAR_SUBSCRIPTION:
      return { ...initialState, trialStartDate: state.trialStartDate };
    case SET_SUBSCRIPTION_PRODUCTS:
      return { ...state, products: payload, loading: false };
    case SET_TRIAL_START:
      return { ...state, trialStartDate: payload };
    default:
      return state;
  }
};

import {
    LOGOUT_SUCCESS,
    SIGN_IN_SUCCESS,
    SIGN_UP_SUCCESS,
  } from '../../actions/action-types';
  
  const initialState = {
    userData: null,
    loginToken: null,
    SignIn: false,
  }
  
  export const authReducer = (state = initialState, { type, payload }) => {
    switch (type) {
      case SIGN_IN_SUCCESS:
        return {
          ...state,
          userData: payload?.data,
          loginToken: payload?.token,
          SignIn: true,
        }
      case LOGOUT_SUCCESS:
        return initialState
      default:
        return state
    }
  }
import { LOGOUT_SUCCESS, SIGN_IN_REQUEST, SIGN_IN_SUCCESS, SIGN_UP_FAILURE, SIGN_UP_REQUEST, SIGN_UP_SUCCESS, UPDATE_PERSONAL_DATA } from "../actions/action-types"


const initialState = {
  userData: [],
  loginToken: null,
  SignIn: false,
  userPersonalData: null,

}

export const authReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SIGN_IN_REQUEST:
      return {
        ...state, userData: [], SignIn: false,
      }
    case SIGN_IN_SUCCESS:
      return {
        ...state,
        userData: payload?.result,
        loginToken: payload?.token,
        SignIn: true,
      }
    case SIGN_UP_REQUEST:
      return { ...state, userData: [] }
    case SIGN_UP_SUCCESS:
      return {
        ...state,
        userData: payload?.user ? { ...payload?.user } : [],
        SignIn: true,
        loginToken: payload?.token || null,
      }
    case SIGN_UP_FAILURE:
      return { ...state, userData: [] }
      case UPDATE_PERSONAL_DATA: {
        return {
            ...state,
            userPersonalData: {
                ...payload,
            },
            userData: {
                ...state.userData,
                email: payload?.email,
            },
        }
    }
   
    case LOGOUT_SUCCESS:
      return {
        ...state,
        userData: [],
        SignIn: false,
        loginToken: null,
        userPersonalData: null,
      }
    default:
      return state
  }
}
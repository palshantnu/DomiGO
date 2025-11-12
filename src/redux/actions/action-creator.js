import {
    SIGN_IN_REQUEST,
    SIGN_IN_SUCCESS,
    SIGN_IN_FAILURE,
    LOGOUT_SUCCESS,
    SET_APP_LANGUAGE,
  } from './action-types';
  import axiosinstance from '../../../axios/axiosinstance';
  import EndPoints from '../../../services/EndPoints';
  
  export const SIGNIN = (data) => (dispatch) => {
    dispatch({ type: SIGN_IN_REQUEST })
    
    return axiosinstance.post(EndPoints.authLogin, data)
      .then((response) => {
        if (response.data.status) {
          dispatch({
            type: SIGN_IN_SUCCESS,
            payload: response.data,
          })
        }
        return response.data
      })
      .catch((error) => {
        dispatch({ type: SIGN_IN_FAILURE })
        throw error
      })
  }
  
  export const LOGOUT = () => (dispatch) => {
    dispatch({ type: LOGOUT_SUCCESS })
  }
  
  export const changeAppLanguageAction = (language) => (dispatch) => {
    dispatch({
      type: SET_APP_LANGUAGE,
      payload: language,
    })
  }
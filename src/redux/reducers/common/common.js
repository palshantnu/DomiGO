import {
    SET_APP_LANGUAGE,
    GET_FAMILY_MEMBER_SUCCESS,
    GET_DOCUMENT_TYPE_LIST_SUCCESS,
  } from '../../../actions/action-types';
  
  const initialState = {
    appLanguage: 'en',
    familyMembersList: [],
    documentList: [],
  }
  
  export const common = (state = initialState, { type, payload }) => {
    switch (type) {
      case SET_APP_LANGUAGE:
        return { ...state, appLanguage: payload }
      case GET_FAMILY_MEMBER_SUCCESS:
        return { ...state, familyMembersList: payload?.data || [] }
      case GET_DOCUMENT_TYPE_LIST_SUCCESS:
        return { ...state, documentList: payload?.data || [] }
      default:
        return state
    }
  }
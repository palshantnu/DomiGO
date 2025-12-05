
import { GET_DOCUMENT_CATEGORY_LIST_SUCCESS, GET_DOCUMENT_TYPE_LIST_SUCCESS, GET_FAMILY_MEMBER_SUCCESS, GET_FINAL_YEAR_PROGRESS_SUCCESS, GET_RESIDENCY_DOC_DETAILS_SUCCESS, GET_RESIDENCY_DOC_LIST_SUCCESS, GET_TRIP_DETAILS_SUCCESS, GET_TRIP_LIST_SUCCESS, GET_TRIP_MODE_LIST_SUCCESS, GET_TRIP_SUMMARY_DETAILS_SUCCESS, GET_TRIP_TYPE_LIST_SUCCESS, SET_APP_LANGUAGE } from '../../actions/action-types';

const initialState = {
  appLanguage: 'en',
  familyMembersList: [],
  documentList: [],
  theme: 'theme1',
  tripList: [],
  documentCategoryList: [],
  ResidencydocumentList: [],
  tripModeList: [],
  tripTypeList: [],
  ResidencyRecordDetails: null,
  TripSummaryDetails: null,
  TripDetails: null,
  finalYearProgress: {},
}

export const common = (state = initialState, { type, payload }) => {
  switch (type) {
    case SET_APP_LANGUAGE:
      return { ...state, appLanguage: payload }
    case GET_TRIP_LIST_SUCCESS:
      return {
        ...state,
        tripList: payload?.result || [],
      }
    case GET_DOCUMENT_CATEGORY_LIST_SUCCESS:
      return {
        ...state,
        documentCategoryList: payload?.result || [],
      }
    case GET_RESIDENCY_DOC_LIST_SUCCESS:
      return {
        ...state,
        ResidencydocumentList: payload?.result || [],
      }
    case GET_TRIP_MODE_LIST_SUCCESS:
      return {
        ...state,
        tripModeList: payload?.result || [],
      }
    case GET_TRIP_TYPE_LIST_SUCCESS:
      return {
        ...state,
        tripTypeList: payload?.result || [],
      }
    case GET_RESIDENCY_DOC_DETAILS_SUCCESS:
      return {
        ...state,
        ResidencyRecordDetails: payload || null,
      };
    case GET_TRIP_SUMMARY_DETAILS_SUCCESS:
      return {
        ...state,
        TripSummaryDetails: payload || null,
      };
    case GET_TRIP_DETAILS_SUCCESS:
      return {
        ...state,
        TripDetails: payload || null,
      };
    case GET_FINAL_YEAR_PROGRESS_SUCCESS:
      return {
        ...state,
        finalYearProgress: payload || null,
      };
    case GET_FAMILY_MEMBER_SUCCESS:
      return { ...state, familyMembersList: payload?.data || [] }
    case GET_DOCUMENT_TYPE_LIST_SUCCESS:
      return { ...state, documentList: payload?.data || [] }
    default:
      return state
  }
}
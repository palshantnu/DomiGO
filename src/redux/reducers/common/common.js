
import { GET_ABOUT_APP_SUCCESS, GET_COMPLIANCE_SCORE_SUCCESS, GET_DOCUMENT_CATEGORY_LIST_SUCCESS, GET_DOCUMENT_TYPE_LIST_SUCCESS, GET_FAMILY_MEMBER_SUCCESS, GET_FAQS_SUCCESS, GET_FINAL_YEAR_PROGRESS_SUCCESS, GET_MISSING_ACTIVITY_LIST_SUCCESS, GET_MONTH_WISE_TIMELINE_SUCCESS, GET_NOTIFICATION_SUCCESS, GET_PRIVACY_POLICY_SUCCESS, GET_REPORTS_SUCCESS, GET_RESIDENCY_DOC_DETAILS_SUCCESS, GET_RESIDENCY_DOC_LIST_SUCCESS, GET_STATES_LIST_SUCCESS, GET_STATE_WISE_METRICS_SUCCESS, GET_STATE_WISE_RESIDENCY_SUCCESS, GET_STATE_WISE_TRIPS_SUCCESS, GET_SUPPORT_CONTACT_SUCCESS, GET_TRIP_DETAILS_SUCCESS, GET_TRIP_LIST_SUCCESS, GET_TRIP_MODE_LIST_SUCCESS, GET_TRIP_SUMMARY_DETAILS_SUCCESS, GET_TRIP_TYPE_LIST_SUCCESS, GET_TYPE_OF_DAY_LIST_SUCCESS, GET_WEEK_WISE_TIMELINE_SUCCESS, GET_YEAR_WISE_TIMELINE_SUCCESS, SET_APP_LANGUAGE,GET_USER_LOCATIONS_SUCCESS } from '../../actions/action-types';

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
  stateWiseResidency: [],
  complianceScore: null,
  stateWiseMetrics: [],
  weekWiseTimeline: [],
  monthWiseTimeline: [],
  yearWiseTimeline: [],
  stateWiseTrips: [],
  notifications: [],
  typeOfDayList: [],
  statesList: [],
  missingActivityList: [],
  resportsList: [],
  privacyPolicy: null,
  faqs: [],
  aboutApp: null,
  supportContact: null,
  userLocations: [],


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
    case GET_STATE_WISE_RESIDENCY_SUCCESS:
      return {
        ...state,
        stateWiseResidency: payload || null,
      };
    case GET_COMPLIANCE_SCORE_SUCCESS:
      return {
        ...state,
        complianceScore: payload || null,
      };
    case GET_STATE_WISE_METRICS_SUCCESS:
      return {
        ...state,
        stateWiseMetrics: payload || null,
      };
    case GET_YEAR_WISE_TIMELINE_SUCCESS:
      return {
        ...state,
        yearWiseTimeline: payload || null,
      };
    case GET_WEEK_WISE_TIMELINE_SUCCESS:
      return {
        ...state,
        weekWiseTimeline: payload || null,
      };
    case GET_MONTH_WISE_TIMELINE_SUCCESS:
      return {
        ...state,
        monthWiseTimeline: payload || null,
      };
    case GET_STATE_WISE_TRIPS_SUCCESS:
      return {
        ...state,
        stateWiseTrips: payload || null,
      };
    case GET_NOTIFICATION_SUCCESS:
      return {
        ...state,
        notifications: payload || null,
      };
    case GET_TYPE_OF_DAY_LIST_SUCCESS:
      return {
        ...state,
        typeOfDayList: payload?.result || [],
      };
    case GET_STATES_LIST_SUCCESS:
      return {
        ...state,
        statesList: payload?.result || [],
      };
    case GET_MISSING_ACTIVITY_LIST_SUCCESS:
      return {
        ...state,
        missingActivityList: payload?.result || [],
      };
    case GET_FAMILY_MEMBER_SUCCESS:
      return { ...state, familyMembersList: payload?.data || [] }
    case GET_DOCUMENT_TYPE_LIST_SUCCESS:
      return { ...state, documentList: payload?.data || [] }
    case GET_REPORTS_SUCCESS:
      return { ...state, resportsList: payload || [] }
    case GET_FAQS_SUCCESS:
      return { ...state, faqs: payload || [] }
    case GET_SUPPORT_CONTACT_SUCCESS:
      return { ...state, supportContact: payload || [] }
    case GET_ABOUT_APP_SUCCESS:
      return { ...state, aboutApp: payload || [] }
    case GET_PRIVACY_POLICY_SUCCESS:
      return { ...state, privacyPolicy: payload || [] }
    case GET_USER_LOCATIONS_SUCCESS:
      return { ...state, userLocations: payload || [] }
    default:
      return state
  }
}
import {
  SIGN_IN_REQUEST,
  SIGN_IN_SUCCESS,
  SIGN_IN_FAILURE,
  LOGOUT_SUCCESS,
  SET_APP_LANGUAGE,
  SIGN_UP_REQUEST,
  SIGN_UP_SUCCESS,
  SIGN_UP_FAILURE,
  UPDATE_PERSONAL_DATA,
  ADD_TRIP_REQUEST,
  ADD_TRIP_FAILURE,
  TRIP_LIST_SUCCESS,
  GET_TRIP_LIST_SUCCESS,
  GET_DOCUMENT_CATEGORY_LIST_SUCCESS,
  DOCUMENT_CATEGORY_LIST_FAILURE,
  ADD_DOCUMENT_RECORD_REQUEST,
  ADD_DOCUMENT_RECORD_SUCCESS,
  ADD_DOCUMENT_RECORD_FAILURE,
  GET_RESIDENCY_DOC_LIST_SUCCESS,
  RESIDENCY_DOC_LIST_FAILURE,
  RESIDENCY_DOC_DETAILS_FAILURE,
  GET_RESIDENCY_DOC_DETAILS_SUCCESS,
  GET_TRIP_MODE_LIST_SUCCESS,
  TRIP_MODE_LIST_FAILURE,
  GET_TRIP_TYPE_LIST_SUCCESS,
  TRIP_TYPE_LIST_FAILURE,
  GET_TRIP_SUMMARY_DETAILS_SUCCESS,
  TRIP_SUMMARY_DETAILS_FAILURE,
  UPDATE_TRIP_REQUEST,
  UPDATE_TRIP_FAILURE,
  UPDATE_TRIP_SUCCESS,
  GET_TRIP_DETAILS_SUCCESS,
  TRIP_DETAILS_FAILURE,
  GET_FINAL_YEAR_PROGRESS_SUCCESS,
  FINAL_YEAR_PROGRESS_FAILURE,
  TRIP_LIST_FAILURE,
  GET_STATE_WISE_RESIDENCY_SUCCESS,
  STATE_WISE_RESIDENCY_FAILURE,
  GET_STATE_WISE_METRICS_SUCCESS,
  STATE_WISE_METRICS_FAILURE,
  GET_YEAR_WISE_TIMELINE_FAILURE,
  GET_YEAR_WISE_TIMELINE_SUCCESS,
  YEAR_WISE_TIMELINE_FAILURE,
  GET_WEEK_WISE_TIMELINE_SUCCESS,
  WEEK_WISE_TIMELINE_FAILURE,
  MONTH_WISE_TIMELINE_FAILURE,
  GET_MONTH_WISE_TIMELINE_SUCCESS,
  GET_STATE_WISE_TRIPS_SUCCESS,
  STATE_WISE_TRIPS_FAILURE,
  GET_COMPLIANCE_SCORE_SUCCESS,
  UPDATE_STATE_THRESHOLD_REQUEST,
  UPDATE_STATE_THRESHOLD_SUCCESS,
  UPDATE_STATE_THRESHOLD_FAILURE,
  NOTIFICATION_FAILURE,
  GET_NOTIFICATION_SUCCESS,
  GET_TYPE_OF_DAY_LIST_SUCCESS,
  GET_STATES_LIST_SUCCESS,
  ADD_MISSINGDAY_SUCCESS,
  ADD_MISSINGDAY_REQUEST,
  ADD_MISSINGDAY_FAILURE,
  GET_MISSING_ACTIVITY_LIST_SUCCESS,
  MISSING_ACTIVITY_LIST_FAILURE,
  UPDATE_MISSINGDAY_REQUEST,
  UPDATE_MISSINGDAY_SUCCESS,
  UPDATE_MISSINGDAY_FAILURE,
  COMPLIANCE_SCORE_FAILURE

} from './action-types';
import axiosinstance from '../../axios/axiosinstance';
import EndPoints from '../../services/EndPoints';
import { getTripService, getUserPersonalInfoService, updateUserPersonalInfoService } from '../../services/Services';
import { CustomToast, jsonToFormData, sendDataToReducer } from '../../helpers/CommonHelpers';
import { getAuthToken } from '../selectors/common';

const CommonError = {
  message: 'Something Went Wrong',
  status: false,
}


export const SIGNIN = (data) => (dispatch) => {
  dispatch({ type: SIGN_IN_REQUEST })

  return axiosinstance.post(EndPoints.authLogin, data)
    .then((response) => {
      // console.log('response1', response);

      if (response.data.message == 'Success') {

        dispatch({
          type: SIGN_IN_SUCCESS,
          payload: response.data,
        })
      } else {

      }
      // console.log('response2', response.data);
      return response.data
    })
    .catch((error) => {
      dispatch({ type: SIGN_IN_FAILURE })
      throw error
    })
}
export const SIGNUP = (data) => (dispatch) => {
  dispatch({ type: SIGN_UP_REQUEST })

  return axiosinstance.post(EndPoints.signup, data)
    .then((response) => {
      // console.log('response1', response);

      if (response.data.success) {
        // console.log('response2', response);
        dispatch({
          type: SIGN_UP_SUCCESS,
          payload: response.data.result,
        })
      }
      // console.log('response3', response.data);
      return response.data
    })
    .catch((error) => {
      dispatch({ type: SIGN_UP_FAILURE })
      throw error
    })
}

export const getPersonalProfileDataAction = () => (dispatch, getState) => new Promise((resolve, reject) => {
  const state = getState()
  const token = getAuthToken(state)
  getUserPersonalInfoService(token).then((res) => {
    // console.log('res====>', res);

    sendDataToReducer(dispatch, UPDATE_PERSONAL_DATA, res?.data?.result);
    resolve(res?.data?.result)
  }).catch((error) => {
    reject({ error })
  })
})

export const updatePersonalInfoAction = (data) => (dispatch, getState) => new Promise((resolve, reject) => {
  const state = getState()
  // const userData = getUserDataSelelctor(state);
  // data.user_id = userData?.id;
  const formData = jsonToFormData(data)
  // console.log('formData==>', formData);

  updateUserPersonalInfoService(data).then((res) => {
    // console.log('res===>', res.data.success);

    dispatch(getPersonalProfileDataAction())
    resolve(res)
  }).catch((error) => {
    const errorResponse = error?.response?.data?.error;
    CustomToast.show(errorResponse?.[Object.keys(errorResponse)?.[0]]?.[0])
    reject({ error })
  })
})

export const ADDTRIP = (formData) => {
  return async (dispatch) => {
    dispatch({
      type: ADD_TRIP_REQUEST,
      payload: 'ADD_TRIP_REQUEST',
    })
    try {
      const response = await axiosinstance.post(EndPoints.addTrip, formData)
      const responseJson = response.data;
      // console.log('responseJson==>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: ADD_TRIP_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: ADD_TRIP_FAILURE,
        payload: 'ADD_TRIP_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: ADD_TRIP_FAILURE,
        payload: 'ADD_TRIP_FAILURE',
      })
      return ({ response: e })
    }
  }
}
export const UPDATETRIP = (formData) => {
  return async (dispatch) => {
    dispatch({
      type: UPDATE_TRIP_REQUEST,
      payload: 'UPDATE_TRIP_REQUEST',
    })
    try {
      const response = await axiosinstance.put(`${EndPoints.UpdateTrip}/${formData.id}`, formData)
      const responseJson = response.data;
      // console.log('responseJson==>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: UPDATE_TRIP_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: UPDATE_TRIP_FAILURE,
        payload: 'UPDATE_TRIP_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: UPDATE_TRIP_FAILURE,
        payload: 'UPDATE_TRIP_FAILURE',
      })
      return ({ response: e })
    }
  }
}

export function GET_TRIP_DETAILS(id) {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get(`trips/${id}`);
      const responseJson = response.data;

      console.log("DETAILS API =>", responseJson);

      if (responseJson.message === "Success") {
        dispatch({
          type: GET_TRIP_DETAILS_SUCCESS,
          payload: responseJson.result,   
        });
        return Promise.resolve(responseJson.result);
      }

      dispatch({
        type: TRIP_DETAILS_FAILURE,
        payload: "TRIP_DETAILS_FAILURE",
      });

      return Promise.reject(responseJson);

    } catch (e) {
      dispatch({
        type: TRIP_DETAILS_FAILURE,
        payload: "TRIP_DETAILS_FAILURE",
      });

      console.log("TRIP_DETAILS_FAILURE API ERROR =>", e);
      return Promise.reject(CommonError);
    }
  };
}
export function GET_TRIP_SUMMARY_DETAILS(id) {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get(`trips/${id}/detail`);
      const responseJson = response.data;

      console.log("DETAILS API =>", responseJson);

      if (responseJson.message === "Success") {
        dispatch({
          type: GET_TRIP_SUMMARY_DETAILS_SUCCESS,
          payload: responseJson.result,   
        });
        return Promise.resolve(responseJson.result);
      }

      dispatch({
        type: TRIP_SUMMARY_DETAILS_FAILURE,
        payload: "TRIP_SUMMARY_DETAILS_FAILURE",
      });

      return Promise.reject(responseJson);

    } catch (e) {
      dispatch({
        type: TRIP_SUMMARY_DETAILS_FAILURE,
        payload: "TRIP_SUMMARY_DETAILS_FAILURE",
      });

      console.log("TRIP_SUMMARY_DETAILS_FAILURE API ERROR =>", e);
      return Promise.reject(CommonError);
    }
  };
}

export function GET_TRIP_LIST_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('trips')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_TRIP_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: TRIP_LIST_FAILURE,
        payload: 'TRIP_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: TRIP_LIST_FAILURE,
        payload: 'TRIP_LIST_FAILURE',
      })
      console.log('catch error API TRIP_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}
export function GET_Document_Category_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('document-category')
      const responseJson = response.data;
      // console.log('responseJson--=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_DOCUMENT_CATEGORY_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: DOCUMENT_CATEGORY_LIST_FAILURE,
        payload: 'DOCUMENT_CATEGORY_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: DOCUMENT_CATEGORY_LIST_FAILURE,
        payload: 'DOCUMENT_CATEGORY_LIST_FAILURE',
      })
      console.log('catch error API DOCUMENT_CATEGORY_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}
export const ADD_DOCUMENT_RECORD = (formData) => {
  // console.log('formData', formData);

  return async (dispatch) => {
    dispatch({
      type: ADD_DOCUMENT_RECORD_REQUEST,
      payload: 'ADD_DOCUMENT_RECORD_REQUEST',
    })
    try {
      const response = await axiosinstance.post(EndPoints.addDocumentRecords, formData)
      const responseJson = response.data;
      // console.log('responseJson=--------=>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: ADD_DOCUMENT_RECORD_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: ADD_DOCUMENT_RECORD_FAILURE,
        payload: 'ADD_DOCUMENT_RECORD_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: ADD_DOCUMENT_RECORD_FAILURE,
        payload: 'ADD_DOCUMENT_RECORD_FAILURE',
      })
      return ({ response: e })
    }
  }
}
export function GET_RESIDENCY_RECORD_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('residency-doc')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_RESIDENCY_DOC_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: RESIDENCY_DOC_LIST_FAILURE,
        payload: 'RESIDENCY_DOC_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: RESIDENCY_DOC_LIST_FAILURE,
        payload: 'RESIDENCY_DOC_LIST_FAILURE',
      })
      console.log('catch error API RESIDENCY_DOC_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}
export function GET_TRIP_MODE_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('trip-mode')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_TRIP_MODE_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: TRIP_MODE_LIST_FAILURE,
        payload: 'TRIP_MODE_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: TRIP_MODE_LIST_FAILURE,
        payload: 'TRIP_MODE_LIST_FAILURE',
      })
      console.log('catch error API TRIP_MODE_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}
export function GET_TRIP_TYPE_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('trip-type')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_TRIP_TYPE_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: TRIP_TYPE_LIST_FAILURE,
        payload: 'TRIP_TYPE_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: TRIP_TYPE_LIST_FAILURE,
        payload: 'TRIP_TYPE_LIST_FAILURE',
      })
      console.log('catch error API TRIP_TYPE_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}
export function DELETE_RESIDENCY_RECORD(id) {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.delete(`residency-doc/${id}`)
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {

        return Promise.resolve(responseJson)
      }

      return Promise.reject(responseJson)
    } catch (e) {

      console.log('catch error API RESIDENCY_DOC_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function UPDATE_RESIDENCY_RECORD(id, payload) {
  return async dispatch => {
    try {
      const formData = new FormData();

      Object.keys(payload).forEach(key => {
        if (key === "attachment" && payload.attachment?.uri) {
          formData.append("attachment", {
            uri: payload.attachment.uri,
            type: payload.attachment.type || "image/jpeg",
            name: payload.attachment.name || "file.jpg"
          });
        } else {
          formData.append(key, payload[key]);
        }
      });

      const response = await axiosinstance.patch(
        `residency-doc/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      const json = response.data;
      if (json.message === "Success") {
        return Promise.resolve(json);
      }

      return Promise.reject(json);

    } catch (error) {
      console.log("UPDATE ERROR =>", error);
      return Promise.reject(error);
    }
  };
}
export function GET_RESIDENCY_RECORD_DETAILS(id) {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get(`residency-doc/${id}`);
      const responseJson = response.data;

      console.log("DETAILS API =>", responseJson);

      if (responseJson.message === "Success") {
        dispatch({
          type: GET_RESIDENCY_DOC_DETAILS_SUCCESS,
          payload: responseJson.result,   
        });
        return Promise.resolve(responseJson.result);
      }

      dispatch({
        type: RESIDENCY_DOC_DETAILS_FAILURE,
        payload: "RESIDENCY_DOC_DETAILS_FAILURE",
      });

      return Promise.reject(responseJson);

    } catch (e) {
      dispatch({
        type: RESIDENCY_DOC_DETAILS_FAILURE,
        payload: "RESIDENCY_DOC_DETAILS_FAILURE",
      });

      console.log("DETAILS API ERROR =>", e);
      return Promise.reject(CommonError);
    }
  };
}
export function GET_FINAL_YEAR_PROGRESS() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('dashboard/fy-progress')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_FINAL_YEAR_PROGRESS_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: FINAL_YEAR_PROGRESS_FAILURE,
        payload: 'FINAL_YEAR_PROGRESS_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: FINAL_YEAR_PROGRESS_FAILURE,
        payload: 'FINAL_YEAR_PROGRESS_FAILURE',
      })
      console.log('catch error API FINAL_YEAR_PROGRESS_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function GET_STATE_WISE_RESIDENCY() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('dashboard/state-days')
      const responseJson = response.data;
      // console.log('responseSTATEJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_STATE_WISE_RESIDENCY_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: STATE_WISE_RESIDENCY_FAILURE,
        payload: 'STATE_WISE_RESIDENCY_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: STATE_WISE_RESIDENCY_FAILURE,
        payload: 'STATE_WISE_RESIDENCY_FAILURE',
      })
      console.log('catch error API STATE_WISE_RESIDENCY_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function GET_COMPLIANCE_SCORE() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('dashboard/compliance-score')
      const responseJson = response.data;
      // console.log('responseSTATEJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_COMPLIANCE_SCORE_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: COMPLIANCE_SCORE_FAILURE,
        payload: 'COMPLIANCE_SCORE_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: COMPLIANCE_SCORE_FAILURE,
        payload: 'COMPLIANCE_SCORE_FAILURE',
      })
      console.log('catch error API COMPLIANCE_SCORE_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function GET_NOTIFICATION() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('notifications')
      const responseJson = response.data;
      // console.log('responseSTATEJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_NOTIFICATION_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: NOTIFICATION_FAILURE,
        payload: 'NOTIFICATION_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: NOTIFICATION_FAILURE,
        payload: 'NOTIFICATION_FAILURE',
      })
      console.log('catch error API NOTIFICATION_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}


export function GET_STATE_WISE_METRICS() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('dashboard/metrics')
      const responseJson = response.data;
      // console.log('responseMetricsJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_STATE_WISE_METRICS_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: STATE_WISE_RESIDENCY_FAILURE,
        payload: 'STATE_WISE_METRICS_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: STATE_WISE_METRICS_FAILURE,
        payload: 'STATE_WISE_METRICS_FAILURE',
      })
      console.log('catch error API STATE_WISE_METRICS_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}


// export function GET_YEAR_WISE_TIMELINE({year}) {
//   return async (dispatch) => {
//     try {
//       const response = await axiosinstance.get(`dashboard/timeline/year?year=${year}`)
//       const responseJson = response.data;
//       // console.log('responseYEARJson-=>', responseJson);

//       if (responseJson.message == 'Success') {
//         dispatch({
//           type: GET_YEAR_WISE_TIMELINE_SUCCESS,
//           payload: responseJson.result,
//         })
//         return Promise.resolve(responseJson)
//       }
//       dispatch({
//         type: YEAR_WISE_TIMELINE_FAILURE,
//         payload: 'YEAR_WISE_TIMELINE_FAILURE',
//       })
//       return Promise.reject(responseJson)
//     } catch (e) {
//       dispatch({
//         type: YEAR_WISE_TIMELINE_FAILURE,
//         payload: 'YEAR_WISE_TIMELINE_FAILURE',
//       })
//       console.log('catch error API YEAR_WISE_TIMELINE_FAILURE', e)
//       return Promise.reject(CommonError)
//     }
//   }
// }
export function GET_YEAR_WISE_TIMELINE({year}) {
  return async (dispatch) => {
    try {
      // const response = await axiosinstance.get(`dashboard//v1/timeline/year?year=${year}`)
      const response = await axiosinstance.get(`dashboard/v1/timeline/year?year=2026`)
      const responseJson = response.data;
      // console.log('responseYEARJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_YEAR_WISE_TIMELINE_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: YEAR_WISE_TIMELINE_FAILURE,
        payload: 'YEAR_WISE_TIMELINE_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: YEAR_WISE_TIMELINE_FAILURE,
        payload: 'YEAR_WISE_TIMELINE_FAILURE',
      })
      console.log('catch error API YEAR_WISE_TIMELINE_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function GET_WEEK_WISE_TIMELINE({ start, end }) {

  
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get(`http://3.91.116.18:4001/api/dashboard/calendar/week?end=${end}&start=${start}`)
      // const response = await axiosinstance.get(`http://3.91.116.18:4001/api/dashboard/calendar/week?end=2025-12-28&start=2025-12-22`)
      // const response = await axiosinstance.get(`http://3.91.116.18:4001/api/dashboard/calendar/week?end=2025-12-07&start=2025-12-01`)
      const responseJson = response.data;
      // console.log('responseWEEKJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_WEEK_WISE_TIMELINE_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: WEEK_WISE_TIMELINE_FAILURE,
        payload: 'WEEK_WISE_TIMELINE_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: WEEK_WISE_TIMELINE_FAILURE,
        payload: 'WEEK_WISE_TIMELINE_FAILURE',
      })
      console.log('catch error API WEEK_WISE_TIMELINE_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

// export function GET_MONTH_WISE_TIMELINE() {
//     type: 'GET_MONTH_WISE_TIMELINE',
//   payload
//   return async (dispatch) => {
//     try {
//       const response = await axiosinstance.get('dashboard/calendar/month?month=2025-12')
//       const responseJson = response.data;
//       console.log('responseMONTHJson-=>', responseJson);

//       if (responseJson.message == 'Success') {
//         dispatch({
//           type: GET_MONTH_WISE_TIMELINE_SUCCESS,
//           payload: responseJson.result,
//         })
//         return Promise.resolve(responseJson)
//       }
//       dispatch({
//         type: MONTH_WISE_TIMELINE_FAILURE,
//         payload: 'MONTH_WISE_TIMELINE_FAILURE',
//       })
//       return Promise.reject(responseJson)
//     } catch (e) {
//       dispatch({
//         type: MONTH_WISE_TIMELINE_FAILURE,
//         payload: 'MONTH_WISE_TIMELINE_FAILURE',
//       })
//       console.log('catch error API MONTH_WISE_TIMELINE_FAILURE', e)
//       return Promise.reject(CommonError)
//     }
//   }
// }


// export const getTripListDataAction = () => (dispatch, getState) => new Promise((resolve, reject) => {

//   getTripService().then((res) => {
//     console.log('res====>', res);

//     // sendDataToReducer(dispatch, TRIP_LIST_SUCCESS, res?.data?.result);
//     // resolve(res?.data?.result)
//   }).catch((error) => {
//     reject({ error })
//   })
// })

export const GET_MONTH_WISE_TIMELINE = ({ month, year }) => {
  // console.log('fbfsvbv',month,year);
  
  return async (dispatch) => {
    try {
      dispatch({ type: 'GET_MONTH_WISE_TIMELINE' });

      // month ko 2 digit me convert karo
      const formattedMonth = String(month).padStart(2, '0');

      const response = await axiosinstance.get(
        `dashboard/calendar/month?month=${year}-${formattedMonth}`
      );

      const responseJson = response.data;
      // console.log('responseMONTHJson =>', responseJson);

      if (responseJson.message === 'Success') {
        dispatch({
          type: 'GET_MONTH_WISE_TIMELINE_SUCCESS',
          payload: responseJson.result,
        });
        return Promise.resolve(responseJson);
      }

      dispatch({
        type: 'MONTH_WISE_TIMELINE_FAILURE',
        payload: responseJson,
      });

      return Promise.reject(responseJson);
    } catch (e) {
      dispatch({
        type: 'MONTH_WISE_TIMELINE_FAILURE',
        payload: e,
      });
      console.log('catch error MONTH_WISE_TIMELINE_FAILURE', e);
      return Promise.reject(e);
    }
  };
};

export function GET_STATE_WISE_TRIPS({state}) {  
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get(`trips/state/${state}`)
      const responseJson = response.data;
      // console.log('responseYEARJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_STATE_WISE_TRIPS_SUCCESS,
          payload: responseJson.result,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: STATE_WISE_TRIPS_FAILURE,
        payload: 'STATE_WISE_TRIPS_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: STATE_WISE_TRIPS_FAILURE,
        payload: 'STATE_WISE_TRIPS_FAILURE',
      })
      console.log('catch error API STATE_WISE_TRIPS_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export const UPDATE_STATE_THRESHOLD = (formData) => {
  // console.log('formData', formData);

  return async (dispatch) => {
    dispatch({
      type: UPDATE_STATE_THRESHOLD_REQUEST,
      payload: 'UPDATE_STATE_THRESHOLD_REQUEST',
    })
    try {
      const response = await axiosinstance.post('/dashboard/state-threshold', formData)
      const responseJson = response.data;
      // console.log('responseJson=--------=>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: UPDATE_STATE_THRESHOLD_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: UPDATE_STATE_THRESHOLD_FAILURE,
        payload: 'UPDATE_STATE_THRESHOLD_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: UPDATE_STATE_THRESHOLD_FAILURE,
        payload: 'UPDATE_STATE_THRESHOLD_FAILURE',
      })
      return ({ response: e })
    }
  }
}

export function GET_TYPE_OF_DAY_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('type-of-day')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_TYPE_OF_DAY_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: TYPE_OF_DAY_LIST_FAILURE,
        payload: 'TYPE_OF_DAY_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: TYPE_OF_DAY_LIST_FAILURE,
        payload: 'TYPE_OF_DAY_LIST_FAILURE',
      })
      console.log('catch error API TYPE_OF_DAY_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export function GET_STATES_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('states')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_STATES_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: STATES_LIST_FAILURE,
        payload: 'STATES_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: STATES_LIST_FAILURE,
        payload: 'STATES_LIST_FAILURE',
      })
      console.log('catch error API STATES_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
}

export const ADDMISSINGDAY = (formData) => {
  return async (dispatch) => {
    dispatch({
      type: ADD_MISSINGDAY_REQUEST,
      payload: 'ADD_MISSINGDAY_REQUEST',
    })
    try {
      const response = await axiosinstance.post('activity', formData)
      const responseJson = response.data;
      console.log('responseJson==>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: ADD_MISSINGDAY_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: ADD_MISSINGDAY_FAILURE,
        payload: 'ADD_MISSINGDAY_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: ADD_MISSINGDAY_FAILURE,
        payload: 'ADD_MISSINGDAY_FAILURE',
      })
      return ({ response: e })
    }
  }
}

export const UPDATEMISSINGDAY = (formData) => {
  return async (dispatch) => {
    dispatch({
      type: UPDATE_MISSINGDAY_REQUEST,
      payload: 'UPDATE_MISSINGDAY_REQUEST',
    })
    try {
      const response = await axiosinstance.patch(`activity/${formData.id}`, formData)
      const responseJson = response.data;
      // console.log('responseJson==>', responseJson);

      if (response.message == 'Success') {
        dispatch({
          type: UPDATE_MISSINGDAY_SUCCESS,
          payload: responseJson,
        })
        return { response: responseJson }
      }
      dispatch({
        type: UPDATE_MISSINGDAY_FAILURE,
        payload: 'UPDATE_MISSINGDAY_FAILURE',
      })
      return ({ response: responseJson })
    }
    catch (e) {
      dispatch({
        type: UPDATE_MISSINGDAY_FAILURE,
        payload: 'UPDATE_MISSINGDAY_FAILURE',
      })
      return ({ response: e })
    }
  }
}

export function GET_MISSING_ACTIVITY_LIST() {
  return async (dispatch) => {
    try {
      const response = await axiosinstance.get('activity')
      const responseJson = response.data;
      // console.log('responseJson-=>', responseJson);

      if (responseJson.message == 'Success') {
        dispatch({
          type: GET_MISSING_ACTIVITY_LIST_SUCCESS,
          payload: responseJson,
        })
        return Promise.resolve(responseJson)
      }
      dispatch({
        type: MISSING_ACTIVITY_LIST_FAILURE,
        payload: 'MISSING_ACTIVITY_LIST_FAILURE',
      })
      return Promise.reject(responseJson)
    } catch (e) {
      dispatch({
        type: MISSING_ACTIVITY_LIST_FAILURE,
        payload: 'MISSING_ACTIVITY_LIST_FAILURE',
      })
      console.log('catch error API MISSING_ACTIVITY_LIST_FAILURE', e)
      return Promise.reject(CommonError)
    }
  }
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
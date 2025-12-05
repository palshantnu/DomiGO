import SimpleToast from 'react-native-simple-toast'
  
  export const sendDataToReducer = (dispatch, type, payload) => {
    dispatch({ type, payload })
  }
 export  const GOOGLE_KEY = "AIzaSyDbk7w0pvfAxvMsgGiCs3UMa_GTsAHTmgY";
export const jsonToFormData = (jsonObj) => Object.entries(jsonObj).reduce((current, item) => (current.append(...item), current), new FormData())

  export const CustomToast = {
    show: (message) => {
        if (message) SimpleToast.show(message)
    },
}
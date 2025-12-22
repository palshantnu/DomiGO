import SimpleToast from 'react-native-simple-toast'
  
  export const sendDataToReducer = (dispatch, type, payload) => {
    dispatch({ type, payload })
  }
//  export  const GOOGLE_KEY = "AIzaSyAa19yt9VdEpZdIH8n9jLNQ_vVc1AZKdXY";
 export  const GOOGLE_KEY = "AIzaSyAUoUI2uEmhZjAPglvXi1QqD5TWa93P1KY";
export const jsonToFormData = (jsonObj) => Object.entries(jsonObj).reduce((current, item) => (current.append(...item), current), new FormData())

  export const CustomToast = {
    show: (message) => {
        if (message) SimpleToast.show(message)
    },
}
export const CustomToast = {
    show: (message) => {
      console.log('Toast:', message)
    }
  }
  
  export const sendDataToReducer = (dispatch, type, payload) => {
    dispatch({ type, payload })
  }
  
  export const jsonToFormData = (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
    return formData
  }
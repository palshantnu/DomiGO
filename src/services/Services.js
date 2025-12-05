import axiosinstance from '../axios/axiosinstance'
import EndPoints from './EndPoints'

export const checkEmailOrMobileIsExistOrNotService = (data) => 
  axiosinstance.post(EndPoints.checkEmailOrMobileIsExistOrNot, data)

export const logoutService = () => 
  axiosinstance.post(EndPoints.logout)

export const getUserPersonalInfoService = (token) => 
  axiosinstance.get(`${EndPoints.getUserPersonalInfo}`)
export const updateUserPersonalInfoService = (data) => axiosinstance.put(EndPoints.updateUserPersonalInfo, data)

export const changePasswordService = (data) => axiosinstance.patch(EndPoints.changePassword, data)

export const getFamilyMemberService = (token) => 
  axiosinstance.get(`${EndPoints.getFamilyMember}/${token}`)

export const getTripService = () => 
  axiosinstance.get(`${EndPoints.tripList}`)